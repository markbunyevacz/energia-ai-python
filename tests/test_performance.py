"""
Performance tests for the Energia AI application
"""
import pytest
import time
import concurrent.futures
from fastapi.testclient import TestClient
import sys
from pathlib import Path
import statistics

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.energia_ai.main import app

@pytest.mark.performance
class TestAPIPerformance:
    """Performance tests for API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_health_endpoint_response_time(self, benchmark, client):
        """Benchmark health endpoint response time"""
        result = benchmark(client.get, "/health")
        assert result.status_code == 200
        
    def test_ready_endpoint_response_time(self, benchmark, client):
        """Benchmark ready endpoint response time"""
        result = benchmark(client.get, "/ready")
        assert result.status_code == 200
    
    def test_root_endpoint_response_time(self, benchmark, client):
        """Benchmark root endpoint response time"""
        result = benchmark(client.get, "/")
        assert result.status_code == 200

@pytest.mark.performance
class TestConcurrencyPerformance:
    """Concurrency performance tests"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_concurrent_health_checks(self, client):
        """Test concurrent health check performance"""
        def make_request():
            start_time = time.time()
            response = client.get("/health")
            end_time = time.time()
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time
            }
        
        # Test with 50 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            start_time = time.time()
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [future.result() for future in futures]
            total_time = time.time() - start_time
        
        # All requests should succeed
        assert all(r["status_code"] == 200 for r in results)
        
        # Calculate statistics
        response_times = [r["response_time"] for r in results]
        avg_response_time = statistics.mean(response_times)
        max_response_time = max(response_times)
        
        # Performance assertions
        assert avg_response_time < 0.5  # Average response time under 500ms
        assert max_response_time < 1.0  # Max response time under 1 second
        assert total_time < 10.0  # Total time under 10 seconds
        
        # Calculate requests per second
        rps = len(results) / total_time
        assert rps > 5  # At least 5 requests per second
    
    def test_sustained_load(self, client):
        """Test sustained load performance"""
        duration = 10  # seconds
        start_time = time.time()
        request_count = 0
        errors = 0
        
        while time.time() - start_time < duration:
            try:
                response = client.get("/health")
                if response.status_code == 200:
                    request_count += 1
                else:
                    errors += 1
            except Exception:
                errors += 1
            
            # Small delay to prevent overwhelming
            time.sleep(0.01)
        
        # Performance assertions
        assert request_count > 100  # At least 100 successful requests
        assert errors < request_count * 0.01  # Less than 1% error rate

@pytest.mark.performance
class TestMemoryPerformance:
    """Memory usage performance tests"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_memory_usage_stability(self, client):
        """Test that memory usage remains stable under load"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Make many requests
        for _ in range(1000):
            response = client.get("/health")
            assert response.status_code == 200
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 50MB)
        assert memory_increase < 50 * 1024 * 1024

# Locust performance test (can be run separately)
"""
To run Locust performance tests:
pip install locust
locust -f tests/test_performance.py --host=http://localhost:8000
"""

try:
    from locust import HttpUser, task, between
    
    class EnergiaAIUser(HttpUser):
        """Locust user for load testing"""
        wait_time = between(1, 3)
        
        @task(3)
        def test_health(self):
            self.client.get("/health")
        
        @task(2)
        def test_ready(self):
            self.client.get("/ready")
        
        @task(1)
        def test_root(self):
            self.client.get("/")
        
        @task(1)
        def test_docs(self):
            self.client.get("/api/docs")

except ImportError:
    # Locust not installed, skip locust tests
    pass 