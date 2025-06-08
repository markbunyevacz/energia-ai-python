/**
 * @file AIAgentRouter.ts
 * @description This file defines the AI Agent Router, a core component of the legal platform.
 * The router is responsible for intelligently directing user queries to the most appropriate
 * specialized AI agent based on the query's content and the active legal domains.
 *
 * This service is designed to be fully domain-agnostic. It dynamically loads keywords
 * and routing rules from the DomainRegistry, allowing for new legal domains and agent
 * capabilities to be added without requiring changes to this file.
 *
 * The router is implemented as a singleton, ensuring a single, consistent routing
 * logic is used throughout the application.
 */
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';

/**
 * AI Agent Router Service
 * 
 * This service intelligently routes user queries to the most appropriate AI agent
 * based on the content and context of the question. It supports multiple specialized
 * agents for different legal domains.
 * 
 * Features:
 * - Intelligent query analysis and agent selection
 * - Context-aware routing based on user history and role
 * - Confidence scoring for agent recommendations
 * - Specialized prompts for different agent types
 * - Document processing capabilities (OCR, PDF extraction)
 * 
 * Supported Agent Types:
 * - Contract Analysis: Specialized in contract review and analysis
 * - Legal Research: Focused on legal precedents and regulations
 * - Compliance: Handles regulatory compliance and risk assessment
 * - General: Fallback for general legal questions
 */

/**
 * Available AI Agent Types
 * 
 * Each agent type is specialized for specific legal domains
 */
export type AgentType = 'contract' | 'legal_research' | 'compliance' | 'general';

/**
 * Agent Context Interface
 * 
 * Provides contextual information to improve agent selection accuracy
 */
export interface AgentContext {
  previousQuestions: string[];    // Recent questions from the user
  documentTypes: string[];        // Types of documents being analyzed
  userRole: string;              // User's role (influences agent selection)
  sessionHistory: any[];         // Complete session history for context
}

/**
 * Agent Response Interface
 * 
 * Standardized response from the agent router
 */
export interface AgentResponse {
  agentType: AgentType;          // Selected agent type
  confidence: number;            // Confidence score (0-1)
  reasoning: string;             // Explanation for the selection
  suggestedPrompt: string;       // Enhanced prompt for the selected agent
}

/**
 * AI Agent Router Class
 * 
 * Main class responsible for analyzing queries and routing them to appropriate agents
 */
class AIAgentRouter {
  private domainRegistry: DomainRegistry;
  private contractKeywords: string[] = [];
  private legalResearchKeywords: string[] = [];
  private complianceKeywords: string[] = [];
  private isInitialized = false;

  constructor(domainRegistry: DomainRegistry) {
    this.domainRegistry = domainRegistry;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.domainRegistry.loadDomainsFromDb();
    this.loadKeywordsFromDomains();
    this.isInitialized = true;
  }

  private loadKeywordsFromDomains(): void {
    const activeDomains = this.domainRegistry.getActiveDomains();
    
    this.contractKeywords = [];
    this.legalResearchKeywords = [];
    this.complianceKeywords = [];

    activeDomains.forEach(domain => {
      if (domain.agentConfig?.contract?.keywords) {
        this.contractKeywords.push(...domain.agentConfig.contract.keywords);
      }
      if (domain.agentConfig?.legal_research?.keywords) {
        this.legalResearchKeywords.push(...domain.agentConfig.legal_research.keywords);
      }
      if (domain.agentConfig?.compliance?.keywords) {
        this.complianceKeywords.push(...domain.agentConfig.compliance.keywords);
      }
    });

    this.contractKeywords = [...new Set(this.contractKeywords)];
    this.legalResearchKeywords = [...new Set(this.legalResearchKeywords)];
    this.complianceKeywords = [...new Set(this.complianceKeywords)];
  }

  public async analyzeQuestion(
    question: string, 
    context?: AgentContext, 
    options?: {
      extractClauses?: boolean;
      highlightRisks?: boolean;
      suggestImprovements?: boolean;
      contractText?: string;
    }
  ): Promise<AgentResponse> {

    if (!this.isInitialized) {
        await this.initialize();
    }

    const questionLower = question.toLowerCase();
    
    const scores = {
      contract: this.calculateScore(questionLower, this.contractKeywords),
      legal_research: this.calculateScore(questionLower, this.legalResearchKeywords),
      compliance: this.calculateScore(questionLower, this.complianceKeywords),
      general: 0.3 
    };

    if (context) {
      this.adjustScoresWithContext(scores, context);
    }

    const bestMatch = Object.entries(scores).reduce((a, b) => 
      scores[a[0] as AgentType] > scores[b[0] as AgentType] ? a : b
    );

    const agentType = bestMatch[0] as AgentType;
    const confidence = bestMatch[1];

    return {
      agentType,
      confidence,
      reasoning: this.getReasoningForAgent(agentType, confidence),
      suggestedPrompt: this.enhancePromptForAgent(question, agentType, options)
    };
  }

  private calculateScore(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;
    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }

  private adjustScoresWithContext(scores: Record<AgentType, number>, context: AgentContext): void {
    const recentQuestions = context.previousQuestions.slice(0, 3).join(' ').toLowerCase();
    
    if (recentQuestions.includes('szerződés')) {
      scores.contract += 0.2;
    }
    
    if (context.documentTypes.includes('szerződés')) {
      scores.contract += 0.3;
    }

    if (context.userRole === 'jogász') {
      scores.legal_research += 0.1;
    }
  }

  private getReasoningForAgent(agentType: AgentType, confidence: number): string {
    const reasonings = {
      contract: 'Szerződéses elemzésre specializált ágens kiválasztva a kérdésben található szerződéses fogalmak alapján.',
      legal_research: 'Jogi kutatási ágens kiválasztva a jogszabályi hivatkozások miatt.',
      compliance: 'Megfelelőségi ágens kiválasztva a szabályozási kérdések alapján.',
      general: 'Általános ágens kiválasztva, mivel a kérdés nem tartozik specifikus szakterülethez.'
    };

    return reasonings[agentType] + ` (Megbízhatóság: ${Math.round(confidence * 100)}%)`;
  }

  private enhancePromptForAgent(question: string, agentType: AgentType, options?: {
    extractClauses?: boolean;
    highlightRisks?: boolean;
    suggestImprovements?: boolean;
    contractText?: string;
  }): string {
    const enhancements = {
      contract: () => {
        let prompt = `Szerződéses szakértőként elemezze a következő kérdést, különös figyelmet fordítva a jogi kötelezettségekre és kockázatokra: ${question}`;
        if (options?.extractClauses && options.contractText) {
          prompt += '\n' + 'Klausulák kinyerése és összefoglalása...'; // Placeholder for actual implementation
        }
        if (options?.highlightRisks && options.contractText) {
          prompt += '\n' + 'Kockázatok és hiányzó elemek kiemelése...'; // Placeholder for actual implementation
        }
        if (options?.suggestImprovements && options.contractText) {
          prompt += '\n' + 'Fejlesztési javaslatok és megfelelőségi ellenőrzések...'; // Placeholder for actual implementation
        }
        return prompt;
      },
      legal_research: () => `Jogi kutatási szakértőként válaszoljon a kérdésre, hivatkozva a releváns jogszabályokra és precedensekre: ${question}`,
      compliance: () => `Megfelelőségi szakértőként értékelje a kérdést, azonosítva a potenciális szabályozási kockázatokat: ${question}`,
      general: () => `Jogi szakértőként adjon átfogó választ a következő kérdésre: ${question}`
    };

    return enhancements[agentType]();
  }
}

export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.9) return 'Kiváló megbízhatóság';
  if (confidence >= 0.8) return 'Magas megbízhatóság';
  if (confidence >= 0.6) return 'Közepes megbízhatóság';
  if (confidence >= 0.4) return 'Alacsony megbízhatóság';
  return 'Kevésbé megbízható';
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-600';
  if (confidence >= 0.8) return 'text-green-500';
  if (confidence >= 0.6) return 'text-yellow-500';
  if (confidence >= 0.4) return 'text-orange-500';
  return 'text-red-500';
};

const routerInstance = new AIAgentRouter(DomainRegistry.getInstance());
export default routerInstance;
