CREATE TABLE court_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT NOT NULL,
    court_name TEXT NOT NULL,
    decision_date DATE NOT NULL,
    summary TEXT,
    full_text TEXT,
    jurisdiction VARCHAR(2) NOT NULL, -- HU or EU
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_precedents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    full_text TEXT,
    source_document_id UUID REFERENCES court_decisions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE court_decisions IS 'Stores court decisions from various jurisdictions.';
COMMENT ON TABLE legal_precedents IS 'Stores legal precedents derived from court decisions or other legal sources.'; 