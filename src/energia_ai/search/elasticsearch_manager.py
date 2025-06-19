"""
Elasticsearch manager for lexical search with Hungarian language support
"""
import asyncio
from typing import List, Dict, Any, Optional, Union
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class ElasticsearchManager:
    """Elasticsearch manager for lexical search"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncElasticsearch] = None
        self.index_name = "legal_documents"
        
    async def initialize(self):
        """Initialize Elasticsearch connection"""
        try:
            # Create Elasticsearch client
            self.client = AsyncElasticsearch(
                [{"host": self.settings.elasticsearch_host, "port": self.settings.elasticsearch_port}],
                timeout=30,
                max_retries=3,
                retry_on_timeout=True,
            )
            
            # Test connection
            info = await self.client.info()
            
            # Create index if it doesn't exist
            await self.create_index()
            
            logger.info("Elasticsearch connection initialized", 
                       host=self.settings.elasticsearch_host, 
                       port=self.settings.elasticsearch_port,
                       version=info["version"]["number"])
            
        except Exception as e:
            logger.error("Failed to initialize Elasticsearch", error=str(e))
            raise
    
    async def create_index(self):
        """Create the legal documents index with Hungarian analyzer"""
        try:
            # Check if index exists
            if await self.client.indices.exists(index=self.index_name):
                logger.info("Index already exists", index=self.index_name)
                return
            
            # Define Hungarian language analyzer
            index_settings = {
                "settings": {
                    "number_of_shards": 2,
                    "number_of_replicas": 1,
                    "analysis": {
                        "analyzer": {
                            "hungarian_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "hungarian_stop",
                                    "hungarian_stemmer",
                                    "asciifolding"
                                ]
                            },
                            "hungarian_search_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "hungarian_stop",
                                    "asciifolding"
                                ]
                            }
                        },
                        "filter": {
                            "hungarian_stop": {
                                "type": "stop",
                                "stopwords": [
                                    "a", "az", "és", "vagy", "de", "hogy", "egy", "ez", "az",
                                    "van", "volt", "lesz", "lehet", "kell", "csak", "még",
                                    "már", "nem", "igen", "igen", "is", "el", "fel", "le",
                                    "ki", "be", "meg", "át", "rá", "össze", "szét"
                                ]
                            },
                            "hungarian_stemmer": {
                                "type": "stemmer",
                                "language": "hungarian"
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "title": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer",
                            "fields": {
                                "keyword": {
                                    "type": "keyword"
                                },
                                "suggest": {
                                    "type": "completion"
                                }
                            }
                        },
                        "content": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer"
                        },
                        "extracted_text": {
                            "type": "text",
                            "analyzer": "hungarian_analyzer",
                            "search_analyzer": "hungarian_search_analyzer"
                        },
                        "document_type": {
                            "type": "keyword"
                        },
                        "legal_reference": {
                            "type": "keyword",
                            "fields": {
                                "text": {
                                    "type": "text",
                                    "analyzer": "hungarian_analyzer"
                                }
                            }
                        },
                        "publication_date": {
                            "type": "date",
                            "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                        },
                        "effective_date": {
                            "type": "date",
                            "format": "yyyy-MM-dd||yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
                        },
                        "source_url": {
                            "type": "keyword",
                            "index": False
                        },
                        "keywords": {
                            "type": "keyword"
                        },
                        "content_hash": {
                            "type": "keyword"
                        },
                        "created_at": {
                            "type": "date"
                        },
                        "updated_at": {
                            "type": "date"
                        }
                    }
                }
            }
            
            # Create index
            await self.client.indices.create(
                index=self.index_name,
                body=index_settings
            )
            
            logger.info("Elasticsearch index created successfully", index=self.index_name)
            
        except Exception as e:
            logger.error("Failed to create Elasticsearch index", error=str(e))
            raise
    
    async def index_document(self, document_id: str, document: Dict[str, Any]) -> bool:
        """Index a single document"""
        try:
            if not self.client:
                await self.initialize()
            
            # Index document
            response = await self.client.index(
                index=self.index_name,
                id=document_id,
                body=document
            )
            
            success = response["result"] in ["created", "updated"]
            
            logger.info("Document indexed", 
                       document_id=document_id, 
                       result=response["result"])
            
            return success
            
        except Exception as e:
            logger.error("Failed to index document", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def batch_index_documents(self, documents: List[Dict[str, Any]]) -> bool:
        """Batch index multiple documents"""
        try:
            if not self.client:
                await self.initialize()
            
            # Prepare documents for bulk indexing
            actions = []
            for doc in documents:
                action = {
                    "_index": self.index_name,
                    "_id": doc["id"],
                    "_source": {k: v for k, v in doc.items() if k != "id"}
                }
                actions.append(action)
            
            # Bulk index
            success_count, failed_items = await async_bulk(
                self.client,
                actions,
                chunk_size=100,
                max_chunk_bytes=10485760,  # 10MB
            )
            
            logger.info("Batch indexing completed", 
                       total_documents=len(documents),
                       successful=success_count,
                       failed=len(failed_items) if failed_items else 0)
            
            return len(failed_items) == 0 if failed_items else True
            
        except Exception as e:
            logger.error("Batch indexing failed", 
                        count=len(documents), 
                        error=str(e))
            return False
    
    async def search_documents(
        self,
        query: str,
        document_type: Optional[str] = None,
        date_range: Optional[Dict[str, str]] = None,
        keywords: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search documents using Elasticsearch"""
        try:
            if not self.client:
                await self.initialize()
            
            # Build search query
            search_body = {
                "from": offset,
                "size": limit,
                "query": {
                    "bool": {
                        "must": [],
                        "filter": []
                    }
                },
                "highlight": {
                    "fields": {
                        "title": {"fragment_size": 150, "number_of_fragments": 1},
                        "content": {"fragment_size": 150, "number_of_fragments": 3},
                        "extracted_text": {"fragment_size": 150, "number_of_fragments": 3}
                    }
                },
                "sort": [
                    {"_score": {"order": "desc"}},
                    {"publication_date": {"order": "desc"}}
                ]
            }
            
            # Add text search
            if query:
                search_body["query"]["bool"]["must"].append({
                    "multi_match": {
                        "query": query,
                        "fields": [
                            "title^3",
                            "content^2",
                            "extracted_text^2",
                            "legal_reference^2"
                        ],
                        "type": "best_fields",
                        "fuzziness": "AUTO"
                    }
                })
            else:
                search_body["query"]["bool"]["must"].append({"match_all": {}})
            
            # Add filters
            if document_type:
                search_body["query"]["bool"]["filter"].append({
                    "term": {"document_type": document_type}
                })
            
            if date_range:
                date_filter = {"range": {"publication_date": {}}}
                if date_range.get("start"):
                    date_filter["range"]["publication_date"]["gte"] = date_range["start"]
                if date_range.get("end"):
                    date_filter["range"]["publication_date"]["lte"] = date_range["end"]
                search_body["query"]["bool"]["filter"].append(date_filter)
            
            if keywords:
                search_body["query"]["bool"]["filter"].append({
                    "terms": {"keywords": keywords}
                })
            
            # Execute search
            response = await self.client.search(
                index=self.index_name,
                body=search_body
            )
            
            # Format results
            results = {
                "total": response["hits"]["total"]["value"],
                "documents": [],
                "aggregations": response.get("aggregations", {})
            }
            
            for hit in response["hits"]["hits"]:
                doc = {
                    "id": hit["_id"],
                    "score": hit["_score"],
                    "source": hit["_source"],
                    "highlights": hit.get("highlight", {})
                }
                results["documents"].append(doc)
            
            logger.info("Search completed", 
                       query=query,
                       total_results=results["total"],
                       returned_results=len(results["documents"]))
            
            return results
            
        except Exception as e:
            logger.error("Search failed", query=query, error=str(e))
            return {"total": 0, "documents": [], "aggregations": {}}
    
    async def suggest_completions(self, text: str, size: int = 5) -> List[str]:
        """Get search suggestions/completions"""
        try:
            if not self.client:
                await self.initialize()
            
            suggest_body = {
                "suggest": {
                    "title_suggest": {
                        "prefix": text,
                        "completion": {
                            "field": "title.suggest",
                            "size": size
                        }
                    }
                }
            }
            
            response = await self.client.search(
                index=self.index_name,
                body=suggest_body
            )
            
            suggestions = []
            for suggestion in response["suggest"]["title_suggest"][0]["options"]:
                suggestions.append(suggestion["text"])
            
            return suggestions
            
        except Exception as e:
            logger.error("Suggestion failed", text=text, error=str(e))
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete a document from the search index"""
        try:
            if not self.client:
                await self.initialize()
            
            response = await self.client.delete(
                index=self.index_name,
                id=document_id
            )
            
            success = response["result"] == "deleted"
            
            logger.info("Document deleted from search index", 
                       document_id=document_id, 
                       success=success)
            
            return success
            
        except Exception as e:
            logger.error("Failed to delete document from search index", 
                        document_id=document_id, 
                        error=str(e))
            return False
    
    async def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        try:
            if not self.client:
                await self.initialize()
            
            stats = await self.client.indices.stats(index=self.index_name)
            
            return {
                "document_count": stats["indices"][self.index_name]["total"]["docs"]["count"],
                "index_size": stats["indices"][self.index_name]["total"]["store"]["size_in_bytes"],
                "search_time": stats["indices"][self.index_name]["total"]["search"]["time_in_millis"],
                "search_count": stats["indices"][self.index_name]["total"]["search"]["query_total"],
                "indexing_time": stats["indices"][self.index_name]["total"]["indexing"]["time_in_millis"],
                "indexing_count": stats["indices"][self.index_name]["total"]["indexing"]["index_total"],
            }
            
        except Exception as e:
            logger.error("Failed to get index stats", error=str(e))
            return {}
    
    async def close(self):
        """Close Elasticsearch connection"""
        if self.client:
            await self.client.close()
            logger.info("Elasticsearch connection closed")

# Global Elasticsearch manager instance
_elasticsearch_manager = None

async def get_elasticsearch_manager() -> ElasticsearchManager:
    """Get the global Elasticsearch manager instance"""
    global _elasticsearch_manager
    if _elasticsearch_manager is None:
        _elasticsearch_manager = ElasticsearchManager()
        await _elasticsearch_manager.initialize()
    return _elasticsearch_manager
