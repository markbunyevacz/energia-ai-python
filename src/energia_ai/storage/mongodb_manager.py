"""
MongoDB connection and operations manager
"""
import asyncio
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from pymongo import IndexModel, TEXT, ASCENDING, DESCENDING
import structlog
from ..config.settings import get_settings
from .schemas import LegalDocumentSchema, DocumentVersionSchema, DocumentCollectionSchema

logger = structlog.get_logger()

class MongoDBManager:
    """Async MongoDB manager for document storage"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        
    async def initialize(self):
        """Initialize MongoDB connection"""
        try:
            # Create MongoDB client
            self.client = AsyncIOMotorClient(
                self.settings.mongodb_url,
                maxPoolSize=50,
                minPoolSize=10,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=5000,
            )
            
            # Get database
            self.database = self.client.energia_ai
            
            # Test connection
            await self.client.admin.command('ping')
            
            # Create indexes
            await self.create_indexes()
            
            logger.info("MongoDB connection initialized", mongodb_url=self.settings.mongodb_url)
            
        except Exception as e:
            logger.error("Failed to initialize MongoDB", error=str(e))
            raise
    
    async def create_indexes(self):
        """Create MongoDB indexes for optimal performance"""
        try:
            # Documents collection indexes
            documents = self.database.documents
            await documents.create_indexes([
                IndexModel([("title", TEXT), ("extracted_text", TEXT)], name="text_search"),
                IndexModel([("document_type", ASCENDING)], name="document_type_idx"),
                IndexModel([("legal_reference", ASCENDING)], name="legal_reference_idx"),
                IndexModel([("content_hash", ASCENDING)], unique=True, name="content_hash_idx"),
                IndexModel([("publication_date", DESCENDING)], name="publication_date_idx"),
                IndexModel([("created_at", DESCENDING)], name="created_at_idx"),
                IndexModel([("keywords", ASCENDING)], name="keywords_idx"),
            ])
            
            # Document versions collection indexes
            versions = self.database.document_versions
            await versions.create_indexes([
                IndexModel([("document_id", ASCENDING), ("version_number", DESCENDING)], name="document_version_idx"),
                IndexModel([("created_at", DESCENDING)], name="version_created_idx"),
            ])
            
            # Collections collection indexes
            collections = self.database.collections
            await collections.create_indexes([
                IndexModel([("name", ASCENDING)], unique=True, name="collection_name_idx"),
                IndexModel([("document_ids", ASCENDING)], name="collection_documents_idx"),
            ])
            
            logger.info("MongoDB indexes created successfully")
            
        except Exception as e:
            logger.error("Failed to create MongoDB indexes", error=str(e))
            raise
    
    async def store_document(self, document: LegalDocumentSchema) -> str:
        """Store a legal document in MongoDB"""
        try:
            collection = self.database.documents
            result = await collection.insert_one(document.dict(by_alias=True, exclude_unset=True))
            
            logger.info("Document stored", document_id=str(result.inserted_id))
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error("Failed to store document", error=str(e))
            raise
    
    async def get_document(self, document_id: str) -> Optional[LegalDocumentSchema]:
        """Retrieve a document by ID"""
        try:
            collection = self.database.documents
            doc = await collection.find_one({"_id": document_id})
            
            if doc:
                return LegalDocumentSchema(**doc)
            return None
            
        except Exception as e:
            logger.error("Failed to retrieve document", document_id=document_id, error=str(e))
            raise
    
    async def search_documents(
        self, 
        query: str, 
        document_type: Optional[str] = None,
        limit: int = 50
    ) -> List[LegalDocumentSchema]:
        """Search documents using full-text search"""
        try:
            collection = self.database.documents
            
            # Build search filter
            search_filter = {"$text": {"$search": query}}
            if document_type:
                search_filter["document_type"] = document_type
            
            # Execute search
            cursor = collection.find(
                search_filter,
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(limit)
            
            documents = []
            async for doc in cursor:
                documents.append(LegalDocumentSchema(**doc))
            
            logger.info("Document search completed", query=query, results_count=len(documents))
            return documents
            
        except Exception as e:
            logger.error("Document search failed", query=query, error=str(e))
            raise
    
    async def update_document(self, document_id: str, updates: Dict[str, Any]) -> bool:
        """Update a document"""
        try:
            collection = self.database.documents
            updates["updated_at"] = datetime.utcnow()
            
            result = await collection.update_one(
                {"_id": document_id},
                {"$set": updates}
            )
            
            success = result.modified_count > 0
            logger.info("Document updated", document_id=document_id, success=success)
            return success
            
        except Exception as e:
            logger.error("Failed to update document", document_id=document_id, error=str(e))
            raise
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document"""
        try:
            collection = self.database.documents
            result = await collection.delete_one({"_id": document_id})
            
            success = result.deleted_count > 0
            logger.info("Document deleted", document_id=document_id, success=success)
            return success
            
        except Exception as e:
            logger.error("Failed to delete document", document_id=document_id, error=str(e))
            raise
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

# Global MongoDB manager instance
_mongo_manager = None

async def get_mongodb_manager() -> MongoDBManager:
    """Get the global MongoDB manager instance"""
    global _mongo_manager
    if _mongo_manager is None:
        _mongo_manager = MongoDBManager()
        await _mongo_manager.initialize()
    return _mongo_manager
