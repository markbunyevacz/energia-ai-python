-- supabase/migrations/20240523100000_add_feedback_tables.sql

-- Create a table to store performance metrics for each agent interaction
CREATE TABLE IF NOT EXISTS interaction_metrics (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  session_id TEXT,
  user_id UUID REFERENCES profiles(id),
  response_time_ms INTEGER NOT NULL,
  confidence_score REAL, -- Using REAL for floating point numbers
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interaction_metrics_agent_id ON interaction_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_interaction_metrics_created_at ON interaction_metrics(created_at);
ALTER TABLE interaction_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own metrics" ON interaction_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all metrics" ON interaction_metrics FOR SELECT USING (auth.role() = 'admin');
-- Service roles can insert data, which is how our backend will operate
CREATE POLICY "Enable insert for service_role" ON interaction_metrics FOR INSERT WITH CHECK (true);


-- Create a table to store direct user feedback on interactions
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID NOT NULL REFERENCES interaction_metrics(interaction_id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  rating TEXT CHECK (rating IN ('up', 'down')),
  category TEXT,
  comments TEXT,
  suggested_correction TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_feedback_interaction_id ON user_feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_agent_id ON user_feedback(agent_id);
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own feedback" ON user_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON user_feedback FOR SELECT USING (auth.role() = 'admin');
CREATE POLICY "Admins can update feedback" ON user_feedback FOR UPDATE USING (auth.role() = 'admin'); 