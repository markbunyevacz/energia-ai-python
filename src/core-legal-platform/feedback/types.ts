// src/core-legal-platform/feedback/types.ts

/**
 * Unique identifier for an agent.
 */
export type AgentId = string;

/**
 * Unique identifier for a user interaction.
 */
export type InteractionId = string;

/**
 * Defines a date range for querying feedback.
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Represents the type of rating given by a user.
 */
export type FeedbackRating = 'up' | 'down';

/**
 * Categories for detailed user feedback.
 */
export type FeedbackCategory =
  | 'Inaccurate Information'
  | 'Unhelpful Response'
  | 'Formatting Issue'
  | 'Other';

/**
 * Represents user-provided feedback for a specific interaction.
 * This is the core model for data collected from the UI.
 */
export interface UserFeedback {
  id: string;
  interaction_id: InteractionId;
  agent_id: AgentId;
  user_id?: string;
  created_at: string;
  rating?: FeedbackRating;
  category?: FeedbackCategory;
  comments?: string;
  suggested_correction?: string;
}

/**
 * Metrics logged automatically for each agent interaction.
 */
export interface InteractionMetrics {
  interaction_id: InteractionId;
  agent_id: AgentId;
  created_at: string;
  response_time_ms: number;
  confidence_score?: number;
}

/**
 * Represents the aggregated analysis of feedback for an agent.
 */
export interface FeedbackAnalysis {
  agentId: AgentId;
  timeRange: DateRange;
  totalInteractions: number;
  satisfactionScore: number; // e.g., (upvotes / (upvotes + downvotes))
  feedbackCount: number;
  categoryBreakdown: Record<FeedbackCategory, number>;
  commonKeywords: { keyword: string; count: number }[];
  performanceMetrics: {
    averageResponseTimeMs: number;
  };
}

/**
 * Defines the type of improvement action to be taken.
 */
export type ImprovementActionType =
  | 'ADJUST_ROUTING_SCORE'
  | 'UPDATE_FINETUNING_DATA'
  | 'MODIFY_SYSTEM_PROMPT'
  | 'FLAG_FOR_MANUAL_REVIEW';

/**
 * Represents a single, actionable step for improving an agent.
 */
export interface ImprovementAction {
  type: ImprovementActionType;
  description: string;
  // Metadata for the action, e.g., new score, link to data, etc.
  payload: Record<string, any>;
}

/**
 * A plan containing a set of actions to improve an agent's performance.
 * This is the output of the `generateImprovementPlan` method.
 */
export interface ImprovementPlan {
  agentId: AgentId;
  analysisId: string; // Link back to the analysis that generated this plan
  generatedAt: Date;
  actions: ImprovementAction[];
} 