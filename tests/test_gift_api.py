"""
Gift API Tests
Tests for the rebuilt gifting system API endpoint.
Validates UUID format, amount limits, self-gifting prevention, and error messages.
"""

import pytest
import requests

# Use localhost since this is a Next.js app with API routes
BASE_URL = "http://localhost:3000"

class TestGiftAPIValidation:
    """Tests for Gift API validation - ensures user-friendly error messages"""
    
    def test_missing_sender_id(self):
        """Test that missing senderId returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={"recipientId": "00000000-0000-0000-0000-000000000002", "amount": 100}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Sender ID is required" in data["error"]
        assert data.get("field") == "senderId"
    
    def test_missing_recipient_id(self):
        """Test that missing recipientId returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={"senderId": "00000000-0000-0000-0000-000000000001", "amount": 100}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Recipient ID is required" in data["error"]
        assert data.get("field") == "recipientId"
    
    def test_missing_amount(self):
        """Test that missing amount returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "amount is required" in data["error"].lower()
        assert data.get("field") == "amount"
    
    def test_invalid_sender_uuid_format(self):
        """Test that invalid senderId UUID returns clear error (not pattern error)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "invalid-uuid",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 100
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Invalid sender ID format" in data["error"]
        assert "pattern" not in data["error"].lower()  # No cryptic pattern errors
        assert data.get("field") == "senderId"
    
    def test_invalid_recipient_uuid_format(self):
        """Test that invalid recipientId UUID returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "not-a-uuid",
                "amount": 100
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Invalid recipient ID format" in data["error"]
        assert "pattern" not in data["error"].lower()
        assert data.get("field") == "recipientId"
    
    def test_amount_below_minimum(self):
        """Test that amount below 100 returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 50
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Minimum gift amount is 100" in data["error"]
        assert data.get("field") == "amount"
    
    def test_amount_above_maximum(self):
        """Test that amount above 1000000 returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 1000001
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Maximum gift amount is 1000000" in data["error"]
        assert data.get("field") == "amount"
    
    def test_self_gifting_prevention(self):
        """Test that sending gift to yourself is prevented"""
        same_id = "00000000-0000-0000-0000-000000000001"
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": same_id,
                "recipientId": same_id,
                "amount": 100
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "yourself" in data["error"].lower()
        assert data.get("field") == "recipientId"
    
    def test_valid_request_with_message(self):
        """Test valid request with optional message (will fail due to no wallet, but validates format)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 100,
                "message": "Thank you for your great work!"
            }
        )
        # Should pass validation but fail on wallet lookup
        data = response.json()
        assert data["success"] == False
        # Error should be about wallet, not validation
        assert "wallet" in data["error"].lower() or "balance" in data["error"].lower()
        # No pattern errors
        assert "pattern" not in data["error"].lower()
    
    def test_invalid_json_body(self):
        """Test that invalid JSON returns clear error"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            data="not-valid-json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "Invalid request format" in data["error"]


class TestGiftAPIHTTPMethods:
    """Tests for HTTP method handling"""
    
    def test_get_method_not_allowed(self):
        """Test that GET returns 405"""
        response = requests.get(f"{BASE_URL}/api/gifts")
        assert response.status_code == 405
        data = response.json()
        assert data["success"] == False
        assert "Method not allowed" in data["error"]
    
    def test_put_method_not_allowed(self):
        """Test that PUT returns 405"""
        response = requests.put(f"{BASE_URL}/api/gifts", json={})
        assert response.status_code == 405
        data = response.json()
        assert data["success"] == False
        assert "Method not allowed" in data["error"]
    
    def test_delete_method_not_allowed(self):
        """Test that DELETE returns 405"""
        response = requests.delete(f"{BASE_URL}/api/gifts")
        assert response.status_code == 405
        data = response.json()
        assert data["success"] == False
        assert "Method not allowed" in data["error"]


class TestGiftAPIEdgeCases:
    """Tests for edge cases and boundary conditions"""
    
    def test_amount_at_minimum_boundary(self):
        """Test amount exactly at minimum (100)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 100
            }
        )
        data = response.json()
        # Should pass validation (fail on wallet lookup)
        assert "Minimum" not in data.get("error", "")
    
    def test_amount_at_maximum_boundary(self):
        """Test amount exactly at maximum (1000000)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 1000000
            }
        )
        data = response.json()
        # Should pass validation (fail on wallet lookup)
        assert "Maximum" not in data.get("error", "")
    
    def test_amount_just_below_minimum(self):
        """Test amount at 99 (just below minimum)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 99
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "Minimum" in data["error"]
    
    def test_amount_just_above_maximum(self):
        """Test amount at 1000001 (just above maximum)"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 1000001
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "Maximum" in data["error"]
    
    def test_uuid_with_uppercase(self):
        """Test that uppercase UUIDs are accepted"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
                "amount": 100
            }
        )
        data = response.json()
        # Should pass UUID validation (fail on wallet lookup)
        assert "Invalid recipient ID format" not in data.get("error", "")
    
    def test_empty_message_allowed(self):
        """Test that empty message is allowed"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 100,
                "message": ""
            }
        )
        data = response.json()
        # Should pass validation (fail on wallet lookup)
        assert "message" not in data.get("error", "").lower()
    
    def test_null_message_allowed(self):
        """Test that null message is allowed"""
        response = requests.post(
            f"{BASE_URL}/api/gifts",
            json={
                "senderId": "00000000-0000-0000-0000-000000000001",
                "recipientId": "00000000-0000-0000-0000-000000000002",
                "amount": 100,
                "message": None
            }
        )
        data = response.json()
        # Should pass validation (fail on wallet lookup)
        assert "message" not in data.get("error", "").lower()
    
    def test_no_pattern_error_in_any_response(self):
        """Verify no 'pattern' error appears in any validation response"""
        test_cases = [
            {"senderId": "bad", "recipientId": "00000000-0000-0000-0000-000000000002", "amount": 100},
            {"senderId": "00000000-0000-0000-0000-000000000001", "recipientId": "bad", "amount": 100},
            {"senderId": "123", "recipientId": "456", "amount": 100},
            {"senderId": "", "recipientId": "", "amount": 100},
        ]
        
        for test_data in test_cases:
            response = requests.post(f"{BASE_URL}/api/gifts", json=test_data)
            data = response.json()
            error_msg = data.get("error", "").lower()
            assert "pattern" not in error_msg, f"Pattern error found in: {data}"
            assert "did not match" not in error_msg, f"Match error found in: {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
