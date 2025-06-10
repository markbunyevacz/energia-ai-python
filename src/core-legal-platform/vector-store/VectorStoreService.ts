import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';
import embeddingService from '../embedding/EmbeddingService';
import type { Database } from '@/integrations/supabase/types';

type DocumentChunkInsert = Database['public']['Tables']['document_chunks']['Insert'];

export interface VectorStoreService {
  similaritySearch(queryEmbedding: number[], matchThreshold: number, matchCount: number): Promise<{ data: any[] | null; error: PostgrestError | null }>;
  addDocument(document: { id: string, content: string }): Promise<void>;
}

// Simple text splitter function
function splitText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    chunks.push(text.slice(i, end));
    i += chunkSize - overlap;
    if (end === text.length) break;
  }
  return chunks;
}

class SupabaseVectorStore implements VectorStoreService {
  async similaritySearch(queryEmbedding: number[], matchThreshold: number, matchCount: number) {
    const { data, error } = await supabase.rpc('match_legal_documents' as any, {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });
    return { data: data as any[], error };
  }

  async addDocument(document: { id: string, content: string }): Promise<void> {
    if (!document.content) {
      console.warn(`Document ${document.id} has no content to embed.`);
      return;
    }

    const chunks = splitText(document.content);
    
    for (const [index, chunkText] of chunks.entries()) {
      try {
        const embedding = await embeddingService.getEmbedding(chunkText);
        
        const chunkData: DocumentChunkInsert = {
          document_id: document.id,
          chunk_text: chunkText,
          embedding: JSON.stringify(embedding),
          chunk_index: index,
        };

        const { error } = await supabase.from('document_chunks').insert(chunkData);

        if (error) {
          console.error(`Failed to insert chunk ${index} for document ${document.id}:`, error);
        }
      } catch (error) {
        console.error(`Error processing chunk ${index} for document ${document.id}:`, error);
      }
    }
  }
}

export const vectorStoreService = new SupabaseVectorStore(); 