/**
 * @fileoverview Create Embedding Supabase Edge Function - Text Vectorization Service
 * @description Serverless function that generates vector embeddings from text input for semantic
 * search and similarity matching. Currently implements a deterministic embedding algorithm
 * for development and testing purposes.
 * 
 * CORE FUNCTIONALITY:
 * - Text-to-vector conversion for semantic search
 * - Deterministic embedding generation for consistent results
 * - 384-dimensional vector output (standard embedding size)
 * - Input validation and error handling
 * - RESTful API interface for easy integration
 * 
 * EMBEDDING ALGORITHM:
 * - Hash-based deterministic generation
 * - Text content analysis for consistent vectors
 * - Normalized output values [0, 1] range
 * - 384-dimensional vector space
 * - Pseudo-random distribution based on text content
 * 
 * CURRENT IMPLEMENTATION:
 * - Development/testing algorithm (not production ML model)
 * - Deterministic results for same input text
 * - Fast generation without external API calls
 * - Suitable for proof-of-concept and testing
 * 
 * PRODUCTION CONSIDERATIONS:
 * - Replace with OpenAI embeddings API for production
 * - Consider Sentence Transformers for local deployment
 * - Implement caching for frequently embedded texts
 * - Add support for different embedding dimensions
 * 
 * API INTERFACE:
 * - POST request with JSON body: { "input": "text to embed" }
 * - Response: { "embedding": [number array] }
 * - Error responses with appropriate HTTP status codes
 * 
 * INPUT VALIDATION:
 * - Requires non-empty string input
 * - Type checking for string input
 * - Error handling for malformed requests
 * 
 * INTEGRATION POINTS:
 * - Vector Store Service for embedding storage
 * - Semantic search functionality
 * - Document similarity matching
 * - Legal document clustering
 * 
 * USAGE SCENARIOS:
 * - Document similarity search
 * - Legal text clustering
 * - Semantic query matching
 * - Content recommendation systems
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - Fast execution (no external API calls)
 * - Consistent response times
 * - Low memory footprint
 * - Scalable for high-volume requests
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 * @todo Replace with production ML embedding model
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  try {
    const { input } = await req.json()
    
    if (!input || typeof input !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: expected a non-empty string' }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Simple deterministic embedding generation based on text content
    // This creates a 384-dimensional vector (common embedding size)
    const embedding = generateSimpleEmbedding(input);

    return new Response(
      JSON.stringify({ embedding }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Error in create-embedding function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

function generateSimpleEmbedding(text: string): number[] {
  // Create a deterministic embedding based on text content
  // This is a simplified approach for development/testing
  const embedding = new Array(384);
  
  // Use text content to generate deterministic values
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate embedding values based on hash and position
  for (let i = 0; i < 384; i++) {
    const seed = hash + i;
    // Use a simple pseudo-random function to generate normalized values
    const value = Math.sin(seed) * 0.5 + 0.5; // Normalize to [0, 1]
    embedding[i] = value;
  }
  
  return embedding;
} 
