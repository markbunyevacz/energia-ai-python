"""
NJT.hu Crawler with ELI Standards Implementation

Crawls the Hungarian National Legislation Database (njt.hu) using European Legislation 
Identifier (ELI) standards for programmatic access to Hungarian legal documents.

ELI URI Template for Hungary: http://www.njt.hu/eli/{type}/{year}/{number}/{point}/{version}/{language}
"""

import asyncio
import re
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, date
from urllib.parse import urljoin
from dataclasses import dataclass
import hashlib

from playwright.async_api import Page, async_playwright
from bs4 import BeautifulSoup

try:
    from .base_crawler import BaseCrawler
except ImportError:
    # For standalone testing, create a minimal base crawler
    from abc import ABC, abstractmethod
    import random
    
    class DelayManager:
        async def short_pause(self):
            import asyncio
            await asyncio.sleep(random.uniform(1, 3))
        
        async def medium_pause(self):
            import asyncio
            await asyncio.sleep(random.uniform(3, 7))
    
    class InteractionManager:
        async def human_like_scroll(self, page: Page):
            await page.evaluate("window.scrollBy(0, Math.random() * 300)")
        
        async def human_like_mouse_move(self, page: Page):
            await page.mouse.move(random.randint(100, 800), random.randint(100, 600))
        
        async def random_click(self, page: Page):
            await page.mouse.click(random.randint(100, 300), random.randint(100, 300))
    
    class AntiDetectionManager:
        def __init__(self, proxy_list: List[str] = None):
            self.proxy_list = proxy_list or []
            self.delays = DelayManager()
            self.interaction = InteractionManager()
    
    class HeaderRotator:
        def get_random_headers(self):
            user_agents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
            ]
            return {
                "User-Agent": random.choice(user_agents),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            }
    
    class BaseCrawler(ABC):
        def __init__(self, proxy_list: List[str] = None):
            self.proxy_list = proxy_list or []
            self.anti_detection = AntiDetectionManager(proxy_list)
            self.header_rotator = HeaderRotator()
            self.proxy_manager = None
            
            # Setup logging
            self.logger = logging.getLogger(self.__class__.__name__)
            if not self.logger.handlers:
                handler = logging.StreamHandler()
                formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
                handler.setFormatter(formatter)
                self.logger.addHandler(handler)
                self.logger.setLevel(logging.INFO)
        
        async def _configure_browser_context(self, browser):
            headers = self.header_rotator.get_random_headers()
            context_options = {
                "user_agent": headers["User-Agent"],
                "extra_http_headers": headers,
                "ignore_https_errors": True,
                "bypass_csp": True
            }
            
            context = await browser.new_context(**context_options)
            
            await context.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => false
                });
            """)
            
            return context
        
        async def _human_interaction_break(self, page: Page) -> None:
            await self.anti_detection.interaction.human_like_scroll(page)
            await self.anti_detection.interaction.human_like_mouse_move(page)
            if random.random() > 0.7:
                await self.anti_detection.interaction.random_click(page)
            await self.anti_detection.delays.medium_pause()
        
        @abstractmethod
        async def crawl(self, *args, **kwargs):
            pass


@dataclass
class ELIIdentifier:
    """European Legislation Identifier structure for Hungarian legal documents"""
    country: str = "hu"
    type: str = ""
    year: int = 0
    number: str = ""
    point: str = ""
    version: str = ""
    language: str = "hu"
    
    def to_uri(self) -> str:
        """Generate ELI URI for the document"""
        base_uri = f"http://www.njt.hu/eli/{self.country}/{self.type}/{self.year}/{self.number}"
        
        if self.point:
            base_uri += f"/{self.point}"
        if self.version:
            base_uri += f"/{self.version}"
        if self.language != "hu":
            base_uri += f"/{self.language}"
            
        return base_uri
    
    @classmethod
    def from_njt_reference(cls, reference: str) -> 'ELIIdentifier':
        """Parse NJT reference into ELI identifier"""
        eli = cls()
        
        # Match law pattern: "YYYY. évi ROMAN. törvény"
        law_match = re.match(r'(\d{4})\.\s*évi\s+([IVXLCDM]+)\.\s*törvény', reference)
        if law_match:
            eli.year = int(law_match.group(1))
            eli.number = law_match.group(2)
            eli.type = "torveny"
            return eli
        
        # Match decree pattern
        decree_match = re.match(r'(\d+)/(\d{4})\.\s*\([^)]+\)\s*([^.]+)\.\s*rendelet', reference)
        if decree_match:
            eli.number = decree_match.group(1)
            eli.year = int(decree_match.group(2))
            issuer = decree_match.group(3).lower()
            if "korm" in issuer:
                eli.type = "korm.rendelet"
            else:
                eli.type = "rendelet"
            return eli
        
        return eli


@dataclass
class LegalDocument:
    """Hungarian legal document with ELI metadata"""
    eli_id: ELIIdentifier
    title: str
    content: str
    publication_date: Optional[date]
    effective_date: Optional[date]
    status: str
    document_type: str
    issuer: str
    subject_areas: List[str]
    citations: List[str]
    amendments: List[str]
    url: str
    content_hash: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "eli_uri": self.eli_id.to_uri(),
            "title": self.title,
            "content": self.content,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None,
            "status": self.status,
            "document_type": self.document_type,
            "issuer": self.issuer,
            "subject_areas": self.subject_areas,
            "citations": self.citations,
            "amendments": self.amendments,
            "url": self.url,
            "content_hash": self.content_hash,
            "crawled_at": datetime.now().isoformat()
        }


class NJTCrawler(BaseCrawler):
    """
    National Legislation Database (NJT.hu) crawler with ELI standards support
    """
    
    def __init__(self, proxy_list: List[str] = None):
        super().__init__(proxy_list)
        self.base_url = "https://njt.hu"
        self.eli_base = "http://www.njt.hu/eli"
        self.crawl_statistics = {
            "documents_found": 0,
            "documents_processed": 0,
            "documents_updated": 0,
            "errors": 0,
            "start_time": None,
            "end_time": None
        }
    
    async def crawl(self, search_params: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """
        Main crawl method - implements the abstract method from BaseCrawler
        
        Args:
            search_params: Search parameters (year, number, type, text, etc.)
            
        Returns:
            List of crawled documents
        """
        return await self.crawl_search_results(search_params)
    
    async def crawl_search_results(self, search_params: Dict[str, str] = None) -> List[Dict[str, Any]]:
        """Crawl NJT search results with given parameters"""
        self.crawl_statistics["start_time"] = datetime.now()
        documents = []
        
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=True)
            context = await self._configure_browser_context(browser)
            page = await context.new_page()
            
            try:
                # Navigate to main page first
                self.logger.info("Navigating to NJT.hu...")
                await page.goto(self.base_url, timeout=30000)
                await self.anti_detection.delays.short_pause()
                
                # For testing, let's just get some links from the main page
                document_links = await self._extract_document_links(page)
                self.crawl_statistics["documents_found"] = len(document_links)
                
                self.logger.info(f"Found {len(document_links)} potential document links")
                
                # Process a limited number of documents for testing
                for i, link in enumerate(document_links[:5]):  # Only process first 5 for testing
                    try:
                        self.logger.info(f"Processing document {i+1}: {link}")
                        document = await self._process_document(page, link)
                        if document:
                            documents.append(document)
                            self.crawl_statistics["documents_processed"] += 1
                        
                        # Human-like delay between documents
                        if i < len(document_links) - 1:
                            await self.anti_detection.delays.medium_pause()
                            
                    except Exception as e:
                        self.logger.error(f"Error processing document {link}: {e}")
                        self.crawl_statistics["errors"] += 1
                        continue
                
            except Exception as e:
                self.logger.error(f"Error during crawling: {e}")
                raise
            finally:
                await context.close()
                await browser.close()
        
        self.crawl_statistics["end_time"] = datetime.now()
        self.logger.info(f"Crawling completed. Processed {len(documents)} documents.")
        return documents
    
    async def _extract_document_links(self, page: Page) -> List[str]:
        """Extract all document links from page"""
        links = []
        
        try:
            # Wait for page to load
            await page.wait_for_selector("a", timeout=10000)
            
            # Get all links on the page
            link_elements = await page.query_selector_all("a[href]")
            
            for element in link_elements:
                try:
                    href = await element.get_attribute("href")
                    text = await element.text_content()
                    
                    if href and text:
                        # Check if it's likely a legal document link
                        text_lower = text.lower().strip()
                        href_lower = href.lower()
                        
                        # Look for patterns that indicate legal documents
                        legal_patterns = [
                            "törvény", "rendelet", "határozat", "utasítás",
                            "jogszabály", "alaptörvény", "korm.", "tv."
                        ]
                        
                        if (any(pattern in text_lower for pattern in legal_patterns) or
                            any(pattern in href_lower for pattern in ["jogszabaly", "law", "act"])):
                            
                            full_url = urljoin(self.base_url, href)
                            if full_url not in links and "njt.hu" in full_url:
                                links.append(full_url)
                                
                except Exception as e:
                    # Skip problematic links
                    continue
            
            # If no specific legal document links found, get some general links for testing
            if not links:
                self.logger.warning("No legal document links found, getting general links for testing")
                for element in link_elements[:10]:  # Get first 10 links
                    try:
                        href = await element.get_attribute("href")
                        if href:
                            full_url = urljoin(self.base_url, href)
                            if "njt.hu" in full_url:
                                links.append(full_url)
                    except:
                        continue
                
        except Exception as e:
            self.logger.warning(f"Error extracting document links: {e}")
        
        return links[:10]  # Limit to first 10 for testing
    
    async def _process_document(self, page: Page, document_url: str) -> Optional[Dict[str, Any]]:
        """Process individual document"""
        try:
            self.logger.info(f"Processing: {document_url}")
            await page.goto(document_url, timeout=30000)
            await page.wait_for_load_state("networkidle", timeout=10000)
            await self.anti_detection.delays.short_pause()
            
            # Extract document data
            document_data = await self._extract_document_data(page, document_url)
            
            if document_data and document_data.get("title"):
                # Generate ELI identifier
                eli_id = ELIIdentifier.from_njt_reference(document_data.get("title", ""))
                
                # Create legal document object
                legal_doc = LegalDocument(
                    eli_id=eli_id,
                    title=document_data.get("title", ""),
                    content=document_data.get("content", ""),
                    publication_date=document_data.get("publication_date"),
                    effective_date=document_data.get("effective_date"),
                    status=document_data.get("status", "unknown"),
                    document_type=document_data.get("document_type", ""),
                    issuer=document_data.get("issuer", ""),
                    subject_areas=document_data.get("subject_areas", []),
                    citations=document_data.get("citations", []),
                    amendments=document_data.get("amendments", []),
                    url=document_url,
                    content_hash=self._generate_content_hash(document_data.get("content", ""))
                )
                
                return legal_doc.to_dict()
        
        except Exception as e:
            self.logger.error(f"Error processing document {document_url}: {e}")
            return None
    
    async def _extract_document_data(self, page: Page, url: str) -> Dict[str, Any]:
        """Extract structured data from page"""
        data = {"url": url}
        
        try:
            # Get page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract title
            title_element = (soup.find("h1") or 
                           soup.find("h2") or 
                           soup.find("title"))
            
            if title_element:
                title_text = title_element.get_text(strip=True)
                # Clean up title
                if "Nemzeti Jogszabálytár" in title_text:
                    parts = title_text.split("-")
                    if len(parts) > 1:
                        title_text = parts[0].strip()
                data["title"] = title_text
            else:
                # Fallback: try to get title from page title or first heading
                page_title = await page.title()
                data["title"] = page_title if page_title else f"Document from {url}"
            
            # Extract content
            body = soup.find("body")
            if body:
                # Remove script and style elements
                for script in body(["script", "style"]):
                    script.decompose()
                document_content = body.get_text(separator="\n", strip=True)
            else:
                document_content = soup.get_text(separator="\n", strip=True)
            
            data["content"] = document_content[:5000]  # Limit content for testing
            
            # Basic document classification
            title_lower = data.get("title", "").lower()
            content_lower = document_content.lower()
            
            if "törvény" in title_lower or "törvény" in content_lower:
                data["document_type"] = "törvény"
                data["issuer"] = "országgyűlés"
                data["status"] = "hatályos"
            elif "rendelet" in title_lower or "rendelet" in content_lower:
                data["document_type"] = "rendelet"
                data["issuer"] = "kormány"
                data["status"] = "hatályos"
            else:
                data["document_type"] = "egyéb"
                data["issuer"] = "ismeretlen"
                data["status"] = "ismeretlen"
            
            # Set defaults
            data.setdefault("subject_areas", [])
            data.setdefault("citations", [])
            data.setdefault("amendments", [])
            
        except Exception as e:
            self.logger.error(f"Error extracting document data: {e}")
            # Return minimal data to avoid complete failure
            data.setdefault("title", f"Document from {url}")
            data.setdefault("content", "")
            data.setdefault("document_type", "egyéb")
            data.setdefault("issuer", "ismeretlen")
            data.setdefault("status", "ismeretlen")
            data.setdefault("subject_areas", [])
            data.setdefault("citations", [])
            data.setdefault("amendments", [])
        
        return data
    
    def _generate_content_hash(self, content: str) -> str:
        """Generate hash for content change detection"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def get_crawl_statistics(self) -> Dict[str, Any]:
        """Get crawling statistics"""
        if self.crawl_statistics["start_time"] and self.crawl_statistics["end_time"]:
            duration = self.crawl_statistics["end_time"] - self.crawl_statistics["start_time"]
            self.crawl_statistics["duration_seconds"] = duration.total_seconds()
        
        return self.crawl_statistics.copy()
    
    async def validate_eli_compliance(self, document: Dict[str, Any]) -> bool:
        """
        Validate document compliance with ELI standards
        
        Args:
            document: Document data
            
        Returns:
            True if compliant, False otherwise
        """
        required_fields = ["eli_uri", "title", "content", "status"]
        
        for field in required_fields:
            if field not in document or not document[field]:
                self.logger.warning(f"Document missing required ELI field: {field}")
                return False
        
        # Validate ELI URI format
        eli_uri = document["eli_uri"]
        if not eli_uri.startswith("http://www.njt.hu/eli/"):
            self.logger.warning(f"Invalid ELI URI format: {eli_uri}")
            return False
        
        return True


# Usage example
async def main():
    """Example usage of the NJT crawler"""
    crawler = NJTCrawler()
    
    # Simple test without search parameters
    print("Starting NJT crawler...")
    documents = await crawler.crawl()
    
    print(f"Found and processed {len(documents)} documents")
    for i, doc in enumerate(documents):
        print(f"{i+1}. {doc.get('title', 'No title')}")
        print(f"   ELI URI: {doc.get('eli_uri', 'No ELI URI')}")
        print(f"   Status: {doc.get('status', 'Unknown')}")
        print(f"   Type: {doc.get('document_type', 'Unknown')}")
        print()
    
    # Show statistics
    stats = crawler.get_crawl_statistics()
    print("Crawl Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main()) 