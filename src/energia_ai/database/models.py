"""
Database models for Energia AI using SQLAlchemy
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    documents = relationship("Document", back_populates="owner")
    search_history = relationship("SearchHistory", back_populates="user")

class Document(Base):
    """Legal document metadata model"""
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False, index=True)
    document_type = Column(String(100), nullable=False, index=True)
    source_url = Column(Text)
    content_hash = Column(String(64), unique=True, index=True)
    file_path = Column(Text)  # Path to stored document file
    
    # Legal document specific fields
    publication_date = Column(DateTime, index=True)
    effective_date = Column(DateTime, index=True)
    legal_reference = Column(String(200), index=True)  # e.g., "2023. évi V. törvény"
    
    # Processing status
    processing_status = Column(String(50), default='pending', index=True)
    extracted_text = Column(Text)
    summary = Column(Text)
    keywords = Column(JSON)  # Array of extracted keywords
    
    # Metadata
    owner_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    citations = relationship("Citation", back_populates="document")

class Citation(Base):
    """Legal citation relationships between documents"""
    __tablename__ = 'citations'
    
    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    cited_document_id = Column(Integer, ForeignKey('documents.id'), nullable=False)
    citation_text = Column(Text)  # The actual citation text
    citation_type = Column(String(50))  # 'reference', 'amendment', 'repeal', etc.
    context = Column(Text)  # Surrounding context of the citation
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    document = relationship("Document", foreign_keys=[document_id], back_populates="citations")
    cited_document = relationship("Document", foreign_keys=[cited_document_id])

class SearchHistory(Base):
    """User search history for analytics and personalization"""
    __tablename__ = 'search_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    query = Column(Text, nullable=False)
    search_type = Column(String(50))  # 'semantic', 'lexical', 'hybrid'
    results_count = Column(Integer)
    response_time_ms = Column(Integer)
    
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="search_history")

class SystemMetrics(Base):
    """System performance and usage metrics"""
    __tablename__ = 'system_metrics'
    
    id = Column(Integer, primary_key=True)
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(String(255))
    metric_data = Column(JSON)  # Additional structured data
    
    created_at = Column(DateTime, default=func.now())
