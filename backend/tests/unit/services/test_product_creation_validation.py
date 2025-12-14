"""
Unit tests for Product Creation using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Following best practices:
- Each test verifies only one behavior
- Positive and negative tests are separated
- Test case selection is comprehensive
"""

from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.schemas.product_schema import ProductCreate


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_valid_product(**overrides):
    """Helper to create a valid ProductCreate with optional field overrides"""
    defaults = {
        "title": "Mountain Bike",
        "description": "A nice bike in good condition",
        "price_amount": Decimal("150.00"),
        "price_currency": "DKK",
        "category_id": 1,
        "quantity": 1,
        "condition": "good"
    }
    return ProductCreate(**{**defaults, **overrides})


# ============================================
# TITLE TESTS
# ============================================

class TestTitleLength:
    """
    Title length boundaries (1-200 characters)
    BVA Test Values: 0, 1, 2, 199, 200, 201, 202, 250
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        1,     # Valid partition 1-200: lower boundary value
        2,     # Valid partition 1-200: lower boundary value + 1
        199,   # Valid partition 1-200: upper boundary value - 1
        200,   # Valid partition 1-200: upper boundary value
    ])
    def test_title_length_valid_passes(self, length):
        """BVA: Test valid title length boundaries"""
        title = "A" * length
        product = create_valid_product(title=title)
        assert len(product.title) == length
    
    #
    # Negative testing
    #
    
    def test_title_empty_fails(self):
        """BVA: Empty title (required field)"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(title="")
        assert error_info.value is not None
    
    @pytest.mark.parametrize("length", [
        201,   # Invalid partition >200: upper boundary value + 1
        202,   # Invalid partition >200: upper boundary value + 2
        250,   # EP: invalid partition middle value
    ])
    def test_title_too_long_fails(self, length):
        """BVA: Test title length above maximum boundary"""
        title = "A" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(title=title)
        assert error_info.value is not None
    
    def test_title_required_fails(self):
        """EP: Title is required field"""
        with pytest.raises(ValidationError) as error_info:
            ProductCreate(
                description="Test",
                price_amount=Decimal("100"),
                category_id=1
            )
        assert error_info.value is not None


# ============================================
# DESCRIPTION TESTS
# ============================================

class TestDescriptionLength:
    """
    Description length boundaries (1-1000 characters)
    BVA Test Values: 0, 1, 2, 999, 1000, 1001, 1002, 1500
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("length", [
        1,      # Valid partition 1-1000: lower boundary value
        2,      # Valid partition 1-1000: lower boundary value + 1
        999,    # Valid partition 1-1000: upper boundary value - 1
        1000,   # Valid partition 1-1000: upper boundary value
    ])
    def test_description_length_valid_passes(self, length):
        """BVA: Test valid description length boundaries"""
        description = "A" * length
        product = create_valid_product(description=description)
        assert len(product.description) == length
    
    #
    # Negative testing
    #
    
    def test_description_empty_fails(self):
        """BVA: Empty description (required field)"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(description="")
        assert error_info.value is not None
    
    @pytest.mark.parametrize("length", [
        1001,   # Invalid partition >1000: upper boundary value + 1
        1002,   # Invalid partition >1000: upper boundary value + 2
        1500,   # EP: invalid partition middle value
    ])
    def test_description_too_long_fails(self, length):
        """BVA: Test description length above maximum boundary"""
        description = "A" * length
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(description=description)
        assert error_info.value is not None
    
    def test_description_required_fails(self):
        """EP: Description is required field"""
        with pytest.raises(ValidationError) as error_info:
            ProductCreate(
                title="Test Product",
                price_amount=Decimal("100"),
                category_id=1
            )
        assert error_info.value is not None


# ============================================
# PRICE AMOUNT TESTS
# ============================================

class TestPriceAmount:
    """
    Price amount boundaries (must be > 0, up to 999,999)
    BVA Test Values: -1, 0, 0.01, 0.02, 999999
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("amount", [
        Decimal("0.01"),        # Valid partition >0: lower boundary value
        Decimal("0.02"),        # Valid partition >0: lower boundary value + 0.01
        Decimal("1.00"),        # EP: normal value
        Decimal("150.50"),      # EP: normal with decimals
        Decimal("999999.00"),   # BVA: max reasonable
        Decimal("999999.99"),   # BVA: max with decimals
    ])
    def test_price_amount_valid_passes(self, amount):
        """BVA: Test valid price amount boundaries"""
        product = create_valid_product(price_amount=amount)
        assert product.price_amount == amount
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("amount", [
        Decimal("-1"),          # Invalid: negative value
        Decimal("0"),           # Invalid: zero
        Decimal("0.001"),       # Invalid: too many decimal places
    ])
    def test_price_amount_invalid_fails(self, amount):
        """BVA/EP: Test invalid price amounts"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(price_amount=amount)
        assert error_info.value is not None
    
    def test_price_amount_required_fails(self):
        """EP: Price amount is required field"""
        with pytest.raises(ValidationError) as error_info:
            ProductCreate(
                title="Test",
                description="Test",
                category_id=1
            )
        assert error_info.value is not None


class TestPriceDecimalPlaces:
    """Test price decimal places validation (max 2 decimal places)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("amount_str", [
        "100",          # EP: integer (0 decimals)
        "100.5",        # EP: one decimal place
        "100.50",       # EP: two decimal places
    ])
    def test_price_decimal_places_valid_passes(self, amount_str):
        """BVA: Test valid decimal places"""
        product = create_valid_product(price_amount=Decimal(amount_str))
        assert product.price_amount == Decimal(amount_str)
    
    #
    # Negative testing
    #
    
    def test_price_three_decimal_places_fails(self):
        """BVA: Test three decimal places (too many)"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(price_amount=Decimal("100.505"))
        assert error_info.value is not None


# ============================================
# PRICE CURRENCY TESTS
# ============================================

class TestPriceCurrency:
    """Price currency validation (3-letter uppercase codes)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("currency", [
        "DKK",   # EP: Danish Krone
        "EUR",   # EP: Euro
        "USD",   # EP: US Dollar
        "GBP",   # EP: British Pound
        "NOK",   # EP: Norwegian Krone
        "SEK",   # EP: Swedish Krona
        "XYZ",   # EP: Pattern matches but semantically invalid (service validates)
    ])
    def test_currency_code_valid_passes(self, currency):
        """EP: Test valid currency code patterns"""
        product = create_valid_product(price_currency=currency)
        assert product.price_currency == currency
    
    def test_currency_default_value_passes(self):
        """EP: Currency defaults to DKK if not provided"""
        product = ProductCreate(
            title="Test",
            description="Test desc",
            price_amount=Decimal("100"),
            category_id=1
        )
        assert product.price_currency == "DKK"
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("currency", [
        "dkk",    # EP: lowercase
        "Dkk",    # EP: mixed case
        "DK",     # BVA: too short
        "DKKK",   # BVA: too long
        "123",    # EP: numbers
        "D K",    # EP: with space
    ])
    def test_currency_code_invalid_fails(self, currency):
        """EP/BVA: Test invalid currency codes"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(price_currency=currency)
        assert error_info.value is not None


# ============================================
# CATEGORY ID TESTS
# ============================================

class TestCategoryId:
    """Category ID validation (must be > 0)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("category_id", [
        1,       # Valid partition >0: lower boundary value
        2,       # Valid partition >0: lower boundary value + 1
        999,     # EP: large valid value
        99999,   # EP: very large (existence checked by service)
    ])
    def test_category_id_valid_passes(self, category_id):
        """BVA: Test valid category ID boundaries"""
        product = create_valid_product(category_id=category_id)
        assert product.category_id == category_id
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("category_id", [
        -1,   # Invalid: negative value
        0,    # Invalid: zero
    ])
    def test_category_id_invalid_fails(self, category_id):
        """BVA: Test invalid category IDs"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(category_id=category_id)
        assert error_info.value is not None
    
    def test_category_id_required_fails(self):
        """EP: Category ID is required field"""
        with pytest.raises(ValidationError) as error_info:
            ProductCreate(
                title="Test",
                description="Test",
                price_amount=Decimal("100")
            )
        assert error_info.value is not None


# ============================================
# QUANTITY TESTS
# ============================================

class TestQuantity:
    """
    Quantity boundaries (1-999)
    BVA Test Values: -1, 0, 1, 2, 998, 999, 1000, 1001, 1500
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("quantity", [
        1,      # Valid partition >=1: lower boundary value
        2,      # Valid partition >=1: lower boundary value + 1
        50,     # EP: normal value
        998,    # BVA: reasonable max - 1
        999,    # BVA: reasonable max
        1000,   # Schema allows (no upper limit enforced)
        1500,   # Schema allows (no upper limit enforced)
    ])
    def test_quantity_valid_passes(self, quantity):
        """BVA: Test valid quantity boundaries"""
        product = create_valid_product(quantity=quantity)
        assert product.quantity == quantity
    
    def test_quantity_defaults_to_1_passes(self):
        """EP: Quantity defaults to 1 if not provided"""
        product = ProductCreate(
            title="Test",
            description="Test",
            price_amount=Decimal("100"),
            category_id=1
        )
        assert product.quantity == 1
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("quantity", [
        -1,   # Invalid: negative value
        0,    # Invalid: zero
    ])
    def test_quantity_invalid_fails(self, quantity):
        """BVA: Test invalid quantities"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(quantity=quantity)
        assert error_info.value is not None


# ============================================
# CONDITION TESTS
# ============================================

class TestCondition:
    """Condition validation (enum values)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("condition", [
        "new",           # EP: valid enum value
        "like_new",      # EP: valid enum value
        "good",          # EP: valid enum value
        "fair",          # EP: valid enum value
        "needs_repair",  # EP: valid enum value
    ])
    def test_condition_enum_valid_passes(self, condition):
        """EP: Test valid condition enum values"""
        product = create_valid_product(condition=condition)
        assert product.condition == condition
    
    def test_condition_optional_passes(self):
        """EP: Condition is optional field"""
        product = ProductCreate(
            title="Test",
            description="Test",
            price_amount=Decimal("100"),
            category_id=1,
            condition=None
        )
        assert product.condition is None
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("condition", [
        "broken",      # EP: not in enum
        "excellent",   # EP: not in enum
        "New",         # EP: wrong case
        "GOOD",        # EP: wrong case
        "",            # EP: empty string
    ])
    def test_condition_enum_invalid_fails(self, condition):
        """EP: Test invalid condition values"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(condition=condition)
        assert error_info.value is not None


# ============================================
# IMAGE URLS TESTS
# ============================================

class TestImageUrls:
    """
    Image URLs validation (0-10 images)
    BVA Test Values: 0, 1, 2, 9, 10, 11, 12
    Note: Schema doesn't enforce max, but analysis suggests 10 max
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("count", [
        0,    # BVA: no images
        1,    # BVA: one image
        2,    # EP: two images
        5,    # EP: five images
        9,    # BVA: nine images
        10,   # BVA: ten images (suggested max)
        11,   # Eleven images - may exceed limit
        12,   # Twelve images - may exceed limit
    ])
    def test_image_urls_count_passes(self, count):
        """BVA: Test image URLs count (schema allows any, business may limit)"""
        image_urls = [f"https://example.com/image{i}.jpg" for i in range(count)]
        product = create_valid_product(image_urls=image_urls)
        assert len(product.image_urls) == count
    
    def test_image_urls_optional_passes(self):
        """EP: Image URLs are optional"""
        product = create_valid_product(image_urls=None)
        assert product.image_urls is None
    
    def test_empty_image_urls_list_passes(self):
        """EP: Empty list is valid"""
        product = create_valid_product(image_urls=[])
        assert product.image_urls == []


# ============================================
# DIMENSIONS TESTS
# ============================================

class TestDimensions:
    """
    Dimensions validation (must be > 0, up to 1000)
    BVA Test Values: -1, 0, 0.1, 0.2, 999.9, 1000, 1000.1, 1500
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("field_name,dimension", [
        # width_cm tests
        ("width_cm", Decimal("0.1")),      # Valid partition >0: lower boundary value
        ("width_cm", Decimal("0.2")),      # Valid partition >0: lower boundary value + 0.1
        ("width_cm", Decimal("50")),       # EP: normal value
        ("width_cm", Decimal("999.9")),    # BVA: max - 0.1
        ("width_cm", Decimal("1000")),     # BVA: max
        ("width_cm", Decimal("1000.1")),   # Max + 0.1 (schema allows but may be limit)
        ("width_cm", Decimal("1500")),     # Large (schema allows but may be limit)
        
        # height_cm tests
        ("height_cm", Decimal("0.1")),     # Valid partition >0: lower boundary value
        ("height_cm", Decimal("999.9")),   # BVA: near max
        ("height_cm", Decimal("1000")),    # BVA: max
        
        # depth_cm tests
        ("depth_cm", Decimal("0.1")),      # Valid partition >0: lower boundary value
        ("depth_cm", Decimal("1000")),     # BVA: max
        
        # weight_kg tests (allows 3 decimal places)
        ("weight_kg", Decimal("0.001")),   # Valid partition >0: min with 3 decimals
        ("weight_kg", Decimal("0.1")),     # EP: small value
        ("weight_kg", Decimal("50.5")),    # EP: normal value
        ("weight_kg", Decimal("999.999")), # BVA: near max with 3 decimals
    ])
    def test_dimensions_valid_passes(self, field_name, dimension):
        """BVA: Test valid dimension boundaries for all dimension fields"""
        product = create_valid_product(**{field_name: dimension})
        assert getattr(product, field_name) == dimension
    
    def test_dimensions_all_optional_passes(self):
        """EP: All dimensions are optional"""
        product = create_valid_product(
            width_cm=None,
            height_cm=None,
            depth_cm=None,
            weight_kg=None
        )
        assert product.width_cm is None
        assert product.height_cm is None
        assert product.depth_cm is None
        assert product.weight_kg is None
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("field_name,dimension", [
        # width_cm invalid
        ("width_cm", Decimal("-1")),    # Invalid: negative value
        ("width_cm", Decimal("0")),     # Invalid: zero
        
        # height_cm invalid
        ("height_cm", Decimal("-1")),   # Invalid: negative value
        ("height_cm", Decimal("0")),    # Invalid: zero
        
        # depth_cm invalid
        ("depth_cm", Decimal("-1")),    # Invalid: negative value
        ("depth_cm", Decimal("0")),     # Invalid: zero
        
        # weight_kg invalid
        ("weight_kg", Decimal("-1")),   # Invalid: negative value
        ("weight_kg", Decimal("0")),    # Invalid: zero
    ])
    def test_dimensions_invalid_fails(self, field_name, dimension):
        """BVA: Test invalid dimension values for all dimension fields"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(**{field_name: dimension})
        assert error_info.value is not None


# ============================================
# LOCATION ID TESTS
# ============================================

class TestLocationId:
    """Location ID validation (optional, must be > 0 if provided)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("location_id", [
        None,   # EP: optional - can be None
        1,      # Valid partition >0: lower boundary value
        2,      # Valid partition >0: lower boundary value + 1
        999,    # EP: large valid value
    ])
    def test_location_id_valid_passes(self, location_id):
        """BVA: Test valid location ID boundaries"""
        product = create_valid_product(location_id=location_id)
        assert product.location_id == location_id
    
    #
    # Negative testing
    #
    
    @pytest.mark.parametrize("location_id", [
        -1,   # Invalid: negative value
        0,    # Invalid: zero
    ])
    def test_location_id_invalid_fails(self, location_id):
        """BVA: Test invalid location IDs"""
        with pytest.raises(ValidationError) as error_info:
            create_valid_product(location_id=location_id)
        assert error_info.value is not None


# ============================================
# RELATED IDS TESTS
# ============================================

class TestRelatedIds:
    """Test color_ids, material_ids, tag_ids (optional lists)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.parametrize("field,value", [
        ("color_ids", None),
        ("color_ids", []),
        ("color_ids", [1, 2, 3]),
        ("material_ids", None),
        ("material_ids", []),
        ("material_ids", [1, 2]),
        ("tag_ids", None),
        ("tag_ids", []),
        ("tag_ids", [5, 10, 15]),
    ])
    def test_related_ids_valid_passes(self, field, value):
        """EP: Test valid related IDs (optional lists)"""
        product = create_valid_product(**{field: value})
        assert getattr(product, field) == value


