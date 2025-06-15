from .human_like import HumanLikeDelays
from .headers import HeaderRotator
from .proxy import AdvancedProxyManager
from .interaction import InteractionSimulator

class AntiDetectionManager:
    def __init__(self, proxy_list: List[str] = None):
        self.header_rotator = HeaderRotator()
        self.proxy_manager = AdvancedProxyManager(proxy_list) if proxy_list else None
        self.delays = HumanLikeDelays()
        self.interaction = InteractionSimulator() 