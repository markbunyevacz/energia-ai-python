export interface InteractionMetrics {
  interaction_id: string;
  agent_id: string;
  session_id?: string;
  user_id?: string;
  response_time_ms: number;
  confidence_score?: number;
  created_at: string;
}

export interface UserFeedback {
  id: string;
  interaction_id: string;
  agent_id: string;
  user_id?: string;
  rating: 'up' | 'down';
  category?: string;
  comments?: string;
  suggested_correction?: string;
  resolved: boolean;
  created_at: string;
} 
