
import { chunkCache } from '../chunkCache';
import { BatchProcessor } from '../batchProcessor';

class EmbeddingService {
  private embeddingBatchProcessor: BatchProcessor<string, number[]>;

  constructor() {
    this.embeddingBatchProcessor = new BatchProcessor(
      this.batchGenerateEmbeddings.bind(this),
      { batchSize: 10, maxWaitTime: 100 }
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `embedding:${text.substring(0, 100)}`;
    
    // Check cache first
    const cached = chunkCache.get(cacheKey);
    if (cached) {
      // console.log('Cache hit for embedding generation');
      return cached;
    }

    // Use batch processor for embedding generation
    const embedding = await this.embeddingBatchProcessor.add(text);

    // Cache the embedding for 1 hour
    chunkCache.set(cacheKey, embedding, 60 * 60 * 1000);

    return embedding;
  }

  private async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    // console.log(`Batch generating embeddings for ${texts.length} texts`);

    try {
      // Import AI config for proper API key management
      const { aiConfig } = await import('@/config/ai-config');
      const apiKey = aiConfig.getApiKey('openai');
      
      if (!apiKey) {
        // console.warn('No OpenAI API key found, returning empty embeddings');
        return texts.map(() => []);
      }

      // Call OpenAI embeddings API for batch processing
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small', // Updated to newer model
          input: texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      // console.error('Batch embedding generation failed:', error);
      // Return empty embeddings as fallback
      return texts.map(() => []);
    }
  }

  getQueueSize(): number {
    return this.embeddingBatchProcessor.getQueueSize();
  }

  isProcessing(): boolean {
    return this.embeddingBatchProcessor.isProcessing();
  }
}

export const embeddingService = new EmbeddingService();
