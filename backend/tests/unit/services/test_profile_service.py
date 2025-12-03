import pytest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from fastapi import HTTPException, status

from app.repositories.base import (
    UserRepositoryInterface,
    ProductRepositoryInterface,
    LocationRepositoryInterface,
)
from app.schemas.location_schema import LocationCreate
from app.schemas.user_schema import ProfileUpdate
from app.services.profile_service import ProfileService


def make_user(**overrides):
    base = dict(
        id=1,
        email="u@example.com",
        username="user1",
        full_name="User One",
        phone=None,
        is_active=True,
        is_admin=False,
        location=None,
        location_id=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def make_product(product_id=1, seller_id=1):
    return SimpleNamespace(id=product_id, seller_id=seller_id)


@pytest.fixture
def user_repository():
    return MagicMock(spec=UserRepositoryInterface)


@pytest.fixture
def product_repository():
    return MagicMock(spec=ProductRepositoryInterface)


@pytest.fixture
def location_repository():
    return MagicMock(spec=LocationRepositoryInterface)


@pytest.fixture
def profile_service(user_repository, product_repository, location_repository):
    return ProfileService(user_repository, product_repository, location_repository)


def test_get_user_profile_success(profile_service, user_repository, product_repository):
    user = make_user()
    user_repository.get_by_id.return_value = user
    product_repository.count_by_seller.return_value = 3

    profile = profile_service.get_user_profile(1)

    assert profile.id == user.id
    assert profile.product_count == 3
    user_repository.get_by_id.assert_called_once_with(1)
    product_repository.count_by_seller.assert_called_once_with(1)


def test_get_user_profile_not_found(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.get_user_profile(99)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_get_public_profile_success(profile_service, user_repository, product_repository):
    user = make_user()
    user_repository.get_by_id.return_value = user
    product_repository.count_by_seller.return_value = 5

    public_profile = profile_service.get_public_profile(1)

    assert public_profile.id == user.id
    assert public_profile.username == user.username
    assert public_profile.product_count == 5


def test_get_public_profile_inactive_raises(profile_service, user_repository):
    user_repository.get_by_id.return_value = make_user(is_active=False)

    with pytest.raises(HTTPException) as exc_info:
        profile_service.get_public_profile(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_get_public_profile_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.get_public_profile(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_update_profile_success(profile_service, user_repository):
    updated_user = make_user(email="new@example.com")
    user_repository.update.return_value = updated_user

    result = profile_service.update_profile(1, ProfileUpdate(email="new@example.com"))

    assert result.email == "new@example.com"
    user_repository.update.assert_called_once()
    args, _ = user_repository.update.call_args
    assert args[0] == 1
    assert getattr(args[1], "email") == "new@example.com"


def test_update_profile_not_found(profile_service, user_repository):
    user_repository.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.update_profile(1, ProfileUpdate(full_name="New Name"))

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_add_user_location_success(profile_service, user_repository, location_repository):
    user_repository.get_by_id.return_value = make_user()
    location_repository.get_or_create.return_value = SimpleNamespace(id=10)
    updated_user = make_user(location_id=10)
    user_repository.update.return_value = updated_user

    result = profile_service.add_user_location(1, LocationCreate(city="Cph", postcode="2100"))

    assert result.location_id == 10
    location_repository.get_or_create.assert_called_once_with("Cph", "2100")
    user_repository.update.assert_called_once()


def test_add_user_location_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.add_user_location(1, LocationCreate(city="Cph", postcode="2100"))

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_add_user_location_update_failed(profile_service, user_repository, location_repository):
    user_repository.get_by_id.return_value = make_user()
    location_repository.get_or_create.return_value = SimpleNamespace(id=10)
    user_repository.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.add_user_location(1, LocationCreate(city="Cph", postcode="2100"))

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


def test_remove_user_location_success(profile_service, user_repository):
    user_repository.get_by_id.return_value = make_user(location_id=5)
    updated_user = make_user(location_id=None)
    user_repository.update.return_value = updated_user

    result = profile_service.remove_user_location(1)

    assert result.location_id is None
    user_repository.update.assert_called_once()


def test_remove_user_location_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.remove_user_location(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_remove_user_location_update_failed(profile_service, user_repository):
    user_repository.get_by_id.return_value = make_user()
    user_repository.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.remove_user_location(1)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


def test_get_user_products_success(profile_service, user_repository, product_repository):
    user_repository.get_by_id.return_value = make_user()
    products = [make_product(1), make_product(2)]
    product_repository.get_by_seller.return_value = products

    result = profile_service.get_user_products(1, skip=2, limit=5)

    assert result == products
    product_repository.get_by_seller.assert_called_once_with(1, 2, 5)


def test_get_user_products_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.get_user_products(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_get_user_statistics_success(profile_service, user_repository, product_repository):
    user = make_user(location_id=7, is_active=True, created_at=datetime(2024, 1, 1, tzinfo=timezone.utc))
    user_repository.get_by_id.return_value = user
    product_repository.count_by_seller.return_value = 4

    stats = profile_service.get_user_statistics(1)

    assert stats == {
        "total_products": 4,
        "user_since": user.created_at,
        "is_active": True,
        "has_location": True,
    }


def test_get_user_statistics_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.get_user_statistics(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_delete_user_account_success(profile_service, user_repository, product_repository):
    user_repository.get_by_id.return_value = make_user()
    product_repository.get_by_seller.return_value = [make_product(1), make_product(2)]
    product_repository.delete.return_value = True
    user_repository.delete.return_value = True

    result = profile_service.delete_user_account(1)

    assert result is True
    assert product_repository.delete.call_count == 2
    user_repository.delete.assert_called_once_with(1)


def test_delete_user_account_missing_user(profile_service, user_repository):
    user_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        profile_service.delete_user_account(1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_delete_user_account_product_delete_failed(profile_service, user_repository, product_repository):
    user_repository.get_by_id.return_value = make_user()
    product_repository.get_by_seller.return_value = [make_product(1)]
    product_repository.delete.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        profile_service.delete_user_account(1)

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


def test_delete_user_account_user_delete_failed(profile_service, user_repository, product_repository):
    user_repository.get_by_id.return_value = make_user()
    product_repository.get_by_seller.return_value = []
    user_repository.delete.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        profile_service.delete_user_account(1)

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
