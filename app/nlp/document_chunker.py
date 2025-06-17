"""
Legal Document Chunking System
Intelligent chunking algorithms that respect legal document structure.
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class DocumentChunk:
    content: str
    chunk_type: str  # paragraph, section, article
    metadata: Dict[str, Any]
    start_position: int
    end_position: int

class LegalDocumentChunker:
    def __init__(self):
        self.section_patterns = [
            r'\d+\. §',  # Hungarian section pattern
            r'\(\d+\)',  # Numbered subsections
            r'[a-z]\)',   # Lettered subsections
        ]
        
    def chunk_document(self, text: str) -> List[DocumentChunk]:
        """Chunk document respecting legal structure"""
        chunks = []
        
        # Simple paragraph-based chunking for now
        paragraphs = text.split('\n\n')
        
        position = 0
        for i, paragraph in enumerate(paragraphs):
            if paragraph.strip():
                chunk = DocumentChunk(
                    content=paragraph.strip(),
                    chunk_type="paragraph",
                    metadata={"chunk_id": i, "word_count": len(paragraph.split())},
                    start_position=position,
                    end_position=position + len(paragraph)
                )
                chunks.append(chunk)
            position += len(paragraph) + 2  # +2 for \n\n
            
        return chunks
    
    def validate_chunks(self, chunks: List[DocumentChunk]) -> bool:
        """Validate chunk quality"""
        if not chunks:
            return False
            
        # Check if chunks are reasonable size
        for chunk in chunks:
            word_count = chunk.metadata.get("word_count", 0)
            if word_count < 5 or word_count > 500:  # Reasonable bounds
                return False
                
        return True

if __name__ == "__main__":
    chunker = LegalDocumentChunker()
    print("Legal document chunker created successfully!")
