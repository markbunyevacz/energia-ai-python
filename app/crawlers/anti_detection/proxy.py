import random
import logging
from typing import List, Optional, Dict

class AdvancedProxyManager:
    def __init__(self, proxy_list: List[str] = None):
        self.proxies = proxy_list or []
        self.current_proxy = None
        self.failed_proxies = set()
        self.logger = logging.getLogger(__name__)
    
    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        """Get next proxy with rotation strategy"""
        if not self.proxies:
            return None
            
        # Filter out failed proxies
        active_proxies = [p for p in self.proxies if p not in self.failed_proxies]
        
        if not active_proxies:
            self.logger.warning("No active proxies available")
            return None
            
        proxy = random.choice(active_proxies)
        self.current_proxy = proxy
        
        # Format proxy for Playwright: http://user:pass@host:port
        return {
            "server": proxy,
            "username": None,  # Will be extracted from URL if present
            "password": None   # Will be extracted from URL if present
        }
    
    def mark_proxy_failed(self, proxy: str) -> None:
        """Mark a proxy as failed (remove from rotation)"""
        self.failed_proxies.add(proxy)
        self.logger.warning(f"Proxy marked as failed: {proxy}")
    
    def reset_failed_proxies(self) -> None:
        """Reset failed proxies (e.g., after successful request)"""
        self.failed_proxies = set()
        self.logger.info("Failed proxies reset") 