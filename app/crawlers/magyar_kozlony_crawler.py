from app.core.config import settings

class MagyarKozlonyCrawler(BaseCrawler):
    def __init__(self):
        # Pass proxy list from environment configuration
        super().__init__(proxy_list=settings.proxy_list)
        # ... rest of initialization ...
    
    async def crawl(self):
        try:
            # ... existing crawl logic ...
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