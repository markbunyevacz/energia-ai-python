"""
API endpoints for search
"""
from fastapi import APIRouter, HTTPException, Query
from structlog.stdlib import get_logger

from src.energia_ai.search.elasticsearch_manager import ElasticsearchManager
from src.energia_ai.vector_search.qdrant_manager import QdrantManager
from src.energia_ai.vector_search.embeddings import get_embedding_manager

logger = get_logger(__name__)
router = APIRouter()

@router.get("/search")
async def search(query: str = Query(..., min_length=3, max_length=300)):
    """
    Performs a hybrid search across lexical and semantic databases.
    """
    logger.info(f"Received search query: {query}")
    
    es_manager = ElasticsearchManager()
    qdrant_manager = QdrantManager()
    
    try:
        # Generate embedding for the query for semantic search
        embedding_manager = await get_embedding_manager()
        query_embedding = await embedding_manager.generate_embedding(query)
        
        # Perform semantic search
        semantic_results = await qdrant_manager.search(query_embedding)
        
        # Perform lexical search
        lexical_results = await es_manager.search(query)
        
        # Simple combination of results (a more sophisticated strategy would be needed)
        combined_results = {
            "semantic_results": semantic_results,
            "lexical_results": lexical_results
        }
        
        return combined_results
        
    except Exception as e:
        logger.error(f"Error during search: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error performing search.") 