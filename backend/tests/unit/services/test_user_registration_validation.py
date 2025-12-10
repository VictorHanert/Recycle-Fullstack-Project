"""
Unit tests for User Registration using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Based on test analysis covering:
- Username length (3-50 chars)
- Username pattern (a-zA-Z0-9_.)
- Password length (8-100 chars)
- Email format validation
- Full name validation (0-255 chars)
"""

import pytest
from pydantic import ValidationError

from app.schemas.user_schema import UserCreate


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_valid_user(**overrides):
    """Helper to create a valid UserCreate with optional field overrides"""
    defaults = {
        "username": "john_doe",
        "email": "test@mail.com",
        "password": "Password123"
    }
    return UserCreate(**{**defaults, **overrides})


def expect_validation_error(error_msg_fragment, **user_fields):
    """Helper to assert ValidationError with message fragment"""
    with pytest.raises(ValidationError) as exc_info:
        create_valid_user(**user_fields)
    assert error_msg_fragment in str(exc_info.value).lower()


# ============================================
# USERNAME TESTS
# ============================================

class TestUsernameLength:
    """
    Username length boundaries (3-50 characters)
    BVA Test Values: 1, 2, 3, 4, 49, 50, 51, 52
    """
    
    @pytest.mark.parametrize("length,should_pass", [
        (1, False),   # min-2
        (2, False),   # min-1
        (3, True),    # min
        (4, True),    # min+1
        (49, True),   # max-1
        (50, True),   # max
        (51, False),  # max+1
        (52, False),  # max+2
        (55, False),  # EP invalid partition
    ])
    def test_username_length_boundaries(self, length, should_pass):
        """BVA: Test username length at various boundaries"""
        username = "a" * length
        if should_pass:
            user = create_valid_user(username=username)
            assert len(user.username) == length
        else:
            expect_validation_error("at least 3 characters" if length < 3 else "at most 50 characters", 
                                   username=username)


class TestUsernamePattern:
    """Username pattern validation (a-zA-Z0-9_.)"""
    
    @pytest.mark.parametrize("username,should_pass", [
        ("john123", True),           # alphanumeric
        ("john_doe", True),          # underscore
        ("john.doe", True),          # dot
        ("john_doe.123", True),      # combined
        ("john!doe", False),         # exclamation
        ("john@doe", False),         # at symbol
        ("john doe", False),         # space
        ("john-doe", False),         # hyphen
        ("john#doe", False),         # hash
        ("john$doe", False),         # dollar
    ])
    def test_username_pattern(self, username, should_pass):
        """EP: Test valid and invalid username patterns"""
        if should_pass:
            user = create_valid_user(username=username)
            assert user.username == username
        else:
            with pytest.raises(ValidationError):
                create_valid_user(username=username)


# ============================================
# PASSWORD TESTS
# ============================================

class TestPasswordLength:
    """
    Password length boundaries (8-100 characters)
    BVA Test Values: 5, 6, 7, 8, 9, 99, 100, 101, 102, 150
    """
    
    @pytest.mark.parametrize("length,should_pass", [
        (5, False),   # EP invalid
        (6, False),   # min-2
        (7, False),   # min-1
        (8, True),    # min
        (9, True),    # min+1
        (99, True),   # max-1
        (100, True),  # max
        (101, False), # max+1
        (102, False), # max+2
        (150, False), # EP invalid partition
    ])
    def test_password_length_boundaries(self, length, should_pass):
        """BVA: Test password length at various boundaries"""
        password = "P" * length
        if should_pass:
            user = create_valid_user(password=password)
            assert len(user.password) == length
        else:
            expect_validation_error("at least 8 characters" if length < 8 else "at most 100 characters", 
                                   password=password)


# ============================================
# EMAIL TESTS
# ============================================

class TestEmailPattern:
    """Email format validation"""
    
    @pytest.mark.parametrize("email,should_pass", [
        ("test@mail.com", True),           # standard
        ("user@mail.example.com", True),   # subdomain
        ("user+tag@mail.com", True),       # plus sign
        ("first.last@mail.com", True),     # dots
        ("testmail.com", False),           # missing @
        ("test@", False),                  # missing domain
        ("@mail.com", False),              # missing local
        ("test@mail", False),              # no TLD
        ("test mail@mail.com", False),     # spaces
        ("test@@mail.com", False),         # double @
    ])
    def test_email_validation(self, email, should_pass):
        """EP: Test valid and invalid email formats"""
        if should_pass:
            user = create_valid_user(email=email)
            assert user.email == email
        else:
            expect_validation_error("value is not a valid email address", email=email)


# ============================================
# FULL NAME TESTS
# ============================================

class TestFullName:
    """
    Full name validation (0-100 characters, optional)
    BVA Test Values: 0 (empty), 1, 99, 100, 101
    """
    
    @pytest.mark.parametrize("full_name,expected", [
        ("", ""),                       # empty string
        (None, None),                   # None value
        ("A", "A"),                     # 1 char
        ("John Doe", "John Doe"),       # standard
        ("Mary-Jane O'Brien", "Mary-Jane O'Brien"),  # special chars
    ])
    def test_full_name_valid_cases(self, full_name, expected):
        """EP: Test valid full name cases"""
        user = create_valid_user(full_name=full_name)
        assert user.full_name == expected
    
    def test_full_name_omitted(self):
        """EP: Omitted optional field should be None"""
        user = create_valid_user()
        assert user.full_name is None
    
    @pytest.mark.parametrize("length,should_pass", [
        (99, True),   # max-1
        (100, True),  # max
        (101, False), # max+1
    ])
    def test_full_name_length_boundaries(self, length, should_pass):
        """BVA: Test full name length boundaries"""
        full_name = "A" * length
        if should_pass:
            user = create_valid_user(full_name=full_name)
            assert len(user.full_name) == length
        else:
            expect_validation_error("at most 100 characters", full_name=full_name)


# ============================================
# COMBINED BOUNDARY TESTS
# ============================================

class TestCombinedBoundaryScenarios:
    """Test combined boundary scenarios"""
    
    @pytest.mark.parametrize("username,password,full_name,description", [
        ("abc", "Pass1234", "A", "all minimum boundaries"),
        ("a" * 50, "P" * 100, "N" * 100, "all maximum boundaries"),
        ("abc", "P" * 100, None, "mixed boundaries"),
    ])
    def test_combined_boundaries(self, username, password, full_name, description):
        """Test with multiple fields at various boundaries"""
        user = create_valid_user(username=username, password=password, full_name=full_name)
        assert user.username == username
        assert user.password == password
        assert user.full_name == full_name
