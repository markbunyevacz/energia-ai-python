import { BaseAgent, AgentConfig, AgentResult, AgentContext } from '../base-agents/BaseAgent';
import { LegalDocument } from '@/core-legal-platform/legal-domains/types';
import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import axios from 'axios';

/**
 * @file ContractAnalysisAgent.ts
 * @description Defines the ContractAnalysisAgent, a specialized agent for reviewing and
 * analyzing legal contracts. It can extract clauses, identify risks, and suggest improvements.
 */

export class ContractAnalysisAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    const defaultConfig: Partial<AgentConfig> = {
      name: 'ContractAnalysisAgent',
      description: 'Analyzes legal contracts for risks, clauses, and compliance.',
      securityConfig: {
        requireAuth: true,
        allowedRoles: ['user', 'admin'],
        allowedDomains: ['energy'] // This agent is specific to the energy domain for now
      }
    };
    // The agent's ID and domainCode must be provided in the config.
    super({ ...defaultConfig, ...config });
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
        let analysisResult: any;
        switch (analysisType) {
            case 'risk_highlighting':
                analysisResult = await this.highlightRisksOrMissingElements(document);
                break;
            case 'compliance_checks':
                analysisResult = await this.suggestImprovementsOrComplianceChecks(document);
                break;
            default:
                // Default to a general analysis if no specific type is requested
                analysisResult = await this.highlightRisksOrMissingElements(document);
        }

        return {
            success: true,
            message: 'Analysis completed successfully.',
            data: analysisResult
        };
    } catch (error) {
        return this.handleError(error as Error, context);
    }
  }

  public async highlightRisksOrMissingElements(document: LegalDocument): Promise<any> {
    const prompt = `You are a legal contract analysis assistant... Analyze this contract for risks and missing elements:\n${document.content}`;
    return this.queryLanguageModel(prompt);
  }

  public async suggestImprovementsOrComplianceChecks(document: LegalDocument): Promise<any> {
    const prompt = `You are a legal contract improvement specialist... Suggest improvements for this contract:\n${document.content}`;
    return this.queryLanguageModel(prompt);
  }

  private async queryLanguageModel(prompt: string): Promise<any> {
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
         model: 'gpt-4',
         messages: [{ role: 'user', content: prompt }]
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error querying language model:', error);
        throw new ContractAnalysisError('Failed to get analysis from language model.', ErrorCodes.API_ERROR);
    }
  }
} 