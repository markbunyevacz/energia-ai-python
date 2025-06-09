import { supabase } from '@/integrations/supabase/client';

export interface Document {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        [key: string]: any;
        domain?: string;
    };
    title?: string;
    documentType?: string;
    domainId?: string;
}

export class EmbeddingService {
  // REAL embedding service using Hugging Face
  async getEmbedding(content: string): Promise<number[]> {
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` },
      body: JSON.stringify({ inputs: content })
    });
    
    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Efficient similarity search
  async findSimilar(embedding: number[], threshold: number, limit: number): Promise<number[]> {
    const { data, error } = await supabase.rpc('find_similar_documents', {
      query_embedding: embedding,
      similarity_threshold: threshold,
      max_count: limit
    });
    
    if (error) {
      console.error('Error in findSimilar:', error);
      return [];
    }
    
    return data?.map((item: any) => item.document_id) || [];
  }

  // REAL implementation with database-level filtering - NO MORE MOCKS
  async findSimilarDocuments(
    embedding: number[],
    threshold: number,
    limit: number,
    options?: { excludeDomainId?: string }
  ): Promise<Document[]> {
    try {
      // Use the new cross-domain RPC function for better performance
      const { data, error } = await supabase.rpc('find_cross_domain_similar_documents', {
        query_embedding: embedding,
        similarity_threshold: threshold,
        match_count: limit,
        exclude_domain_id: options?.excludeDomainId || null
      });
      
      if (error) {
        console.error('Error finding cross-domain similar documents:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return (data || []).map((item: any) => ({
        id: item.document_id,
        title: item.title || 'Untitled',
        content: item.content || '',
        documentType: item.document_type,
        domainId: item.domain_id,
        metadata: {
          ...item.metadata,
          domain: item.domain_id,
          similarity: item.similarity
        },
        embedding: [] // Not returned by RPC for performance
      }));
    } catch (error) {
      console.error('Critical error in findSimilarDocuments:', error);
      throw error;
    }
  }
}

export default new EmbeddingService(); 