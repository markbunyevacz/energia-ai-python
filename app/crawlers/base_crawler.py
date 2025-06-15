from app.crawlers.anti_detection.manager import AntiDetectionManager
from app.crawlers.anti_detection.headers import HeaderRotator
from app.crawlers.anti_detection.proxy import AdvancedProxyManager

class BaseCrawler(ABC):
    def __init__(self, proxy_list: List[str] = None):
        # ... existing initialization ...
        self.anti_detection = AntiDetectionManager(proxy_list)
        self.header_rotator = HeaderRotator()
        self.proxy_manager = AdvancedProxyManager(proxy_list) if proxy_list else None
    
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