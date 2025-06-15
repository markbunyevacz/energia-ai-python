/**
 * @fileoverview Feedback Types & Interfaces - Type Definitions for User Feedback System
 * @description Comprehensive type definitions for the feedback and analytics system,
 * including user feedback, performance metrics, interaction telemetry, and
 * analytics data structures used throughout the Legal AI platform.
 * 
 * TYPE CATEGORIES:
 * - User Feedback: Ratings, comments, and satisfaction data
 * - Performance Metrics: Response times, accuracy, and system performance
 * - Interaction Telemetry: User behavior and workflow analytics
 * - Analytics Data: Aggregated insights and reporting structures
 * 
 * FEEDBACK TYPES:
 * - FeedbackRating: Thumbs up/down and star rating enums
 * - FeedbackCategory: Categorized feedback for targeted improvements
 * - UserFeedback: Complete user feedback with metadata
 * - FeedbackAnalytics: Aggregated feedback insights and trends
 * 
 * PERFORMANCE TYPES:
 * - InteractionMetrics: Agent performance and response data
 * - PerformanceData: System-wide performance measurements
 * - AgentMetrics: Individual agent performance tracking
 * - SystemHealth: Overall platform health indicators
 * 
 * ANALYTICS TYPES:
 * - UserBehavior: User interaction patterns and workflows
 * - FeatureUsage: Feature adoption and usage statistics
 * - TrendAnalysis: Time-series data for trend identification
 * - InsightData: Actionable insights from analytics processing
 * 
 * DATA STRUCTURES:
 * - Timestamp-based data for temporal analysis
 * - User-centric data for personalization
 * - Agent-specific data for performance optimization
 * - System-wide data for platform monitoring
 * 
 * INTEGRATION INTERFACES:
 * - Database schema compatibility
 * - API request/response structures
 * - Event tracking and logging formats
 * - Analytics pipeline data formats
 * 
 * TYPE SAFETY:
 * - Strict TypeScript interfaces for compile-time validation
 * - Enum types for controlled vocabularies
 * - Optional fields for flexible data collection
 * - Union types for polymorphic data structures
 * 
 * @author Legal AI Team
 * @version 1.1.0
 * @since 2024
 */
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
  session_id: string;
  user_id?: string;
  created_at: string;
  response_time_ms: number;
  confidence_score?: number;
  reasoning_log?: { step: string; timestamp: string; }[];
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
