"""
ETL script to move data from MongoDB to Elasticsearch and Qdrant.
"""
import asyncio
from structlog.stdlib import get_logger

from src.energia_ai.storage.mongodb_manager import MongoDBManager
from src.energia_ai.search.elasticsearch_manager import ElasticsearchManager
from src.energia_ai.vector_search.qdrant_manager import QdrantManager
from src.energia_ai.vector_search.embeddings import generate_embedding

logger = get_logger(__name__)

async def run_etl():
    """
    Runs the ETL process.
    """
    mongo_manager = MongoDBManager()
    es_manager = ElasticsearchManager()
    qdrant_manager = QdrantManager()

    await mongo_manager.connect()
    
    try:
        documents = await mongo_manager.db["documents"].find().to_list(length=100) # Process 100 docs for demo
        logger.info(f"Found {len(documents)} documents in MongoDB to process.")

        for doc in documents:
            content = doc.get("content", "")
            if not content:
                continue

            # Generate embedding
            embedding = await generate_embedding(content)
            
            # Index in Elasticsearch
            await es_manager.index_document(doc["_id"], doc)
            
            # Upsert to Qdrant
            await qdrant_manager.upsert(doc["_id"], embedding, doc)
            
            logger.info(f"Processed and indexed document {doc['_id']}")

    except Exception as e:
        logger.error(f"Error during ETL process: {e}", exc_info=True)
    finally:
        await mongo_manager.disconnect()

if __name__ == "__main__":
    logger.info("Starting ETL process...")
    asyncio.run(run_etl())
    logger.info("ETL process finished.") 