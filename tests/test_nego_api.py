"""
Nego Talent Marketplace API Tests
Tests for: Health, Talents, Content, and Auth endpoints
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_healthy(self):
        """GET /api/health should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

class TestTalentsEndpoint:
    """Talents CRUD endpoint tests"""
    
    def test_get_talents_returns_list(self):
        """GET /api/talents should return list of talents"""
        response = requests.get(f"{BASE_URL}/api/talents")
        assert response.status_code == 200
        data = response.json()
        assert "talents" in data
        assert "total" in data
        assert isinstance(data["talents"], list)
    
    def test_get_talents_returns_8_seeded_talents(self):
        """GET /api/talents should return 8 seeded talents"""
        response = requests.get(f"{BASE_URL}/api/talents")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 8
        assert len(data["talents"]) == 8
    
    def test_talents_have_location_data(self):
        """Each talent should have location data"""
        response = requests.get(f"{BASE_URL}/api/talents")
        assert response.status_code == 200
        data = response.json()
        for talent in data["talents"]:
            assert "location" in talent
            assert talent["location"] is not None
            assert len(talent["location"]) > 0
    
    def test_talents_have_required_fields(self):
        """Each talent should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/talents")
        assert response.status_code == 200
        data = response.json()
        required_fields = ["id", "name", "location", "image", "starting_price", "age"]
        for talent in data["talents"]:
            for field in required_fields:
                assert field in talent, f"Missing field: {field}"
    
    def test_get_single_talent(self):
        """GET /api/talents/{id} should return single talent"""
        response = requests.get(f"{BASE_URL}/api/talents/talent-1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "talent-1"
        assert data["name"] == "Adaeze Nwosu"
        assert data["location"] == "Lagos"
    
    def test_get_nonexistent_talent_returns_404(self):
        """GET /api/talents/{id} with invalid id should return 404"""
        response = requests.get(f"{BASE_URL}/api/talents/nonexistent-talent")
        assert response.status_code == 404

class TestContentEndpoint:
    """Private content endpoint tests"""
    
    def test_get_content_returns_list(self):
        """GET /api/content should return list of private content"""
        response = requests.get(f"{BASE_URL}/api/content")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_content_returns_3_items(self):
        """GET /api/content should return 3 seeded content items"""
        response = requests.get(f"{BASE_URL}/api/content")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_content_items_are_locked(self):
        """All content items should be locked by default"""
        response = requests.get(f"{BASE_URL}/api/content")
        assert response.status_code == 200
        data = response.json()
        for content in data:
            assert content["is_locked"] == True
    
    def test_content_has_required_fields(self):
        """Each content item should have required fields"""
        response = requests.get(f"{BASE_URL}/api/content")
        assert response.status_code == 200
        data = response.json()
        required_fields = ["id", "title", "image_url", "unlock_price", "is_locked"]
        for content in data:
            for field in required_fields:
                assert field in content, f"Missing field: {field}"

class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_register_new_user(self):
        """POST /api/auth/register should create new user and return token"""
        unique_email = f"TEST_user_{int(time.time())}@negoempire.live"
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": unique_email,
                "name": "Test User",
                "password": "password123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
    
    def test_register_duplicate_email_fails(self):
        """POST /api/auth/register with existing email should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": "test@negoempire.live",
                "name": "Duplicate User",
                "password": "password123"
            }
        )
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    def test_login_valid_credentials(self):
        """POST /api/auth/login with valid credentials should return token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@negoempire.live",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@negoempire.live"
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@negoempire.live",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self):
        """POST /api/auth/login with nonexistent user should fail"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "nonexistent@negoempire.live",
                "password": "password123"
            }
        )
        assert response.status_code == 401
    
    def test_get_me_with_valid_token(self):
        """GET /api/auth/me with valid token should return user"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "test@negoempire.live",
                "password": "password123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Then get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@negoempire.live"
        assert "id" in data
        assert "name" in data
    
    def test_get_me_without_token_fails(self):
        """GET /api/auth/me without token should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
    
    def test_get_me_with_invalid_token_fails(self):
        """GET /api/auth/me with invalid token should fail"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401

class TestAPIRoot:
    """API root endpoint tests"""
    
    def test_api_root_returns_welcome(self):
        """GET /api/ should return welcome message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Nego" in data["message"]
