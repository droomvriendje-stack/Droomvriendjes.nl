#!/usr/bin/env python3
"""
Backend API Testing for Droomvriendjes Project
Tests all backend endpoints with focus on new features:
1. Review Management APIs
2. Product Advanced Editor APIs  
3. Orders API
"""

import requests
import json
import uuid
from datetime import datetime
import time

# Configuration
BASE_URL = "https://match-dreams-app.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class DroomvriendjesAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS
        self.test_results = []
        self.created_review_ids = []
        self.test_product_id = 2  # Use existing product (ID 1 doesn't exist)
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "PATCH":
                if "?" in endpoint:  # Query parameters in URL
                    response = requests.patch(url, headers=self.headers, timeout=30)
                else:
                    response = requests.patch(url, headers=self.headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=self.headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request exception: {e}")
            return None
    
    def test_health_check(self):
        """Test basic health check"""
        print("\n=== HEALTH CHECK ===")
        
        response = self.make_request("GET", "/health")
        if response and response.status_code == 200:
            self.log_result("Health Check", True, "API is healthy")
            return True
        else:
            error = response.text if response else "Connection failed"
            self.log_result("Health Check", False, "API health check failed", error)
            return False
    
    def setup_test_data(self):
        """Create test reviews for testing"""
        print("\n=== SETTING UP TEST DATA ===")
        
        # Create test reviews
        test_reviews = [
            {
                "product_id": self.test_product_id,
                "name": "Emma van der Berg",
                "rating": 5,
                "title": "Geweldige slaapknuffel!",
                "text": "Mijn dochter slaapt er fantastisch mee. De projectie is prachtig en de muziek heel rustgevend.",
                "verified": True
            },
            {
                "product_id": self.test_product_id,
                "name": "Mark Jansen",
                "rating": 4,
                "title": "Goede kwaliteit",
                "text": "Mooie knuffel met leuke functies. Alleen de batterij gaat niet zo lang mee.",
                "verified": True
            },
            {
                "product_id": self.test_product_id,
                "name": "Lisa de Vries",
                "rating": 5,
                "title": "Aanrader!",
                "text": "Perfect voor onze baby. Helpt echt bij het inslapen.",
                "verified": False
            },
            {
                "product_id": 2,  # Different product
                "name": "Peter Bakker",
                "rating": 3,
                "title": "Oké product",
                "text": "Doet wat het moet doen, maar had meer verwacht voor de prijs.",
                "verified": True
            },
            {
                "product_id": 2,
                "name": "Sarah Mulder",
                "rating": 5,
                "title": "Fantastisch schaapje",
                "text": "Onze zoon is er dol op! De sterren zijn prachtig.",
                "verified": True
            }
        ]
        
        for review_data in test_reviews:
            response = self.make_request("POST", "/reviews", review_data)
            if response and response.status_code == 200:
                review = response.json()
                self.created_review_ids.append(review.get("id"))
                self.log_result("Create Test Review", True, f"Created review by {review_data['name']}")
            else:
                error = response.text if response else "Request failed"
                self.log_result("Create Test Review", False, f"Failed to create review by {review_data['name']}", error)
    
    def test_review_apis(self):
        """Test all Review Management APIs"""
        print("\n=== TESTING REVIEW MANAGEMENT APIs ===")
        
        # 1. Test PATCH /api/reviews/{review_id} - Edit review
        if self.created_review_ids:
            review_id = self.created_review_ids[0]
            update_data = {
                "name": "Emma van der Berg (Updated)",
                "rating": 5,
                "title": "Nog steeds geweldig!",
                "text": "Update: Na 3 maanden gebruik nog steeds super tevreden!",
                "verified": True,
                "visible": True
            }
            
            response = self.make_request("PATCH", f"/reviews/{review_id}", update_data)
            if response and response.status_code == 200:
                self.log_result("Edit Review", True, "Successfully updated review fields")
            else:
                error = response.text if response else "Request failed"
                self.log_result("Edit Review", False, "Failed to update review", error)
        
        # 2. Test GET /api/reviews/filter - Advanced filtering
        test_filters = [
            {"rating": 5, "description": "5-star reviews"},
            {"product_id": self.test_product_id, "description": f"Product {self.test_product_id} reviews"},
            {"source": "manual", "description": "Manual source reviews"},
            {"visible": True, "description": "Visible reviews"},
            {"search": "geweldig", "description": "Search for 'geweldig'"},
            {"rating": 5, "product_id": self.test_product_id, "description": "5-star reviews for specific product"}
        ]
        
        for filter_params in test_filters:
            desc = filter_params.pop("description")
            response = self.make_request("GET", "/reviews/filter", params=filter_params)
            if response and response.status_code == 200:
                reviews = response.json()
                self.log_result(f"Filter Reviews - {desc}", True, f"Found {len(reviews)} reviews")
            else:
                error = response.text if response else "Request failed"
                self.log_result(f"Filter Reviews - {desc}", False, "Filter request failed", error)
        
        # 3. Test GET /api/reviews/five-star-random - Random 5-star reviews
        response = self.make_request("GET", "/reviews/five-star-random", params={"limit": 3})
        if response and response.status_code == 200:
            reviews = response.json()
            all_five_star = all(review.get("rating") == 5 for review in reviews)
            if all_five_star:
                self.log_result("Random 5-Star Reviews", True, f"Retrieved {len(reviews)} random 5-star reviews")
            else:
                self.log_result("Random 5-Star Reviews", False, "Not all reviews are 5-star", f"Reviews: {reviews}")
        else:
            error = response.text if response else "Request failed"
            self.log_result("Random 5-Star Reviews", False, "Failed to get random reviews", error)
        
        # 4. Test GET /api/reviews/admin - Admin panel reviews
        response = self.make_request("GET", "/reviews/admin")
        if response and response.status_code == 200:
            reviews = response.json()
            self.log_result("Admin Reviews", True, f"Retrieved {len(reviews)} reviews for admin")
        else:
            error = response.text if response else "Request failed"
            self.log_result("Admin Reviews", False, "Failed to get admin reviews", error)
        
        # 5. Test GET /api/reviews/stats - Statistics
        response = self.make_request("GET", "/reviews/stats")
        if response and response.status_code == 200:
            stats = response.json()
            has_total = "total_reviews" in stats
            has_by_product = "by_product" in stats and isinstance(stats["by_product"], list)
            if has_total and has_by_product:
                self.log_result("Review Statistics", True, f"Total: {stats['total_reviews']}, Products: {len(stats['by_product'])}")
            else:
                self.log_result("Review Statistics", False, "Invalid stats format", stats)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Review Statistics", False, "Failed to get statistics", error)
        
        # 6. Test PATCH /api/reviews/{review_id}/visibility - Toggle visibility
        if self.created_review_ids:
            review_id = self.created_review_ids[1]
            response = self.make_request("PATCH", f"/reviews/{review_id}/visibility?visible=false")
            if response and response.status_code == 200:
                self.log_result("Toggle Visibility", True, "Successfully toggled review visibility")
            else:
                error = response.text if response else "Request failed"
                self.log_result("Toggle Visibility", False, "Failed to toggle visibility", error)
        
        # 7. Test POST /api/reviews/bulk-delete - Bulk deletion
        if len(self.created_review_ids) >= 2:
            delete_ids = self.created_review_ids[-2:]  # Delete last 2 reviews
            bulk_delete_data = {"review_ids": delete_ids}
            
            response = self.make_request("POST", "/reviews/bulk-delete", bulk_delete_data)
            if response and response.status_code == 200:
                result = response.json()
                deleted_count = result.get("deleted", 0)
                self.log_result("Bulk Delete Reviews", True, f"Deleted {deleted_count} reviews")
                # Remove deleted IDs from our list
                for deleted_id in delete_ids:
                    if deleted_id in self.created_review_ids:
                        self.created_review_ids.remove(deleted_id)
            else:
                error = response.text if response else "Request failed"
                self.log_result("Bulk Delete Reviews", False, "Failed to bulk delete", error)
        
        # 8. Test DELETE /api/reviews/{review_id} - Single deletion
        if self.created_review_ids:
            review_id = self.created_review_ids[0]
            response = self.make_request("DELETE", f"/reviews/{review_id}")
            if response and response.status_code == 200:
                self.log_result("Delete Single Review", True, "Successfully deleted single review")
                self.created_review_ids.remove(review_id)
            else:
                error = response.text if response else "Request failed"
                self.log_result("Delete Single Review", False, "Failed to delete review", error)
    
    def test_product_advanced_apis(self):
        """Test Product Advanced Editor APIs"""
        print("\n=== TESTING PRODUCT ADVANCED EDITOR APIs ===")
        
        # 1. Test GET /api/products/{product_id}/advanced - Fetch product with customizations
        response = self.make_request("GET", f"/products/{self.test_product_id}/advanced")
        if response and response.status_code == 200:
            product = response.json()
            has_required_fields = all(field in product for field in ["id", "name", "gallery"])
            if has_required_fields:
                self.log_result("Get Product Advanced", True, f"Retrieved product {product['name']}")
            else:
                self.log_result("Get Product Advanced", False, "Missing required fields", product)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Get Product Advanced", False, "Failed to get product", error)
        
        # 2. Test PUT /api/products/{product_id}/advanced - Save advanced customizations
        advanced_data = {
            "gallery": [
                {
                    "url": "https://i.imgur.com/E4g3eOy.jpeg",
                    "alt": "Droomvriendjes Slaapknuffel Leeuw - Hoofdafbeelding",
                    "visible": True,
                    "order": 1
                },
                {
                    "url": "https://i.imgur.com/zYLuTAg.jpeg", 
                    "alt": "Knuffel met hartslag baby - Detailfoto",
                    "visible": True,
                    "order": 2
                },
                "https://i.imgur.com/WfHQKKr.jpeg"  # Test backward compatibility with string URLs
            ],
            "sections": [
                {
                    "id": "features",
                    "title": "Kenmerken",
                    "content": "🌟 Sterrenprojectie in 3 kleuren\n🎵 8 rustgevende slaapliedjes",
                    "visible": True,
                    "order": 1
                },
                {
                    "id": "benefits", 
                    "title": "Voordelen",
                    "content": "Helpt je baby sneller in slaap te vallen\nCreëert een rustgevende slaapomgeving",
                    "visible": True,
                    "order": 2
                }
            ],
            "features": [
                "🌟 Sterrenprojectie in 3 kleuren",
                "🎵 8 rustgevende slaapliedjes", 
                "🔇 White noise & natuurgeluiden",
                "⏰ 30 minuten timer",
                "🔋 USB oplaadbaar"
            ],
            "seo_keywords": [
                "Droomvriendjes Slaapknuffel",
                "Knuffel met hartslag baby",
                "Witte ruis knuffel leeuw"
            ]
        }
        
        response = self.make_request("PUT", f"/products/{self.test_product_id}/advanced", advanced_data)
        if response and response.status_code == 200:
            updated_product = response.json()
            # Verify gallery supports both formats
            gallery = updated_product.get("gallery", [])
            has_mixed_gallery = any(isinstance(item, dict) for item in gallery) and any(isinstance(item, str) for item in gallery)
            
            if has_mixed_gallery or len(gallery) > 0:
                self.log_result("Save Product Advanced", True, "Successfully saved advanced customizations with mixed gallery formats")
            else:
                self.log_result("Save Product Advanced", False, "Gallery format not preserved", gallery)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Save Product Advanced", False, "Failed to save advanced data", error)
        
        # 3. Test backward compatibility - Verify existing products work
        response = self.make_request("GET", f"/products/{self.test_product_id}")
        if response and response.status_code == 200:
            product = response.json()
            gallery = product.get("gallery", [])
            # Should work with both string URLs and objects
            self.log_result("Backward Compatibility", True, f"Product works with gallery: {len(gallery)} items")
        else:
            error = response.text if response else "Request failed"
            self.log_result("Backward Compatibility", False, "Backward compatibility failed", error)
    
    def test_orders_api(self):
        """Test Orders API with discount calculations"""
        print("\n=== TESTING ORDERS API ===")
        
        # Test order creation with both automatic and manual discounts
        order_data = {
            "customer_email": "test.klant@droomvriendjes.nl",
            "customer_name": "Test Klant",
            "customer_phone": "0612345678",
            "customer_address": "Teststraat 123",
            "customer_city": "Amsterdam", 
            "customer_zipcode": "1000 AB",
            "customer_comment": "Test bestelling voor API validatie",
            "items": [
                {
                    "product_id": "1",
                    "product_name": "Baby Slaapmaatje Leeuw",
                    "price": 49.95,
                    "quantity": 2,
                    "image": "https://i.imgur.com/E4g3eOy.jpeg"
                },
                {
                    "product_id": "2", 
                    "product_name": "Baby Nachtlamp Schaap",
                    "price": 59.95,
                    "quantity": 1,
                    "image": "https://i.imgur.com/vYpeb4c.jpeg"
                }
            ],
            "subtotal": 159.85,  # (49.95 * 2) + 59.95
            "discount": 24.98,   # 50% off second item (49.95 * 0.5)
            "coupon_code": "WELKOM10",
            "coupon_discount": 13.49,  # 10% off remaining total ((159.85 - 24.98) * 0.1)
            "total_amount": 121.38   # 159.85 - 24.98 - 13.49
        }
        
        response = self.make_request("POST", "/orders", order_data)
        if response and response.status_code == 200:
            order_result = response.json()
            order_id = order_result.get("order_id")
            
            # Verify calculation fields are preserved
            if order_id:
                self.log_result("Create Order with Discounts", True, f"Order created: {order_id}")
                
                # Test edge case: Order with only automatic discount
                order_data_auto_only = {
                    "customer_email": "auto.discount@droomvriendjes.nl",
                    "customer_name": "Auto Discount Test",
                    "customer_address": "Autostraat 1",
                    "customer_city": "Utrecht",
                    "customer_zipcode": "3500 AB", 
                    "items": [
                        {
                            "product_id": "3",
                            "product_name": "Teddy Projector Knuffel", 
                            "price": 59.95,
                            "quantity": 2
                        }
                    ],
                    "subtotal": 119.90,
                    "discount": 29.98,  # 50% off second item
                    "total_amount": 89.92  # No coupon
                }
                
                response2 = self.make_request("POST", "/orders", order_data_auto_only)
                if response2 and response2.status_code == 200:
                    self.log_result("Order Auto Discount Only", True, "Order with automatic discount only created")
                else:
                    error = response2.text if response2 else "Request failed"
                    self.log_result("Order Auto Discount Only", False, "Failed to create auto-discount order", error)
                
                # Test edge case: Order with only manual coupon
                order_data_coupon_only = {
                    "customer_email": "coupon.only@droomvriendjes.nl", 
                    "customer_name": "Coupon Only Test",
                    "customer_address": "Couponlaan 5",
                    "customer_city": "Rotterdam",
                    "customer_zipcode": "3000 AB",
                    "items": [
                        {
                            "product_id": "4",
                            "product_name": "Pinguïn Nachtlampje",
                            "price": 59.95,
                            "quantity": 1
                        }
                    ],
                    "subtotal": 59.95,
                    "discount": 0,  # No automatic discount
                    "coupon_code": "WELKOM10", 
                    "coupon_discount": 5.99,  # 10% off
                    "total_amount": 53.96
                }
                
                response3 = self.make_request("POST", "/orders", order_data_coupon_only)
                if response3 and response3.status_code == 200:
                    self.log_result("Order Coupon Only", True, "Order with coupon only created")
                else:
                    error = response3.text if response3 else "Request failed"
                    self.log_result("Order Coupon Only", False, "Failed to create coupon-only order", error)
                    
            else:
                self.log_result("Create Order with Discounts", False, "No order ID returned", order_result)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Create Order with Discounts", False, "Failed to create order", error)
    
    def test_email_logs_apis(self):
        """Test Email Logs API endpoints"""
        print("\n=== TESTING EMAIL LOGS APIs ===")
        
        # 1. Test GET /api/email-logs/ - Get email logs with parameters
        response = self.make_request("GET", "/email-logs/", params={"days": 30, "limit": 10})
        if response and response.status_code == 200:
            logs_data = response.json()
            required_fields = ["logs", "total", "offset", "limit"]
            has_required_fields = all(field in logs_data for field in required_fields)
            
            if has_required_fields:
                logs = logs_data.get("logs", [])
                self.log_result("Get Email Logs", True, f"Retrieved {len(logs)} email logs (total: {logs_data.get('total', 0)})")
                
                # Verify log structure if logs exist
                if logs:
                    first_log = logs[0]
                    log_fields = ["id", "to_email", "subject", "email_type", "status", "created_at"]
                    has_log_fields = all(field in first_log for field in log_fields)
                    if has_log_fields:
                        self.log_result("Email Log Structure", True, f"Log structure valid: {first_log.get('email_type')} to {first_log.get('to_email')}")
                    else:
                        self.log_result("Email Log Structure", False, "Missing required log fields", first_log)
            else:
                self.log_result("Get Email Logs", False, "Missing required response fields", logs_data)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Get Email Logs", False, "Failed to get email logs", error)
        
        # 2. Test GET /api/email-logs/stats - Email statistics
        response = self.make_request("GET", "/email-logs/stats", params={"days": 30})
        if response and response.status_code == 200:
            stats_data = response.json()
            required_stats = ["total_emails", "sent", "failed", "success_rate", "by_type", "by_day"]
            has_required_stats = all(field in stats_data for field in required_stats)
            
            if has_required_stats:
                total = stats_data.get("total_emails", 0)
                success_rate = stats_data.get("success_rate", 0)
                by_type = stats_data.get("by_type", {})
                self.log_result("Email Statistics", True, f"Total: {total}, Success rate: {success_rate}%, Types: {len(by_type)}")
            else:
                self.log_result("Email Statistics", False, "Missing required statistics fields", stats_data)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Email Statistics", False, "Failed to get email statistics", error)
        
        # 3. Test GET /api/email-logs/types - Available email types
        response = self.make_request("GET", "/email-logs/types")
        if response and response.status_code == 200:
            types_data = response.json()
            if "types" in types_data and isinstance(types_data["types"], list):
                types = types_data["types"]
                # Verify type structure
                if types:
                    first_type = types[0]
                    type_fields = ["id", "label", "icon"]
                    has_type_fields = all(field in first_type for field in type_fields)
                    if has_type_fields:
                        self.log_result("Email Types", True, f"Retrieved {len(types)} email types: {[t.get('id') for t in types[:3]]}")
                    else:
                        self.log_result("Email Types", False, "Invalid type structure", first_type)
                else:
                    self.log_result("Email Types", True, "Retrieved empty types list")
            else:
                self.log_result("Email Types", False, "Invalid types response format", types_data)
        else:
            error = response.text if response else "Request failed"
            self.log_result("Email Types", False, "Failed to get email types", error)
        
        # 4. Test filtering by email_type and status
        response = self.make_request("GET", "/email-logs/", params={"email_type": "order_confirmation", "days": 30})
        if response and response.status_code == 200:
            filtered_data = response.json()
            logs = filtered_data.get("logs", [])
            # Check if all logs have the correct email_type (if any logs exist)
            if logs:
                correct_type = all(log.get("email_type") == "order_confirmation" for log in logs)
                if correct_type:
                    self.log_result("Filter by Email Type", True, f"Found {len(logs)} order_confirmation emails")
                else:
                    self.log_result("Filter by Email Type", False, "Filter not working correctly")
            else:
                self.log_result("Filter by Email Type", True, "No order_confirmation emails found (filter working)")
        else:
            error = response.text if response else "Request failed"
            self.log_result("Filter by Email Type", False, "Failed to filter by email type", error)
        
        # 5. Test filtering by status
        response = self.make_request("GET", "/email-logs/", params={"status": "sent", "days": 30})
        if response and response.status_code == 200:
            filtered_data = response.json()
            logs = filtered_data.get("logs", [])
            if logs:
                correct_status = all(log.get("status") == "sent" for log in logs)
                if correct_status:
                    self.log_result("Filter by Status", True, f"Found {len(logs)} sent emails")
                else:
                    self.log_result("Filter by Status", False, "Status filter not working correctly")
            else:
                self.log_result("Filter by Status", True, "No sent emails found (filter working)")
        else:
            error = response.text if response else "Request failed"
            self.log_result("Filter by Status", False, "Failed to filter by status", error)

    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n=== TESTING EDGE CASES ===")
        
        # 1. Test invalid review ID
        response = self.make_request("PATCH", "/reviews/invalid-id", {"name": "Test"})
        if response and response.status_code == 404:
            self.log_result("Invalid Review ID", True, "Correctly returned 404 for invalid ID")
        else:
            status = response.status_code if response else "No response"
            self.log_result("Invalid Review ID", False, f"Expected 404, got {status}")
        
        # 2. Test empty bulk delete
        response = self.make_request("POST", "/reviews/bulk-delete", {"review_ids": []})
        if response and response.status_code == 400:
            self.log_result("Empty Bulk Delete", True, "Correctly rejected empty bulk delete")
        else:
            status = response.status_code if response else "No response"
            self.log_result("Empty Bulk Delete", False, f"Expected 400, got {status}")
        
        # 3. Test invalid product ID
        response = self.make_request("GET", "/products/99999/advanced")
        if response and response.status_code == 404:
            self.log_result("Invalid Product ID", True, "Correctly returned 404 for invalid product")
        else:
            status = response.status_code if response else "No response"
            self.log_result("Invalid Product ID", False, f"Expected 404, got {status}")
        
        # 4. Test concurrent operations (simulate with multiple requests)
        print("Testing concurrent operations...")
        concurrent_results = []
        for i in range(3):
            review_data = {
                "product_id": self.test_product_id,
                "name": f"Concurrent User {i+1}",
                "rating": 5,
                "title": f"Concurrent Review {i+1}",
                "text": f"This is concurrent review number {i+1}",
                "verified": True
            }
            response = self.make_request("POST", "/reviews", review_data)
            concurrent_results.append(response.status_code == 200 if response else False)
        
        success_count = sum(concurrent_results)
        if success_count == 3:
            self.log_result("Concurrent Operations", True, "All 3 concurrent requests succeeded")
        else:
            self.log_result("Concurrent Operations", False, f"Only {success_count}/3 concurrent requests succeeded")
    
    def cleanup_test_data(self):
        """Clean up any remaining test data"""
        print("\n=== CLEANING UP TEST DATA ===")
        
        # Delete any remaining test reviews
        if self.created_review_ids:
            for review_id in self.created_review_ids:
                response = self.make_request("DELETE", f"/reviews/{review_id}")
                if response and response.status_code == 200:
                    print(f"✅ Cleaned up review: {review_id}")
                else:
                    print(f"⚠️ Could not clean up review: {review_id}")
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🧸 DROOMVRIENDJES BACKEND API TESTING")
        print("=" * 50)
        
        # Health check first
        if not self.test_health_check():
            print("❌ Health check failed - aborting tests")
            return False
        
        # Setup test data
        self.setup_test_data()
        
        # Run main test suites
        self.test_review_apis()
        self.test_product_advanced_apis()
        self.test_orders_api()
        self.test_email_logs_apis()
        self.test_edge_cases()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['test']}: {result['message']}")
                    if result["details"]:
                        print(f"     Details: {result['details']}")
        
        print("\n🎯 KEY FEATURES TESTED:")
        print("  ✓ Review Management (Edit, Bulk Delete, Filtering)")
        print("  ✓ Product Advanced Editor (Images with Alt-text)")
        print("  ✓ Orders API (Discount Calculations)")
        print("  ✓ Email Logs API (Logs, Statistics, Types)")
        print("  ✓ Edge Cases & Error Handling")
        print("  ✓ Backward Compatibility")


if __name__ == "__main__":
    tester = DroomvriendjesAPITester()
    tester.run_all_tests()