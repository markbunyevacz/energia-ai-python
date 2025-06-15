import { ExampleAgent } from '../ExampleAgent';
import { AgentConfig, AgentContext, AgentTask, AgentResult } from '../../base-agents/BaseAgent';
import { LegalDocument } from '../../../legal-domains/types';
import { DomainRegistry } from '../../../legal-domains/registry/DomainRegistry';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BaseLLM } from '@/llm/base-llm';

vi.mock('../../../legal-domains/registry/DomainRegistry');
vi.mock('@/llm/base-llm');

const mockLLM = {
    generate: vi.fn().mockResolvedValue({ content: 'mocked response' }),
} as unknown as BaseLLM;

describe('ExampleAgent', () => {
  let domainRegistry: DomainRegistry;
  const mockConfig: AgentConfig = {
    id: 'example-agent',
    name: 'Example Agent',
    description: 'An example agent implementation',
    domainCode: 'test-domain',
    enabled: true,
  };

  const mockDocument: LegalDocument = {
    id: 'doc-1',
    title: 'Test Document',
    content: 'Test content',
    documentType: 'law',
    domainId: 'test-domain',
    metadata: {
      created_at: '2024-03-23T00:00:00Z',
      updated_at: '2024-03-23T00:00:00Z',
    },
  };

  const mockDomain = {
    id: '1',
    code: 'test-domain',
    name: 'Test Domain',
    description: 'Test domain description',
    active: true,
    documentTypes: ['law'],
    processingRules: [],
    complianceRequirements: [],
    metadata: {
      created_at: '2024-03-23T00:00:00Z',
      updated_at: '2024-03-23T00:00:00Z',
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock DomainRegistry
    vi.mocked(DomainRegistry.getInstance).mockReturnValue({
      getDomain: vi.fn().mockResolvedValue(mockDomain),
    } as any);
  });

  it('should initialize with zero processing count', () => {
    const agent = new ExampleAgent({ ...mockConfig }, mockLLM);
    expect(agent.getProcessingCount()).toBe(0);
  });

  it('should process a document successfully', async () => {
    const agent = new ExampleAgent({ ...mockConfig }, mockLLM);
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
      sessionId: 'test-session-1',
    };
    const task: AgentTask = { context, sessionId: 'test-session-1' };

    const result = await agent.process(task) as AgentResult;
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      processed: true,
      count: 1,
      domain: 'test-domain',
      documentId: 'doc-1',
    });
    expect(agent.getProcessingCount()).toBe(1);
  });

  it('should handle disabled state', async () => {
    const agent = new ExampleAgent({ ...mockConfig }, mockLLM);
    agent.setEnabled(false);
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
      sessionId: 'test-session-2',
    };
    const task: AgentTask = { context, sessionId: 'test-session-2' };

    const result = await agent.process(task);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Agent is disabled');
  });

  it('should handle missing domain', async () => {
    const agentWithNoDomain = new ExampleAgent({ ...mockConfig }, mockLLM);
    await agentWithNoDomain.initialize();

    // Mock getDomain to return null for this agent instance
    vi.spyOn(agentWithNoDomain, 'getDomain').mockResolvedValue(null);

    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
      sessionId: 'test-session-3',
    };
    const task: AgentTask = { context, sessionId: 'test-session-3' };

    const result = await agentWithNoDomain.process(task);
    expect(result.success).toBe(false);
    expect(result.error).toContain(`Domain ${mockConfig.domainCode} not found`);
  });

  it('should clean up resources', async () => {
    const agent = new ExampleAgent({ ...mockConfig }, mockLLM);
    // Process a document first
    const context: AgentContext = {
      document: mockDocument,
      domain: 'test-domain',
      sessionId: 'test-session-4',
    };
    const task: AgentTask = {
      context: context,
      sessionId: 'test-session-4',
    }
    const processSpy = vi.spyOn(agent, 'process').mockImplementation(async (task: AgentTask) => {
        (agent as any).processingCount++;
        return { success: true, data: {} };
    });

    await agent.process(task);
    expect(agent.getProcessingCount()).toBe(1);

    // Clean up
    await agent.cleanup();
    expect(agent.getProcessingCount()).toBe(0);

    processSpy.mockRestore();
  });
}); 
