/**
 * @fileoverview Base Agent Abstract Class - Foundation for All AI Legal Agents
 * @description Abstract base class that provides the core infrastructure and standardized interface
 * for all specialized AI agents in the legal platform. Implements common functionality including
 * telemetry, security, batch processing, and LLM integration.
 * 
 * AGENT ARCHITECTURE:
 * - Abstract base class with template method pattern
 * - Standardized agent lifecycle (initialize → process → cleanup)
 * - Built-in telemetry and performance monitoring
 * - Security layer with role-based access control
 * - Error handling with graceful degradation
 * 
 * CORE CAPABILITIES:
 * - Document processing with multi-format support
 * - LLM integration with prompt engineering
 * - Vector store integration for semantic search
 * - Conversation context management
 * - Batch processing for high-volume operations
 * - Performance metrics and feedback collection
 * 
 * SECURITY FEATURES:
 * - Authentication requirement enforcement
 * - Role-based permission checking
 * - Domain-specific access control
 * - Secure batch processing validation
 * 
 * TELEMETRY & MONITORING:
 * - Response time tracking
 * - Confidence score logging
 * - Reasoning chain capture
 * - Interaction metrics collection
 * - Error tracking and reporting
 * 
 * EXTENSIBILITY POINTS:
 * - performTask(): Core agent-specific logic implementation
 * - initialize(): Agent-specific setup and configuration
 * - getDomain(): Domain registry integration
 * - Custom error handling and validation
 * 
 * INTEGRATION SERVICES:
 * - LegalDataService: Document CRUD operations
 * - VectorStoreService: Semantic search and embeddings
 * - EmbeddingService: Text vectorization
 * - FeedbackService: User feedback and ratings
 * - DomainRegistry: Legal domain management
 * 
 * USAGE PATTERN:
 * 1. Extend BaseAgent with domain-specific implementation
 * 2. Implement performTask() with agent logic
 * 3. Configure agent settings and security
 * 4. Register with MixtureOfExpertsRouter
 * 5. Deploy and monitor performance
 * 
 * CONCRETE IMPLEMENTATIONS:
 * - ContractAnalysisAgent: Contract review and risk assessment
 * - GeneralPurposeAgent: General legal queries and research
 * - LegalResearchAgent: Case law and statute analysis
 * - ComplianceAgent: Regulatory compliance checking
 * 
 * @author Legal AI Team
 * @version 2.1.0
 * @since 2024
 */
import { LegalDocument, DocumentType } from '@/core-legal-platform/legal-domains/types';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { LegalDataService } from '@/core-legal-platform/legal/LegalDataService';
import type { Database, Json } from '@/integrations/supabase/types';
import { v4 as uuidv4 } from 'uuid';
import { FeedbackService } from '@/core-legal-platform/feedback/FeedbackService';
import { InteractionMetrics } from '@/core-legal-platform/feedback/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { AgentConfig, AgentContext, AgentResult, AgentResponse, AgentTask } from '@/core-legal-platform/agents/types';
import { BaseLLM } from '@/llm/base-llm';
import { vectorStoreService, VectorStoreService } from '@/core-legal-platform/vector-store/VectorStoreService';
import { EmbeddingService } from '@/core-legal-platform/embedding/EmbeddingService';

export { AgentConfig, AgentContext, AgentResult, AgentResponse, AgentTask };

export class AgentSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentSecurityError';
  }
}

export interface BatchProcessingResult {
  total: number;
  successful: number;
  failed: number;
  results: AgentResult[];
}

export abstract class BaseAgent<T extends AgentTask = AgentTask, U extends AgentResponse = AgentResponse> {
  protected config: AgentConfig;
  protected domainRegistry: DomainRegistry;
  protected documentService: LegalDataService;
  protected vectorStoreService: VectorStoreService;
  protected embeddingService: EmbeddingService;
  protected batchQueue: LegalDocument[] = [];
  protected batchTimeout: NodeJS.Timeout | null = null;
  protected reasoning_log: { step: string; timestamp: string; }[] = [];
  protected feedbackService: FeedbackService;
  protected llm: BaseLLM;
  protected systemPrompt: string;
  protected name: string;
  protected description: string;
  public agentId: string;
  protected supabase: SupabaseClient;

  constructor(
    config: AgentConfig,
    llm: BaseLLM,
    systemPrompt: string,
    name: string,
    description: string,
    domainRegistry?: DomainRegistry,
  ) {
    this.config = config;
    this.domainRegistry = domainRegistry || DomainRegistry.getInstance();
    this.documentService = new LegalDataService();
    this.supabase = supabaseClient;
    this.vectorStoreService = vectorStoreService;
    this.embeddingService = new EmbeddingService();
    this.feedbackService = new FeedbackService(this.supabase);
    this.llm = llm;
    this.systemPrompt = systemPrompt;
    this.name = name;
    this.description = description;
    this.agentId = uuidv4();
  }

  /**
   * Initialize the agent with required resources and connections
   */
  public abstract initialize(): Promise<void>;

  /**
   * Wraps the process method to include performance logging and error handling.
   * This is the public-facing method that should be called by the router.
   */
  public async processWithTelemetry(context: AgentContext): Promise<AgentResult & { interactionId: string }> {
    const startTime = Date.now();
    const interactionId = context.document?.id || uuidv4();
    this.reasoning_log = []; // Reset log for new telemetry call

    const task = {
      query: context.query,
      context: context,
      sessionId: context.sessionId,
      user: context.user,
    } as T;

    try {
      const result = await this.process(task);
      const responseTimeMs = Date.now() - startTime;

      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: context.sessionId,
        response_time_ms: responseTimeMs,
        confidence_score: (result as unknown as AgentResult).confidence ?? 0,
        reasoning_log: this.reasoning_log,
      }, interactionId);

      return { ...(result as unknown as AgentResult), interactionId };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: context.sessionId,
        response_time_ms: responseTimeMs,
        confidence_score: 0,
        reasoning_log: this.reasoning_log,
      }, interactionId);
      const agentResult = this.handleError(error as Error, context);
      return { ...agentResult, interactionId };
    }
  }

  /**
   * Logs interaction metrics to the feedback service.
   */
  protected async logInteractionMetrics(
    metrics: Omit<InteractionMetrics, 'interaction_id' | 'created_at'>,
    interactionId: string
  ) {
    try {
      const interactionMetrics: InteractionMetrics = {
        ...metrics,
        interaction_id: interactionId,
        created_at: new Date().toISOString(),
      };
      await this.feedbackService.submitInteractionMetrics(interactionMetrics);
    } catch (error) {
      // Log silently to avoid disrupting agent processing
      // console.error('Error logging interaction metrics:', (error as Error).message);
    }
  }

  /**
   * Main processing method that all agents must implement.
   * 
   * This is the core method where agent-specific logic is implemented. It follows
   * a standardized pattern for processing legal documents and queries while allowing
   * each agent to specialize in their domain expertise.
   * 
   * IMPLEMENTATION REQUIREMENTS:
   * - Must validate input context and document content
   * - Should implement domain-specific processing logic
   * - Must return structured AgentResult with success/error states
   * - Should include reasoning logs for transparency
   * - Must handle errors gracefully without throwing exceptions
   * 
   * CONTEXT STRUCTURE:
   * - document: The legal document to process
   * - query: User's natural language query
   * - user: User information for personalization
   * - conversationHistory: Previous interactions for context
   * 
   * RESULT STRUCTURE:
   * - success: Boolean indicating processing success
   * - message: Human-readable result summary
   * - data: Structured response data (agent-specific)
   * - error: Error message if processing failed
   * - reasoning: Chain-of-thought explanation
   * 
   * @param context - Complete processing context with document, query, and user info
   * @returns Promise<AgentResult> - Standardized result structure
   * @abstract - Must be implemented by all concrete agent classes
   * 
   * @example
   * ```typescript
   * class ContractAgent extends BaseAgent {
   *   async process(context: AgentContext): Promise<AgentResult> {
   *     // Validate inputs
   *     if (!context.document?.content) {
   *       return this.handleError(new Error("No document content"), context);
   *     }
   *     
   *     // Process document
   *     const analysis = await this.analyzeContract(context.document);
   *     
   *     // Return structured result
   *     return {
   *       success: true,
   *       message: "Contract analysis completed",
   *       data: analysis,
   *       reasoning: this.getReasoningLog()
   *     };
   *   }
   * }
   * ```
   */
  public async process(task: T): Promise<U> {
    this.reasoning_log = []; // Reset log for new processing task
    const interactionId = uuidv4();
    const startTime = Date.now();
    try {
      const result = await this.performTask(task, interactionId);
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      const interactionMetrics: Omit<InteractionMetrics, 'interaction_id' | 'created_at' | 'user_id'> = {
        agent_id: this.config.id,
        session_id: task.sessionId,
        response_time_ms: responseTimeMs,
        confidence_score: (result as unknown as AgentResult).confidence ?? 0,
        reasoning_log: this.reasoning_log,
      };

      try {
        await this.logInteractionMetrics(interactionMetrics, interactionId);
      } catch (error) {
        // console.error(`[${this.config.name}] Failed to submit interaction metrics:`, error);
      }

      return result;
    } catch (error) {
        return this.handleError(error as Error, task.context) as U;
    }
  }

  protected abstract performTask(task: T, interactionId: string): Promise<U>;

  /**
   * Adds a step to the agent's reasoning log.
   * @param step A description of the reasoning step.
   */
  protected reason(step: string): void {
    this.reasoning_log.push({
      step,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Process a batch of documents
   */
  public async processBatch(documents: LegalDocument[], user?: AgentContext['user']): Promise<BatchProcessingResult> {
    // Check security for batch processing
    if (this.config.securityConfig?.requireAuth && !user) {
      throw new AgentSecurityError('Authentication required for batch processing');
    }

    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions for batch processing');
    }

    const validDocuments = documents.filter(doc => doc); // Ensure no null/undefined docs
    const results: AgentResult[] = [];
    let successful = 0;
    let failed = 0;

    // Process documents in chunks to avoid memory issues
    const chunkSize = this.config.batchConfig?.maxBatchSize ?? 10;
    for (let i = 0; i < validDocuments.length; i += chunkSize) {
      const chunk = validDocuments.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(doc => this.processWithTelemetry({
          document: doc,
          domain: this.config.domainCode,
          user,
          sessionId: uuidv4(),
        }))
      );

      chunkResults.forEach(result => {
        results.push(result);
        if (result.success) successful++;
        else failed++;
      });
    }

    return {
      total: validDocuments.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Queue a document for batch processing
   */
  public queueForBatchProcessing(document: LegalDocument, user?: AgentContext['user']): void {
    if (this.config.securityConfig?.requireAuth && !user) {
      throw new AgentSecurityError('Authentication required for batch processing');
    }

    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions for batch processing');
    }

    this.batchQueue.push(document);

    // Process batch if it reaches max size
    if (this.batchQueue.length >= (this.config.batchConfig?.maxBatchSize ?? 10)) {
      this.processBatchQueue(user);
    } else if (!this.batchTimeout) {
      // Set timeout for batch processing
      this.batchTimeout = setTimeout(
        () => this.processBatchQueue(user),
        this.config.batchConfig?.batchTimeout ?? 5000
      );
    }
  }

  /**
   * Process the current batch queue
   */
  private async processBatchQueue(user?: AgentContext['user']): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length > 0) {
      const batch = [...this.batchQueue];
      this.batchQueue = [];
      await this.processBatch(batch, user);
    }
  }

  /**
   * Clean up resources when the agent is no longer needed
   */
  public async cleanup(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    await this.processBatchQueue();
  }

  /**
   * Validate the agent's configuration
   */
  protected validateConfig(): void {
    if (!this.config.id || !this.config.name || !this.config.domainCode) {
      throw new Error('Agent must have an id, name, and domain code');
    }
  }

  /**
   * Get the agent's current configuration
   */
  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update the agent's configuration
   */
  public async updateConfig(updates: Partial<AgentConfig>): Promise<void> {
    this.config = {
      ...this.config,
      ...updates,
    };
    this.validateConfig();
  }

  /**
   * Check if the agent is enabled
   */
  public isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable the agent
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get the agent's domain
   */
  public async getDomain() {
    return this.domainRegistry.getDomain(this.config.domainCode);
  }

  /**
   * Check if user has required permissions
   */
  protected hasRequiredPermissions(user: NonNullable<AgentContext['user']>): boolean {
    const { allowedRoles, allowedDomains } = this.config.securityConfig ?? {};

    // Check role permissions
    if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
      return false;
    }

    // Check domain permissions
    if (allowedDomains && !allowedDomains.includes(this.config.domainCode)) {
      return false;
    }

    return true;
  }

  /**
   * Verify user authentication
   */
  protected async verifyAuthentication(userId: string): Promise<boolean> {
    if (!this.config.securityConfig?.requireAuth) {
      return true;
    }

    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      return !!user && user.id === userId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle errors during agent operations
   */
  public handleError(error: Error, context: AgentContext): AgentResult {
    // console.error(`[${this.config.name}] Error processing task:`, error, 'Context:', context);
    // Basic error handling, can be customized in subclasses
    return {
      success: false,
      data: null,
      error: `Error processing document ${context.document?.id}: ${error.message}`,
    };
  }

  public async execute(task: T): Promise<U & { interactionId: string }> {
    const interactionId = uuidv4();
    const startTime = Date.now();

    try {
      const result = await this.process(task);
      const responseTimeMs = Date.now() - startTime;

      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: task.sessionId,
        response_time_ms: responseTimeMs,
        confidence_score: (result as unknown as AgentResult).confidence ?? 0,
        reasoning_log: this.reasoning_log,
      }, interactionId);

      return { ...result, interactionId };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: task.sessionId,
        response_time_ms: responseTimeMs,
        confidence_score: 0,
        reasoning_log: this.reasoning_log,
      }, interactionId);
      
      const agentResult = this.handleError(error as Error, task.context as AgentContext);
      return { ...agentResult, interactionId } as unknown as U & { interactionId: string };
    }
  }

  /**
   * Searches the long-term memory for content related to the query.
   * @param query The search query.
   * @param matchThreshold The minimum similarity score to consider a match.
   * @param matchCount The maximum number of matches to return.
   * @returns A list of relevant document chunks.
   */
  protected async searchLongTermMemory(
    query: string,
    matchThreshold: number = 0.75,
    matchCount: number = 5
  ): Promise<Array<{ id: string; content: string; similarity: number }>> {
    try {
      const queryEmbedding = await this.embeddingService.getEmbedding(query);
      const searchResults = await this.vectorStoreService.similaritySearch(
        queryEmbedding,
        matchThreshold,
        matchCount
      );

      if (searchResults.error) {
        throw searchResults.error;
      }

      return (searchResults.data ?? []).map((result: any) => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
      }));
    } catch (error) {
      // console.error('Error searching long-term memory:', error);
      return [];
    }
  }
} 
