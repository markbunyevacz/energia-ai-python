import { SupabaseClient } from '@supabase/supabase-js';
import {
  AgentId,
  DateRange,
  FeedbackAnalysis,
  ImprovementAction,
  ImprovementPlan,
  UserFeedback,
} from './types';

/**
 * A service for managing the collection and analysis of user feedback.
 * It interacts with a Supabase backend to store and retrieve feedback data.
 */
export class FeedbackService {
  private supabase: SupabaseClient;

  /**
   * Constructs a new FeedbackService.
   * @param supabase - The Supabase client for database interactions.
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Stores a piece of user feedback in the database.
   * @param feedback - The user feedback to collect.
   */
  async collectFeedback(feedback: UserFeedback): Promise<void> {
    const { error } = await this.supabase.from('user_feedback').insert({
      interaction_id: feedback.interactionId,
      agent_id: feedback.agentId,
      user_id: feedback.userId,
      rating: feedback.rating,
      category: feedback.category,
      comments: feedback.comments,
      suggested_correction: feedback.suggestedCorrection,
    });

    if (error) {
      console.error('Error collecting feedback:', error);
      throw new Error('Failed to collect feedback.');
    }
  }

  /**
   * Analyzes feedback for a specific agent within a given time range.
   * This is a simplified analysis. A real implementation would involve more complex SQL queries or a data analysis pipeline.
   * @param agentId - The ID of the agent to analyze.
   * @param timeRange - The date range for the analysis.
   * @returns A promise that resolves to a feedback analysis object.
   */
  async analyzeFeedback(
    agentId: AgentId,
    timeRange: DateRange,
  ): Promise<FeedbackAnalysis> {
    const { data: feedbackData, error: feedbackError } = await this.supabase
      .from('user_feedback')
      .select('rating, category, comments')
      .eq('agent_id', agentId)
      .gte('created_at', timeRange.startDate.toISOString())
      .lte('created_at', timeRange.endDate.toISOString());

    if (feedbackError) {
      console.error('Error fetching feedback data:', feedbackError);
      throw new Error('Could not analyze feedback.');
    }
    
    const { data: metricsData, error: metricsError } = await this.supabase
        .from('interaction_metrics')
        .select('response_time_ms')
        .eq('agent_id', agentId)
        .gte('created_at', timeRange.startDate.toISOString())
        .lte('created_at', timeRange.endDate.toISOString());

    if (metricsError) {
        console.error('Error fetching metrics data:', metricsError);
        throw new Error('Could not analyze feedback metrics.');
    }

    const totalInteractions = metricsData?.length || 0;
    const upvotes = feedbackData.filter(f => f.rating === 'up').length;
    const downvotes = feedbackData.filter(f => f.rating === 'down').length;
    const satisfactionScore = (upvotes + downvotes) > 0 ? upvotes / (upvotes + downvotes) : 0;
    
    const categoryBreakdown: FeedbackAnalysis['categoryBreakdown'] = {
        'Inaccurate Information': 0,
        'Unhelpful Response': 0,
        'Formatting Issue': 0,
        'Other': 0,
    };
    feedbackData.forEach(f => {
        if (f.category && categoryBreakdown.hasOwnProperty(f.category)) {
            categoryBreakdown[f.category as keyof typeof categoryBreakdown]++;
        }
    });

    const averageResponseTimeMs = totalInteractions > 0 
        ? metricsData.reduce((sum, m) => sum + m.response_time_ms, 0) / totalInteractions 
        : 0;

    return {
      agentId,
      timeRange,
      totalInteractions,
      satisfactionScore,
      feedbackCount: feedbackData.length,
      categoryBreakdown,
      commonKeywords: [], // NLP for keyword extraction would be implemented here
      performanceMetrics: {
        averageResponseTimeMs,
      },
    };
  }

  /**
   * Generates an improvement plan based on feedback analysis.
   * @param analysis - The feedback analysis to use.
   * @returns A promise that resolves to an improvement plan.
   */
  async generateImprovementPlan(
    analysis: FeedbackAnalysis,
  ): Promise<ImprovementPlan> {
    const actions: ImprovementAction[] = [];

    // Rule 1: If satisfaction is low and "Inaccurate" is a high category, suggest fine-tuning.
    if (analysis.satisfactionScore < 0.6 && analysis.categoryBreakdown['Inaccurate Information'] > analysis.feedbackCount * 0.3) {
      actions.push({
        type: 'UPDATE_FINETUNING_DATA',
        description: `Agent has a satisfaction score of ${analysis.satisfactionScore.toFixed(2)} with many "Inaccurate Information" reports. Review and update its knowledge base or fine-tuning data.`,
        payload: { analysisId: 'placeholder-analysis-id' },
      });
    }

    // Rule 2: If response times are high, flag for performance review.
    if (analysis.performanceMetrics.averageResponseTimeMs > 5000) {
        actions.push({
            type: 'FLAG_FOR_MANUAL_REVIEW',
            description: `Average response time is over 5 seconds (${analysis.performanceMetrics.averageResponseTimeMs.toFixed(0)}ms). Investigate performance bottlenecks.`,
            payload: { metric: 'responseTime', value: analysis.performanceMetrics.averageResponseTimeMs },
        });
    }
    
    console.log(`Generating improvement plan for agent: ${analysis.agentId} with ${actions.length} action(s).`);
    
    return {
      agentId: analysis.agentId,
      analysisId: 'placeholder-analysis-id', // In a real system, this would be a real ID.
      generatedAt: new Date(),
      actions,
    };
  }
} 