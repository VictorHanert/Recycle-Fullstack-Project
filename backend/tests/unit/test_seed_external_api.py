from unittest.mock import patch, MagicMock
# Adjust the import based on where your seed.py is located relative to tests
from scripts.seed import fetch_unsplash_bike_image

class TestUnsplashSeeding:

    @patch('scripts.seed.requests.get')
    @patch('scripts.seed.random.choice')
    def test_fetch_unsplash_bike_image_success(self, mock_random_choice, mock_get):
        """
        Test that we correctly parse a valid 200 OK response from Unsplash.
        """
        # Mock random.choice to return predictable values: style, base_term, title_word (but title_word is derived from title)
        # Actually, random.choice is called for style, base_term, and results
        mock_random_choice.side_effect = ["used", "road bike", {"urls": {"regular": "https://images.unsplash.com/photo-fake-bicycle.jpg"}}]
        
        # 1. Arrange: Create a fake Unsplash response
        mock_api_response = {
            "results": [
                {
                    "urls": {
                        "regular": "https://images.unsplash.com/photo-fake-bicycle.jpg"
                    }
                }
            ]
        }
        
        # Configure the mock to return our fake data
        mock_response_object = MagicMock()
        mock_response_object.status_code = 200
        mock_response_object.json.return_value = mock_api_response
        mock_get.return_value = mock_response_object

        # 2. Act: Call your function
        # We pass a category and title to trigger the logic
        image_url = fetch_unsplash_bike_image("road", "Speedster 3000")

        # 3. Assert: Verify we got the URL from our fake data
        assert image_url == "https://images.unsplash.com/photo-fake-bicycle.jpg"
        
        # Verify we called the API with the correct params (Client ID, query, etc)
        args, kwargs = mock_get.call_args
        assert "api.unsplash.com/search/photos" in args[0]
        assert "client_id=" in args[0]
        # Check for query in the URL
        assert "used road bike speedster" in args[0]  # Based on mocked random choices

    @patch('scripts.seed.requests.get')
    @patch('scripts.seed.random.choice')
    def test_fetch_unsplash_bike_image_failure_fallback(self, mock_random_choice, mock_get):
        """
        Test that we fallback to a local image if the API fails (e.g., 403 Rate Limit or 500 Error).
        """
        # Mock random.choice for fallback selection
        mock_random_choice.return_value = "/images/mountain-bike.jpg"
        
        # 1. Arrange: Simulate a crash or bad status code
        mock_get.side_effect = Exception("Connection Timeout")
        
        # 2. Act
        image_url = fetch_unsplash_bike_image("mountain", "Mountain King")

        # 3. Assert: It should return the mocked fallback
        assert image_url == "/images/mountain-bike.jpg"