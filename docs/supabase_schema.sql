-- Supabase Schema for Human Feedback System

-- Table to store direct user feedback
CREATE TABLE public.user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL,
    agent_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rating TEXT CHECK (rating IN ('up', 'down')),
    category TEXT CHECK (category IN ('Inaccurate Information', 'Unhelpful Response', 'Formatting Issue', 'Other')),
    comments TEXT,
    suggested_correction TEXT,
    user_id UUID REFERENCES auth.users(id) -- Optional: link to the user who gave feedback
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Table to store automated interaction metrics
CREATE TABLE public.interaction_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL,
    agent_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_time_ms INTEGER,
    confidence_score REAL,
    user_id UUID REFERENCES auth.users(id) -- Optional: link to the user in the interaction
);

ALTER TABLE public.interaction_metrics ENABLE ROW LEVEL SECURITY;

-- Indexes to improve query performance
CREATE INDEX idx_user_feedback_agent_id ON public.user_feedback(agent_id, created_at);
CREATE INDEX idx_interaction_metrics_agent_id ON public.interaction_metrics(agent_id, created_at);
CREATE INDEX idx_user_feedback_interaction_id ON public.user_feedback(interaction_id);
CREATE INDEX idx_interaction_metrics_interaction_id ON public.interaction_metrics(interaction_id);

-- RLS Policies (Example: allow users to insert their own feedback)
CREATE POLICY "Allow users to insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow service roles to access all feedback"
ON public.user_feedback
FOR ALL
USING (true); -- Simplified for demonstration; restrict in production

CREATE POLICY "Allow service roles to access all metrics"
ON public.interaction_metrics
FOR ALL
USING (true); -- Simplified for demonstration; restrict in production 