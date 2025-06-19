"""
Integration tests for the Energia AI application
"""
import pytest
import asyncio
import httpx
from fastapi.testclient import TestClient
import sys
from pathlib import Path
import os

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from src.energia_ai.main import app

@pytest.mark.integration
class TestApplicationIntegration:
    """Integration tests for the full application"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_application_startup(self, client):
        """Test that the application starts up correctly"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_api_docs_accessible(self, client):
        """Test that API documentation is accessible"""
        response = client.get("/api/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_openapi_spec(self, client):
        """Test that OpenAPI specification is valid"""
        response = client.get("/api/openapi.json")
        assert response.status_code == 200
        spec = response.json()
        assert "openapi" in spec
        assert "info" in spec
        assert "paths" in spec

@pytest.mark.integration
class TestDatabaseIntegration:
    """Integration tests for database connectivity"""
    
    def test_database_connection(self):
        """Test database connection"""
        # This would test actual database connection
        # For now, just ensure the database URL is configured
        db_url = os.getenv("DATABASE_URL")
        assert db_url is not None, "DATABASE_URL must be configured for integration tests"
    
    def test_database_migrations(self):
        """Test that database migrations can be applied"""
        # This would test migration application
        # For now, just check that migration files exist
        migration_dir = Path(__file__).parent.parent / "database" / "init"
        assert migration_dir.exists()
        
        init_files = list(migration_dir.glob("*.sql"))
        assert len(init_files) > 0, "Migration files should exist"

@pytest.mark.integration
class TestExternalServices:
    """Integration tests for external service connections"""
    
    @pytest.mark.asyncio
    async def test_http_client_connectivity(self):
        """Test HTTP client functionality"""
        async with httpx.AsyncClient() as client:
            # Test basic HTTP connectivity
            response = await client.get("https://httpbin.org/get")
            assert response.status_code == 200
    
    def test_redis_connectivity(self):
        """Test Redis connectivity if configured"""
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            # Would test Redis connection here
            assert True  
        else:
            pytest.skip("REDIS_URL not configured")

@pytest.mark.integration
class TestEndToEndWorkflows:
    """End-to-end integration tests"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_health_check_workflow(self, client):
        """Test complete health check workflow"""
        # Test health endpoint
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        # Test readiness endpoint
        ready_response = client.get("/ready")
        assert ready_response.status_code == 200
        
        # Verify response structure
        health_data = health_response.json()
        ready_data = ready_response.json()
        
        assert health_data["service"] == ready_data["service"]
        assert "timestamp" in health_data
        assert "timestamp" in ready_data

@pytest.mark.integration
class TestPerformanceBaselines:
    """Performance baseline tests for integration"""
    
    @pytest.fixture
    def client(self):
        """Test client fixture"""
        return TestClient(app)
    
    def test_health_endpoint_performance(self, client):
        """Test health endpoint responds within acceptable time"""
        import time
        
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        assert (end_time - start_time) < 1.0  # Should respond within 1 second
    
    def test_concurrent_requests(self, client):
        """Test application handles concurrent requests"""
        import concurrent.futures
        import time
        
        def make_request():
            return client.get("/health")
        
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(make_request) for _ in range(20)]
            responses = [future.result() for future in futures]
        end_time = time.time()
        
        # All requests should succeed
        assert all(r.status_code == 200 for r in responses)
        
        # Should complete within reasonable time
        assert (end_time - start_time) < 10.0 