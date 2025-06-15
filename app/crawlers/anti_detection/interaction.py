import random
from playwright.async_api import Page

class InteractionSimulator:
    @staticmethod
    async def human_like_scroll(page: Page) -> None:
        """Simulate human-like scrolling with variable speed"""
        scroll_steps = random.randint(3, 8)
        for _ in range(scroll_steps):
            scroll_distance = random.randint(200, 800)
            await page.mouse.wheel(0, scroll_distance)
            await asyncio.sleep(random.uniform(0.2, 1.0))
    
    @staticmethod
    async def human_like_mouse_move(page: Page) -> None:
        """Simulate non-linear mouse movement"""
        width, height = page.viewport_size
        target_x = random.randint(0, width)
        target_y = random.randint(0, height)
        
        # Create non-linear path
        steps = random.randint(5, 15)
        for _ in range(steps):
            current_x = random.randint(0, width)
            current_y = random.randint(0, height)
            await page.mouse.move(current_x, current_y)
            await asyncio.sleep(random.uniform(0.1, 0.3))
        
        await page.mouse.move(target_x, target_y)
    
    @staticmethod
    async def random_click(page: Page) -> None:
        """Click on random non-critical elements"""
        elements = await page.query_selector_all("body, div, span, a")
        if elements:
            element = random.choice(elements)
            try:
                await element.click(timeout=5000)
                await asyncio.sleep(random.uniform(0.5, 2.0))
            except:
                # Ignore failed clicks on non-interactive elements
                pass 