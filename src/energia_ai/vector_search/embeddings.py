"""
Document embedding utilities for semantic search
"""
import asyncio
import hashlib
from typing import List, Dict, Any, Optional
import openai
import numpy as np
from sentence_transformers import SentenceTransformer
import structlog
from ..config.settings import get_settings
from dataclasses import dataclass
import dspy

logger = structlog.get_logger()

@dataclass
class DSPyConfig:
    model_name: str = 'openai/gpt-4o-mini'
    temperature: float = 0.7
    use_local_model: bool = False
    optimization_enabled: bool = True
    cache_enabled: bool = True

class EmbeddingManager:
    """Manager for generating document embeddings"""
    
    def __init__(self):
        self.settings = get_settings()
        self.openai_client = None
        self.sentence_transformer = None
        self.embedding_model = "text-embedding-ada-002"  # OpenAI model
        self.local_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"  # Supports Hungarian
        
    async def initialize(self):
        """Initialize embedding models"""
        try:
            # Initialize OpenAI client if API key is available
            if self.settings.openai_api_key:
                openai.api_key = self.settings.openai_api_key
                self.openai_client = openai
                logger.info("OpenAI embedding client initialized")
            
            # Initialize local sentence transformer for Hungarian support
            self.sentence_transformer = SentenceTransformer(self.local_model)
            logger.info("Local sentence transformer initialized", model=self.local_model)
            
        except Exception as e:
            logger.error("Failed to initialize embedding models", error=str(e))
            raise
    
    async def generate_embedding_openai(self, text: str) -> Optional[List[float]]:
        """Generate embedding using OpenAI API"""
        try:
            if not self.openai_client:
                return None
            
            # Clean and truncate text
            cleaned_text = self.preprocess_text(text)
            
            response = await self.openai_client.Embedding.acreate(
                model=self.embedding_model,
                input=cleaned_text
            )
            
            embedding = response['data'][0]['embedding']
            
            logger.debug("OpenAI embedding generated", text_length=len(text))
            return embedding
            
        except Exception as e:
            logger.error("OpenAI embedding generation failed", error=str(e))
            return None
    
    def generate_embedding_local(self, text: str) -> List[float]:
        """Generate embedding using local sentence transformer"""
        try:
            if not self.sentence_transformer:
                raise ValueError("Sentence transformer not initialized")
            
            # Clean and preprocess text
            cleaned_text = self.preprocess_text(text)
            
            # Generate embedding
            embedding = self.sentence_transformer.encode(cleaned_text)
            
            # Convert to list and normalize
            embedding_list = embedding.tolist()
            
            logger.debug("Local embedding generated", text_length=len(text))
            return embedding_list
            
        except Exception as e:
            logger.error("Local embedding generation failed", error=str(e))
            return []
    
    async def generate_embedding(self, text: str, prefer_openai: bool = True) -> List[float]:
        """Generate embedding with fallback strategy"""
        try:
            if not self.sentence_transformer and not self.openai_client:
                await self.initialize()
            
            # Try OpenAI first if preferred and available
            if prefer_openai and self.openai_client:
                embedding = await self.generate_embedding_openai(text)
                if embedding:
                    return embedding
            
            # Fallback to local model
            return self.generate_embedding_local(text)
            
        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            return []
    
    def preprocess_text(self, text: str, max_length: int = 8000) -> str:
        """Preprocess text for embedding generation"""
        try:
            # Remove excessive whitespace
            cleaned = ' '.join(text.split())
            
            # Truncate if too long
            if len(cleaned) > max_length:
                cleaned = cleaned[:max_length]
                logger.debug("Text truncated for embedding", original_length=len(text), final_length=len(cleaned))
            
            return cleaned
            
        except Exception as e:
            logger.error("Text preprocessing failed", error=str(e))
            return text
    
    async def generate_document_embeddings(
        self, 
        documents: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generate embeddings for multiple documents"""
        try:
            results = []
            
            for doc in documents:
                # Extract text content
                content = doc.get('content', '') or doc.get('extracted_text', '')
                if not content:
                    logger.warning("No content found for document", document_id=doc.get('id'))
                    continue
                
                # Generate embedding
                embedding = await self.generate_embedding(content)
                if not embedding:
                    logger.warning("Failed to generate embedding", document_id=doc.get('id'))
                    continue
                
                # Prepare result
                result = {
                    'id': doc['id'],
                    'embedding': embedding,
                    'metadata': {
                        'title': doc.get('title', ''),
                        'document_type': doc.get('document_type', ''),
                        'legal_reference': doc.get('legal_reference', ''),
                        'publication_date': doc.get('publication_date'),
                        'source_url': doc.get('source_url', ''),
                        'content_length': len(content),
                        'embedding_model': self.local_model if not self.openai_client else self.embedding_model,
                    }
                }
                results.append(result)
            
            logger.info("Document embeddings generated", 
                       total_documents=len(documents), 
                       successful_embeddings=len(results))
            
            return results
            
        except Exception as e:
            logger.error("Batch embedding generation failed", error=str(e))
            return []
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity between two texts using embeddings"""
        try:
            if not self.sentence_transformer:
                return 0.0
            
            # Generate embeddings
            embedding1 = self.sentence_transformer.encode(text1)
            embedding2 = self.sentence_transformer.encode(text2)
            
            # Calculate cosine similarity
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )
            
            return float(similarity)
            
        except Exception as e:
            logger.error("Text similarity calculation failed", error=str(e))
            return 0.0

class HungarianLegalSignatures:
    class MagyarJogszabalySignature(dspy.Signature):
        """Magyar jogszabályok elemzése és értelmezése."""
        jogszabaly_szoveg = dspy.InputField(desc="Magyar jogszabály szövege")
        kerdes = dspy.InputField(desc="Konkrét jogi kérdés")
        valasz = dspy.OutputField(desc="Jogszabály alapú válasz")

# Global embedding manager instance
_embedding_manager = None

async def get_embedding_manager() -> EmbeddingManager:
    """Get the global embedding manager instance"""
    global _embedding_manager
    if _embedding_manager is None:
        _embedding_manager = EmbeddingManager()
        await _embedding_manager.initialize()
    return _embedding_manager

def optimize_agent(agent, training_data):
    teleprompter = BootstrapFewShot(metric=accuracy_metric)
    return teleprompter.compile(agent, trainset=training_data)
