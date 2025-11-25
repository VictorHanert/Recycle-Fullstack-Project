import pytest
from app.main import app
from fastapi.testclient import TestClient

# ----------------------------------------------------------------------
# FIXTURE: Test Client
# ----------------------------------------------------------------------
@pytest.fixture(scope="module")
def client():
    """
    Creates a TestClient instance. 
    This allows us to send HTTP requests to our FastAPI app without 
    running the actual server (e.g., client.get("/products")).
    """
    with TestClient(app) as c:
        yield c

# ----------------------------------------------------------------------
# FIXTURE: Mock Database Session (For Unit Tests)
# ----------------------------------------------------------------------
@pytest.fixture
def mock_db_session():
    """
    Use this fixture for UNIT tests where you don't want to hit the real DB.
    You can mock the return values of repository functions here.
    """
    # In the future, you will use 'unittest.mock.MagicMock' here
    pass