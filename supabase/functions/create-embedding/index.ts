import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1'

serve(async (req) => {
  const { input } = await req.json()

  // Generate the embedding using a pre-trained model
  const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await pipe(input, { pooling: 'mean', normalize: true });
  const embedding = Array.from(output.data);

  return new Response(
    JSON.stringify({ embedding }),
    { headers: { "Content-Type": "application/json" } }
  )
}) 