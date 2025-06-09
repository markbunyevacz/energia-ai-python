CREATE EXTENSION IF NOT EXISTS vector;

-- Create improved cross-domain similarity search function
CREATE OR REPLACE FUNCTION find_cross_domain_similar_documents(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10,
  exclude_domain_id text DEFAULT NULL
)
RETURNS TABLE (
  document_id uuid,
  title text,
  content text,
  document_type text,
  domain_id text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ld.id as document_id,
    ld.title,
    ld.content,
    ld.document_type::text,
    ld.domain_id,
    ld.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  FROM legal_documents ld
  JOIN document_embeddings de ON ld.id = de.document_id
  WHERE 
    1 - (de.embedding <=> query_embedding) > similarity_threshold
    AND (exclude_domain_id IS NULL OR ld.domain_id != exclude_domain_id)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION find_cross_domain_similar_documents TO authenticated;
GRANT EXECUTE ON FUNCTION find_cross_domain_similar_documents TO anon;

-- Add comment explaining the function
COMMENT ON FUNCTION find_cross_domain_similar_documents IS 
'Find semantically similar documents across different legal domains with domain exclusion support'; 