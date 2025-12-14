"""
Unit tests for FileUploadService using Boundary Value Analysis (BVA) 
and Equivalence Partitioning (EP).

Following best practices:
- Each test verifies only one behavior
- Positive and negative tests are separated
- Test case selection is comprehensive

Based on black box testing analysis for:
- Image count validation (0, 1-10, 11+)
- Image size validation (0 bytes, 1B-5MB, >5MB)
- File type validation (allowed and disallowed types)
"""

import pytest
from io import BytesIO
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch
from fastapi import HTTPException, UploadFile

from app.services.file_upload_service import FileUploadService


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_mock_upload_file(
    filename: str = "test.jpg",
    content_type: str = "image/jpeg",
    size: int = 1024,
    content: bytes = None
) -> Mock:
    """Helper to create a mock UploadFile"""
    if content is None:
        # Create content of exact size
        # Use a more efficient method for large files
        if size == 0:
            content = b""
        elif size < 1024:
            content = b"x" * size
        else:
            # For larger files, create in chunks to be more efficient
            chunk = b"x" * 1024
            full_chunks = size // 1024
            remainder = size % 1024
            content = chunk * full_chunks + b"x" * remainder
    
    # Create a Mock object instead of real UploadFile
    file = Mock(spec=UploadFile)
    file.filename = filename
    file.content_type = content_type
    file.file = BytesIO(content)
    
    # Mock the read method to return the content
    async def mock_read():
        return content
    
    file.read = mock_read
    return file


# ============================================
# IMAGE COUNT TESTS
# ============================================

class TestImageCount:
    """
    Image count validation (0-10 images allowed)
    BVA Test Values: 0, 1, 2, 9, 10, 11, 12
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("count", [
        0,    # Valid partition 0-10: lower boundary value
        1,    # Valid partition 0-10: lower boundary value + 1
        9,    # Valid partition 0-10: upper boundary value - 1
        10,   # Valid partition 0-10: upper boundary value
    ])
    async def test_image_count_valid_passes(self, count):
        """BVA: Test valid image count boundaries"""
        service = FileUploadService()
        files = [create_mock_upload_file(filename=f"test{i}.jpg") for i in range(count)]
        
        with patch.object(service, '_validate_and_save_single_image', new_callable=AsyncMock) as mock_save:
            mock_save.return_value = f"http://example.com/image.jpg"
            
            result = await service.validate_and_save_images(files)
            
            assert len(result) == count
            assert mock_save.call_count == count
    
    #
    # Negative testing
    #
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("count", [
        11,   # Invalid partition >10: upper boundary value + 1
        12,   # Invalid partition >10: upper boundary value + 2
    ])
    async def test_image_count_exceeds_limit_fails(self, count):
        """BVA: Test image count above maximum boundary"""
        service = FileUploadService()
        files = [create_mock_upload_file(filename=f"test{i}.jpg") for i in range(count)]
        
        with pytest.raises(HTTPException) as error_info:
            await service.validate_and_save_images(files)
        
        assert error_info.value.status_code == 400
        assert "Maximum 10 images allowed" in error_info.value.detail


# ============================================
# IMAGE SIZE TESTS
# ============================================

class TestImageSize:
    """
    Image size validation (1 byte - 5MB allowed)
    BVA Test Values: 0, 1, 5MB-1, 5MB, 5MB+1
    """
    
    #
    # Positive testing
    #
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("size", [
        1,                          # Valid partition 1B-5MB: lower boundary value
        2,                          # Valid partition 1B-5MB: lower boundary value + 1
        5 * 1024 * 1024 - 1,        # Valid partition 1B-5MB: upper boundary value - 1
        5 * 1024 * 1024,            # Valid partition 1B-5MB: upper boundary value (5MB)
    ])
    async def test_image_size_valid_passes(self, size, tmp_path):
        """BVA: Test valid image size boundaries"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(size=size)
        
        url = await service._validate_and_save_single_image(file)
        
        assert url is not None
        assert ".jpg" in url
    
    #
    # Negative testing
    #
    
    @pytest.mark.asyncio
    async def test_image_size_zero_fails(self, tmp_path):
        """BVA: Test zero byte file (empty file)"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(size=0, content=b"")
        
        with pytest.raises(HTTPException) as error_info:
            await service._validate_and_save_single_image(file)
        
        assert error_info.value.status_code == 400
        assert "File is empty" in error_info.value.detail
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("size", [
        5 * 1024 * 1024 + 1,        # Invalid partition >5MB: upper boundary value + 1
        5 * 1024 * 1024 + 2,        # Invalid partition >5MB: upper boundary value + 2
    ])
    async def test_image_size_exceeds_limit_fails(self, size, tmp_path):
        """BVA: Test image size above maximum boundary"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(size=size)
        
        with pytest.raises(HTTPException) as error_info:
            await service._validate_and_save_single_image(file)
        
        assert error_info.value.status_code == 400
        assert "File size must be less than 5MB" in error_info.value.detail


# ============================================
# FILE TYPE TESTS EXTRA NOT COVERED BY BVA AND EP
# ============================================

class TestFileType:
    """File type validation (content type and extension)"""
    
    #
    # Positive testing
    #
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("filename,content_type", [
        ("test.jpg", "image/jpeg"),      # EP: JPEG with .jpg extension
        ("test.jpeg", "image/jpeg"),     # EP: JPEG with .jpeg extension
        ("test.png", "image/png"),       # EP: PNG
        ("test.webp", "image/webp"),     # EP: WebP
        ("test.gif", "image/gif"),       # EP: GIF
    ])
    async def test_file_type_valid_passes(self, filename, content_type, tmp_path):
        """EP: Test valid file types"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(filename=filename, content_type=content_type)
        
        url = await service._validate_and_save_single_image(file)
        
        assert url is not None
        assert Path(filename).suffix.lower() in url.lower()
    
    #
    # Negative testing
    #
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("content_type", [
        "image/bmp",            # EP: unsupported image type
        "application/pdf",      # EP: PDF document
        "text/plain",           # EP: text file
        "video/mp4",            # EP: video file
        "application/zip",      # EP: archive file
    ])
    async def test_file_type_invalid_content_type_fails(self, content_type, tmp_path):
        """EP: Test invalid content types"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(filename="test.jpg", content_type=content_type)
        
        with pytest.raises(HTTPException) as error_info:
            await service._validate_and_save_single_image(file)
        
        assert error_info.value.status_code == 400
        assert "Invalid file type" in error_info.value.detail
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("filename", [
        "test.bmp",     # EP: unsupported extension
        "test.svg",     # EP: SVG (not allowed)
        "test.pdf",     # EP: PDF extension
        "test.txt",     # EP: text file extension
        "test.exe",     # EP: executable file
    ])
    async def test_file_type_invalid_extension_fails(self, filename, tmp_path):
        """EP: Test invalid file extensions"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(filename=filename, content_type="image/jpeg")
        
        with pytest.raises(HTTPException) as error_info:
            await service._validate_and_save_single_image(file)
        
        assert error_info.value.status_code == 400
        assert "Invalid file extension" in error_info.value.detail
    
    @pytest.mark.asyncio
    async def test_file_without_filename_fails(self, tmp_path):
        """EP: File without filename should fail"""
        service = FileUploadService(upload_base_path=str(tmp_path / "uploads"))
        file = create_mock_upload_file(filename="", content_type="image/jpeg")
        
        with pytest.raises(HTTPException) as error_info:
            await service._validate_and_save_single_image(file)
        
        assert error_info.value.status_code == 400
        assert "Filename is required" in error_info.value.detail



