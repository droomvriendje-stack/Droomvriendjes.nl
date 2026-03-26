"""
Test Cart Persistence and AI Campaign Maker Features
Tests for Droomvriendjes e-commerce app
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-campaigns-4.preview.emergentagent.com')

class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ API health check passed: {data}")
    
    def test_products_endpoint(self):
        """Test products endpoint returns products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        assert isinstance(products, list)
        assert len(products) > 0
        print(f"✅ Products endpoint returned {len(products)} products")


class TestAICampaignsAPI:
    """AI Campaign Maker API tests"""
    
    def test_config_status_returns_ai_ready(self):
        """Test GET /api/ai-campaigns/config-status returns ai_ready: true"""
        response = requests.get(f"{BASE_URL}/api/ai-campaigns/config-status")
        assert response.status_code == 200
        data = response.json()
        assert "ai_ready" in data
        assert data["ai_ready"] == True, f"Expected ai_ready=True, got {data['ai_ready']}"
        assert "supabase_connected" in data
        print(f"✅ Config status: ai_ready={data['ai_ready']}, supabase_connected={data['supabase_connected']}")
    
    def test_products_for_campaigns(self):
        """Test GET /api/ai-campaigns/products returns list of products"""
        response = requests.get(f"{BASE_URL}/api/ai-campaigns/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        assert len(data["products"]) > 0
        # Verify product structure
        product = data["products"][0]
        assert "id" in product
        assert "name" in product
        assert "description" in product
        print(f"✅ AI campaigns products endpoint returned {len(data['products'])} products")
        print(f"   First product: {product['name'][:50]}...")
    
    def test_generate_campaign_single_platform(self):
        """Test POST /api/ai-campaigns/generate with single platform"""
        payload = {
            "product_name": "Test Knuffel",
            "product_description": "Een zachte slaapknuffel voor baby's",
            "platforms": ["facebook"],
            "tone": "warm",
            "campaign_goal": "sales"
        }
        response = requests.post(
            f"{BASE_URL}/api/ai-campaigns/generate",
            json=payload,
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "campaign_id" in data
        assert "status" in data
        assert data["status"] == "generated"
        assert "generated_content" in data
        assert "facebook" in data["generated_content"]
        
        # Verify content structure
        fb_content = data["generated_content"]["facebook"]
        assert "headline" in fb_content
        assert "caption" in fb_content
        assert "hashtags" in fb_content
        assert "cta" in fb_content
        
        print(f"✅ Campaign generated: {data['campaign_id']}")
        print(f"   Facebook headline: {fb_content['headline']}")
    
    def test_generate_campaign_multiple_platforms(self):
        """Test POST /api/ai-campaigns/generate with multiple platforms"""
        payload = {
            "product_name": "Droomvriendjes Panda",
            "product_description": "Lieve panda knuffel met nachtlamp en hartslagfunctie",
            "platforms": ["facebook", "instagram", "tiktok"],
            "tone": "playful",
            "campaign_goal": "awareness"
        }
        response = requests.post(
            f"{BASE_URL}/api/ai-campaigns/generate",
            json=payload,
            timeout=90  # Longer timeout for multiple platforms
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "generated"
        assert "generated_content" in data
        
        # Verify all platforms have content
        for platform in ["facebook", "instagram", "tiktok"]:
            assert platform in data["generated_content"], f"Missing content for {platform}"
            content = data["generated_content"][platform]
            assert "headline" in content
            assert "caption" in content
        
        print(f"✅ Multi-platform campaign generated: {data['campaign_id']}")
        print(f"   Platforms: {list(data['generated_content'].keys())}")
    
    def test_campaign_history(self):
        """Test GET /api/ai-campaigns/history returns campaigns"""
        response = requests.get(f"{BASE_URL}/api/ai-campaigns/history")
        assert response.status_code == 200
        data = response.json()
        assert "campaigns" in data
        assert isinstance(data["campaigns"], list)
        print(f"✅ Campaign history returned {len(data['campaigns'])} campaigns")


class TestAdminLogin:
    """Admin authentication tests for AI Campaign Maker access"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "Droomvriendjes2024!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✅ Admin login successful, token received")
        return data["token"]
    
    def test_admin_login_wrong_password(self):
        """Test admin login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print(f"✅ Admin login correctly rejected wrong password")


class TestCartRelatedAPIs:
    """Test cart-related API endpoints"""
    
    def test_checkout_started_endpoint(self):
        """Test checkout started tracking endpoint"""
        payload = {
            "customer_email": "test@example.com",
            "cart_items": [
                {"name": "Droomvriendjes Dino", "price": 45.95, "quantity": 1}
            ],
            "total_amount": 45.95,
            "session_id": "test-session-123"
        }
        response = requests.post(
            f"{BASE_URL}/api/checkout-started",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "session_id" in data
        print(f"✅ Checkout started tracking works: session_id={data['session_id']}")
    
    def test_discount_validate_endpoint(self):
        """Test discount code validation endpoint"""
        payload = {
            "code": "INVALID_CODE",
            "cart_total": 45.95
        }
        response = requests.post(
            f"{BASE_URL}/api/discount/validate",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        # Invalid code should return valid=False
        assert data["valid"] == False
        print(f"✅ Discount validation endpoint works: {data['message']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
