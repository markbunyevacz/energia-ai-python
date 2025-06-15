/**
 * @fileoverview Mixture of Experts Router - Intelligent AI Agent Selection System
 * @description Advanced routing system that intelligently selects the most appropriate AI agents
 * for legal queries using multi-factor scoring algorithms and machine learning techniques.
 * 
 * CORE ALGORITHM:
 * The router uses a weighted scoring system that evaluates agents based on:
 * - Keyword matching (35%): Domain-specific terminology analysis
 * - Context relevance (15%): Document type and user role alignment  
 * - Historical performance (15%): Previous successful interactions
 * - Vector similarity (15%): Semantic similarity to stored documents
 * - User feedback (20%): Performance ratings and user satisfaction
 * 
 * INTELLIGENT FEATURES:
 * - Dynamic confidence threshold adjustment
 * - Agent performance tracking with feedback integration
 * - Conversation context awareness for multi-turn interactions
 * - Vector store integration for semantic document matching
 * - Real-time agent scoring and ranking
 * 
 * SCORING METHODOLOGY:
 * 1. Keyword Score: Matches query terms against agent domain keywords
 * 2. Context Score: Evaluates document type and user role compatibility
 * 3. History Score: Considers recent agent usage patterns (last 5 messages)
 * 4. Vector Score: Uses embedding similarity for semantic matching
 * 5. Feedback Score: Incorporates user ratings and performance metrics
 * 
 * AGENT SELECTION PROCESS:
 * 1. Query analysis and embedding generation
 * 2. Multi-factor scoring for all enabled agents
 * 3. Confidence threshold filtering
 * 4. Ranking by composite score
 * 5. Return top 1-3 agents for execution
 * 
 * PERFORMANCE OPTIMIZATION:
 * - Caches agent performance scores for fast lookup
 * - Batch processes similarity searches
 * - Maintains conversation context for efficiency
 * - Implements score normalization for fair comparison
 * 
 * INTEGRATION POINTS:
 * - Vector Store Service for semantic search
 * - Embedding Service for query vectorization
 * - Domain Registry for agent-domain mapping
 * - Conversation Context Manager for history tracking
 * 
 * @author Legal AI Team
 * @version 2.0.0
 * @since 2024
 */
import { BaseAgent, AgentContext } from '../agents/base-agents/BaseAgent';
import { DomainRegistry } from '../legal-domains/registry/DomainRegistry';
import { LegalDomain } from '../legal-domains/types';
import { conversationContextManager, ConversationContext } from '../common/conversationContext';
import { vectorStoreService } from '../vector-store/VectorStoreService';
import embeddingService from '../embedding/EmbeddingService';

export interface AgentScore {
  agent: BaseAgent;
  score: number;
}

// The context for the MoE router will be a combination of agent and conversation contexts
export interface MoEContext extends AgentContext {
    conversation: ConversationContext | null;
}

export class MixtureOfExpertsRouter {
  private agentPool: BaseAgent[];
  private domainRegistry: DomainRegistry;
  private confidenceThreshold: number;
  private agentPerformanceScores: Map<string, { score: number; feedbackCount: number }>;

  constructor(agentPool: BaseAgent[], domainRegistry: DomainRegistry) {
    this.agentPool = agentPool;
    this.domainRegistry = domainRegistry;
    this.confidenceThreshold = 0.7; // Default threshold
    this.agentPerformanceScores = new Map();
    this.initializeScores();
  }

  private initializeScores(): void {
    for (const agent of this.agentPool) {
      this.agentPerformanceScores.set(agent.getConfig().id, { score: 1.0, feedbackCount: 0 });
    }
  }

  public async routeQuery(question: string, context: MoEContext): Promise<AgentScore[]> {
    const scores: AgentScore[] = [];

    const queryEmbedding = await embeddingService.getEmbedding(question);
    const { data: similarDocuments } = await vectorStoreService.similaritySearch(queryEmbedding, 0.7, 5);

    for (const agent of this.agentPool) {
      if (!agent.isEnabled()) {
        continue;
      }

      const agentDomain = await agent.getDomain();
      if (!agentDomain) {
        continue;
      }

      const keywordScore = this.calculateKeywordScore(question, agentDomain);
      const contextScore = this.calculateContextScore(context, agentDomain);
      const historyScore = this.calculateHistoryScore(context, agent.getConfig().id);
      const vectorScore = this.calculateVectorScore(similarDocuments, agentDomain);
      const feedbackScore = this.getFeedbackScore(agent.getConfig().id);

      // Weighted average of scores, now including feedback
      const finalScore = 
        (keywordScore * 0.35) + 
        (contextScore * 0.15) + 
        (historyScore * 0.15) + 
        (vectorScore * 0.15) +
        (feedbackScore * 0.20); // Feedback has a significant weight

      if (finalScore > this.confidenceThreshold) {
        scores.push({ agent, score: finalScore });
      }
    }

    // Sort agents by score in descending order
    scores.sort((a, b) => b.score - a.score);

    // Return top 1-3 agents
    return scores.slice(0, 3);
  }

  public setConfidenceThreshold(threshold: number) {
    this.confidenceThreshold = threshold;
  }

  /**
   * Adjusts an agent's performance score based on feedback.
   * This is called by the PerformanceTuner.
   * @param agentId - The ID of the agent to adjust.
   * @param adjustment - The amount to adjust the score by (can be positive or negative).
   */
  public adjustAgentScore(agentId: string, adjustment: number): void {
    const performance = this.agentPerformanceScores.get(agentId);
    if (performance) {
      // Apply adjustment, ensuring score stays within a reasonable range (e.g., 0.1 to 2.0)
      performance.score = Math.max(0.1, Math.min(2.0, performance.score + adjustment));
      performance.feedbackCount++;
      this.agentPerformanceScores.set(agentId, performance);
      // console.log(`[MoE] Adjusted score for ${agentId} to ${performance.score.toFixed(2)}`);
    }
  }

  private getFeedbackScore(agentId: string): number {
    return this.agentPerformanceScores.get(agentId)?.score ?? 1.0;
  }

  private calculateKeywordScore(question: string, domain: LegalDomain): number {
    const questionLower = question.toLowerCase();
    let score = 0;

    const allKeywords = [
        ...(domain.agentConfig.contract?.keywords || []),
        ...(domain.agentConfig.compliance?.keywords || []),
        ...(domain.agentConfig.legal_research?.keywords || [])
    ];

    for (const keyword of allKeywords) {
      if (questionLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // Normalize score
    return allKeywords.length > 0 ? score / allKeywords.length : 0;
  }

  private calculateContextScore(context: MoEContext, domain: LegalDomain): number {
    let score = 0;
    let factors = 0;

    // Score based on document type
    if (context.document?.documentType) {
        factors++;
        if (domain.documentTypes.includes(context.document.documentType)) {
            score += 1;
        }
    }

    // Score based on user role
    if (context.conversation?.userRole) {
        factors++;
        // This is a simple check. A more advanced implementation could have role-to-domain mappings.
        // For now, we assume certain roles are more aligned with certain domains implicitly.
        // Let's give a small boost if a user role is present.
        // A better implementation would be to check domain.relevantRoles or something similar.
        if (context.conversation.userRole === 'jogász' && (domain.code === 'energy' || domain.code === 'general')) {
             score += 0.5;
        }
    }
    
    return factors > 0 ? score / factors : 0;
  }

  private calculateHistoryScore(context: MoEContext, agentId: string): number {
    if (!context.conversation || context.conversation.messages.length === 0) {
      return 0;
    }

    const recentMessages = context.conversation.messages.slice(-5);
    const agentMentions = recentMessages.filter(m => m.agentType === agentId).length;

    // Give a score boost if the agent was used in the last 5 messages.
    // The more it was used, the higher the score.
    return (agentMentions / recentMessages.length) * 0.5; // Max score of 0.5 for this factor
  }

  private calculateVectorScore(similarDocuments: any[] | null, domain: LegalDomain): number {
    if (!similarDocuments) {
      return 0;
    }

    const domainMentions = similarDocuments.filter(doc => doc.domain_id === domain.code).length;
    return domainMentions / similarDocuments.length;
  }
} 
