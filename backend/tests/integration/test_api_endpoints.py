# ----------------------------------------------------------------------
# INTEGRATION TEST EXAMPLE
# Purpose: Test that endpoints respond correctly.
# ----------------------------------------------------------------------

def test_health_check(client):
    """
    Tests the root endpoint or health check.
    """
    response = client.get("/health")
    assert response.status_code == 200