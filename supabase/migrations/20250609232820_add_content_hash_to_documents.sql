-- Add the content_hash column to the documents table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'content_hash'
    ) THEN
        ALTER TABLE documents ADD COLUMN content_hash TEXT;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash);
