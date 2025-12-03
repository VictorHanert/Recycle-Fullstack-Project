import pytest
from fastapi import HTTPException, status
from unittest.mock import MagicMock

from app.models.location import Location
from app.repositories.base import LocationRepositoryInterface
from app.schemas.location_schema import LocationCreate, LocationUpdate
from app.services.location_service import LocationService


@pytest.fixture
def location_repository():
    return MagicMock(spec=LocationRepositoryInterface)


@pytest.fixture
def location_service(location_repository):
    return LocationService(location_repository)


def test_create_location_uses_get_or_create(location_service, location_repository):
    location_create = LocationCreate(city="Test City", postcode="12345")
    existing_location = Location(city="Test City", postcode="12345")
    existing_location.id = 1
    location_repository.get_or_create.return_value = existing_location

    result = location_service.create_location(location_create)

    assert result is existing_location
    location_repository.get_or_create.assert_called_once_with("Test City", "12345")


def test_get_location_by_id_delegates_to_repository(location_service, location_repository):
    location = Location(city="Townsville", postcode="54321")
    location.id = 2
    location_repository.get_by_id.return_value = location

    result = location_service.get_location_by_id(2)

    assert result is location
    location_repository.get_by_id.assert_called_once_with(2)


def test_get_all_locations_uses_defaults(location_service, location_repository):
    locations = [Location(city="A", postcode="11111")]
    location_repository.get_all.return_value = locations

    result = location_service.get_all_locations()

    assert result == locations
    location_repository.get_all.assert_called_once_with(0, 100)


def test_search_locations_forwards_query_with_limit(location_service, location_repository):
    matches = [Location(city="New York", postcode="10001")]
    location_repository.search_locations.return_value = matches

    result = location_service.search_locations("York")

    assert result == matches
    location_repository.search_locations.assert_called_once_with("York", 10)


def test_update_location_success(location_service, location_repository):
    update_payload = LocationUpdate(city="Updated City")
    updated_location = Location(city="Updated City", postcode="22222")
    updated_location.id = 3
    location_repository.update.return_value = updated_location

    result = location_service.update_location(3, update_payload)

    assert result is updated_location
    location_repository.update.assert_called_once_with(3, city="Updated City", postcode=None)


def test_update_location_not_found_raises(location_service, location_repository):
    location_repository.update.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        location_service.update_location(999, LocationUpdate(city="Ghost Town"))

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Location not found"


def test_delete_location_success(location_service, location_repository):
    location_repository.delete.return_value = True

    result = location_service.delete_location(4)

    assert result is True
    location_repository.delete.assert_called_once_with(4)


def test_delete_location_not_found_raises(location_service, location_repository):
    location_repository.delete.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        location_service.delete_location(404)

    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
    assert exc_info.value.detail == "Location not found"
