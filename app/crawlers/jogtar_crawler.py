import random
from playwright.async_api import Page
from .base_crawler import BaseCrawler
from app.core.config import settings
from playwright.async_api import PlaywrightError

class JogtarCrawler(BaseCrawler):
    def __init__(self):
        # Pass proxy list from environment configuration
        super().__init__(proxy_list=settings.proxy_list)
        # ... rest of initialization ...

    async def crawl(self):
        # ... existing setup ...
        
        try:
            # Navigate to page with human-like delay
            await page.goto(url)
            await self.anti_detection.delays.short_pause()
            
            # Perform anti-detection interactions
            await self._human_interaction_break(page)
            
            # ... existing scraping logic ...
            
            # Insert random pauses during processing
            for item in items:
                await self.process_item(item)
                if random.random() > 0.8:  # 20% chance of pause
                    await self.anti_detection.delays.short_pause()
        
        except PlaywrightError as e:
            if "proxy" in str(e).lower():
                # Report proxy failure to manager
                if self.proxy_manager and self.proxy_manager.current_proxy:
                    self.proxy_manager.mark_proxy_failed(
                        self.proxy_manager.current_proxy['server']
                    )
                self.logger.error(f"Proxy connection failed: {e}")
                # Retry with new proxy
                return await self.crawl()
            raise
        
        # ... existing cleanup ... 