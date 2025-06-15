import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Logger } from '@/lib/logging/logger';

type UserInteraction = {
  userId: string;
  action: string;
  documentId?: string;
  metadata?: Record<string, any>;
};

/**
 * @file PersonalizationService.ts
 *
 * @summary This service is responsible for tailoring content and recommendations to individual users.
 * It tracks user interactions and computes relevance scores to personalize the user experience.
 */
export class PersonalizationService {
  private supabase: SupabaseClient<Database>;
  private logger: Logger;

  constructor() {
    this.supabase = supabase;
    this.logger = new Logger('PersonalizationService');
  }

  /**
   * Tracks a user interaction event.
   * @param interaction The interaction event to track.
   */
  public async trackInteraction(interaction: UserInteraction): Promise<void> {
    // In a real implementation, this would insert into a user_interactions table.
    this.logger.info('Tracking interaction:', interaction);

    // Example of what could be done:
    // await this.supabase.from('user_interactions').insert({
    //   user_id: interaction.userId,
    //   action: interaction.action,
    //   document_id: interaction.documentId,
    //   metadata: interaction.metadata,
    // });
  }

  /**
   * Calculates relevance scores for a set of items for a given user.
   * @param userId The ID of the user.
   * @param items A list of items to score.
   * @returns A list of items with relevance scores.
   */
  public async getPersonalizedRecommendations<T extends { id: string }>(
    userId: string,
    items: T[]
  ): Promise<(T & { relevance: number })[]> {
    this.logger.info(`Getting personalized recommendations for user ${userId}...`);

    // A real algorithm would fetch user interaction history and use a model
    // to compute relevance. For now, we return a default relevance score.
    const recommendedItems = items.map((item) => ({
      ...item,
      relevance: 0.5, // Default relevance
    }));

    // Sort by relevance
    return recommendedItems.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Generates proactive recommendations for a user based on recent legal changes
   * and their relevance to the user's documents.
   * @param userId The ID of the user.
   * @returns A list of recommendations.
   */
  public async getProactiveRecommendations(userId: string): Promise<{ id: string; title: string; summary: string; link: string; }[]> {
    this.logger.info(`Generating proactive recommendations for user ${userId}...`);

    const { data: relevanceData, error: relevanceError } = await this.supabase
      .from('user_document_relevance')
      .select(`
        relevance_score,
        legal_change_events (
          id,
          summary,
          source_url
        ),
        legal_documents (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('relevance_score', { ascending: false })
      .limit(5);

    if (relevanceError) {
      this.logger.error('Error fetching user document relevance:', relevanceError);
      return [];
    }

    if (!relevanceData) {
      return [];
    }

    // Transform the data into recommendations
    const recommendations = relevanceData.map(item => {
      const event = item.legal_change_events;
      const doc = item.legal_documents;

      if (!event || !doc) return null;

      return {
        id: `${event.id}-${doc.id}`,
        title: `Legal Change Alert: Your document "${doc.title}" may be affected.`,
        summary: event.summary || 'A recent legal change may have an impact on your document. Please review for compliance.',
        link: `/documents/${doc.id}/changes/${event.id}`, // Example link structure
      };
    }).filter(Boolean);

    // @ts-expect-error - Expected type mismatch for legacy API
    return recommendations;
  }

  /**
   * Analyzes a user's documents to determine their most relevant legal domains.
   * @param userId The ID of the user.
   * @returns A list of top domains with their counts.
   */
  public async getTopUserDomains(userId: string): Promise<{ domain: string; count: number }[]> {
    this.logger.info(`Getting top domains for user ${userId}...`);

    const { data, error } = await this.supabase
      .from('legal_documents')
      .select('domain_id, legal_domains ( name )')
      .eq('user_id', userId);

    if (error) {
      this.logger.error('Error fetching user documents by domain:', error);
      return []; // Return empty array on failure
    }

    if (!data) return [];

    const domainCounts = data.reduce((acc, doc) => {
      // @ts-ignore
      const domainName = doc.legal_domains?.name || 'Unknown';
      acc[domainName] = (acc[domainName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
} 
