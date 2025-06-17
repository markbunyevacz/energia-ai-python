"""
Base crawler class with anti-detection capabilities
"""

import random
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from playwright.async_api import Browser, BrowserContext, Page


class CrawlerException(Exception):
    """Custom exception for crawler errors"""
    pass


class AntiDetectionManager:
    """Mock anti-detection manager for basic functionality"""
    def __init__(self, proxy_list: List[str] = None):
        self.proxy_list = proxy_list or []
        self.delays = DelayManager()
        self.interaction = InteractionManager()


class DelayManager:
    """Manages human-like delays"""
    async def short_pause(self):
        import asyncio
        await asyncio.sleep(random.uniform(1, 3))
    
    async def medium_pause(self):
        import asyncio
        await asyncio.sleep(random.uniform(3, 7))
    
    async def long_pause(self):
        import asyncio
        await asyncio.sleep(random.uniform(7, 15))


class InteractionManager:
    """Manages human-like interactions"""
    async def human_like_scroll(self, page: Page):
        # Scroll down slowly
        await page.evaluate("window.scrollBy(0, Math.random() * 300)")
    
    async def human_like_mouse_move(self, page: Page):
        # Move mouse to random position
        await page.mouse.move(random.randint(100, 800), random.randint(100, 600))
    
    async def random_click(self, page: Page):
        # Click at random safe position
        await page.mouse.click(random.randint(100, 300), random.randint(100, 300))


class HeaderRotator:
    """Rotates HTTP headers"""
    def get_random_headers(self):
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        ]
        
        return {
            "User-Agent": random.choice(user_agents),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }


class AdvancedProxyManager:
    """Manages proxy rotation"""
    def __init__(self, proxy_list: List[str]):
        self.proxy_list = proxy_list
        self.current_proxy = None
        self.failed_proxies = set()
    
    def get_next_proxy(self):
        available_proxies = [p for p in self.proxy_list if p not in self.failed_proxies]
        if available_proxies:
            self.current_proxy = {"server": random.choice(available_proxies)}
            return self.current_proxy
        return None
    
    def mark_proxy_failed(self, proxy_url: str):
        self.failed_proxies.add(proxy_url)


class BaseCrawler(ABC):
    """Base crawler class with anti-detection capabilities"""
    
    def __init__(self, proxy_list: List[str] = None):
        self.proxy_list = proxy_list or []
        self.anti_detection = AntiDetectionManager(proxy_list)
        self.header_rotator = HeaderRotator()
        self.proxy_manager = AdvancedProxyManager(proxy_list) if proxy_list else None
        
        # Setup logging
        self.logger = logging.getLogger(self.__class__.__name__)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
    
    async def _configure_browser_context(self, browser: Browser) -> BrowserContext:
        """Configure browser context with anti-detection measures"""
        headers = self.header_rotator.get_random_headers()
        proxy = self.proxy_manager.get_next_proxy() if self.proxy_manager else None
        
        context_options = {
            "user_agent": headers["User-Agent"],
            "extra_http_headers": headers,
            "ignore_https_errors": True,
            "bypass_csp": True
        }
        
        if proxy:
            context_options["proxy"] = proxy
            self.logger.info(f"Using proxy: {proxy['server']}")
        
        context = await browser.new_context(**context_options)
        
        # Set additional headers that can't be set in new_context
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false
            });
        """)
        
        return context
    
    async def _human_interaction_break(self, page: Page) -> None:
        """Perform random human-like interactions"""
        await self.anti_detection.interaction.human_like_scroll(page)
        await self.anti_detection.interaction.human_like_mouse_move(page)
        if random.random() > 0.7:  # 30% chance of random click
            await self.anti_detection.interaction.random_click(page)
        await self.anti_detection.delays.medium_pause()
    
    async def _handle_request_failure(self, failure_count: int) -> None:
        """Handle request failures with proxy rotation"""
        if self.proxy_manager and self.proxy_manager.current_proxy:
            proxy_url = self.proxy_manager.current_proxy['server']
            self.proxy_manager.mark_proxy_failed(proxy_url)
            self.logger.warning(f"Marked proxy as failed: {proxy_url}")
        
        if failure_count > 3:
            self.logger.error("Multiple consecutive failures, aborting crawl")
            raise CrawlerException("Excessive request failures")
    
    @abstractmethod
    async def crawl(self, *args, **kwargs):
        """Abstract method that must be implemented by subclasses"""
        pass 