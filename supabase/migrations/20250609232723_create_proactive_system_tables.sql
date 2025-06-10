-- Create ENUM types for status and change_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type') THEN
        CREATE TYPE change_type AS ENUM ('amendment', 'repeal', 'new_legislation', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_status') THEN
        CREATE TYPE notification_status AS ENUM ('detected', 'analyzed', 'notified');
    END IF;
END$$;

-- Create table for legal change events
CREATE TABLE IF NOT EXISTS legal_change_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT,
    change_type change_type,
    summary TEXT,
    status notification_status DEFAULT 'detected',
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for user document relevance to legal changes
CREATE TABLE IF NOT EXISTS user_document_relevance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE,
    change_event_id UUID REFERENCES legal_change_events(id) ON DELETE CASCADE,
    relevance_score REAL,
    CONSTRAINT user_document_relevance_check CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0)
);

-- Create table for user notification preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_document_relevance_user_doc ON user_document_relevance(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_user_document_relevance_change_event ON user_document_relevance(change_event_id);
