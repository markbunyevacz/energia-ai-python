import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LegalDomain } from '../../src/core-legal-platform/legal-domains/types';

// Define mocks at the top level of the test file
const mockEq = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('../../src/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('Architectural Tests for Domain Abstraction', () => {

  beforeEach(() => {
    vi.resetModules(); // Reset module cache before each test to handle singletons correctly
    vi.clearAllMocks();
    // Provide a default empty mock for all tests to prevent unhandled rejections
    mockEq.mockResolvedValue({ data: [], error: null });
  });

  describe('DomainRegistry', () => {
    it('should initialize with zero domains', async () => {
      const { DomainRegistry } = await import('../../src/core-legal-platform/legal-domains/registry/DomainRegistry');
      const domainRegistry = DomainRegistry.getInstance();
      
      await domainRegistry.loadDomainsFromDb();
      expect(domainRegistry.getActiveDomains()).toHaveLength(0);
      expect(mockFrom).toHaveBeenCalledWith('legal_domains');
    });

    it('should load one or more domains correctly', async () => {
        const { DomainRegistry } = await import('../../src/core-legal-platform/legal-domains/registry/DomainRegistry');
        const domainRegistry = DomainRegistry.getInstance();
        
        const mockDomains: LegalDomain[] = [
            { code: 'energy', name: 'Energy Law', description: 'Energy sector regulations', documentTypes: [], agentConfig: {}, active: true },
            { code: 'labor', name: 'Labor Law', description: 'Employment regulations', documentTypes: [], agentConfig: {}, active: true },
        ];
        mockEq.mockResolvedValue({ data: mockDomains, error: null });

        await domainRegistry.loadDomainsFromDb();

        expect(domainRegistry.getActiveDomains()).toHaveLength(2);
        expect(domainRegistry.getDomain('energy')).toEqual(mockDomains[0]);
    });
  });

  describe('AIAgentRouter', () => {
    it('should have empty keyword lists when no domains are loaded', async () => {
      // The mock is already configured in beforeEach to return zero domains.
      // We just need to import the router, which will trigger its initialization.
      const AIAgentRouter = (await import('../../src/core-legal-platform/routing/AIAgentRouter')).default;
      
      // Allow the async constructor logic to complete
      await new Promise(resolve => setImmediate(resolve));

      // Now we can inspect the state of the singleton instance
      expect((AIAgentRouter as any).contractKeywords).toEqual([]);
      expect((AIAgentRouter as any).legalResearchKeywords).toEqual([]);
      expect((AIAgentRouter as any).complianceKeywords).toEqual([]);
    });
  });
}); 