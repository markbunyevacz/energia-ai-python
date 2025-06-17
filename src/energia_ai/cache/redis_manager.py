"""
Redis connection and caching manager
"""
import asyncio
import json
import pickle
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import aioredis
from aioredis import Redis
import structlog
from ..config.settings import get_settings

logger = structlog.get_logger()

class RedisManager:
    """Async Redis manager for caching and session management"""
    
    def __init__(self):
        self.settings = get_settings()
        self.redis: Optional[Redis] = None
        
    async def initialize(self):
        """Initialize Redis connection"""
        try:
            # Create Redis connection
            self.redis = await aioredis.from_url(
                self.settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
            )
            
            # Test connection
            await self.redis.ping()
            
            logger.info("Redis connection initialized", redis_url=self.settings.redis_url)
            
        except Exception as e:
            logger.error("Failed to initialize Redis", error=str(e))
            raise
    
    async def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set a value in Redis with optional expiration"""
        try:
            if not self.redis:
                await self.initialize()
            
            # Serialize complex objects
            if isinstance(value, (dict, list)):
                value = json.dumps(value, default=str)
            elif not isinstance(value, (str, int, float, bool)):
                value = pickle.dumps(value)
            
            result = await self.redis.set(key, value, ex=expire)
            
            logger.debug("Redis set operation", key=key, expire=expire, success=bool(result))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis set failed", key=key, error=str(e))
            return False
    
    async def get(self, key: str, deserialize_json: bool = True) -> Optional[Any]:
        """Get a value from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            value = await self.redis.get(key)
            
            if value is None:
                return None
            
            # Try to deserialize JSON
            if deserialize_json and isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    # Try pickle if JSON fails
                    try:
                        return pickle.loads(value.encode())
                    except (pickle.PickleError, TypeError):
                        pass
            
            return value
            
        except Exception as e:
            logger.error("Redis get failed", key=key, error=str(e))
            return None
    
    async def delete(self, key: str) -> bool:
        """Delete a key from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.delete(key)
            
            logger.debug("Redis delete operation", key=key, success=bool(result))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis delete failed", key=key, error=str(e))
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if a key exists in Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.exists(key)
            return bool(result)
            
        except Exception as e:
            logger.error("Redis exists check failed", key=key, error=str(e))
            return False
    
    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration for a key"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.expire(key, seconds)
            return bool(result)
            
        except Exception as e:
            logger.error("Redis expire failed", key=key, error=str(e))
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a numeric value"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.incrby(key, amount)
            return result
            
        except Exception as e:
            logger.error("Redis increment failed", key=key, error=str(e))
            return None
    
    async def set_hash(self, key: str, mapping: Dict[str, Any], expire: Optional[int] = None) -> bool:
        """Set a hash in Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            # Serialize values
            serialized_mapping = {}
            for k, v in mapping.items():
                if isinstance(v, (dict, list)):
                    serialized_mapping[k] = json.dumps(v, default=str)
                else:
                    serialized_mapping[k] = str(v)
            
            result = await self.redis.hset(key, mapping=serialized_mapping)
            
            if expire:
                await self.redis.expire(key, expire)
            
            logger.debug("Redis hash set operation", key=key, fields=len(mapping))
            return bool(result)
            
        except Exception as e:
            logger.error("Redis hash set failed", key=key, error=str(e))
            return False
    
    async def get_hash(self, key: str) -> Optional[Dict[str, Any]]:
        """Get a hash from Redis"""
        try:
            if not self.redis:
                await self.initialize()
            
            result = await self.redis.hgetall(key)
            
            if not result:
                return None
            
            # Try to deserialize JSON values
            deserialized = {}
            for k, v in result.items():
                try:
                    deserialized[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    deserialized[k] = v
            
            return deserialized
            
        except Exception as e:
            logger.error("Redis hash get failed", key=key, error=str(e))
            return None
    
    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")

# Caching decorators and utilities
class CacheManager:
    """High-level caching utilities"""
    
    def __init__(self, redis_manager: RedisManager):
        self.redis = redis_manager
    
    def cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a cache key from prefix and arguments"""
        key_parts = [prefix]
        key_parts.extend(str(arg) for arg in args)
        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
        return ":".join(key_parts)
    
    async def cache_search_results(
        self, 
        query: str, 
        results: List[Dict[str, Any]], 
        expire: int = 3600
    ) -> bool:
        """Cache search results"""
        key = self.cache_key("search", query)
        return await self.redis.set(key, results, expire=expire)
    
    async def get_cached_search_results(self, query: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached search results"""
        key = self.cache_key("search", query)
        return await self.redis.get(key)
    
    async def cache_document_analysis(
        self, 
        document_id: str, 
        analysis: Dict[str, Any], 
        expire: int = 86400
    ) -> bool:
        """Cache document analysis results"""
        key = self.cache_key("analysis", document_id)
        return await self.redis.set(key, analysis, expire=expire)
    
    async def get_cached_document_analysis(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get cached document analysis"""
        key = self.cache_key("analysis", document_id)
        return await self.redis.get(key)
    
    async def invalidate_document_cache(self, document_id: str) -> bool:
        """Invalidate all cache entries for a document"""
        try:
            keys_to_delete = [
                self.cache_key("analysis", document_id),
                self.cache_key("summary", document_id),
                self.cache_key("keywords", document_id),
            ]
            
            for key in keys_to_delete:
                await self.redis.delete(key)
            
            return True
            
        except Exception as e:
            logger.error("Cache invalidation failed", document_id=document_id, error=str(e))
            return False

# Session management
class SessionManager:
    """User session management using Redis"""
    
    def __init__(self, redis_manager: RedisManager):
        self.redis = redis_manager
        self.session_prefix = "session"
        self.default_expire = 86400  # 24 hours
    
    def session_key(self, session_id: str) -> str:
        """Generate session key"""
        return f"{self.session_prefix}:{session_id}"
    
    async def create_session(self, session_id: str, user_data: Dict[str, Any]) -> bool:
        """Create a new session"""
        key = self.session_key(session_id)
        session_data = {
            "user_data": user_data,
            "created_at": datetime.utcnow().isoformat(),
            "last_accessed": datetime.utcnow().isoformat(),
        }
        
        return await self.redis.set_hash(key, session_data, expire=self.default_expire)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data"""
        key = self.session_key(session_id)
        session_data = await self.redis.get_hash(key)
        
        if session_data:
            # Update last accessed time
            session_data["last_accessed"] = datetime.utcnow().isoformat()
            await self.redis.set_hash(key, session_data, expire=self.default_expire)
        
        return session_data
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        key = self.session_key(session_id)
        existing_data = await self.redis.get_hash(key)
        
        if not existing_data:
            return False
        
        existing_data.update(updates)
        existing_data["last_accessed"] = datetime.utcnow().isoformat()
        
        return await self.redis.set_hash(key, existing_data, expire=self.default_expire)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session"""
        key = self.session_key(session_id)
        return await self.redis.delete(key)

# Global Redis manager instance
_redis_manager = None

async def get_redis_manager() -> RedisManager:
    """Get the global Redis manager instance"""
    global _redis_manager
    if _redis_manager is None:
        _redis_manager = RedisManager()
        await _redis_manager.initialize()
    return _redis_manager

async def get_cache_manager() -> CacheManager:
    """Get cache manager instance"""
    redis_manager = await get_redis_manager()
    return CacheManager(redis_manager)

async def get_session_manager() -> SessionManager:
    """Get session manager instance"""
    redis_manager = await get_redis_manager()
    return SessionManager(redis_manager)
