-- Create a table for legal documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    publication_date DATE,
    document_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a table for citation edges to build the graph
CREATE TABLE citation_edges (
    source_document_id UUID REFERENCES legal_documents(id),
    target_document_id UUID REFERENCES legal_documents(id),
    PRIMARY KEY (source_document_id, target_document_id)
);

-- Add a unique constraint to prevent duplicate edges
-- ALTER TABLE citation_edges
-- ADD CONSTRAINT unique_edge UNIQUE (source_document_id, target_document_id);

CREATE INDEX idx_citation_edges_source ON citation_edges (source_document_id);
CREATE INDEX idx_citation_edges_target ON citation_edges (target_document_id);

-- Create a table for impact analysis results
CREATE TABLE impact_analysis_results (
    analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES legal_documents(id),
    referenced_documents JSONB,
    impact_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to find impact chains
CREATE OR REPLACE FUNCTION find_impact_chains(
    start_document_id UUID,
    max_depth INTEGER
)
RETURNS TABLE(
    document_id UUID,
    path UUID[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE impact_path AS (
        SELECT
            ce.target_document_id as doc_id,
            ARRAY[ce.source_document_id, ce.target_document_id] as path_array,
            1 as depth
        FROM
            citation_edges ce
        WHERE
            ce.source_document_id = start_document_id

        UNION ALL

        SELECT
            ce.target_document_id as doc_id,
            ip.path_array || ce.target_document_id,
            ip.depth + 1
        FROM
            citation_edges ce
        JOIN
            impact_path ip ON ce.source_document_id = ip.doc_id
        WHERE
            ip.depth < max_depth
    )
    SELECT
        doc_id,
        path_array
    FROM
        impact_path;
END;
$$ LANGUAGE plpgsql; 