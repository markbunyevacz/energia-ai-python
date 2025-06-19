"""
Enhanced Legal Document Chunking System
Intelligent chunking algorithms that respect Hungarian legal document structure.
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging
from datetime import datetime


class ChunkType(Enum):
    """Types of legal document chunks."""
    TITLE = "title"
    CHAPTER = "chapter"
    SECTION = "section"
    PARAGRAPH = "paragraph"
    SUBSECTION = "subsection"
    ARTICLE = "article"
    POINT = "point"
    SUBPOINT = "subpoint"
    APPENDIX = "appendix"
    CITATION = "citation"
    GENERAL_TEXT = "general_text"


@dataclass
class DocumentChunk:
    """Enhanced document chunk with comprehensive metadata."""
    content: str
    chunk_type: ChunkType
    metadata: Dict[str, Any] = field(default_factory=dict)
    start_position: int = 0
    end_position: int = 0
    hierarchy_level: int = 0
    parent_chunk_id: Optional[str] = None
    chunk_id: str = field(default_factory=lambda: str(datetime.now().timestamp()))
    legal_references: List[str] = field(default_factory=list)
    word_count: int = 0
    confidence_score: float = 1.0


class HungarianLegalChunker:
    """Enhanced chunker for Hungarian legal documents."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._initialize_patterns()
        
    def _initialize_patterns(self):
        """Initialize Hungarian legal document patterns."""
        # Hungarian legal structure patterns
        self.patterns = {
            # Titles and chapters
            'title': [
                r'^([IVXLCDM]+\.?\s*[Cc]ím\b)',  # I. Cím, II. cím
                r'^([IVXLCDM]+\.?\s*[Ff]ejezet\b)',  # I. Fejezet
                r'^([IVXLCDM]+\.?\s*[Rr]ész\b)',  # I. Rész
            ],
            
            # Sections (paragraphs in Hungarian law)
            'section': [
                r'^(\d+\.?\s*§)',  # 1. §, 15. §
                r'^(\(\d+\)\s*§)',  # (1) §
            ],
            
            # Articles and points
            'article': [
                r'^(\d+\.?\s*[Cc]ikk)',  # 1. cikk, 15. cikk
                r'^(\d+\.?\s*[Aa]rt)',   # 1. art
            ],
            
            # Subsections and points
            'paragraph': [
                r'^(\(\d+\)(?!\s*§))',  # (1), (2) - but not § 
                r'^(\d+\.\s+)',         # 1. 2. 3.
            ],
            
            # Lettered points
            'point': [
                r'^([a-z]\))',          # a) b) c)
                r'^([a-z]\.)',          # a. b. c.
            ],
            
            # Sub-points
            'subpoint': [
                r'^([a-z]{2}\))',       # aa) bb) cc)
                r'^(\d+\.\d+\.)',       # 1.1. 1.2.
            ],
            
            # Appendixes
            'appendix': [
                r'^([Mm]elléklet)',
                r'^(\d+\.?\s*[Mm]elléklet)',
                r'^([IVXLCDM]+\.?\s*[Mm]elléklet)',
            ]
        }
        
        # Legal reference patterns
        self.legal_ref_patterns = [
            r'\d{4}\.\s*évi\s*[IVXLCDM]+\.\s*törvény',  # Hungarian laws
            r'\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*Korm\.\s*rendelet',  # Gov. decrees
            r'\d+/\d{4}\.\s*\([IVXLCDM]+\.\s*\d+\.\)\s*[A-Z]+\s*rendelet',  # Ministry decrees
            r'BH\s*\d{4}\.\s*\d+',  # Court decisions
            r'EBH\s*\d{4}\.\s*[A-Z]\.\d+',  # Supreme Court decisions
        ]
    
    def chunk_document(self, text: str, document_type: str = "law") -> List[DocumentChunk]:
        """
        Enhanced chunking that respects Hungarian legal document structure.
        
        Args:
            text: Document text to chunk
            document_type: Type of document (law, decree, decision, etc.)
            
        Returns:
            List of structured chunks with metadata
        """
        self.logger.info(f"Starting chunking process for {document_type}")
        
        chunks = []
        lines = text.split('\n')
        current_hierarchy = []
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
                
            # Detect chunk type and hierarchy
            chunk_type, hierarchy_level, match = self._detect_chunk_type(line)
            
            # Extract content
            content = self._extract_content(line, chunk_type, match)
            if not content:
                continue
                
            # Create chunk
            chunk = self._create_chunk(
                content=content,
                chunk_type=chunk_type,
                hierarchy_level=hierarchy_level,
                line_number=i + 1,
                current_hierarchy=current_hierarchy
            )
            
            # Extract legal references
            chunk.legal_references = self._extract_legal_references(content)
            
            # Update hierarchy tracking
            self._update_hierarchy(current_hierarchy, chunk_type, hierarchy_level, chunk.chunk_id)
            
            chunks.append(chunk)
        
        # Post-process chunks
        chunks = self._post_process_chunks(chunks)
        
        self.logger.info(f"Chunking completed: {len(chunks)} chunks created")
        return chunks
    
    def _detect_chunk_type(self, line: str) -> Tuple[ChunkType, int, Optional[str]]:
        """Detect the type and hierarchy level of a text line."""
        line_stripped = line.strip()
        
        # Check each pattern type
        for chunk_type_name, patterns in self.patterns.items():
            for pattern in patterns:
                match = re.match(pattern, line_stripped, re.IGNORECASE)
                if match:
                    chunk_type = ChunkType(chunk_type_name)
                    hierarchy_level = self._calculate_hierarchy_level(chunk_type, match.group(1))
                    return chunk_type, hierarchy_level, match.group(1)
        
        # Default to general text
        return ChunkType.GENERAL_TEXT, 0, None
    
    def _calculate_hierarchy_level(self, chunk_type: ChunkType, match_text: str) -> int:
        """Calculate hierarchy level based on chunk type and content."""
        base_levels = {
            ChunkType.TITLE: 1,
            ChunkType.CHAPTER: 1,
            ChunkType.SECTION: 2,
            ChunkType.ARTICLE: 2,
            ChunkType.PARAGRAPH: 3,
            ChunkType.POINT: 4,
            ChunkType.SUBPOINT: 5,
            ChunkType.APPENDIX: 1,
            ChunkType.GENERAL_TEXT: 6
        }
        
        return base_levels.get(chunk_type, 0)
    
    def _extract_content(self, line: str, chunk_type: ChunkType, match: Optional[str]) -> str:
        """Extract clean content from a line."""
        if match:
            # Remove the structural marker and clean up
            content = line.replace(match, '', 1).strip()
            # Keep the marker for structural chunks
            if chunk_type in [ChunkType.SECTION, ChunkType.ARTICLE, ChunkType.PARAGRAPH]:
                content = f"{match} {content}"
        else:
            content = line.strip()
            
        return content
    
    def _create_chunk(self, content: str, chunk_type: ChunkType, hierarchy_level: int, 
                     line_number: int, current_hierarchy: List) -> DocumentChunk:
        """Create a document chunk with comprehensive metadata."""
        
        word_count = len(content.split())
        
        # Determine parent chunk
        parent_id = None
        if current_hierarchy and hierarchy_level > 0:
            # Find the most recent chunk at a higher hierarchy level
            for level, chunk_id in reversed(current_hierarchy):
                if level < hierarchy_level:
                    parent_id = chunk_id
                    break
        
        # Calculate confidence score based on pattern matching
        confidence = self._calculate_confidence_score(content, chunk_type)
        
        chunk = DocumentChunk(
            content=content,
            chunk_type=chunk_type,
            hierarchy_level=hierarchy_level,
            parent_chunk_id=parent_id,
            word_count=word_count,
            confidence_score=confidence,
            metadata={
                'line_number': line_number,
                'created_at': datetime.now().isoformat(),
                'language': 'hungarian',
                'document_structure': 'hungarian_legal'
            }
        )
        
        return chunk
    
    def _calculate_confidence_score(self, content: str, chunk_type: ChunkType) -> float:
        """Calculate confidence score for chunk classification."""
        base_confidence = 0.8
        
        # Boost confidence for well-structured content
        if chunk_type == ChunkType.SECTION and '§' in content:
            base_confidence += 0.15
        elif chunk_type == ChunkType.ARTICLE and 'cikk' in content.lower():
            base_confidence += 0.15
        elif chunk_type == ChunkType.PARAGRAPH and re.match(r'^\(\d+\)', content):
            base_confidence += 0.1
            
        # Penalize very short or very long chunks
        word_count = len(content.split())
        if word_count < 3:
            base_confidence -= 0.2
        elif word_count > 200:
            base_confidence -= 0.1
            
        return min(1.0, max(0.0, base_confidence))
    
    def _extract_legal_references(self, content: str) -> List[str]:
        """Extract legal references from content."""
        references = []
        
        for pattern in self.legal_ref_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            references.extend(matches)
            
        return list(set(references))  # Remove duplicates
    
    def _update_hierarchy(self, current_hierarchy: List, chunk_type: ChunkType, 
                         hierarchy_level: int, chunk_id: str):
        """Update the current hierarchy stack."""
        # Remove chunks at same or lower hierarchy levels
        current_hierarchy[:] = [(level, cid) for level, cid in current_hierarchy 
                               if level < hierarchy_level]
        
        # Add current chunk to hierarchy
        current_hierarchy.append((hierarchy_level, chunk_id))
    
    def _post_process_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        """Post-process chunks for optimization and validation."""
        processed_chunks = []
        
        for i, chunk in enumerate(chunks):
            # Set positions
            if i == 0:
                chunk.start_position = 0
            else:
                chunk.start_position = chunks[i-1].end_position + 1
            
            chunk.end_position = chunk.start_position + len(chunk.content)
            
            # Merge very small general text chunks with previous chunks
            if (chunk.chunk_type == ChunkType.GENERAL_TEXT and 
                chunk.word_count < 5 and 
                processed_chunks and 
                processed_chunks[-1].chunk_type != ChunkType.TITLE):
                
                # Merge with previous chunk
                prev_chunk = processed_chunks[-1]
                prev_chunk.content += " " + chunk.content
                prev_chunk.word_count += chunk.word_count
                prev_chunk.end_position = chunk.end_position
                prev_chunk.legal_references.extend(chunk.legal_references)
                continue
            
            processed_chunks.append(chunk)
        
        return processed_chunks
    
    def validate_chunks(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """Enhanced validation with detailed quality metrics."""
        if not chunks:
            return {"valid": False, "reason": "No chunks created"}
        
        validation_result = {
            "valid": True,
            "total_chunks": len(chunks),
            "chunk_types": {},
            "hierarchy_levels": set(),
            "quality_metrics": {},
            "issues": []
        }
        
        # Analyze chunk distribution
        for chunk in chunks:
            chunk_type = chunk.chunk_type.value
            validation_result["chunk_types"][chunk_type] = validation_result["chunk_types"].get(chunk_type, 0) + 1
            validation_result["hierarchy_levels"].add(chunk.hierarchy_level)
            
            # Check chunk quality
            if chunk.word_count < 3:
                validation_result["issues"].append(f"Very short chunk: {chunk.chunk_id}")
            elif chunk.word_count > 500:
                validation_result["issues"].append(f"Very long chunk: {chunk.chunk_id}")
            
            if chunk.confidence_score < 0.5:
                validation_result["issues"].append(f"Low confidence chunk: {chunk.chunk_id}")
        
        # Calculate quality metrics
        avg_words = sum(c.word_count for c in chunks) / len(chunks)
        avg_confidence = sum(c.confidence_score for c in chunks) / len(chunks)
        
        validation_result["quality_metrics"] = {
            "average_words_per_chunk": avg_words,
            "average_confidence": avg_confidence,
            "hierarchy_depth": max(validation_result["hierarchy_levels"]) if validation_result["hierarchy_levels"] else 0,
            "legal_references_found": sum(len(c.legal_references) for c in chunks)
        }
        
        # Determine overall validity
        if len(validation_result["issues"]) > len(chunks) * 0.3:  # More than 30% issues
            validation_result["valid"] = False
            validation_result["reason"] = "Too many quality issues detected"
        
        return validation_result
    
    def get_chunk_summary(self, chunks: List[DocumentChunk]) -> Dict[str, Any]:
        """Generate a comprehensive summary of chunks."""
        if not chunks:
            return {"error": "No chunks to summarize"}
        
        summary = {
            "total_chunks": len(chunks),
            "total_words": sum(c.word_count for c in chunks),
            "chunk_distribution": {},
            "hierarchy_structure": {},
            "legal_references": [],
            "processing_timestamp": datetime.now().isoformat()
        }
        
        # Chunk type distribution
        for chunk in chunks:
            chunk_type = chunk.chunk_type.value
            summary["chunk_distribution"][chunk_type] = summary["chunk_distribution"].get(chunk_type, 0) + 1
            
            # Collect unique legal references
            summary["legal_references"].extend(chunk.legal_references)
        
        # Remove duplicate references
        summary["legal_references"] = list(set(summary["legal_references"]))
        
        # Build hierarchy structure
        for chunk in chunks:
            level = chunk.hierarchy_level
            if level not in summary["hierarchy_structure"]:
                summary["hierarchy_structure"][level] = []
            summary["hierarchy_structure"][level].append({
                "id": chunk.chunk_id,
                "type": chunk.chunk_type.value,
                "content_preview": chunk.content[:100] + "..." if len(chunk.content) > 100 else chunk.content
            })
        
        return summary


# Legacy class for backward compatibility
class LegalDocumentChunker(HungarianLegalChunker):
    """Legacy chunker class for backward compatibility."""
    
    def __init__(self):
        super().__init__()
        self.logger.warning("LegalDocumentChunker is deprecated. Use HungarianLegalChunker instead.")


if __name__ == "__main__":
    # Test the enhanced chunker
    logging.basicConfig(level=logging.INFO)
    chunker = HungarianLegalChunker()
    
    test_text = """
    I. Cím
    Általános rendelkezések
    
    1. § (1) Ez a törvény a villamos energia termelését, átvitelét, elosztását és kereskedelmét szabályozza.
    (2) A törvény hatálya kiterjed az energiahatékonyságra is.
    
    2. § A törvény alkalmazásában:
    a) villamos energia: elektromos áram formájában előállított energia,
    b) szolgáltató: az energiaszolgáltatást végző társaság.
    
    II. Cím
    Engedélyezési eljárás
    
    3. § (1) Energetikai tevékenység engedély nélkül nem végezhető.
    """
    
    chunks = chunker.chunk_document(test_text)
    validation = chunker.validate_chunks(chunks)
    summary = chunker.get_chunk_summary(chunks)
    
    print(f"Created {len(chunks)} chunks")
    print(f"Validation: {validation['valid']}")
    print(f"Summary: {summary}")
