"""
Unit tests for User Login using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Based on test analysis covering:
- Identifier validation (username or email format)
- Password length (8-100 chars)
- Empty/invalid input handling
"""

import pytest
from pydantic import ValidationError

from app.schemas.user_schema import UserLogin


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_valid_login(**overrides):
    """Helper to create a valid UserLogin with optional field overrides"""
    defaults = {
        "identifier": "john_doe",
        "password": "Password123"
    }
    return UserLogin(**{**defaults, **overrides})


def expect_validation_error(error_msg_fragment, **login_fields):
    """Helper to assert ValidationError with message fragment"""
    with pytest.raises(ValidationError) as exc_info:
        create_valid_login(**login_fields)
    assert error_msg_fragment in str(exc_info.value).lower()


# ============================================
# IDENTIFIER TESTS (Username or Email)
# ============================================

class TestIdentifierValidation:
    """
    Identifier can be either username or email
    Must be between 3-100 characters
    """
    
    @pytest.mark.parametrize("identifier,should_pass,description", [
        ("john_doe", True, "valid username"),
        ("user@test.com", True, "valid email"),
        ("abc", True, "minimum 3 chars username"),
        ("a@b.c", True, "minimum valid email"),
        ("john.doe_123", True, "username with dots and underscores"),
        ("user+tag@domain.co.uk", True, "email with plus and subdomain"),
        ("", False, "empty string"),
        ("ab", False, "too short - 2 chars"),
        ("a" * 101, False, "too long - 101 chars"),
    ])
    def test_identifier_validation(self, identifier, should_pass, description):
        """EP: Test valid and invalid identifier formats"""
        if should_pass:
            login = create_valid_login(identifier=identifier)
            assert login.identifier == identifier
        else:
            with pytest.raises(ValidationError):
                create_valid_login(identifier=identifier)
    
    @pytest.mark.parametrize("length,should_pass", [
        (0, False),   # empty
        (1, False),   # min-2
        (2, False),   # min-1
        (3, True),    # min
        (4, True),    # min+1
        (99, True),   # max-1
        (100, True),  # max
        (101, False), # max+1
    ])
    def test_identifier_length_boundaries(self, length, should_pass):
        """BVA: Test identifier length boundaries"""
        identifier = "a" * length
        if should_pass:
            login = create_valid_login(identifier=identifier)
            assert len(login.identifier) == length
        else:
            with pytest.raises(ValidationError):
                create_valid_login(identifier=identifier)


# ============================================
# PASSWORD TESTS
# ============================================

class TestPasswordLength:
    """
    Password length boundaries (1-100 characters for login)
    Note: Login is less strict than registration (no minimum enforcement)
    """
    
    @pytest.mark.parametrize("length,should_pass", [
        (0, False),   # empty - required field
        (1, True),    # min
        (6, True),    # below registration min but valid for login
        (7, True),    # registration min-1
        (8, True),    # registration min
        (9, True),    # min+1
        (99, True),   # max-1
        (100, True),  # max
        (101, False), # max+1
        (102, False), # max+2
        (150, False), # EP invalid partition
    ])
    def test_password_length_boundaries(self, length, should_pass):
        """BVA: Test password length at various boundaries"""
        password = "P" * length if length > 0 else ""
        if should_pass:
            login = create_valid_login(password=password)
            assert len(login.password) == length
        else:
            with pytest.raises(ValidationError):
                create_valid_login(password=password)


# ============================================
# REQUIRED FIELDS TESTS
# ============================================

class TestRequiredFields:
    """Test that both identifier and password are required"""
    
    def test_missing_identifier_fails(self):
        """EP: Missing identifier should fail"""
        with pytest.raises(ValidationError):  # Pydantic v2 raises ValidationError
            UserLogin(password="Password123")
    
    def test_missing_password_fails(self):
        """EP: Missing password should fail"""
        with pytest.raises(ValidationError):  # Pydantic v2 raises ValidationError
            UserLogin(identifier="john_doe")
    
    def test_both_fields_none_fails(self):
        """EP: Both fields None should fail"""
        with pytest.raises(ValidationError):
            UserLogin(identifier=None, password=None)
    
    def test_empty_identifier_fails(self):
        """EP: Empty identifier should fail"""
        with pytest.raises(ValidationError):
            create_valid_login(identifier="")
    
    def test_empty_password_fails(self):
        """EP: Empty password should fail"""
        with pytest.raises(ValidationError):
            create_valid_login(password="")


# ============================================
# COMBINED BOUNDARY TESTS
# ============================================

class TestCombinedBoundaryScenarios:
    """Test combined boundary scenarios"""
    
    @pytest.mark.parametrize("identifier,password,description", [
        ("abc", "P", "both at minimum boundaries"),
        ("a" * 100, "P" * 100, "both at maximum boundaries"),
        ("user@test.com", "P" * 100, "email with max password"),
        ("abc", "MySecretPass1", "min identifier with valid password"),
    ])
    def test_combined_boundaries(self, identifier, password, description):
        """Test with multiple fields at various boundaries"""
        login = create_valid_login(identifier=identifier, password=password)
        assert login.identifier == identifier
        assert login.password == password


# ============================================
# SPECIAL CHARACTER TESTS
# ============================================

class TestIdentifierSpecialCharacters:
    """Test identifier handling with special characters"""
    
    @pytest.mark.parametrize("identifier,should_pass", [
        ("user@domain.com", True),      # email with @
        ("user+test@mail.com", True),   # email with +
        ("first.last@mail.com", True),  # email with dots
        ("john_doe", True),             # username with underscore
        ("john.doe", True),             # username with dot
        ("john123", True),              # username with numbers
    ])
    def test_identifier_with_special_chars(self, identifier, should_pass):
        """EP: Test identifiers with various special characters"""
        if should_pass:
            login = create_valid_login(identifier=identifier)
            assert login.identifier == identifier
        else:
            with pytest.raises(ValidationError):
                create_valid_login(identifier=identifier)


# ============================================
# PASSWORD CONTENT TESTS
# ============================================

class TestPasswordContent:
    """Test that any characters are allowed in login password"""
    
    @pytest.mark.parametrize("password", [
        "SimplePass",           # alphanumeric
        "Pass123!@#",          # with special chars
        "pass with spaces",    # with spaces
        "パスワード123",        # unicode characters
        "Pass@word#2024",      # mixed special chars
        "12345678",            # numbers only
        "        ",            # spaces only (8 spaces)
    ])
    def test_password_accepts_any_characters(self, password):
        """EP: Login should accept any password characters (validation happens server-side)"""
        login = create_valid_login(password=password)
        assert login.password == password
