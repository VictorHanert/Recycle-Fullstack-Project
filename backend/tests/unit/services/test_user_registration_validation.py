import pytest
from pydantic import ValidationError

from app.schemas.user_schema import UserCreate

"""
Unit tests for User registration using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Following best practices:
- Each test verifies only one behavior
- Positive and negative tests are separated
- Test case selection is comprehensive
"""

# ============================================
# HELPER FUNCTIONS
# ============================================
def create_valid_user(**overrides):
    """Helper function to create a valid user with default values"""
    defaults = {
        "username": "john_doe",
        "email": "test@mail.com",
        "password": "Password123"
    }
    return UserCreate(**{**defaults, **overrides})


# ============================================
# USERNAME TESTS
# ============================================

class TestUsernameLength:
    """
    Username length boundaries (3-50 characters)
    BVA Test Values: 1, 2, 3, 4, 49, 50, 51, 52
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        3,    # Valid partition 3-50: lower boundary value
        4,    # Valid partition 3-50: lower boundary value + 1
        49,   # Valid partition 3-50: upper boundary value - 1
        50,   # Valid partition 3-50: upper boundary value
    ])
    def test_username_length_valid_passes(self, length):
        """BVA: Test valid username length boundaries"""
        username = "a" * length
        user = create_valid_user(username=username)
        assert len(user.username) == length
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("length", [
        1,    # Invalid partition <3: lower boundary value - 2
        2,    # Invalid partition <3: lower boundary value - 1
    ])
    def test_username_length_too_short_fails(self, length):
        """BVA: Test username length below minimum boundary"""
        username = "a" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(username=username)
        assert "at least 3 characters" in str(error_info.value).lower()
    
    @pytest.mark.parametrize("length", [
        51,   # Invalid partition >50: upper boundary value + 1
        52,   # Invalid partition >50: upper boundary value + 2
        55,   # EP: invalid partition middle value
    ])
    def test_username_length_too_long_fails(self, length):
        """BVA: Test username length above maximum boundary"""
        username = "a" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(username=username)
        assert "at most 50 characters" in str(error_info.value).lower()


class TestUsernamePattern:
    """Username pattern validation (a-zA-Z0-9_.)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("username", [
        "john123",         # EP: alphanumeric
        "john_doe",        # EP: underscore
        "john.doe",        # EP: dot
        "john_doe.123",    # EP: combined valid characters
    ])
    def test_username_pattern_valid_passes(self, username):
        """EP: Test valid username patterns"""
        user = create_valid_user(username=username)
        assert user.username == username
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("username", [
        "john!doe",        # EP: exclamation mark
        "john@doe",        # EP: at symbol
        "john doe",        # EP: space
        "john-doe",        # EP: hyphen
        "john#doe",        # EP: hash
        "john$doe",        # EP: dollar sign
    ])
    def test_username_pattern_invalid_fails(self, username):
        """EP: Test invalid username patterns"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(username=username)
        # Pattern validation error is raised
        assert error_info.value is not None


# ============================================
# PASSWORD TESTS
# ============================================

class TestPasswordLength:
    """
    Password length boundaries (8-100 characters)
    BVA Test Values: 5, 6, 7, 8, 9, 99, 100, 101, 102, 150
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        8,     # Valid partition 8-100: lower boundary value
        9,     # Valid partition 8-100: lower boundary value + 1
        99,    # Valid partition 8-100: upper boundary value - 1
        100,   # Valid partition 8-100: upper boundary value
    ])
    def test_password_length_valid_passes(self, length):
        """BVA: Test valid password length boundaries"""
        password = "P" * length
        user = create_valid_user(password=password)
        assert len(user.password) == length
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("length", [
        5,     # EP: invalid partition middle value
        6,     # Invalid partition <8: lower boundary value - 2
        7,     # Invalid partition <8: lower boundary value - 1
    ])
    def test_password_length_too_short_fails(self, length):
        """BVA: Test password length below minimum boundary"""
        password = "P" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(password=password)
        assert "at least 8 characters" in str(error_info.value).lower()
    
    @pytest.mark.parametrize("length", [
        101,   # Invalid partition >100: upper boundary value + 1
        102,   # Invalid partition >100: upper boundary value + 2
        150,   # EP: invalid partition middle value
    ])
    def test_password_length_too_long_fails(self, length):
        """BVA: Test password length above maximum boundary"""
        password = "P" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(password=password)
        assert "at most 100 characters" in str(error_info.value).lower()


# ============================================
# EMAIL TESTS
# ============================================

class TestEmailPattern:
    """Email format validation"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("email", [
        "test@mail.com",           # EP: standard format
        "user@mail.example.com",   # EP: subdomain
        "user+tag@mail.com",       # EP: plus sign
        "first.last@mail.com",     # EP: dots in local part
    ])
    def test_email_pattern_valid_passes(self, email):
        """EP: Test valid email formats"""
        user = create_valid_user(email=email)
        assert user.email == email
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("email", [
        "testmail.com",            # EP: missing @ symbol
        "test@",                   # EP: missing domain
        "@mail.com",               # EP: missing local part
        "test@mail",               # EP: missing TLD
        "test mail@mail.com",      # EP: space in local part
        "test@@mail.com",          # EP: double @ symbol
    ])
    def test_email_pattern_invalid_fails(self, email):
        """EP: Test invalid email formats"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(email=email)
        assert "value is not a valid email address" in str(error_info.value).lower()


# ============================================
# FULL NAME TESTS
# ============================================

class TestFullName:
    """
    Full name validation (0-100 characters, optional)
    BVA Test Values: 0 (empty), 1, 99, 100, 101
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("full_name,expected", [
        ("", ""),                                    # EP: empty string
        (None, None),                                # EP: None value (optional field)
        ("A", "A"),                                  # BVA: 1 character
        ("John Doe", "John Doe"),                    # EP: standard format
        ("Mary-Jane O'Brien", "Mary-Jane O'Brien"),  # EP: special characters
    ])
    def test_full_name_valid_passes(self, full_name, expected):
        """EP: Test valid full name cases"""
        user = create_valid_user(full_name=full_name)
        assert user.full_name == expected
    
    def test_full_name_omitted_passes(self):
        """EP: Optional field can be omitted"""
        user = create_valid_user()
        assert user.full_name is None
    
    @pytest.mark.parametrize("length", [
        99,    # Valid partition 0-100: upper boundary value - 1
        100,   # Valid partition 0-100: upper boundary value
    ])
    def test_full_name_length_boundaries_passes(self, length):
        """BVA: Test full name length at upper boundaries"""
        full_name = "A" * length
        user = create_valid_user(full_name=full_name)
        assert len(user.full_name) == length
    
    #
    # Negative testing
    #
    
    def test_full_name_too_long_fails(self):
        """BVA: Test full name length above maximum boundary"""
        full_name = "A" * 101  # Invalid partition >100: upper boundary value + 1
        with pytest.raises(ValidationError) as error_info:
            create_valid_user(full_name=full_name)
        assert "at most 100 characters" in str(error_info.value).lower()

