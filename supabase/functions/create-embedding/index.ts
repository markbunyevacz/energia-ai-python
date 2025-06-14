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