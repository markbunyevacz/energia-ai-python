import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export interface VectorStoreService {
  similaritySearch(queryEmbedding: number[], matchThreshold: number, matchCount: number): Promise<{ data: any[] | null; error: PostgrestError | null }>;
}

class SupabaseVectorStore implements VectorStoreService {
  async similaritySearch(queryEmbedding: number[], matchThreshold: number, matchCount: number) {
    const { data, error } = await supabase.rpc('match_legal_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });
    return { data, error };
  }
}

export const vectorStoreService = new SupabaseVectorStore(); 