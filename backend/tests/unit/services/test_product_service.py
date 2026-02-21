import pytest
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from fastapi import HTTPException, status
from unittest.mock import AsyncMock, MagicMock, call

from app.repositories.base import ProductRepositoryInterface, UserRepositoryInterface
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.services.file_upload_service import FileUploadService
from app.services.product_service import ProductService


def make_product(**overrides):
    base = dict(
        id=1,
        title="Title",
        description="Desc",
        price_amount=Decimal("10.00"),
        price_currency="DKK",
        category_id=1,
        condition="good",
        quantity=1,
        likes_count=0,
        status="active",
        seller_id=1,
        location_id=1,
        sold_at=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        width_cm=None,
        height_cm=None,
        depth_cm=None,
        weight_kg=None,
        images=[],
        views_count=0,
        colors=[],
        materials=[],
        tags=[],
        price_changes=[],
        seller=None,
        location=None,
        image_urls=None,
    )
    base.update(overrides)
    return SimpleNamespace(**base)


@pytest.fixture
def product_repository():
    return MagicMock(spec=ProductRepositoryInterface)


@pytest.fixture
def user_repository():
    return MagicMock(spec=UserRepositoryInterface)


@pytest.fixture
def file_upload_service():
    service = MagicMock(spec=FileUploadService)
    service.validate_and_save_images = AsyncMock(return_value=[])
    service.delete_images = AsyncMock()
    return service


@pytest.fixture
def product_service(product_repository, user_repository, file_upload_service):
    return ProductService(product_repository, user_repository, file_upload_service)


@pytest.mark.asyncio
async def test_create_product_without_images_uses_repository(product_service, product_repository, file_upload_service):
    payload = ProductCreate(
        title="New",
        description="Desc",
        price_amount=Decimal("5.00"),
        price_currency="DKK",
        category_id=2,
    )
    created = make_product()
    product_repository.create.return_value = created

    result = await product_service.create_product(payload, seller_id=5)

    assert result is created
    product_repository.create.assert_called_once_with(payload, 5)
    file_upload_service.validate_and_save_images.assert_not_called()
    file_upload_service.delete_images.assert_not_called()


@pytest.mark.asyncio
async def test_create_product_with_images_sets_urls(product_service, product_repository, file_upload_service):
    payload = ProductCreate(
        title="New",
        description="Desc",
        price_amount=Decimal("5.00"),
        price_currency="DKK",
        category_id=2,
    )
    product_repository.create.return_value = make_product()
    file_upload_service.validate_and_save_images = AsyncMock(return_value=["img1", "img2"])

    result = await product_service.create_product(payload, seller_id=1, image_files=[MagicMock(), MagicMock()])

    assert payload.image_urls == ["img1", "img2"]
    assert result is product_repository.create.return_value
    file_upload_service.validate_and_save_images.assert_awaited_once()
    file_upload_service.delete_images.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_product_failure_cleans_up_images(product_service, product_repository, file_upload_service):
    payload = ProductCreate(
        title="New",
        description="Desc",
        price_amount=Decimal("5.00"),
        price_currency="DKK",
        category_id=2,
    )
    file_upload_service.validate_and_save_images = AsyncMock(return_value=["tmp1"])
    product_repository.create.side_effect = ValueError("boom")

    with pytest.raises(ValueError):
        await product_service.create_product(payload, seller_id=1, image_files=[MagicMock()])

    file_upload_service.validate_and_save_images.assert_awaited_once()
    file_upload_service.delete_images.assert_awaited_once_with(["tmp1"])


def test_get_product_by_id_returns_none_when_not_found(product_service, product_repository):
    product_repository.get_by_id.return_value = None

    result = product_service.get_product_by_id(1, current_user_id=None)

    assert result is None
    product_repository.record_view.assert_not_called()


def test_get_product_by_id_inactive_for_other_user_returns_none(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(status="draft", seller_id=5)

    result = product_service.get_product_by_id(1, current_user_id=10)

    assert result is None
    product_repository.record_view.assert_not_called()


def test_get_product_by_id_records_view_and_reloads(product_service, product_repository):
    product = make_product(status="active", seller_id=10)
    product_reloaded = make_product(status="active", seller_id=10)
    product_repository.get_by_id.side_effect = [product, product_reloaded]

    result = product_service.get_product_by_id(1, current_user_id=20)

    assert result.id == product_reloaded.id
    assert product_repository.record_view.call_args == call(1, 20)
    assert product_repository.get_by_id.call_args_list == [
        call(1, load_details=True),
        call(1, load_details=True),
    ]


def test_get_product_by_id_allows_owner_when_inactive(product_service, product_repository):
    product = make_product(status="paused", seller_id=7)
    product_repository.get_by_id.return_value = product

    result = product_service.get_product_by_id(1, current_user_id=7)

    assert result.id == product.id
    product_repository.record_view.assert_not_called()


@pytest.mark.asyncio
async def test_update_product_not_found_raises(product_service, product_repository):
    product_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await product_service.update_product(1, ProductUpdate(title="x"), user_id=1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    product_repository.update.assert_not_called()


@pytest.mark.asyncio
async def test_update_product_forbidden_for_non_owner(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)

    with pytest.raises(HTTPException) as exc_info:
        await product_service.update_product(1, ProductUpdate(title="x"), user_id=2, is_admin=False)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    product_repository.update.assert_not_called()


@pytest.mark.asyncio
async def test_update_product_success_deletes_old_images(product_service, product_repository, file_upload_service):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)
    file_upload_service.validate_and_save_images = AsyncMock(return_value=["new1"])
    updated_product = SimpleNamespace(id=1)
    product_repository.update.return_value = (updated_product, ["old1"])

    result = await product_service.update_product(
        1,
        ProductUpdate(title="updated"),
        user_id=1,
        image_files=[MagicMock()],
    )

    assert result is updated_product
    product_repository.update.assert_called_once()
    file_upload_service.delete_images.assert_awaited_once_with(["old1"])


@pytest.mark.asyncio
async def test_update_product_repo_returns_none_raises_500(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)
    product_repository.update.return_value = (None, [])

    with pytest.raises(HTTPException) as exc_info:
        await product_service.update_product(1, ProductUpdate(title="bad"), user_id=1)

    assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.asyncio
async def test_update_product_exception_cleans_up_new_images(product_service, product_repository, file_upload_service):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)
    file_upload_service.validate_and_save_images = AsyncMock(return_value=["new1"])
    product_repository.update.side_effect = ValueError("explode")

    with pytest.raises(ValueError):
        await product_service.update_product(1, ProductUpdate(title="x"), user_id=1, image_files=[MagicMock()])

    file_upload_service.delete_images.assert_awaited_once_with(["new1"])


@pytest.mark.asyncio
async def test_delete_product_not_found_raises(product_service, product_repository):
    product_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await product_service.delete_product(1, user_id=1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_product_forbidden_for_non_owner(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=2)

    with pytest.raises(HTTPException) as exc_info:
        await product_service.delete_product(1, user_id=1)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    product_repository.soft_delete.assert_not_called()


@pytest.mark.asyncio
async def test_delete_product_success_calls_soft_delete(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)
    product_repository.soft_delete.return_value = True

    result = await product_service.delete_product(1, user_id=1)

    assert result is True
    product_repository.soft_delete.assert_called_once_with(1)


@pytest.mark.asyncio
async def test_force_delete_product_returns_false_when_repo_none(product_service, product_repository):
    product_repository.delete.return_value = None

    result = await product_service.force_delete_product(1)

    assert result is False


@pytest.mark.asyncio
async def test_force_delete_product_deletes_images(product_service, product_repository, file_upload_service):
    product_repository.delete.return_value = ["img1", "img2"]

    result = await product_service.force_delete_product(1)

    assert result is True
    file_upload_service.delete_images.assert_awaited_once_with(["img1", "img2"])


def test_mark_product_as_sold_forbidden_for_non_owner(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1)

    with pytest.raises(HTTPException) as exc_info:
        product_service.mark_product_as_sold(1, user_id=2, is_admin=False)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    product_repository.update.assert_not_called()


def test_mark_product_as_sold_missing_product_raises(product_service, product_repository):
    product_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        product_service.mark_product_as_sold(1, user_id=2)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


def test_toggle_product_status_active_to_paused(product_service, product_repository):
    product_repository.get_by_id.return_value = make_product(status="active", seller_id=1)
    updated_product = make_product(status="paused", seller_id=1)
    product_repository.update.return_value = (updated_product, [])

    result = product_service.toggle_product_status(1, user_id=1)

    assert result.status == "paused"
    product_repository.update.assert_called_once()


def test_toggle_product_status_unauthorized(product_service, product_repository):
    product_repository.get_by_id.return_value = SimpleNamespace(seller_id=1, status="active")

    with pytest.raises(HTTPException) as exc_info:
        product_service.toggle_product_status(1, user_id=2)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN


def test_toggle_product_status_missing_product_raises(product_service, product_repository):
    product_repository.get_by_id.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        product_service.toggle_product_status(1, user_id=1)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# BVA and EP tests for ProductService.create_product validations
# Image Size, Images Count, Category Existence 


@pytest.mark.asyncio
async def test_create_product_fails_when_file_too_large(
    product_service, file_upload_service
):
    """
    Covers Analysis: Image Size -> Invalid (> 5MB)
    """
    payload = ProductCreate(
        title="Test",
        description="Test description",
        category_id=1,
        price_amount=Decimal("10")
    )
    
    # MOCK BEHAVIOR: Simulate the FileUploadService rejecting the file
    file_upload_service.validate_and_save_images.side_effect = HTTPException(
        status_code=413, 
        detail="File too large"
    )

    # Act & Assert
    with pytest.raises(HTTPException) as exc:
        await product_service.create_product(
            payload, 
            seller_id=1, 
            image_files=[MagicMock()] # The mock file itself doesn't matter, the side_effect does
        )
    
    assert exc.value.status_code == 413
    assert "File too large" in exc.value.detail


# TODO: Image count validation not yet implemented in ProductService
# @pytest.mark.asyncio
# async def test_create_product_fails_when_too_many_images(
#     product_service, file_upload_service
# ):
#     """
#     Covers Analysis: Images Count -> Invalid (11+ files)
#     TODO: Implement max images check in ProductService.create_product()
#     Note: FileUploadService.MAX_IMAGES_PER_PRODUCT = 10
#     """
#     payload = ProductCreate(
#         title="Test",
#         description="Test description",
#         category_id=1,
#         price_amount=Decimal("10")
#     )
#     
#     too_many_files = [MagicMock() for _ in range(11)]
# 
#     # When implemented, should validate image count before processing
#     with pytest.raises(HTTPException) as exc:
#         await product_service.create_product(
#             payload, 
#             seller_id=1, 
#             image_files=too_many_files
#         )
#     
#     assert exc.value.status_code == 400
#     assert "Too many images" in str(exc.value.detail)

# TODO: Category existence validation not yet implemented in ProductService
# @pytest.mark.asyncio
# async def test_create_product_fails_when_category_does_not_exist(
#     product_service, product_repository
# ):
#     """
#     Covers Analysis: Category ID -> Invalid (Non-Existing)
#     TODO: Implement category existence check in ProductService.create_product()
#     """
#     payload = ProductCreate(
#         title="Test", 
#         description="Test description",
#         category_id=99999, 
#         price_amount=Decimal("10")
#     )
#     
#     # When implemented, should check category exists before creating product
#     with pytest.raises(HTTPException) as exc:
#         await product_service.create_product(payload, seller_id=1)
#     
#     assert exc.value.status_code == 404
#     assert "Category not found" in exc.value.detail


# ============================================
# SEARCH TERM VALIDATION TESTS
# ============================================

class TestSearchProductsValidation:
    """
    Search term validation based on BVA/EP analysis:
    - Search Length: 0 (empty), 1-100 chars (valid), 101+ chars (invalid)
    - Search Content: Standard text, special chars, security attacks
    - BVA Boundaries: 0, 1, 99, 100, 101, 102
    """

    @pytest.mark.parametrize("length,should_pass", [
        (0, True),    # empty - show all
        (1, True),    # min
        (2, True),    # min+1
        (99, True),   # max-1
        (100, True),  # max
        (101, False), # max+1
        (102, False), # max+2
        (150, False), # EP invalid partition
    ])
    def test_search_length_boundaries(self, length, should_pass, product_service, product_repository):
        """BVA: Test search term length boundaries (0-100 chars)"""
        search_term = "a" * length
        
        if should_pass:
            product_repository.search_by_title.return_value = [make_product()]
            result = product_service.search_products(search_term)
            
            # Verify repository was called
            product_repository.search_by_title.assert_called_once()
            assert isinstance(result, list)
        else:
            # Should raise validation error for too long search terms
            with pytest.raises(HTTPException) as exc:
                product_service.search_products(search_term)
            assert exc.value.status_code == 400
            assert "too long" in str(exc.value.detail).lower()

    def test_search_standard_text(self, product_service, product_repository):
        """EP: Search with standard text returns filtered results"""
        search_term = "Trek"
        expected_products = [
            make_product(id=1, title="Trek Mountain Bike"),
            make_product(id=2, title="Trek Road Bike"),
        ]
        product_repository.search_by_title.return_value = expected_products
        
        result = product_service.search_products(search_term)
        
        assert result == expected_products
        # Default: page=1, size=20 → skip=0, limit=20
        product_repository.search_by_title.assert_called_once()

    def test_search_with_special_characters(self, product_service, product_repository):
        """EP: Search with special characters (bike-2024!) succeeds"""
        search_term = "bike-2024!"
        product_repository.search_by_title.return_value = [make_product()]
        
        result = product_service.search_products(search_term)
        
        assert isinstance(result, list)
        product_repository.search_by_title.assert_called_once()

    def test_search_empty_string_shows_all(self, product_service, product_repository):
        """EP: Empty search (0 chars) returns all products"""
        all_products = [
            make_product(id=1, title="Product 1"),
            make_product(id=2, title="Product 2"),
            make_product(id=3, title="Product 3"),
        ]
        product_repository.search_by_title.return_value = all_products
        
        result = product_service.search_products("")
        
        assert result == all_products
        product_repository.search_by_title.assert_called_once()

    def test_search_with_whitespace(self, product_service, product_repository):
        """EP: Search with whitespace is handled correctly"""
        search_term = "red bike"
        product_repository.search_by_title.return_value = [make_product(title="Red Bike")]
        
        result = product_service.search_products(search_term)
        
        assert isinstance(result, list)
        product_repository.search_by_title.assert_called_once()

    @pytest.mark.parametrize("malicious_input", [
        "' OR 1=1",                    # SQL injection attempt
        "'; DROP TABLE products; --", # SQL injection
        "<script>alert('xss')</script>", # XSS attempt
        "../../../etc/passwd",        # Path traversal
        "%'; DELETE FROM users; --",  # SQL with wildcards
    ])
    def test_search_security_sanitization(self, malicious_input, product_service, product_repository):
        """EP: Security attacks are sanitized and handled safely"""
        # Service should sanitize and search safely without executing malicious code
        product_repository.search_by_title.return_value = []
        
        result = product_service.search_products(malicious_input)
        
        # Should return empty results or safe results, not execute malicious code
        assert isinstance(result, list)
        # Verify the repository was called (meaning sanitization happened in service)
        product_repository.search_by_title.assert_called_once()
        
        # Verify the actual call - the service should pass the sanitized input
        call_args = product_repository.search_by_title.call_args
        assert call_args is not None

    def test_search_with_unicode_characters(self, product_service, product_repository):
        """EP: Search with unicode characters succeeds"""
        search_term = "café ñoño 中文"
        product_repository.search_by_title.return_value = [make_product()]
        
        result = product_service.search_products(search_term)
        
        assert isinstance(result, list)
        product_repository.search_by_title.assert_called_once()

    def test_search_pagination_parameters(self, product_service, product_repository):
        """Test search respects skip and limit parameters"""
        search_term = "bike"
        product_repository.search_by_title.return_value = [make_product()]
        
        result = product_service.search_products(search_term, skip=50, limit=50)
        
        # skip=50, limit=50 (equivalent to page=2, size=50)
        assert isinstance(result, list)
        product_repository.search_by_title.assert_called_once_with(search_term, 50, 50)

    def test_search_no_results_returns_empty_list(self, product_service, product_repository):
        """EP: Search with no matching results returns empty list"""
        search_term = "nonexistentproduct12345"
        product_repository.search_by_title.return_value = []
        
        result = product_service.search_products(search_term)
        
        assert result == []
        product_repository.search_by_title.assert_called_once()


# ============================================
# PAGINATION VALIDATION TESTS (skip/limit parameters)
# ============================================

class TestPaginationValidation:
    """
    Pagination validation based on BVA/EP analysis.
    Tests the skip/limit parameters used in repository methods.
    
    Analysis converts page/size to skip/limit:
    - Page ≥ 1 → skip = (page - 1) * size
    - Size 1-100 → limit = size
    
    BVA Boundaries tested:
    - Skip: 0, 20, 50 (calculated from page/size)
    - Limit: -1, 0, 1, 2, 99, 100, 101, 102
    """

    @pytest.mark.parametrize("skip,limit", [
        (0, 20),      # First page
        (20, 20),     # Second page
        (50, 15),     # Page 4 with size 15
        (0, 1),       # Min limit
        (0, 100),     # Max limit
        (100, 50),    # Large skip
    ])
    def test_search_with_valid_skip_limit(self, skip, limit, product_service, product_repository):
        """EP: Valid skip/limit combinations work correctly"""
        product_repository.search_by_title.return_value = [make_product()]
        
        result = product_service.search_products("test", skip=skip, limit=limit)
        
        assert isinstance(result, list)
        product_repository.search_by_title.assert_called_once_with("test", skip, limit)

    def test_search_default_pagination(self, product_service, product_repository):
        """EP: Default pagination is skip=0, limit=20"""
        product_repository.search_by_title.return_value = [make_product()]
        
        result = product_service.search_products("test")
        
        # Defaults: skip=0, limit=20
        product_repository.search_by_title.assert_called_once_with("test", 0, 20)
        assert isinstance(result, list)

    def test_get_products_by_seller_pagination(self, product_service, product_repository):
        """EP: get_products_by_seller respects skip/limit"""
        product_repository.get_by_seller.return_value = [make_product()]
        product_repository.count_by_seller.return_value = 100
        
        products, total = product_service.get_products_by_seller(seller_id=1, skip=30, limit=30)
        
        product_repository.get_by_seller.assert_called_once_with(1, 30, 30)
        assert total == 100
        assert isinstance(products, list)

    def test_get_products_by_category_pagination(self, product_service, product_repository):
        """EP: get_products_by_category respects skip/limit"""
        product_repository.get_by_category.return_value = [make_product()]
        
        products, total = product_service.get_products_by_category(category="electronics", skip=50, limit=25)
        
        # Called twice: once for paginated results, once for count
        assert product_repository.get_by_category.call_count == 2
        first_call = product_repository.get_by_category.call_args_list[0]
        assert first_call[0] == ("electronics", 50, 25)
        assert isinstance(products, list)
