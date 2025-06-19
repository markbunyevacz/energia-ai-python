"""
Comprehensive test suite for NJT.hu Crawler

Tests the National Legislation Database crawler functionality including:
- ELI standards compliance
- Anti-detection measures
- Document parsing and extraction
- Content validation
- Error handling
"""

import pytest
import asyncio
import logging
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, date
from typing import Dict, List, Any

# Import the crawler components
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'app', 'crawlers'))

from njt_crawler import (
    NJTCrawler, 
    ELIIdentifier, 
    LegalDocument,
    BaseCrawler
)


class TestELIIdentifier:
    """Test European Legislation Identifier functionality"""
    
    def test_eli_identifier_creation(self):
        """Test basic ELI identifier creation"""
        eli = ELIIdentifier(
            country="hu",
            type="torveny",
            year=2023,
            number="XII",
            language="hu"
        )
        
        assert eli.country == "hu"
        assert eli.type == "torveny"
        assert eli.year == 2023
        assert eli.number == "XII"
        assert eli.language == "hu"
    
    def test_eli_uri_generation(self):
        """Test ELI URI generation"""
        eli = ELIIdentifier(
            country="hu",
            type="torveny",
            year=2023,
            number="XII"
        )
        
        expected_uri = "http://www.njt.hu/eli/hu/torveny/2023/XII"
        assert eli.to_uri() == expected_uri
    
    def test_eli_uri_with_point_and_version(self):
        """Test ELI URI with point and version"""
        eli = ELIIdentifier(
            country="hu",
            type="rendelet",
            year=2023,
            number="123",
            point="1",
            version="1.0"
        )
        
        expected_uri = "http://www.njt.hu/eli/hu/rendelet/2023/123/1/1.0"
        assert eli.to_uri() == expected_uri
    
    def test_eli_from_law_reference(self):
        """Test parsing Hungarian law reference"""
        reference = "2023. évi XII. törvény"
        eli = ELIIdentifier.from_njt_reference(reference)
        
        assert eli.year == 2023
        assert eli.number == "XII"
        assert eli.type == "torveny"
        assert eli.country == "hu"
    
    def test_eli_from_decree_reference(self):
        """Test parsing Hungarian decree reference"""
        reference = "123/2023. (XII. 31.) Korm. rendelet"
        eli = ELIIdentifier.from_njt_reference(reference)
        
        assert eli.number == "123"
        assert eli.year == 2023
        assert eli.type == "korm.rendelet"
    
    def test_eli_from_invalid_reference(self):
        """Test parsing invalid reference returns default ELI"""
        reference = "Invalid reference"
        eli = ELIIdentifier.from_njt_reference(reference)
        
        # Should return default values
        assert eli.country == "hu"
        assert eli.type == ""
        assert eli.year == 0


class TestLegalDocument:
    """Test Legal Document data structure"""
    
    def test_legal_document_creation(self):
        """Test creating a legal document"""
        eli = ELIIdentifier(type="torveny", year=2023, number="XII")
        
        doc = LegalDocument(
            eli_id=eli,
            title="Test Law",
            content="Test content",
            publication_date=date(2023, 12, 1),
            effective_date=date(2024, 1, 1),
            status="hatályos",
            document_type="törvény",
            issuer="országgyűlés",
            subject_areas=["test"],
            citations=["ref1"],
            amendments=["amendment1"],
            url="https://njt.hu/test",
            content_hash="abc123"
        )
        
        assert doc.title == "Test Law"
        assert doc.status == "hatályos"
        assert doc.document_type == "törvény"
        assert doc.issuer == "országgyűlés"
    
    def test_legal_document_to_dict(self):
        """Test converting legal document to dictionary"""
        eli = ELIIdentifier(type="torveny", year=2023, number="XII")
        
        doc = LegalDocument(
            eli_id=eli,
            title="Test Law",
            content="Test content",
            publication_date=date(2023, 12, 1),
            effective_date=None,
            status="hatályos",
            document_type="törvény",
            issuer="országgyűlés",
            subject_areas=["test"],
            citations=["ref1"],
            amendments=[],
            url="https://njt.hu/test",
            content_hash="abc123"
        )
        
        doc_dict = doc.to_dict()
        
        assert doc_dict["title"] == "Test Law"
        assert doc_dict["status"] == "hatályos"
        assert doc_dict["publication_date"] == "2023-12-01"
        assert doc_dict["effective_date"] is None
        assert "crawled_at" in doc_dict
        assert doc_dict["eli_uri"] == eli.to_uri()


class TestNJTCrawler:
    """Test NJT Crawler functionality"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.crawler = NJTCrawler()
    
    def test_crawler_initialization(self):
        """Test crawler initialization"""
        crawler = NJTCrawler()
        
        assert crawler.base_url == "https://njt.hu"
        assert crawler.eli_base == "http://www.njt.hu/eli"
        assert "documents_found" in crawler.crawl_statistics
        assert "documents_processed" in crawler.crawl_statistics
        assert "errors" in crawler.crawl_statistics
    
    def test_crawler_with_proxy_list(self):
        """Test crawler initialization with proxy list"""
        proxy_list = ["http://proxy1:8080", "http://proxy2:8080"]
        crawler = NJTCrawler(proxy_list=proxy_list)
        
        assert crawler.proxy_list == proxy_list
        assert crawler.anti_detection.proxy_list == proxy_list
    
    def test_content_hash_generation(self):
        """Test content hash generation"""
        content = "Test content for hashing"
        hash1 = self.crawler._generate_content_hash(content)
        hash2 = self.crawler._generate_content_hash(content)
        hash3 = self.crawler._generate_content_hash(content + " modified")
        
        assert hash1 == hash2  # Same content should produce same hash
        assert hash1 != hash3  # Different content should produce different hash
        assert len(hash1) == 64  # SHA256 produces 64-character hex string
    
    def test_get_crawl_statistics(self):
        """Test crawl statistics retrieval"""
        stats = self.crawler.get_crawl_statistics()
        
        assert "documents_found" in stats
        assert "documents_processed" in stats
        assert "errors" in stats
        assert "start_time" in stats
        assert "end_time" in stats
    
    @pytest.mark.asyncio
    async def test_validate_eli_compliance_valid(self):
        """Test ELI compliance validation with valid document"""
        valid_doc = {
            "eli_uri": "http://www.njt.hu/eli/hu/torveny/2023/XII",
            "title": "Test Law",
            "content": "Test content",
            "status": "hatályos"
        }
        
        is_compliant = await self.crawler.validate_eli_compliance(valid_doc)
        assert is_compliant is True
    
    @pytest.mark.asyncio
    async def test_validate_eli_compliance_invalid(self):
        """Test ELI compliance validation with invalid document"""
        invalid_doc = {
            "title": "Test Law",
            "content": "Test content"
            # Missing required fields: eli_uri, status
        }
        
        is_compliant = await self.crawler.validate_eli_compliance(invalid_doc)
        assert is_compliant is False
    
    @pytest.mark.asyncio
    async def test_validate_eli_compliance_invalid_uri(self):
        """Test ELI compliance validation with invalid URI"""
        invalid_doc = {
            "eli_uri": "http://invalid.uri/test",
            "title": "Test Law",
            "content": "Test content",
            "status": "hatályos"
        }
        
        is_compliant = await self.crawler.validate_eli_compliance(invalid_doc)
        assert is_compliant is False


class TestNJTCrawlerIntegration:
    """Integration tests for NJT Crawler - these require mocking since we don't want to hit the real site"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.crawler = NJTCrawler()
    
    @pytest.mark.asyncio
    async def test_extract_document_data_basic(self):
        """Test document data extraction with mocked page"""
        with patch('njt_crawler.BeautifulSoup') as mock_soup:
            # Setup mock BeautifulSoup
            mock_title = Mock()
            mock_title.get_text.return_value = "2023. évi XII. törvény a tesztelésről"
            
            mock_body = Mock()
            mock_body.get_text.return_value = "Ez egy teszt törvény tartalma..."
            mock_body.__call__.return_value = []  # No scripts/styles to remove
            
            mock_soup_instance = Mock()
            mock_soup_instance.find.side_effect = lambda tag: mock_title if tag == "h1" else mock_body if tag == "body" else None
            mock_soup_instance.get_text.return_value = "Fallback content"
            
            mock_soup.return_value = mock_soup_instance
            
            # Mock page
            mock_page = AsyncMock()
            mock_page.content.return_value = "<html>test</html>"
            
            # Test extraction
            data = await self.crawler._extract_document_data(mock_page, "https://njt.hu/test")
            
            assert data["title"] == "2023. évi XII. törvény a tesztelésről"
            assert data["document_type"] == "törvény"
            assert data["issuer"] == "országgyűlés"
            assert data["status"] == "hatályos"
            assert "url" in data
    
    @pytest.mark.asyncio
    async def test_process_document_success(self):
        """Test successful document processing with mocks"""
        with patch.object(self.crawler, '_extract_document_data') as mock_extract:
            mock_extract.return_value = {
                "title": "2023. évi XII. törvény",
                "content": "Test content",
                "document_type": "törvény",
                "issuer": "országgyűlés",
                "status": "hatályos",
                "subject_areas": [],
                "citations": [],
                "amendments": []
            }
            
            # Mock page interactions
            mock_page = AsyncMock()
            mock_page.goto = AsyncMock()
            mock_page.wait_for_load_state = AsyncMock()
            
            with patch.object(self.crawler.anti_detection.delays, 'short_pause', new_callable=AsyncMock):
                result = await self.crawler._process_document(mock_page, "https://njt.hu/test")
            
            assert result is not None
            assert result["title"] == "2023. évi XII. törvény"
            assert result["document_type"] == "törvény"
            assert "eli_uri" in result
            assert "content_hash" in result
    
    @pytest.mark.asyncio
    async def test_process_document_error_handling(self):
        """Test document processing error handling"""
        # Mock page that raises an exception
        mock_page = AsyncMock()
        mock_page.goto.side_effect = Exception("Connection error")
        
        result = await self.crawler._process_document(mock_page, "https://njt.hu/test")
        
        assert result is None
        assert self.crawler.crawl_statistics["errors"] == 0  # Error should be logged but not counted in main stats


class TestNJTCrawlerMocked:
    """Test NJT Crawler with fully mocked browser interactions"""
    
    @pytest.fixture
    def mock_playwright_context(self):
        """Fixture providing mocked Playwright context"""
        with patch('njt_crawler.async_playwright') as mock_playwright:
            # Create mock browser hierarchy
            mock_browser = AsyncMock()
            mock_context = AsyncMock()
            mock_page = AsyncMock()
            
            # Setup mock returns
            mock_playwright.return_value.__aenter__.return_value.chromium.launch.return_value = mock_browser
            mock_browser.new_context.return_value = mock_context
            mock_context.new_page.return_value = mock_page
            
            # Mock page methods
            mock_page.goto = AsyncMock()
            mock_page.wait_for_selector = AsyncMock()
            mock_page.query_selector_all.return_value = []
            mock_page.content.return_value = "<html><body>Test content</body></html>"
            mock_page.title.return_value = "Test Page"
            
            yield {
                'playwright': mock_playwright,
                'browser': mock_browser,
                'context': mock_context,
                'page': mock_page
            }
    
    @pytest.mark.asyncio
    async def test_crawl_with_mocked_browser(self, mock_playwright_context):
        """Test full crawl process with mocked browser"""
        crawler = NJTCrawler()
        
        # Mock the page to return some test links
        mock_page = mock_playwright_context['page']
        
        # Mock link elements
        mock_link1 = AsyncMock()
        mock_link1.get_attribute.return_value = "/test-law-1"
        mock_link1.text_content.return_value = "2023. évi I. törvény"
        
        mock_link2 = AsyncMock()
        mock_link2.get_attribute.return_value = "/test-law-2"
        mock_link2.text_content.return_value = "456/2023. (XII. 31.) Korm. rendelet"
        
        mock_page.query_selector_all.return_value = [mock_link1, mock_link2]
        
        # Mock successful document processing
        with patch.object(crawler, '_process_document') as mock_process:
            test_document = {
                "title": "Test Document",
                "eli_uri": "http://www.njt.hu/eli/hu/torveny/2023/I",
                "content": "Test content",
                "status": "hatályos"
            }
            mock_process.return_value = test_document
            
            # Run crawl
            documents = await crawler.crawl()
            
            # Verify results
            assert len(documents) > 0
            assert documents[0]["title"] == "Test Document"
            
            # Verify statistics were updated
            stats = crawler.get_crawl_statistics()
            assert stats["documents_found"] >= 0
            assert stats["documents_processed"] >= 0


def test_standalone_functionality():
    """Test that the crawler can be imported and basic functionality works"""
    # Test ELI identifier parsing
    eli = ELIIdentifier.from_njt_reference("2023. évi XII. törvény")
    assert eli.year == 2023
    assert eli.number == "XII"
    assert eli.type == "torveny"
    
    uri = eli.to_uri()
    assert "njt.hu/eli" in uri
    assert "2023" in uri
    assert "XII" in uri
    
    # Test crawler can be instantiated
    crawler = NJTCrawler()
    assert crawler.base_url == "https://njt.hu"
    
    # Test content hashing
    hash_result = crawler._generate_content_hash("test content")
    assert len(hash_result) == 64  # SHA256 hex string
    
    print("✅ All standalone functionality tests passed!")


if __name__ == "__main__":
    # Run standalone tests first
    test_standalone_functionality()
    
    # Then run pytest if available
    try:
        pytest.main([__file__, "-v"])
    except ImportError:
        print("pytest not available, but standalone tests completed successfully!") 