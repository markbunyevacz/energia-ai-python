-- Create the legal_document_embeddings table
CREATE TABLE legal_document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL
);

-- Create the match_legal_documents function
CREATE OR REPLACE FUNCTION match_legal_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    legal_document_embeddings.id,
    legal_document_embeddings.document_id,
    legal_document_embeddings.content,
    1 - (legal_document_embeddings.embedding <=> query_embedding) AS similarity
  FROM legal_document_embeddings
  WHERE 1 - (legal_document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$; 