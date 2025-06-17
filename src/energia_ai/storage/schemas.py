"""
MongoDB document schemas for legal document storage
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class LegalDocumentSchema(BaseModel):
    """Schema for legal documents stored in MongoDB"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    title: str = Field(..., description="Document title")
    document_type: str = Field(..., description="Type of legal document")
    source_url: Optional[str] = Field(None, description="Original URL")
    
    # Content fields
    raw_content: str = Field(..., description="Raw document content")
    processed_content: Optional[str] = Field(None, description="Processed/cleaned content")
    extracted_text: Optional[str] = Field(None, description="Extracted plain text")
    
    # Legal metadata
    publication_date: Optional[datetime] = Field(None, description="Publication date")
    effective_date: Optional[datetime] = Field(None, description="Effective date")
    legal_reference: Optional[str] = Field(None, description="Legal reference number")
    
    # Processing metadata
    content_hash: str = Field(..., description="SHA-256 hash of content")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    language: str = Field(default="hu", description="Document language")
    
    # Extracted entities and keywords
    keywords: List[str] = Field(default_factory=list, description="Extracted keywords")
    entities: Dict[str, List[str]] = Field(default_factory=dict, description="Named entities")
    
    # Search and indexing
    search_vector: Optional[List[float]] = Field(None, description="Document embedding vector")
    indexed_at: Optional[datetime] = Field(None, description="When document was indexed")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentVersionSchema(BaseModel):
    """Schema for document version history"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    document_id: PyObjectId = Field(..., description="Reference to main document")
    version_number: int = Field(..., description="Version number")
    content: str = Field(..., description="Content of this version")
    changes_summary: Optional[str] = Field(None, description="Summary of changes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DocumentCollectionSchema(BaseModel):
    """Schema for document collections/categories"""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., description="Collection name")
    description: Optional[str] = Field(None, description="Collection description")
    document_ids: List[PyObjectId] = Field(default_factory=list, description="Document IDs in collection")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Collection metadata")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
