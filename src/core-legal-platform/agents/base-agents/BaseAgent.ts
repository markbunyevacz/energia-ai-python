import { LegalDocument, DocumentType } from '@/core-legal-platform/legal-domains/types';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { LegalDocumentService } from '@/core-legal-platform/legal/legalDocumentService';
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

type DbLegalDocument = Database['public']['Tables']['legal_documents']['Row'];
type DbLegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert'];

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
  protected documentService: LegalDocumentService;
  protected vectorStoreService: VectorStoreService;
  protected embeddingService: EmbeddingService;
  protected batchQueue: LegalDocument[] = [];
  protected batchTimeout: NodeJS.Timeout | null = null;
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
    this.documentService = new LegalDocumentService();
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
        user_id: context.user?.id,
        response_time_ms: responseTimeMs,
        confidence_score: (result as unknown as AgentResult).confidence ?? null,
      }, interactionId);

      return { ...(result as unknown as AgentResult), interactionId };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: context.sessionId,
        user_id: context.user?.id,
        response_time_ms: responseTimeMs,
        confidence_score: 0,
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
      console.error('Error logging interaction metrics:', (error as Error).message);
    }
  }

  /**
   * Process a document using the agent's specific logic.
   * This method should be implemented by subclasses.
   */
  public async process(task: T): Promise<U> {
    const interactionId = uuidv4();
    const startTime = Date.now();

    // The agent's core logic for processing the task goes here.
    // This is an abstract method, so the concrete implementation will be in the subclasses.
    const result = await this.performTask(task, interactionId);

    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    const interactionMetrics: Omit<InteractionMetrics, 'interaction_id' | 'created_at'> = {
      agent_id: this.config.id,
      session_id: task.sessionId,
      user_id: task.user?.id,
      response_time_ms: responseTimeMs,
      confidence_score: (result as unknown as AgentResult).confidence ?? null,
    };

    try {
      await this.logInteractionMetrics(interactionMetrics, interactionId);
    } catch (error) {
      console.error(`[${this.config.name}] Failed to submit interaction metrics:`, error);
    }

    return result;
  }

  protected abstract performTask(task: T, interactionId: string): Promise<U>;

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
   * Convert database document to LegalDocument
   */
  private convertDbToLegalDocument(dbDoc: DbLegalDocument): LegalDocument {
    return {
      id: dbDoc.id,
      title: dbDoc.title,
      content: dbDoc.content ?? '',
      documentType: dbDoc.document_type as DocumentType,
      domainId: 'unknown', // Synthesized field
      metadata: {
        publication_date: dbDoc.publication_date,
        source_url: dbDoc.source_url,
        created_at: dbDoc.created_at,
        updated_at: dbDoc.updated_at,
      },
    };
  }

  /**
   * Convert LegalDocument to database insert type
   */
  private convertLegalToDbDocument(doc: Partial<LegalDocument>): DbLegalDocumentInsert {
    return {
      id: doc.id,
      title: doc.title ?? '',
      content: doc.content ?? '',
      document_type: doc.documentType as Database["public"]["Enums"]["legal_document_type"],
      publication_date: doc.metadata?.publication_date,
      source_url: doc.metadata?.source_url,
    };
  }

  /**
   * Get a document by ID with caching
   */
  protected async getDocument(documentId: string, user?: AgentContext['user']): Promise<LegalDocument | null> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to access document');
    }

    try {
      const dbDoc = await this.documentService.getLegalDocument(documentId);
      if (!dbDoc) return null;
      return this.convertDbToLegalDocument(dbDoc);
    } catch (error) {
      return null;
    }
  }

  /**
   * Update a document
   */
  protected async updateDocument(documentId: string, updates: Partial<LegalDocument>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to update document');
    }

    const updatedDbDoc = await this.documentService.updateLegalDocument(documentId, updates);
    return this.convertDbToLegalDocument(updatedDbDoc);
  }

  /**
   * Create a new document
   */
  protected async createDocument(document: Partial<LegalDocument>, user?: AgentContext['user']): Promise<LegalDocument> {
    // Check authentication if required
    if (this.config.securityConfig?.requireAuth && user) {
      const isAuthenticated = await this.verifyAuthentication(user.id);
      if (!isAuthenticated) {
        throw new AgentSecurityError('Authentication failed');
      }
    }

    // Check permissions
    if (user && !this.hasRequiredPermissions(user)) {
      throw new AgentSecurityError('Insufficient permissions to create document');
    }

    const dbDoc = this.convertLegalToDbDocument(document);
    // The service expects the full insert type, let's just cast it for now
    const created = await this.documentService.createLegalDocument(dbDoc as DbLegalDocumentInsert);
    return this.convertDbToLegalDocument(created);
  }

  /**
   * Handle errors during agent operations
   */
  public handleError(error: Error, context: AgentContext): AgentResult {
    console.error(`[${this.config.name}] Error processing task:`, error, 'Context:', context);
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
        user_id: task.user?.id,
        response_time_ms: responseTimeMs,
        confidence_score: (result as unknown as AgentResult).confidence ?? null,
      }, interactionId);

      return { ...result, interactionId };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;
      await this.logInteractionMetrics({
        agent_id: this.config.id,
        session_id: task.sessionId,
        user_id: task.user?.id,
        response_time_ms: responseTimeMs,
        confidence_score: 0,
      }, interactionId);

      const agentResult = this.handleError(error as Error, task.context as AgentContext);
      return { ...agentResult, interactionId } as U & { interactionId: string };
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
      const queryEmbedding = await this.embeddingService.createEmbedding(query);
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
      console.error('Error searching long-term memory:', error);
      return [];
    }
  }
} 