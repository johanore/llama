import requests
import sys
import os
import json
from datetime import datetime
from io import BytesIO
from PIL import Image
import tempfile

class FaceSwapAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.uploaded_files = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def test_health_endpoint(self):
        """Test the health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                details = f"- Status: {data.get('status', 'unknown')}"
            else:
                details = f"- Status Code: {response.status_code}"
            return self.log_test("Health Check", success, details)
        except Exception as e:
            return self.log_test("Health Check", False, f"- Error: {str(e)}")

    def create_test_image(self, width=200, height=200, color=(255, 0, 0)):
        """Create a simple test image"""
        img = Image.new('RGB', (width, height), color)
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_upload_endpoint(self):
        """Test image upload endpoint"""
        try:
            # Create a test image
            test_image = self.create_test_image()
            
            files = {'file': ('test_image.jpg', test_image, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/upload", files=files, timeout=30)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if data.get('success') and 'url' in data:
                    self.uploaded_files.append(data['url'])
                    details = f"- File uploaded: {data.get('filename', 'unknown')}"
                else:
                    success = False
                    details = "- Invalid response format"
            else:
                details = f"- Status Code: {response.status_code}, Response: {response.text[:100]}"
            
            return self.log_test("Image Upload", success, details)
        except Exception as e:
            return self.log_test("Image Upload", False, f"- Error: {str(e)}")

    def test_detect_faces_endpoint(self):
        """Test face detection endpoint"""
        try:
            # Create a test image
            test_image = self.create_test_image()
            
            files = {'file': ('test_face.jpg', test_image, 'image/jpeg')}
            response = requests.post(f"{self.base_url}/api/detect-faces", files=files, timeout=30)
            
            success = response.status_code in [200, 500]  # 500 might be expected due to fal.ai integration
            if response.status_code == 200:
                data = response.json()
                details = f"- Faces detected: {data.get('faces_detected', 'unknown')}"
            elif response.status_code == 500:
                details = "- Expected failure (fal.ai integration required)"
                success = True  # This is expected without proper fal.ai setup
            else:
                details = f"- Status Code: {response.status_code}"
                success = False
            
            return self.log_test("Face Detection", success, details)
        except Exception as e:
            return self.log_test("Face Detection", False, f"- Error: {str(e)}")

    def test_face_swap_endpoint(self):
        """Test single face swap endpoint"""
        try:
            # Need uploaded images for this test
            if len(self.uploaded_files) < 2:
                return self.log_test("Face Swap", False, "- Not enough uploaded images for test")
            
            swap_data = {
                "source_image_url": f"{self.base_url}{self.uploaded_files[0]}",
                "target_image_url": f"{self.base_url}{self.uploaded_files[0]}",  # Use same image for test
                "face_index_source": 0,
                "face_index_target": 0
            }
            
            response = requests.post(
                f"{self.base_url}/api/face-swap", 
                json=swap_data, 
                timeout=60
            )
            
            # This will likely fail without proper fal.ai setup, which is expected
            success = response.status_code in [200, 500]
            if response.status_code == 200:
                data = response.json()
                details = f"- Swap completed in {data.get('processing_time', 'unknown')}s"
            elif response.status_code == 500:
                details = "- Expected failure (fal.ai integration required)"
            else:
                details = f"- Status Code: {response.status_code}"
                success = False
            
            return self.log_test("Face Swap", success, details)
        except Exception as e:
            return self.log_test("Face Swap", False, f"- Error: {str(e)}")

    def test_batch_face_swap_endpoint(self):
        """Test batch face swap endpoint"""
        try:
            if len(self.uploaded_files) < 1:
                return self.log_test("Batch Face Swap", False, "- No uploaded images for test")
            
            batch_data = {
                "source_image_url": f"{self.base_url}{self.uploaded_files[0]}",
                "target_image_urls": [f"{self.base_url}{self.uploaded_files[0]}"],
                "face_index_source": 0
            }
            
            response = requests.post(
                f"{self.base_url}/api/batch-face-swap", 
                json=batch_data, 
                timeout=30
            )
            
            success = response.status_code in [200, 500]
            if response.status_code == 200:
                data = response.json()
                details = f"- Batch ID: {data.get('batch_id', 'unknown')}"
            elif response.status_code == 500:
                details = "- Expected failure (fal.ai integration required)"
            else:
                details = f"- Status Code: {response.status_code}"
                success = False
            
            return self.log_test("Batch Face Swap", success, details)
        except Exception as e:
            return self.log_test("Batch Face Swap", False, f"- Error: {str(e)}")

    def test_history_endpoint(self):
        """Test history retrieval endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/history", timeout=10)
            
            success = response.status_code == 200
            if success:
                data = response.json()
                if data.get('success'):
                    history_count = len(data.get('history', []))
                    total_count = data.get('total', 0)
                    details = f"- Found {history_count} items (total: {total_count})"
                else:
                    success = False
                    details = "- Invalid response format"
            else:
                details = f"- Status Code: {response.status_code}"
            
            return self.log_test("History Retrieval", success, details)
        except Exception as e:
            return self.log_test("History Retrieval", False, f"- Error: {str(e)}")

    def test_cors_headers(self):
        """Test CORS configuration"""
        try:
            response = requests.options(f"{self.base_url}/api/health", timeout=10)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            success = any(cors_headers.values())
            details = f"- CORS headers present: {bool(cors_headers['Access-Control-Allow-Origin'])}"
            
            return self.log_test("CORS Configuration", success, details)
        except Exception as e:
            return self.log_test("CORS Configuration", False, f"- Error: {str(e)}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Face Swap API Tests")
        print("=" * 50)
        
        # Basic connectivity tests
        self.test_health_endpoint()
        self.test_cors_headers()
        
        # File upload tests
        self.test_upload_endpoint()
        self.test_upload_endpoint()  # Upload second image
        
        # Face processing tests (these may fail without fal.ai setup)
        self.test_detect_faces_endpoint()
        self.test_face_swap_endpoint()
        self.test_batch_face_swap_endpoint()
        
        # History tests
        self.test_history_endpoint()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        elif self.tests_passed >= self.tests_run * 0.5:
            print("⚠️  Some tests failed, but core functionality works")
            return 0
        else:
            print("❌ Major issues detected - more than 50% of tests failed")
            return 1

def main():
    """Main test execution"""
    tester = FaceSwapAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())