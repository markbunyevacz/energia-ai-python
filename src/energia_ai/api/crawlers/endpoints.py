"""
API endpoints for crawlers
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from structlog.stdlib import get_logger

from app.crawlers.njt_crawler import NJTCrawler
from src.energia_ai.storage.mongodb_manager import MongoDBManager

logger = get_logger(__name__)
router = APIRouter()

@router.post("/run-njt-crawler", status_code=202)
async def run_njt_crawler(background_tasks: BackgroundTasks):
    """
    Triggers the NJT.hu crawler in the background.
    """
    logger.info("NJT crawler endpoint triggered")
    try:
        crawler = NJTCrawler()
        mongo_manager = MongoDBManager()
        
        # This will run the crawler in the background
        background_tasks.add_task(crawler.run_and_save, mongo_manager)
        
        return {"message": "NJT crawler started in the background."}
    except Exception as e:
        logger.error(f"Failed to start NJT crawler: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start NJT crawler.") 