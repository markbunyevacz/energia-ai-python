import { BaseAgent, AgentConfig, AgentResult, AgentContext } from '../base-agents/BaseAgent';
import { LegalDocument } from '@/core-legal-platform/legal-domains/types';
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import axios from 'axios';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';

/**
 * @file ContractAnalysisAgent.ts
 * @description Defines the ContractAnalysisAgent, a specialized agent for reviewing and
 * analyzing legal contracts. It can extract clauses, identify risks, and suggest improvements.
 */

export const CONTRACT_ANALYSIS_AGENT_CONFIG: AgentConfig = {
    id: 'contract-analysis-agent',
    name: 'Contract Analysis Agent',
    description: 'Analyzes legal contracts for risks, clauses, and compliance.',
    domainCode: 'energy', // This agent is specific to the energy domain for now
    enabled: true,
    securityConfig: {
      requireAuth: true,
      allowedRoles: ['jogász', 'admin'],
      allowedDomains: ['energy']
    }
};


export class ContractAnalysisAgent extends BaseAgent {
  constructor(domainRegistry?: DomainRegistry) {
    super(CONTRACT_ANALYSIS_AGENT_CONFIG, domainRegistry);
  }

  public async initialize(): Promise<void> {
    // This agent has no special initialization requirements for now.
    // In a real scenario, this could involve connecting to a dedicated NLP service.
    console.log(`${this.config.name} initialized.`);
    return Promise.resolve();
  }

  public async process(context: AgentContext): Promise<AgentResult> {
    const { document, metadata } = context;
    const analysisType = metadata?.analysisType; // e.g., 'risk_highlighting'

    if (!document || !document.content) {
        return this.handleError(new ContractAnalysisError('Document content is missing.', ErrorCodes.INVALID_CONTRACT_FORMAT), context);
    }

    try {
        // The logic for calling an LLM is now enabled.
        const prompt = `Analyze the following legal document and provide a risk analysis. Document Title: "${document.title}". Content: """${document.content}""". Please provide:
        1. A brief summary of the document.
        2. A list of potential risks, their severity (high, medium, low), a description, and a recommendation for each.
        3. A list of general recommendations for improvement.
        
        Please format the output as a JSON object with keys: "summary", "risks" (an array of objects with keys "type", "severity", "description", "recommendation", "section"), and "recommendations" (an array of strings).`;

        const analysisResult = await this.queryLanguageModel(prompt);

        return {
            success: true,
            message: 'Analysis completed successfully.',
            data: analysisResult
        };
    } catch (error) {
        return this.handleError(error as Error, context);
    }
  }

  private async queryLanguageModel(prompt: string): Promise<any> {
    try {
        // Import the AI factory for dynamic creation
        const { createTaskAI } = await import('@/llm/ai-factory');
        const aiService = createTaskAI('analysis');
        
        const result = await aiService.generate(prompt);
        // The LLM returns a stringified JSON, so we need to parse it.
        return JSON.parse(result.content);
    } catch (error) {
        console.error('Error querying language model:', error);
        throw new ContractAnalysisError('Failed to get analysis from language model.', ErrorCodes.API_ERROR);
    }
  }
} 