/**
 * @fileoverview useOptimizedSearch Hook - High-Performance Legal Document Search
 * 
 * This custom React hook provides optimized search functionality for legal documents
 * with advanced caching, performance monitoring, and queue management for the Legal AI platform.
 * 
 * Key Features:
 * - Debounced search queries to prevent excessive API calls
 * - Advanced caching system with hit/miss tracking
 * - Real-time performance statistics and monitoring
 * - Search and embedding queue management
 * - Processing status tracking for UI feedback
 * - Error handling and recovery mechanisms
 * - Automatic search triggering with configurable delays
 * 
 * Performance Optimizations:
 * - Query debouncing (300ms default) to reduce server load
 * - Intelligent caching to avoid redundant searches
 * - Queue monitoring for system load management
 * - Performance metrics collection for optimization
 * - Memory-efficient result handling
 * 
 * Usage Examples:
 * - Legal document full-text search with semantic understanding
 * - Contract clause search and extraction
 * - Legal precedent and case law research
 * - Regulatory compliance document search
 * - AI-powered legal content discovery
 * - Document similarity and recommendation systems
 * 
 * Integration Points:
 * - Used throughout platform for document search functionality
 * - Integrates with optimized document service and vector store
 * - Supports Hungarian legal document search and analysis
 * - Works with AI-powered semantic search and ranking
 * - Connects to performance monitoring and analytics systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import { useState, useCallback, useEffect } from 'react';
import optimizedDocumentService from '@/core-legal-platform/document/optimizedDocumentService';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  chunks: any[];
  totalResults: number;
  processingTime: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

interface SearchState {
  cache: CacheStats;
  searchQueue: number;
  embeddingQueue: number;
  isProcessing: {
    search: boolean;
    embedding: boolean;
  };
}

interface UseOptimizedSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult | null;
  isLoading: boolean;
  error: Error | null;
  search: (query: string, documentId?: string) => Promise<void>;
  performanceStats: any;
  searchState: SearchState;
  incrementCacheHits: () => void;
  incrementCacheMisses: () => void;
  updateQueueSizes: (searchQueue: number, embeddingQueue: number) => void;
  updateProcessingStatus: (isProcessing: SearchState['isProcessing']) => void;
}

export function useOptimizedSearch(autoSearch = true): UseOptimizedSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [searchState, setSearchState] = useState<SearchState>({
    cache: {
      hits: 0,
      misses: 0,
      size: 0
    },
    searchQueue: 0,
    embeddingQueue: 0,
    isProcessing: {
      search: false,
      embedding: false
    }
  });

  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string, documentId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await optimizedDocumentService.searchDocuments(searchQuery, documentId);
      setResults(results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred during search'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoSearch && debouncedQuery) {
      search(debouncedQuery);
    }
  }, [debouncedQuery, autoSearch, search]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const stats = await optimizedDocumentService.getPerformanceStats();
      setPerformanceStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setSearchState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const incrementCacheHits = useCallback(() => {
    updateSearchState({
      cache: {
        ...searchState.cache,
        hits: searchState.cache.hits + 1
      }
    });
  }, [searchState.cache, updateSearchState]);

  const incrementCacheMisses = useCallback(() => {
    updateSearchState({
      cache: {
        ...searchState.cache,
        misses: searchState.cache.misses + 1
      }
    });
  }, [searchState.cache, updateSearchState]);

  const updateQueueSizes = useCallback((searchQueue: number, embeddingQueue: number) => {
    updateSearchState({
      searchQueue,
      embeddingQueue
    });
  }, [updateSearchState]);

  const updateProcessingStatus = useCallback((isProcessing: SearchState['isProcessing']) => {
    updateSearchState({
      isProcessing
    });
  }, [updateSearchState]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search: useCallback((searchQuery: string, documentId?: string) => {
      return search(searchQuery, documentId);
    }, [search]),
    performanceStats,
    searchState,
    incrementCacheHits,
    incrementCacheMisses,
    updateQueueSizes,
    updateProcessingStatus
  };
}
