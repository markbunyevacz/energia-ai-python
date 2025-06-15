import random
import time
from typing import Coroutine, Any

class HumanLikeDelays:
    @staticmethod
    async def short_pause() -> None:
        """Random short pause (0.5-2 seconds)"""
        await asyncio.sleep(random.uniform(0.5, 2.0))
    
    @staticmethod
    async def medium_pause() -> None:
        """Random medium pause (2-5 seconds)"""
        await asyncio.sleep(random.uniform(2.0, 5.0))
    
    @staticmethod
    async def long_pause() -> None:
        """Random long pause (5-10 seconds)"""
        await asyncio.sleep(random.uniform(5.0, 10.0))
    
    @staticmethod
    async def typing_delay(text: str) -> None:
        """Simulate typing delay based on text length"""
        per_char_delay = random.uniform(0.05, 0.15)
        await asyncio.sleep(len(text) * per_char_delay) 