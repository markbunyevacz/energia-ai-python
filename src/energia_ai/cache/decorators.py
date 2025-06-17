"""
Caching decorators for FastAPI endpoints
"""
import asyncio
import functools
import hashlib
import json
from typing import Any, Callable, Optional
from fastapi import Request, Response
import structlog
from .redis_manager import get_cache_manager

logger = structlog.get_logger()

def cache_response(expire: int = 3600, key_prefix: str = "endpoint"):
    """
    Decorator to cache FastAPI endpoint responses
    
    Args:
        expire: Cache expiration time in seconds
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request object
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # No request object found, execute without caching
                return await func(*args, **kwargs)
            
            # Generate cache key
            cache_key_data = {
                "path": str(request.url.path),
                "query": str(request.url.query),
                "method": request.method,
            }
            
            cache_key_str = json.dumps(cache_key_data, sort_keys=True)
            cache_key_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
            cache_key = f"{key_prefix}:{cache_key_hash}"
            
            try:
                # Try to get cached response
                cache_manager = await get_cache_manager()
                cached_response = await cache_manager.redis.get(cache_key)
                
                if cached_response:
                    logger.debug("Cache hit", cache_key=cache_key)
                    return json.loads(cached_response)
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                
                # Cache the result
                await cache_manager.redis.set(
                    cache_key, 
                    json.dumps(result, default=str), 
                    expire=expire
                )
                
                logger.debug("Cache miss - result cached", cache_key=cache_key)
                return result
                
            except Exception as e:
                logger.error("Caching error - executing without cache", error=str(e))
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern: str):
    """
    Decorator to invalidate cache entries matching a pattern after function execution
    
    Args:
        pattern: Redis pattern to match keys for deletion
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            try:
                cache_manager = await get_cache_manager()
                
                # Get keys matching pattern
                keys = await cache_manager.redis.redis.keys(pattern)
                
                if keys:
                    # Delete matching keys
                    await cache_manager.redis.redis.delete(*keys)
                    logger.info("Cache invalidated", pattern=pattern, keys_deleted=len(keys))
                
            except Exception as e:
                logger.error("Cache invalidation failed", pattern=pattern, error=str(e))
            
            return result
        
        return wrapper
    return decorator
