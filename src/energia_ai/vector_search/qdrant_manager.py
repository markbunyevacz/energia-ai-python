"""
Qdrant vector database manager for semantic search
"""
import asyncio
from typing import List, Dict, Any, Optional, Union
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, Range
import numpy as np
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class QdrantManager:
    """Qdrant vector database manager for semantic search"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[QdrantClient] = None
        self.collection_name = "legal_documents"
        self.vector_size = 1536  # OpenAI embedding size
        
    async def initialize(self):
        """Initialize Qdrant connection"""
        try:
            # Create Qdrant client
            self.client = QdrantClient(
                host=self.settings.qdrant_host,
                port=self.settings.qdrant_port,
                timeout=30,
            )
            
            # Test connection
            collections = self.client.get_collections()
            
            # Create collection if it doesn't exist
            await self.create_collection()
            
            logger.info("Qdrant connection initialized", 
                       host=self.settings.qdrant_host, 
                       port=self.settings.qdrant_port)
            
        except Exception as e:
            logger.error("Failed to initialize Qdrant", error=str(e))
            raise
    
    async def create_collection(self):
        """Create the legal documents collection"""
        try:
            # Check if collection exists
            try:
                collection_info = self.client.get_collection(self.collection_name)
                logger.info("Collection already exists", collection=self.collection_name)
                return
            except Exception:
                # Collection doesn't exist, create it
                pass
            
            # Create collection with vector configuration
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,
                ),
                optimizers_config=models.OptimizersConfig(
                    default_segment_number=2,
                    max_segment_size=20000,
                    memmap_threshold=20000,
                    indexing_threshold=20000,
                ),
                hnsw_config=models.HnswConfig(
                    m=16,
                    ef_construct=100,
                    full_scan_threshold=10000,
                    max_indexing_threads=0,
                ),
            )
            
            # Create payload indexes for efficient filtering
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="document_type",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="legal_reference",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            
            self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="publication_date",
                field_schema=models.PayloadSchemaType.DATETIME,
            )
            
            logger.info("Qdrant collection created successfully", collection=self.collection_name)
            
        except Exception as e:
            logger.error("Failed to create Qdrant collection", error=str(e))
            raise
    
    async def store_document_embedding(
        self, 
        document_id: str, 
        embedding: List[float], 
        metadata: Dict[str, Any]
    ) -> bool:
        """Store document embedding with metadata"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create point
            point = PointStruct(
                id=document_id,
                vector=embedding,
                payload=metadata
            )
            
            # Upsert point
            operation_info = self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Document embedding stored", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to store document embedding", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def search_similar_documents(
        self, 
        query_embedding: List[float], 
        limit: int = 10,
        document_type: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        try:
            if not self.client:
                await self.initialize()
            
            # Build search filter
            search_filter = None
            conditions = []
            
            if document_type:
                conditions.append(
                    FieldCondition(
                        key="document_type",
                        match=models.MatchValue(value=document_type)
                    )
                )
            
            if date_range:
                if date_range.get("start") or date_range.get("end"):
                    date_condition = FieldCondition(
                        key="publication_date",
                        range=Range(
                            gte=date_range.get("start"),
                            lte=date_range.get("end")
                        )
                    )
                    conditions.append(date_condition)
            
            if conditions:
                search_filter = Filter(must=conditions)
            
            # Perform search
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": result.score,
                    "metadata": result.payload
                })
            
            logger.info("Semantic search completed", 
                       query_results=len(results),
                       score_threshold=score_threshold)
            
            return results
            
        except Exception as e:
            logger.error("Semantic search failed", error=str(e))
            return []
    
    async def batch_store_embeddings(
        self, 
        documents: List[Dict[str, Any]]
    ) -> bool:
        """Batch store multiple document embeddings"""
        try:
            if not self.client:
                await self.initialize()
            
            # Create points
            points = []
            for doc in documents:
                point = PointStruct(
                    id=doc["id"],
                    vector=doc["embedding"],
                    payload=doc["metadata"]
                )
                points.append(point)
            
            # Batch upsert
            operation_info = self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Batch embeddings stored", 
                       count=len(documents), 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Batch embedding storage failed", 
                        count=len(documents), 
                        error=str(e))
            return False
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the vector database"""
        try:
            if not self.client:
                await self.initialize()
            
            operation_info = self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.PointIdsList(
                    points=[document_id]
                )
            )
            
            success = operation_info.status == models.UpdateStatus.COMPLETED
            
            logger.info("Document deleted from vector DB", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to delete document from vector DB", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection"""
        try:
            if not self.client:
                await self.initialize()
            
            collection_info = self.client.get_collection(self.collection_name)
            
            return {
                "name": self.collection_name,
                "vectors_count": collection_info.vectors_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "points_count": collection_info.points_count,
                "segments_count": collection_info.segments_count,
                "status": collection_info.status,
                "optimizer_status": collection_info.optimizer_status,
                "disk_data_size": collection_info.disk_data_size,
                "ram_data_size": collection_info.ram_data_size,
            }
            
        except Exception as e:
            logger.error("Failed to get collection info", error=str(e))
            return {}

# Global Qdrant manager instance
_qdrant_manager = None

async def get_qdrant_manager() -> QdrantManager:
    """Get the global Qdrant manager instance"""
    global _qdrant_manager
    if _qdrant_manager is None:
        _qdrant_manager = QdrantManager()
        await _qdrant_manager.initialize()
    return _qdrant_manager
