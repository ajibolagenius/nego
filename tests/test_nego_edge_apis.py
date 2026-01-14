"""
Nego Talent Marketplace Edge API Tests
Tests for: Cloudinary Signature, Gifts, Media Unlock APIs (Edge Runtime)
"""
import pytest
import requests
import os
import uuid

# Use localhost for testing since this is a Next.js app
BASE_URL = "http://localhost:3000"

class TestCloudinarySignatureAPI:
    """Cloudinary signature endpoint tests - Edge Runtime"""
    
    def test_signature_returns_valid_response(self):
        """GET /api/cloudinary/signature should return valid signature data"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        assert "signature" in data
        assert "timestamp" in data
        assert "cloud_name" in data
        assert "api_key" in data
        assert "folder" in data
        assert "resource_type" in data
        
        # Verify signature is a valid hex string (SHA1 = 40 chars)
        assert len(data["signature"]) == 40
        assert all(c in '0123456789abcdef' for c in data["signature"])
        
        # Verify defaults
        assert data["folder"] == "uploads"
        assert data["resource_type"] == "image"
    
    def test_signature_with_video_resource_type(self):
        """GET /api/cloudinary/signature?resource_type=video should work"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature?resource_type=video")
        assert response.status_code == 200
        data = response.json()
        assert data["resource_type"] == "video"
    
    def test_signature_with_custom_folder(self):
        """GET /api/cloudinary/signature?folder=media should work"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature?folder=media")
        assert response.status_code == 200
        data = response.json()
        assert data["folder"] == "media"
    
    def test_signature_with_nested_folder(self):
        """GET /api/cloudinary/signature?folder=users/avatars should work"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature?folder=users/avatars")
        assert response.status_code == 200
        data = response.json()
        assert data["folder"] == "users/avatars"
    
    def test_signature_invalid_resource_type_returns_400(self):
        """GET /api/cloudinary/signature?resource_type=audio should return 400"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature?resource_type=audio")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Invalid resource type" in data["error"]
    
    def test_signature_invalid_folder_returns_400(self):
        """GET /api/cloudinary/signature?folder=invalid_folder should return 400"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature?folder=invalid_folder")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Invalid folder" in data["error"]
    
    def test_signature_allowed_folders(self):
        """Test all allowed folders work"""
        allowed_folders = ['users', 'talents', 'media', 'avatars', 'profiles', 'uploads']
        for folder in allowed_folders:
            response = requests.get(f"{BASE_URL}/api/cloudinary/signature?folder={folder}")
            assert response.status_code == 200, f"Folder {folder} should be allowed"


class TestGiftsAPI:
    """Gifts endpoint tests - Edge Runtime with UUID validation"""
    
    def test_gifts_missing_fields_returns_400(self):
        """POST /api/gifts with missing fields should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Missing required fields" in data["error"]
    
    def test_gifts_invalid_uuid_returns_400(self):
        """POST /api/gifts with invalid UUID should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "invalid-uuid",
                "recipientId": "also-invalid",
                "amount": 100
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Invalid user ID format" in data["error"]
    
    def test_gifts_amount_below_minimum_returns_400(self):
        """POST /api/gifts with amount < 100 should return 400"""
        sender_id = str(uuid.uuid4())
        recipient_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": sender_id,
                "recipientId": recipient_id,
                "amount": 50
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Minimum gift amount" in data["error"]
    
    def test_gifts_self_gifting_returns_400(self):
        """POST /api/gifts to self should return 400"""
        user_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": user_id,
                "recipientId": user_id,
                "amount": 100
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Cannot gift to yourself" in data["error"]
    
    def test_gifts_nonexistent_sender_returns_404(self):
        """POST /api/gifts with non-existent sender should return 404"""
        sender_id = str(uuid.uuid4())
        recipient_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": sender_id,
                "recipientId": recipient_id,
                "amount": 100
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "wallet not found" in data["error"].lower()


class TestMediaUnlockAPI:
    """Media unlock endpoint tests - Edge Runtime"""
    
    def test_unlock_missing_fields_returns_400(self):
        """POST /api/media/unlock with missing fields should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/media/unlock",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Missing required fields" in data["error"]
    
    def test_unlock_invalid_uuid_returns_400(self):
        """POST /api/media/unlock with invalid UUID should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/media/unlock",
            json={
                "userId": "invalid",
                "mediaId": "invalid",
                "talentId": "invalid",
                "unlockPrice": 100
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "Invalid ID format" in data["error"]
    
    def test_unlock_nonexistent_user_returns_error(self):
        """POST /api/media/unlock with non-existent user should return error"""
        user_id = str(uuid.uuid4())
        media_id = str(uuid.uuid4())
        talent_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/media/unlock",
            json={
                "userId": user_id,
                "mediaId": media_id,
                "talentId": talent_id,
                "unlockPrice": 100
            },
            headers={"Content-Type": "application/json"}
        )
        # API returns 404 for wallet not found
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        assert "wallet not found" in data["error"].lower()
    
    def test_unlock_valid_uuid_format_accepted(self):
        """POST /api/media/unlock with valid UUID format should pass validation"""
        # This test verifies UUID validation passes (will fail on wallet lookup)
        user_id = str(uuid.uuid4())
        media_id = str(uuid.uuid4())
        talent_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/media/unlock",
            json={
                "userId": user_id,
                "mediaId": media_id,
                "talentId": talent_id,
                "unlockPrice": 100
            },
            headers={"Content-Type": "application/json"}
        )
        # Should not return 400 for invalid UUID format
        assert response.status_code != 400 or "Invalid ID format" not in response.json().get("error", "")


class TestAPIEdgeRuntime:
    """Tests to verify Edge Runtime compatibility"""
    
    def test_cloudinary_signature_no_server_error(self):
        """Cloudinary signature should not return 500/520 (Edge runtime working)"""
        response = requests.get(f"{BASE_URL}/api/cloudinary/signature")
        assert response.status_code not in [500, 520], "Edge runtime should work without Node.js crypto"
    
    def test_gifts_api_no_server_error(self):
        """Gifts API should not return 500/520 (Edge runtime working)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={"senderId": "test", "recipientId": "test", "amount": 100},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for validation error, not 500/520
        assert response.status_code not in [500, 520], "Edge runtime should work"
    
    def test_media_unlock_api_no_server_error(self):
        """Media unlock API should not return 500/520 (Edge runtime working)"""
        response = requests.post(
            f"{BASE_URL}/api/media/unlock",
            json={"userId": "test", "mediaId": "test", "talentId": "test", "unlockPrice": 100},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for validation error, not 500/520
        assert response.status_code not in [500, 520], "Edge runtime should work"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
