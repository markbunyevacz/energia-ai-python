"""
Script to initialize the database.
"""
import asyncio
import os
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine
from tenacity import retry, stop_after_attempt, wait_fixed

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.energia_ai.database.models import Base
from src.energia_ai.core.logging import setup_logging
from src.energia_ai.config.settings import get_settings

logger = setup_logging()
settings = get_settings()

MAX_RETRIES = 5
RETRY_DELAY = 5

@retry(stop=stop_after_attempt(MAX_RETRIES), wait=wait_fixed(RETRY_DELAY))
async def init_db() -> None:
    """
    Initializes the database by creating all tables.
    """
    db_url = settings.get_database_url()
    if not db_url:
        logger.error("DATABASE_URL is not set. Please set it in your environment.")
        return

    try:
        engine = create_async_engine(db_url)

        async with engine.begin() as conn:
            logger.info("Dropping all tables...")
            await conn.run_sync(Base.metadata.drop_all)
            logger.info("Creating all tables...")
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database initialized successfully.")

    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        raise
    finally:
        await engine.dispose()


async def main() -> None:
    logger.info("Starting database initialization...")
    await init_db()
    logger.info("Database initialization finished.")


if __name__ == "__main__":
    asyncio.run(main()) 