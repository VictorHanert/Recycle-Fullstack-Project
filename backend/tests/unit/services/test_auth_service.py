import pytest
from datetime import timedelta, timezone, datetime
from types import SimpleNamespace
from unittest.mock import MagicMock
from jose import jwt
from fastapi import HTTPException, status

from app.config import get_settings
from app.repositories.base import UserRepositoryInterface
from app.schemas.user_schema import UserCreate, UserUpdate
from app.services.auth_service import AuthService


def make_user(**overrides):
    base = dict(
        id=1,
        username="user1",
        email="u@example.com",
        full_name="User One",
        hashed_password=AuthService.get_password_hash("secret"),
        is_active=True,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


@pytest.fixture
def user_repository():
    return MagicMock(spec=UserRepositoryInterface)


@pytest.fixture
def auth_service(user_repository):
    return AuthService(user_repository)


def test_register_user_rejects_existing_username(auth_service, user_repository):
    user_repository.check_username_exists.return_value = True
    user = UserCreate(username="user1", email="u@example.com", password="secret123")

    with pytest.raises(HTTPException) as exc_info:
        auth_service.register_user(user)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    user_repository.create.assert_not_called()


def test_register_user_rejects_existing_email(auth_service, user_repository):
    user_repository.check_username_exists.return_value = False
    user_repository.check_email_exists.return_value = True
    user = UserCreate(username="user1", email="u@example.com", password="secret123")

    with pytest.raises(HTTPException) as exc_info:
        auth_service.register_user(user)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    user_repository.create.assert_not_called()


def test_register_user_hashes_password_and_creates(auth_service, user_repository):
    user_repository.check_username_exists.return_value = False
    user_repository.check_email_exists.return_value = False
    created_user = make_user()
    user_repository.create.return_value = created_user
    user = UserCreate(username="user1", email="u@example.com", password="secret123")

    result = auth_service.register_user(user)

    assert result is created_user
    args, _ = user_repository.create.call_args
    _, hashed_password = args
    assert hashed_password != "secret123"
    assert AuthService.verify_password("secret123", hashed_password)


def test_authenticate_user_prefers_username(auth_service, user_repository):
    user = make_user()
    user_repository.get_by_username.return_value = user
    result = auth_service.authenticate_user("user1", "secret")
    assert result is user
    user_repository.get_by_email.assert_not_called()


def test_authenticate_user_falls_back_to_email(auth_service, user_repository):
    user = make_user()
    user_repository.get_by_username.return_value = None
    user_repository.get_by_email.return_value = user

    result = auth_service.authenticate_user("u@example.com", "secret")

    assert result is user
    user_repository.get_by_username.assert_called_once()
    user_repository.get_by_email.assert_called_once()


def test_authenticate_user_wrong_credentials_raises(auth_service, user_repository):
    user_repository.get_by_username.return_value = None
    user_repository.get_by_email.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        auth_service.authenticate_user("missing", "secret")

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticate_user_invalid_password_raises(auth_service, user_repository):
    user = make_user()
    user_repository.get_by_username.return_value = user

    with pytest.raises(HTTPException) as exc_info:
        auth_service.authenticate_user("user1", "wrong")

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticate_user_inactive_raises(auth_service, user_repository):
    user = make_user(is_active=False)
    user_repository.get_by_username.return_value = user

    with pytest.raises(HTTPException) as exc_info:
        auth_service.authenticate_user("user1", "secret")

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


def test_update_user_not_found_raises(auth_service, user_repository):
    user_repository.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        auth_service.update_user(1, UserUpdate(full_name="New"))

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_update_user_success(auth_service, user_repository):
    updated_user = make_user(full_name="New Name")
    user_repository.update.return_value = updated_user

    result = auth_service.update_user(1, UserUpdate(full_name="New Name"))

    assert result.full_name == "New Name"
    user_repository.update.assert_called_once_with(1, UserUpdate(full_name="New Name"))


def test_create_and_verify_access_token_roundtrip(auth_service):
    token = AuthService.create_access_token({"sub": "user1"}, expires_delta=timedelta(minutes=5))
    username = AuthService.verify_token(token)
    assert username == "user1"

    # sanity check token claims
    claims = jwt.decode(token, get_settings().secret_key, algorithms=[get_settings().algorithm])
    assert claims["sub"] == "user1"
    assert datetime.fromtimestamp(claims["exp"], tz=timezone.utc) > datetime.now(timezone.utc)


def test_verify_token_invalid_raises():
    with pytest.raises(HTTPException) as exc_info:
        AuthService.verify_token("not-a-token")

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
