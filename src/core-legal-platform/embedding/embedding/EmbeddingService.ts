import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/logger';

export class EmbeddingService {
  private logger = new Logger('EmbeddingService');

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { data, error } = await supabase.functions.invoke('create-embedding', {
        body: { input: text },
      });

      if (error) throw error;
      return data.embedding;
    } catch (err) {
      this.logger.error('Failed to generate embedding:', err);
      throw new Error(`Failed to generate embedding: ${err.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // This could be optimized to make a single call to the edge function
    // if the function is updated to handle batches.
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  async findSimilar(
    embedding: number[], 
    threshold: number, 
    limit: number, 
    excludeDomainId?: string
  ): Promise<Array<{ id: string; similarity: number; content: string }>> {
    try {
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: limit,
        exclude_domain_id: excludeDomainId
      });

      if (error) throw error;
      return data;
    } catch (err) {
      this.logger.error('Failed to find similar documents:', err);
      throw new Error(`Failed to find similar documents: ${err.message}`);
    }
  }
} 