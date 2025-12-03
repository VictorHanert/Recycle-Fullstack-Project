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


def test_mark_product_as_sold_checks_owner_and_updates(product_service, product_repository):
    product_repository.get_by_id.return_value = make_product(status="active", seller_id=3)
    updated_product = make_product(status="sold", seller_id=3)
    product_repository.update.return_value = (updated_product, [])

    result = product_service.mark_product_as_sold(1, user_id=3, is_admin=False)

    assert result.status == "sold"
    product_repository.update.assert_called_once()


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
