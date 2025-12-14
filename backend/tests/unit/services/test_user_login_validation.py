import pytest
from pydantic import ValidationError

from app.schemas.user_schema import UserLogin

"""
Unit tests for User login using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Following best practices:
- Each test verifies only one behavior
- Positive and negative tests are separated
- Test case selection is comprehensive
"""

# ============================================
# HELPER FUNCTIONS
# ============================================

def create_valid_login(**overrides):
    """Helper function to create a valid login with default values"""
    defaults = {
        "identifier": "john_doe",
        "password": "Password123"
    }
    return UserLogin(**{**defaults, **overrides})


# ============================================
# IDENTIFIER TESTS (Username or Email)
# ============================================

class TestIdentifierValidation:
    """
    Identifier can be either username or email
    Must be between 3-100 characters
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("identifier", [
        "john_doe",                    # EP: valid username
        "user@test.com",               # EP: valid email
        "abc",                         # BVA: minimum 3 chars username
        "a@b.c",                       # BVA: minimum valid email
        "john.doe_123",                # EP: username with dots and underscores
        "user+tag@domain.co.uk",       # EP: email with plus and subdomain
    ])
    def test_identifier_valid_passes(self, identifier):
        """EP: Test valid identifier formats"""
        login = create_valid_login(identifier=identifier)
        assert login.identifier == identifier
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("identifier", [
        "",           # EP: empty string
        "ab",         # BVA: too short - 2 chars
        "a" * 101,    # BVA: too long - 101 chars
    ])
    def test_identifier_invalid_fails(self, identifier):
        """EP/BVA: Test invalid identifier formats"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(identifier=identifier)
        assert error_info.value is not None


class TestIdentifierLength:
    """Test identifier length boundaries (3-100 characters)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        3,     # Valid partition 3-100: lower boundary value
        4,     # Valid partition 3-100: lower boundary value + 1
        99,    # Valid partition 3-100: upper boundary value - 1
        100,   # Valid partition 3-100: upper boundary value
    ])
    def test_identifier_length_valid_passes(self, length):
        """BVA: Test valid identifier length boundaries"""
        identifier = "a" * length
        login = create_valid_login(identifier=identifier)
        assert len(login.identifier) == length
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("length", [
        0,     # Invalid partition: empty
        1,     # Invalid partition <3: lower boundary value - 2
        2,     # Invalid partition <3: lower boundary value - 1
    ])
    def test_identifier_length_too_short_fails(self, length):
        """BVA: Test identifier length below minimum boundary"""
        identifier = "a" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(identifier=identifier)
        assert error_info.value is not None
    
    def test_identifier_length_too_long_fails(self):
        """BVA: Test identifier length above maximum boundary"""
        identifier = "a" * 101  # Invalid partition >100: upper boundary value + 1
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(identifier=identifier)
        assert error_info.value is not None


# ============================================
# PASSWORD TESTS
# ============================================

class TestPasswordLength:
    """
    Password length boundaries (1-100 characters for login)
    Note: Login is less strict than registration (no minimum enforcement)
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        1,     # Valid partition 1-100: lower boundary value
        6,     # EP: below registration min but valid for login
        7,     # EP: registration min-1
        8,     # EP: registration min
        9,     # Valid partition 1-100: lower boundary value + several
        99,    # Valid partition 1-100: upper boundary value - 1
        100,   # Valid partition 1-100: upper boundary value
    ])
    def test_password_length_valid_passes(self, length):
        """BVA: Test valid password length boundaries"""
        password = "P" * length
        login = create_valid_login(password=password)
        assert len(login.password) == length
    
    #
    # Negative testing
    #
    
    def test_password_empty_fails(self):
        """BVA: Empty password (required field)"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(password="")
        assert error_info.value is not None
    
    @pytest.mark.parametrize("length", [
        101,   # Invalid partition >100: upper boundary value + 1
        102,   # Invalid partition >100: upper boundary value + 2
        150,   # EP: invalid partition middle value
    ])
    def test_password_length_too_long_fails(self, length):
        """BVA: Test password length above maximum boundary"""
        password = "P" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(password=password)
        assert error_info.value is not None


# ============================================
# REQUIRED FIELDS TESTS
# ============================================

class TestRequiredFields:
    """Test that both identifier and password are required"""
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("kwargs,description", [
        ({"password": "Password123"}, "Missing identifier"),
        ({"identifier": "john_doe"}, "Missing password"),
        ({"identifier": None, "password": None}, "Both fields None"),
    ])
    def test_missing_required_fields_fails(self, kwargs, description):
        """EP: Missing required fields should fail"""
        with pytest.raises(ValidationError) as error_info:
            UserLogin(**kwargs)
        assert error_info.value is not None
    
    @pytest.mark.parametrize("field,value", [
        ("identifier", ""),
        ("password", ""),
    ])
    def test_empty_required_fields_fails(self, field, value):
        """EP: Empty required fields should fail"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_login(**{field: value})
        assert error_info.value is not None


# ============================================
# COMBINED BOUNDARY TESTS
# ============================================

class TestCombinedBoundaryScenarios:
    """Test combined boundary scenarios"""
    
    @pytest.mark.parametrize("identifier,password", [
        ("abc", "P"),                      # Both at minimum boundaries
        ("a" * 100, "P" * 100),            # Both at maximum boundaries
        ("user@test.com", "P" * 100),      # Email with max password
        ("abc", "MySecretPass1"),          # Min identifier with valid password
    ])
    def test_combined_boundaries_passes(self, identifier, password):
        """BVA: Test with multiple fields at various boundaries"""
        login = create_valid_login(identifier=identifier, password=password)
        assert login.identifier == identifier
        assert login.password == password


# ============================================
# SPECIAL CHARACTER TESTS
# ============================================

class TestIdentifierSpecialCharacters:
    """Test identifier handling with special characters"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("identifier", [
        "user@domain.com",         # EP: email with @
        "user+test@mail.com",      # EP: email with +
        "first.last@mail.com",     # EP: email with dots
        "john_doe",                # EP: username with underscore
        "john.doe",                # EP: username with dot
        "john123",                 # EP: username with numbers
    ])
    def test_identifier_with_special_chars_passes(self, identifier):
        """EP: Test identifiers with various special characters"""
        login = create_valid_login(identifier=identifier)
        assert login.identifier == identifier

