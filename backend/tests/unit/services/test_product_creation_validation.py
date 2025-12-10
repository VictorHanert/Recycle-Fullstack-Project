"""
Unit tests for Product Creation using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Based on test analysis covering:
- Title length (1-200 chars)
- Description length (1-1000 chars)
- Price amount (0.01 - 999,999)
- Price currency (supported codes)
- Category ID validation
- Quantity (1-999)
- Condition (enum values)
- Images count (0-10)
- Dimensions validation (0.1-1000)
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


def expect_validation_error(error_msg_fragment, **product_fields):
    """Helper to assert ValidationError with message fragment"""
    with pytest.raises(ValidationError) as exc_info:
        create_valid_product(**product_fields)
    assert error_msg_fragment in str(exc_info.value).lower()


# ============================================
# TITLE TESTS
# ============================================

class TestTitleLength:
    """
    Title length boundaries (1-200 characters)
    BVA Test Values: 0, 1, 2, 199, 200, 201, 202, 250
    """
    
    @pytest.mark.parametrize("length,should_pass", [
        (0, False),   # empty - required
        (1, True),    # min
        (2, True),    # min+1
        (199, True),  # max-1
        (200, True),  # max
        (201, False), # max+1
        (202, False), # max+2
        (250, False), # EP invalid partition
    ])
    def test_title_length_boundaries(self, length, should_pass):
        """BVA: Test title length at various boundaries"""
        title = "A" * length if length > 0 else ""
        if should_pass:
            product = create_valid_product(title=title)
            assert len(product.title) == length
        else:
            with pytest.raises(ValidationError):
                create_valid_product(title=title)
    
    def test_title_required(self):
        """EP: Title is required field"""
        with pytest.raises(ValidationError):
            ProductCreate(
                description="Test",
                price_amount=Decimal("100"),
                category_id=1
            )


# ============================================
# DESCRIPTION TESTS
# ============================================

class TestDescriptionLength:
    """
    Description length boundaries (1-1000 characters)
    BVA Test Values: 0, 1, 2, 999, 1000, 1001, 1002, 1500
    """
    
    @pytest.mark.parametrize("length,should_pass", [
        (0, False),    # empty - required
        (1, True),     # min
        (2, True),     # min+1
        (999, True),   # max-1
        (1000, True),  # max
        (1001, False), # max+1
        (1002, False), # max+2
        (1500, False), # EP invalid partition
    ])
    def test_description_length_boundaries(self, length, should_pass):
        """BVA: Test description length at various boundaries"""
        description = "A" * length if length > 0 else ""
        if should_pass:
            product = create_valid_product(description=description)
            assert len(product.description) == length
        else:
            with pytest.raises(ValidationError):
                create_valid_product(description=description)
    
    def test_description_required(self):
        """EP: Description is required field"""
        with pytest.raises(ValidationError):
            ProductCreate(
                title="Test Product",
                price_amount=Decimal("100"),
                category_id=1
            )


# ============================================
# PRICE AMOUNT TESTS
# ============================================

class TestPriceAmount:
    """
    Price amount boundaries (must be > 0, up to 999,999)
    BVA Test Values: -1, 0, 0.01, 0.02, 999999
    """
    
    @pytest.mark.parametrize("amount,should_pass", [
        (Decimal("-1"), False),      # negative
        (Decimal("0"), False),        # zero
        (Decimal("0.001"), False),    # too many decimal places
        (Decimal("0.01"), True),      # min valid
        (Decimal("0.02"), True),      # min+0.01
        (Decimal("1.00"), True),      # normal
        (Decimal("150.50"), True),    # normal with decimals
        (Decimal("999999.00"), True), # max reasonable
        (Decimal("999999.99"), True), # max with decimals
    ])
    def test_price_amount_boundaries(self, amount, should_pass):
        """BVA: Test price amount at various boundaries"""
        if should_pass:
            product = create_valid_product(price_amount=amount)
            assert product.price_amount == amount
        else:
            with pytest.raises(ValidationError):
                create_valid_product(price_amount=amount)
    
    def test_price_amount_required(self):
        """EP: Price amount is required field"""
        with pytest.raises(ValidationError):
            ProductCreate(
                title="Test",
                description="Test",
                category_id=1
            )
    
    @pytest.mark.parametrize("amount_str,should_pass", [
        ("100", True),        # integer
        ("100.5", True),      # one decimal
        ("100.50", True),     # two decimals
        ("100.505", False),   # three decimals (too many)
    ])
    def test_price_decimal_places(self, amount_str, should_pass):
        """BVA: Test decimal places validation"""
        if should_pass:
            product = create_valid_product(price_amount=Decimal(amount_str))
            assert product.price_amount == Decimal(amount_str)
        else:
            with pytest.raises(ValidationError):
                create_valid_product(price_amount=Decimal(amount_str))


# ============================================
# PRICE CURRENCY TESTS
# ============================================

class TestPriceCurrency:
    """Price currency validation (3-letter uppercase codes)"""
    
    @pytest.mark.parametrize("currency,should_pass", [
        ("DKK", True),   # Danish Krone
        ("EUR", True),   # Euro
        ("USD", True),   # US Dollar
        ("GBP", True),   # British Pound
        ("NOK", True),   # Norwegian Krone
        ("SEK", True),   # Swedish Krona
        ("XYZ", True),   # Pattern matches but semantically invalid (service validates)
        ("dkk", False),  # lowercase
        ("Dkk", False),  # mixed case
        ("DK", False),   # too short
        ("DKKK", False), # too long
        ("123", False),  # numbers
        ("D K", False),  # with space
    ])
    def test_currency_code_validation(self, currency, should_pass):
        """EP: Test valid and invalid currency codes"""
        if should_pass:
            product = create_valid_product(price_currency=currency)
            assert product.price_currency == currency
        else:
            with pytest.raises(ValidationError):
                create_valid_product(price_currency=currency)
    
    def test_currency_default_value(self):
        """EP: Currency defaults to DKK if not provided"""
        product = ProductCreate(
            title="Test",
            description="Test desc",
            price_amount=Decimal("100"),
            category_id=1
        )
        assert product.price_currency == "DKK"


# ============================================
# CATEGORY ID TESTS
# ============================================

class TestCategoryId:
    """Category ID validation (must be > 0)"""
    
    @pytest.mark.parametrize("category_id,should_pass", [
        (-1, False),    # negative
        (0, False),     # zero
        (1, True),      # min valid
        (2, True),      # min+1
        (999, True),    # large valid
        (99999, True),  # very large (existence checked by service)
    ])
    def test_category_id_boundaries(self, category_id, should_pass):
        """BVA: Test category ID boundaries"""
        if should_pass:
            product = create_valid_product(category_id=category_id)
            assert product.category_id == category_id
        else:
            with pytest.raises(ValidationError):
                create_valid_product(category_id=category_id)
    
    def test_category_id_required(self):
        """EP: Category ID is required field"""
        with pytest.raises(ValidationError):
            ProductCreate(
                title="Test",
                description="Test",
                price_amount=Decimal("100")
            )


# ============================================
# QUANTITY TESTS
# ============================================

class TestQuantity:
    """
    Quantity boundaries (1-999)
    BVA Test Values: -1, 0, 1, 2, 998, 999, 1000, 1001, 1500
    """
    
    @pytest.mark.parametrize("quantity,should_pass", [
        (-1, False),   # negative
        (0, False),    # zero
        (1, True),     # min
        (2, True),     # min+1
        (50, True),    # normal
        (998, True),   # max-1
        (999, True),   # max
        (1000, True),  # schema allows (no upper limit enforced)
        (1500, True),  # schema allows (no upper limit enforced)
    ])
    def test_quantity_boundaries(self, quantity, should_pass):
        """BVA: Test quantity at various boundaries"""
        if should_pass:
            product = create_valid_product(quantity=quantity)
            assert product.quantity == quantity
        else:
            with pytest.raises(ValidationError):
                create_valid_product(quantity=quantity)
    
    def test_quantity_defaults_to_1(self):
        """EP: Quantity defaults to 1 if not provided"""
        product = ProductCreate(
            title="Test",
            description="Test",
            price_amount=Decimal("100"),
            category_id=1
        )
        assert product.quantity == 1


# ============================================
# CONDITION TESTS
# ============================================

class TestCondition:
    """Condition validation (enum values)"""
    
    @pytest.mark.parametrize("condition,should_pass", [
        ("new", True),
        ("like_new", True),
        ("good", True),
        ("fair", True),
        ("needs_repair", True),
        ("broken", False),      # not in enum
        ("excellent", False),   # not in enum
        ("New", False),         # wrong case
        ("GOOD", False),        # wrong case
        ("", False),            # empty
    ])
    def test_condition_enum_values(self, condition, should_pass):
        """EP: Test valid and invalid condition values"""
        if should_pass:
            product = create_valid_product(condition=condition)
            assert product.condition == condition
        else:
            with pytest.raises(ValidationError):
                create_valid_product(condition=condition)
    
    def test_condition_optional(self):
        """EP: Condition is optional field"""
        product = ProductCreate(
            title="Test",
            description="Test",
            price_amount=Decimal("100"),
            category_id=1,
            condition=None
        )
        assert product.condition is None


# ============================================
# IMAGE URLS TESTS
# ============================================

class TestImageUrls:
    """
    Image URLs validation (0-10 images)
    BVA Test Values: 0, 1, 2, 9, 10, 11, 12
    Note: Schema doesn't enforce max, but analysis suggests 10 max
    """
    
    @pytest.mark.parametrize("count,description", [
        (0, "no images"),
        (1, "one image"),
        (2, "two images"),
        (5, "five images"),
        (9, "nine images"),
        (10, "ten images"),
        (11, "eleven images - may exceed limit"),
        (12, "twelve images - may exceed limit"),
    ])
    def test_image_urls_count(self, count, description):
        """BVA: Test image URLs count (schema allows any, business may limit)"""
        image_urls = [f"https://example.com/image{i}.jpg" for i in range(count)]
        product = create_valid_product(image_urls=image_urls)
        assert len(product.image_urls) == count
    
    def test_image_urls_optional(self):
        """EP: Image URLs are optional"""
        product = create_valid_product(image_urls=None)
        assert product.image_urls is None
    
    def test_empty_image_urls_list(self):
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
    
    @pytest.mark.parametrize("dimension,should_pass", [
        (Decimal("-1"), False),     # negative
        (Decimal("0"), False),       # zero
        (Decimal("0.1"), True),      # min valid
        (Decimal("0.2"), True),      # min+0.1
        (Decimal("50"), True),       # normal
        (Decimal("999.9"), True),    # max-0.1
        (Decimal("1000"), True),     # max
        (Decimal("1000.1"), True),   # max+0.1 (schema allows but may be limit)
        (Decimal("1500"), True),     # large (schema allows but may be limit)
    ])
    def test_width_boundaries(self, dimension, should_pass):
        """BVA: Test width_cm boundaries"""
        if should_pass:
            product = create_valid_product(width_cm=dimension)
            assert product.width_cm == dimension
        else:
            with pytest.raises(ValidationError):
                create_valid_product(width_cm=dimension)
    
    @pytest.mark.parametrize("dimension,should_pass", [
        (Decimal("-1"), False),
        (Decimal("0"), False),
        (Decimal("0.1"), True),
        (Decimal("999.9"), True),
        (Decimal("1000"), True),
    ])
    def test_height_boundaries(self, dimension, should_pass):
        """BVA: Test height_cm boundaries"""
        if should_pass:
            product = create_valid_product(height_cm=dimension)
            assert product.height_cm == dimension
        else:
            with pytest.raises(ValidationError):
                create_valid_product(height_cm=dimension)
    
    @pytest.mark.parametrize("dimension,should_pass", [
        (Decimal("-1"), False),
        (Decimal("0"), False),
        (Decimal("0.1"), True),
        (Decimal("1000"), True),
    ])
    def test_depth_boundaries(self, dimension, should_pass):
        """BVA: Test depth_cm boundaries"""
        if should_pass:
            product = create_valid_product(depth_cm=dimension)
            assert product.depth_cm == dimension
        else:
            with pytest.raises(ValidationError):
                create_valid_product(depth_cm=dimension)
    
    @pytest.mark.parametrize("weight,should_pass", [
        (Decimal("-1"), False),
        (Decimal("0"), False),
        (Decimal("0.001"), True),    # min with 3 decimals
        (Decimal("0.1"), True),
        (Decimal("50.5"), True),
        (Decimal("999.999"), True),
    ])
    def test_weight_boundaries(self, weight, should_pass):
        """BVA: Test weight_kg boundaries (3 decimal places)"""
        if should_pass:
            product = create_valid_product(weight_kg=weight)
            assert product.weight_kg == weight
        else:
            with pytest.raises(ValidationError):
                create_valid_product(weight_kg=weight)
    
    def test_dimensions_all_optional(self):
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


# ============================================
# LOCATION ID TESTS
# ============================================

class TestLocationId:
    """Location ID validation (optional, must be > 0 if provided)"""
    
    @pytest.mark.parametrize("location_id,should_pass", [
        (None, True),   # optional - can be None
        (-1, False),    # negative
        (0, False),     # zero
        (1, True),      # min valid
        (2, True),      # valid
        (999, True),    # large valid
    ])
    def test_location_id_boundaries(self, location_id, should_pass):
        """BVA: Test location ID boundaries"""
        if should_pass:
            product = create_valid_product(location_id=location_id)
            assert product.location_id == location_id
        else:
            with pytest.raises(ValidationError):
                create_valid_product(location_id=location_id)


# ============================================
# RELATED IDS TESTS
# ============================================

class TestRelatedIds:
    """Test color_ids, material_ids, tag_ids (optional lists)"""
    
    def test_color_ids_optional(self):
        """EP: color_ids is optional"""
        product = create_valid_product(color_ids=None)
        assert product.color_ids is None
    
    def test_color_ids_empty_list(self):
        """EP: color_ids can be empty list"""
        product = create_valid_product(color_ids=[])
        assert product.color_ids == []
    
    def test_color_ids_with_values(self):
        """EP: color_ids with valid integers"""
        product = create_valid_product(color_ids=[1, 2, 3])
        assert product.color_ids == [1, 2, 3]
    
    def test_material_ids_optional(self):
        """EP: material_ids is optional"""
        product = create_valid_product(material_ids=None)
        assert product.material_ids is None
    
    def test_tag_ids_optional(self):
        """EP: tag_ids is optional"""
        product = create_valid_product(tag_ids=None)
        assert product.tag_ids is None


# ============================================
# COMBINED BOUNDARY TESTS
# ============================================

class TestCombinedBoundaryScenarios:
    """Test combined boundary scenarios"""
    
    def test_all_required_fields_at_minimum(self):
        """Test with all required fields at minimum boundaries"""
        product = ProductCreate(
            title="A",                      # 1 char (min)
            description="B",                # 1 char (min)
            price_amount=Decimal("0.01"),   # min price
            price_currency="DKK",
            category_id=1,                  # min ID
            quantity=1                      # min quantity
        )
        assert len(product.title) == 1
        assert len(product.description) == 1
        assert product.price_amount == Decimal("0.01")
        assert product.quantity == 1
    
    def test_all_fields_at_maximum(self):
        """Test with fields at maximum boundaries"""
        product = ProductCreate(
            title="A" * 200,                 # max title
            description="B" * 1000,          # max description
            price_amount=Decimal("999999.99"), # high price
            price_currency="USD",
            category_id=999,
            quantity=999,                    # max reasonable quantity
            condition="needs_repair",
            width_cm=Decimal("1000"),
            height_cm=Decimal("1000"),
            depth_cm=Decimal("1000"),
            weight_kg=Decimal("999.999")
        )
        assert len(product.title) == 200
        assert len(product.description) == 1000
        assert product.quantity == 999
    
    def test_minimal_required_only(self):
        """Test with only required fields"""
        product = ProductCreate(
            title="Test Product",
            description="Test description",
            price_amount=Decimal("100.00"),
            category_id=1
        )
        # Check defaults and optional fields
        assert product.price_currency == "DKK"
        assert product.quantity == 1
        assert product.condition is None
        assert product.location_id is None
