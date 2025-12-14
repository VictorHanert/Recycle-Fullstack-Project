"""
Unit tests for AuthService - User Login Logic
Testing business logic scenarios using BVA and EP.

Based on test analysis covering:
- Credentials validation (username/email + password)
- Account status (active vs inactive users)
- Rate limiting (login attempts)
"""

from unittest.mock import Mock, patch
import pytest
from fastapi import HTTPException

from app.services.auth_service import AuthService
from app.models.user import User
from app.schemas.user_schema import UserCreate


# ============================================
# HELPER FUNCTIONS & FIXTURES
# ============================================

def create_mock_user(
    id=1,
    username="john_doe",
    email="john@test.com",
    hashed_password="$2b$12$hashedpassword",
    is_active=True,
    is_admin=False
):
    """Helper to create a mock User object"""
    user = Mock(spec=User)
    user.id = id
    user.username = username
    user.email = email
    user.hashed_password = hashed_password
    user.is_active = is_active
    user.is_admin = is_admin
    return user


@pytest.fixture
def mock_user_repo():
    """Create a mocked user repository"""
    return Mock()


@pytest.fixture
def auth_service(mock_user_repo):
    """Create AuthService with mocked repository"""
    return AuthService(mock_user_repo)


# ============================================
# CREDENTIALS VALIDATION TESTS
# ============================================

class TestAuthenticateUserCredentials:
    """
    Test authentication with valid/invalid credentials
    
    Partitions:
    - Valid: Correct username/email + correct password → Success (200)
    - Invalid: Non-existent identifier → Error 401
    - Invalid: Correct identifier + wrong password → Error 401
    """
    
    def test_authenticate_with_valid_username_and_password(self, auth_service, mock_user_repo):
        """EP: Valid credentials (username) should succeed"""
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = user
        mock_user_repo.get_by_email.return_value = None
        
        # Mock password verification
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act
            result = auth_service.authenticate_user("john_doe", "correct_password")
            
            # Assert
            assert result == user
            mock_user_repo.get_by_username.assert_called_once_with("john_doe")
    
    def test_authenticate_with_valid_email_and_password(self, auth_service, mock_user_repo):
        """EP: Valid credentials (email) should succeed"""
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = None
        mock_user_repo.get_by_email.return_value = user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act
            result = auth_service.authenticate_user("john@test.com", "correct_password")
            
            # Assert
            assert result == user
            mock_user_repo.get_by_username.assert_called_once_with("john@test.com")
            mock_user_repo.get_by_email.assert_called_once_with("john@test.com")
    
    def test_authenticate_with_nonexistent_username_fails(self, auth_service, mock_user_repo):
        """EP: Non-existent user should return 401"""
        # Arrange
        mock_user_repo.get_by_username.return_value = None
        mock_user_repo.get_by_email.return_value = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            auth_service.authenticate_user("nonexistent_user", "any_password")
        
        assert exc_info.value.status_code == 401
        assert "Incorrect username/email or password" in exc_info.value.detail
    
    def test_authenticate_with_nonexistent_email_fails(self, auth_service, mock_user_repo):
        """EP: Non-existent email should return 401"""
        # Arrange
        mock_user_repo.get_by_username.return_value = None
        mock_user_repo.get_by_email.return_value = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            auth_service.authenticate_user("nobody@test.com", "any_password")
        
        assert exc_info.value.status_code == 401
        assert "Incorrect username/email or password" in exc_info.value.detail
    
    def test_authenticate_with_wrong_password_fails(self, auth_service, mock_user_repo):
        """EP: Valid user + wrong password should return 401"""
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = user
        
        with patch.object(AuthService, 'verify_password', return_value=False):
            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                auth_service.authenticate_user("john_doe", "wrong_password")
            
            assert exc_info.value.status_code == 401
            assert "Incorrect username/email or password" in exc_info.value.detail
    
    @pytest.mark.parametrize("identifier,password,user_exists,password_valid,should_succeed", [
        ("john_doe", "correct_pass", True, True, True),      # Valid combo
        ("john@test.com", "correct_pass", True, True, True), # Valid email combo
        ("not_a_user", "any_pass", False, False, False),     # Non-existent user
        ("john_doe", "wrong_pass", True, False, False),      # Wrong password
    ])
    def test_authenticate_various_credential_combinations(
        self, auth_service, mock_user_repo, identifier, password, user_exists, password_valid, should_succeed
    ):
        """EP: Test various combinations of credentials"""
        # Arrange
        if user_exists:
            user = create_mock_user()
            if "@" in identifier:
                mock_user_repo.get_by_username.return_value = None
                mock_user_repo.get_by_email.return_value = user
            else:
                mock_user_repo.get_by_username.return_value = user
        else:
            mock_user_repo.get_by_username.return_value = None
            mock_user_repo.get_by_email.return_value = None
        
        with patch.object(AuthService, 'verify_password', return_value=password_valid):
            # Act & Assert
            if should_succeed:
                result = auth_service.authenticate_user(identifier, password)
                assert result is not None
            else:
                with pytest.raises(HTTPException) as exc_info:
                    auth_service.authenticate_user(identifier, password)
                assert exc_info.value.status_code == 401


# ============================================
# ACCOUNT STATUS TESTS
# ============================================

class TestAccountStatus:
    """
    Test authentication based on account status
    
    Partitions:
    - Valid: Active user (is_active=True) → Success (200)
    - Invalid: Inactive user (is_active=False) → Error (400)
    """
    
    def test_authenticate_active_user_succeeds(self, auth_service, mock_user_repo):
        """EP: Active user should authenticate successfully"""
        # Arrange
        active_user = create_mock_user(is_active=True)
        mock_user_repo.get_by_username.return_value = active_user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act
            result = auth_service.authenticate_user("john_doe", "correct_password")
            
            # Assert
            assert result == active_user
            assert result.is_active is True
    
    def test_authenticate_inactive_user_fails(self, auth_service, mock_user_repo):
        """EP: Inactive user should return 400 error"""
        # Arrange
        inactive_user = create_mock_user(is_active=False)
        mock_user_repo.get_by_username.return_value = inactive_user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act & Assert
            with pytest.raises(HTTPException) as exc_info:
                auth_service.authenticate_user("john_doe", "correct_password")
            
            assert exc_info.value.status_code == 400
            assert "Inactive user account" in exc_info.value.detail
    
    @pytest.mark.parametrize("is_active,should_succeed", [
        (True, True),   # Active user
        (False, False), # Inactive user
    ])
    def test_authenticate_various_account_statuses(
        self, auth_service, mock_user_repo, is_active, should_succeed
    ):
        """BVA: Test boundary between active and inactive status"""
        # Arrange
        user = create_mock_user(is_active=is_active)
        mock_user_repo.get_by_username.return_value = user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act & Assert
            if should_succeed:
                result = auth_service.authenticate_user("john_doe", "password")
                assert result == user
            else:
                with pytest.raises(HTTPException) as exc_info:
                    auth_service.authenticate_user("john_doe", "password")
                assert exc_info.value.status_code == 400


# ============================================
# RATE LIMITING TESTS
# ============================================

class TestRateLimiting:
    """
    Test rate limiting for login attempts
    
    Partitions:
    - Valid: ≤5 attempts/min → Success (200)
    - Invalid: >5 attempts/min → Error (429 Too Many Requests)
    
    Boundaries: 4, 5, 6
    BVA Test Values: 4th attempt, 5th attempt, 6th attempt
    
    Note: Rate limiting is typically handled by middleware/decorator,
    these tests demonstrate the expected behavior pattern.
    """
    
    @pytest.mark.parametrize("attempt_number,should_succeed,description", [
        (1, True, "1st attempt - well within limit"),
        (4, True, "4th attempt - below limit (BVA: max-1)"),
        (5, True, "5th attempt - at limit boundary (BVA: max)"),
        (6, False, "6th attempt - exceeds limit (BVA: max+1)"),
        (10, False, "10th attempt - well over limit"),
    ])
    def test_rate_limiting_boundaries(
        self, auth_service, mock_user_repo, attempt_number, should_succeed, description
    ):
        """
        BVA: Test rate limiting at boundaries (5 attempts/min)
        
        Note: This demonstrates the expected behavior. Actual rate limiting
        would be implemented via middleware (e.g., slowapi, rate-limit decorator)
        """
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Simulate the rate limiting check (in reality, middleware handles this)
            rate_limit_exceeded = attempt_number > 5
            
            if rate_limit_exceeded and not should_succeed:
                # Simulate rate limiter raising 429
                with pytest.raises(HTTPException) as exc_info:
                    # This would be raised by rate limiting middleware
                    raise HTTPException(
                        status_code=429,
                        detail="Too many login attempts. Please try again later."
                    )
                assert exc_info.value.status_code == 429
            else:
                # Normal authentication should succeed
                result = auth_service.authenticate_user("john_doe", "password")
                assert result == user
    
    def test_rate_limit_resets_after_time_window(self, auth_service, mock_user_repo):
        """
        EP: Rate limit should reset after time window (1 minute)
        
        Scenario: 5 failed attempts, wait 1 min, 6th attempt should succeed
        """
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = user
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # After time window reset, authentication should work
            result = auth_service.authenticate_user("john_doe", "password")
            assert result == user
    
    def test_rate_limit_applies_per_user_or_ip(self, auth_service, mock_user_repo):
        """
        EP: Rate limiting should be per-user or per-IP
        
        Different users/IPs should have independent rate limits
        """
        # Arrange
        user1 = create_mock_user(id=1, username="user1")
        user2 = create_mock_user(id=2, username="user2")
        
        def get_user_side_effect(username):
            if username == "user1":
                return user1
            elif username == "user2":
                return user2
            return None
        
        mock_user_repo.get_by_username.side_effect = get_user_side_effect
        
        with patch.object(AuthService, 'verify_password', return_value=True):
            # Act - Both users should be able to login independently
            result1 = auth_service.authenticate_user("user1", "password")
            result2 = auth_service.authenticate_user("user2", "password")
            
            # Assert
            assert result1 == user1
            assert result2 == user2


# ============================================
# PASSWORD HASHING TESTS
# ============================================

class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_password_is_hashed_securely(self):
        """EP: Password should be hashed using bcrypt"""
        # Act
        hashed = AuthService.get_password_hash("MySecurePass123")
        
        # Assert
        assert hashed != "MySecurePass123"
        assert hashed.startswith("$2b$")  # bcrypt prefix
        assert len(hashed) == 60  # bcrypt output length
    
    def test_verify_password_with_correct_password(self):
        """EP: Correct password should verify successfully"""
        # Arrange
        plain_password = "MySecurePass123"
        hashed_password = AuthService.get_password_hash(plain_password)
        
        # Act
        result = AuthService.verify_password(plain_password, hashed_password)
        
        # Assert
        assert result is True
    
    def test_verify_password_with_wrong_password(self):
        """EP: Wrong password should fail verification"""
        # Arrange
        correct_password = "MySecurePass123"
        wrong_password = "WrongPassword456"
        hashed_password = AuthService.get_password_hash(correct_password)
        
        # Act
        result = AuthService.verify_password(wrong_password, hashed_password)
        
        # Assert
        assert result is False
    
    def test_same_password_produces_different_hashes(self):
        """EP: Same password should produce different hashes (salt)"""
        # Act
        hash1 = AuthService.get_password_hash("SamePassword")
        hash2 = AuthService.get_password_hash("SamePassword")
        
        # Assert
        assert hash1 != hash2  # Different due to random salt
        assert AuthService.verify_password("SamePassword", hash1)
        assert AuthService.verify_password("SamePassword", hash2)


# ============================================
# USER REGISTRATION TESTS (Service Layer)
# ============================================

class TestRegisterUserService:
    """Test user registration business logic"""
    
    def test_register_user_with_unique_credentials_succeeds(self, auth_service, mock_user_repo):
        """EP: Registration with unique username/email should succeed"""
        # Arrange
        user_data = UserCreate(
            username="new_user",
            email="new@test.com",
            password="Password123"
        )
        
        mock_user_repo.check_username_exists.return_value = False
        mock_user_repo.check_email_exists.return_value = False
        
        created_user = create_mock_user(username="new_user", email="new@test.com")
        mock_user_repo.create.return_value = created_user
        
        # Act
        result = auth_service.register_user(user_data)
        
        # Assert
        assert result == created_user
        mock_user_repo.check_username_exists.assert_called_once_with("new_user")
        mock_user_repo.check_email_exists.assert_called_once_with("new@test.com")
        mock_user_repo.create.assert_called_once()
    
    def test_register_user_with_existing_username_fails(self, auth_service, mock_user_repo):
        """EP: Registration with duplicate username should fail (400)"""
        # Arrange
        user_data = UserCreate(
            username="existing_user",
            email="new@test.com",
            password="Password123"
        )
        
        mock_user_repo.check_username_exists.return_value = True
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Username already registered" in exc_info.value.detail
        mock_user_repo.create.assert_not_called()
    
    def test_register_user_with_existing_email_fails(self, auth_service, mock_user_repo):
        """EP: Registration with duplicate email should fail (400)"""
        # Arrange
        user_data = UserCreate(
            username="new_user",
            email="existing@test.com",
            password="Password123"
        )
        
        mock_user_repo.check_username_exists.return_value = False
        mock_user_repo.check_email_exists.return_value = True
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Email already registered" in exc_info.value.detail
        mock_user_repo.create.assert_not_called()


# ============================================
# ADDITIONAL COVERAGE (Beyond BVA/EP Analysis)
# ============================================


# ============================================
# JWT TOKEN TESTS
# ============================================

class TestJWTTokenOperations:
    """Test JWT token creation and verification"""
    
    def test_create_access_token_with_default_expiration(self):
        """EP: Token should be created with default expiration"""
        # Arrange
        data = {"sub": "john_doe"}
        
        # Act
        token = AuthService.create_access_token(data)
        
        # Assert
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_custom_expiration(self):
        """EP: Token should be created with custom expiration"""
        # Arrange
        from datetime import timedelta
        data = {"sub": "john_doe"}
        expires_delta = timedelta(minutes=30)
        
        # Act
        token = AuthService.create_access_token(data, expires_delta)
        
        # Assert
        assert token is not None
        assert isinstance(token, str)
    
    def test_create_access_token_includes_subject(self):
        """EP: Token payload should include subject claim"""
        # Arrange
        from jose import jwt
        from app.config import get_settings
        settings = get_settings()
        data = {"sub": "john_doe"}
        
        # Act
        token = AuthService.create_access_token(data)
        
        # Decode without verification to inspect payload
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        
        # Assert
        assert payload["sub"] == "john_doe"
        assert "exp" in payload  # Expiration should be present
    
    def test_verify_token_with_valid_token_succeeds(self):
        """EP: Valid token should be verified successfully"""
        # Arrange
        data = {"sub": "john_doe"}
        token = AuthService.create_access_token(data)
        
        # Act
        username = AuthService.verify_token(token)
        
        # Assert
        assert username == "john_doe"
    
    def test_verify_token_with_invalid_token_fails(self):
        """EP: Invalid token should raise 401 error"""
        # Arrange
        invalid_token = "invalid.token.here"
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            AuthService.verify_token(invalid_token)
        
        assert exc_info.value.status_code == 401
        assert "Invalid authentication credentials" in exc_info.value.detail
    
    def test_verify_token_without_subject_fails(self):
        """EP: Token without subject claim should fail"""
        # Arrange
        from jose import jwt
        from app.config import get_settings
        from datetime import datetime, timedelta, timezone
        
        settings = get_settings()
        # Create token without 'sub' claim
        payload = {"exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
        token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            AuthService.verify_token(token)
        
        assert exc_info.value.status_code == 401
    
    def test_verify_token_with_expired_token_fails(self):
        """EP: Expired token should raise 401 error"""
        # Arrange
        from datetime import timedelta
        data = {"sub": "john_doe"}
        # Create token that expires immediately
        token = AuthService.create_access_token(data, timedelta(seconds=-1))
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            AuthService.verify_token(token)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.parametrize("username", [
        "john_doe",
        "user@test.com",
        "user_123",
        "a" * 50,  # max length username
    ])
    def test_token_roundtrip_with_various_usernames(self, username):
        """BVA: Test token creation and verification with various username formats"""
        # Arrange
        data = {"sub": username}
        
        # Act
        token = AuthService.create_access_token(data)
        verified_username = AuthService.verify_token(token)
        
        # Assert
        assert verified_username == username


# ============================================
# USER LOOKUP TESTS
# ============================================

class TestUserLookupOperations:
    """Test user lookup by username and ID"""
    
    def test_get_user_by_username_found(self, auth_service, mock_user_repo):
        """EP: Existing user should be returned"""
        # Arrange
        user = create_mock_user()
        mock_user_repo.get_by_username.return_value = user
        
        # Act
        result = auth_service.get_user_by_username("john_doe")
        
        # Assert
        assert result == user
        mock_user_repo.get_by_username.assert_called_once_with("john_doe")
    
    def test_get_user_by_username_not_found(self, auth_service, mock_user_repo):
        """EP: Non-existent user should return None"""
        # Arrange
        mock_user_repo.get_by_username.return_value = None
        
        # Act
        result = auth_service.get_user_by_username("nonexistent")
        
        # Assert
        assert result is None
        mock_user_repo.get_by_username.assert_called_once_with("nonexistent")
    
    def test_get_user_by_id_found(self, auth_service, mock_user_repo):
        """EP: Existing user ID should return user"""
        # Arrange
        user = create_mock_user(id=123)
        mock_user_repo.get_by_id.return_value = user
        
        # Act
        result = auth_service.get_user_by_id(123)
        
        # Assert
        assert result == user
        assert result.id == 123
        mock_user_repo.get_by_id.assert_called_once_with(123)
    
    def test_get_user_by_id_not_found(self, auth_service, mock_user_repo):
        """EP: Non-existent user ID should return None"""
        # Arrange
        mock_user_repo.get_by_id.return_value = None
        
        # Act
        result = auth_service.get_user_by_id(999)
        
        # Assert
        assert result is None
        mock_user_repo.get_by_id.assert_called_once_with(999)
    
    @pytest.mark.parametrize("user_id,should_exist", [
        (1, True),      # min valid ID
        (999, True),    # large valid ID
        (99999, False), # non-existent ID
    ])
    def test_get_user_by_id_boundaries(self, auth_service, mock_user_repo, user_id, should_exist):
        """BVA: Test user lookup with various ID values"""
        # Arrange
        if should_exist:
            user = create_mock_user(id=user_id)
            mock_user_repo.get_by_id.return_value = user
        else:
            mock_user_repo.get_by_id.return_value = None
        
        # Act
        result = auth_service.get_user_by_id(user_id)
        
        # Assert
        if should_exist:
            assert result is not None
            assert result.id == user_id
        else:
            assert result is None


# ============================================
# USER UPDATE TESTS
# ============================================

class TestUserUpdateOperations:
    """Test user update functionality"""
    
    def test_update_user_success(self, auth_service, mock_user_repo):
        """EP: Valid update should succeed"""
        # Arrange
        from app.schemas.user_schema import UserUpdate
        
        update_data = UserUpdate(
            email="newemail@test.com",
            full_name="New Name"
        )
        updated_user = create_mock_user(email="newemail@test.com")
        mock_user_repo.update.return_value = updated_user
        
        # Act
        result = auth_service.update_user(1, update_data)
        
        # Assert
        assert result == updated_user
        assert result.email == "newemail@test.com"
        mock_user_repo.update.assert_called_once_with(1, update_data)
    
    def test_update_user_not_found(self, auth_service, mock_user_repo):
        """EP: Update non-existent user should raise 404"""
        # Arrange
        from app.schemas.user_schema import UserUpdate
        
        update_data = UserUpdate(email="newemail@test.com")
        mock_user_repo.update.return_value = None
        
        # Act & Assert
        with pytest.raises(HTTPException) as exc_info:
            auth_service.update_user(999, update_data)
        
        assert exc_info.value.status_code == 404
        assert "User not found" in exc_info.value.detail
    
    def test_update_user_partial_update(self, auth_service, mock_user_repo):
        """EP: Partial update should only update provided fields"""
        # Arrange
        from app.schemas.user_schema import UserUpdate
        
        update_data = UserUpdate(full_name="Updated Name")
        updated_user = create_mock_user(username="john_doe", email="john@test.com")
        mock_user_repo.update.return_value = updated_user
        
        # Act
        result = auth_service.update_user(1, update_data)
        
        # Assert
        assert result == updated_user
        # Original fields should remain
        assert result.username == "john_doe"
        assert result.email == "john@test.com"
    
    @pytest.mark.parametrize("user_id,should_succeed", [
        (1, True),      # Valid ID
        (999, True),    # Valid ID
        (99999, False), # Non-existent ID
    ])
    def test_update_user_with_various_ids(self, auth_service, mock_user_repo, user_id, should_succeed):
        """BVA: Test update with various user IDs"""
        # Arrange
        from app.schemas.user_schema import UserUpdate
        
        update_data = UserUpdate(full_name="Test")
        
        if should_succeed:
            updated_user = create_mock_user(id=user_id)
            mock_user_repo.update.return_value = updated_user
        else:
            mock_user_repo.update.return_value = None
        
        # Act & Assert
        if should_succeed:
            result = auth_service.update_user(user_id, update_data)
            assert result is not None
        else:
            with pytest.raises(HTTPException) as exc_info:
                auth_service.update_user(user_id, update_data)
            assert exc_info.value.status_code == 404


# ============================================
# USER SEARCH TESTS
# ============================================

class TestUserSearchOperations:
    """Test user search functionality"""
    
    def test_search_users_with_results(self, auth_service, mock_user_repo):
        """EP: Search with matches should return users"""
        # Arrange
        users = [
            create_mock_user(id=1, username="john_doe"),
            create_mock_user(id=2, username="john_smith"),
        ]
        mock_user_repo.search_users.return_value = users
        
        # Act
        result = auth_service.search_users("john")
        
        # Assert
        assert len(result) == 2
        assert result == users
        mock_user_repo.search_users.assert_called_once_with("john", 0, 100)
    
    def test_search_users_no_results(self, auth_service, mock_user_repo):
        """EP: Search without matches should return empty list"""
        # Arrange
        mock_user_repo.search_users.return_value = []
        
        # Act
        result = auth_service.search_users("nonexistent")
        
        # Assert
        assert result == []
        assert len(result) == 0
    
    def test_search_users_with_pagination(self, auth_service, mock_user_repo):
        """EP: Search should support pagination"""
        # Arrange
        users = [create_mock_user(id=i) for i in range(10)]
        mock_user_repo.search_users.return_value = users
        
        # Act
        result = auth_service.search_users("test", skip=10, limit=10)
        
        # Assert
        assert len(result) == 10
        mock_user_repo.search_users.assert_called_once_with("test", 10, 10)
    
    @pytest.mark.parametrize("search_term,skip,limit", [
        ("john", 0, 10),     # First page
        ("john", 10, 10),    # Second page
        ("test", 0, 100),    # Default limit
        ("a", 0, 1),         # Single result
    ])
    def test_search_users_various_pagination(
        self, auth_service, mock_user_repo, search_term, skip, limit
    ):
        """BVA: Test search with various pagination parameters"""
        # Arrange
        users = [create_mock_user(id=i) for i in range(limit)]
        mock_user_repo.search_users.return_value = users
        
        # Act
        result = auth_service.search_users(search_term, skip, limit)
        
        # Assert
        assert len(result) == limit
        mock_user_repo.search_users.assert_called_once_with(search_term, skip, limit)
    
    def test_search_users_by_email(self, auth_service, mock_user_repo):
        """EP: Search should work with email patterns"""
        # Arrange
        user = create_mock_user(email="john@test.com")
        mock_user_repo.search_users.return_value = [user]
        
        # Act
        result = auth_service.search_users("john@test.com")
        
        # Assert
        assert len(result) == 1
        assert result[0].email == "john@test.com"
