import { DomainRegistry } from '../registry/DomainRegistry';
import { LegalDomain } from '../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => {
  const eq = vi.fn().mockResolvedValue({ data: [], error: null });
  const select = vi.fn(() => ({ eq }));
  return {
    supabase: {
      from: vi.fn(() => ({ select })),
    }
  }
});

const mockDomain: LegalDomain = {
  code: 'energy',
  name: 'Energy Law',
  description: 'Energy law domain',
  active: true,
  documentTypes: ['law', 'regulation'],
  agentConfig: {},
};

describe('DomainRegistry', () => {
  let registry: DomainRegistry;

  beforeEach(() => {
    vi.clearAllMocks();
    (DomainRegistry as any).instance = undefined;
    registry = DomainRegistry.getInstance();
    (supabase.from('legal_domains').select('*').eq as vi.Mock).mockResolvedValue({
        data: [
            {
                code: 'energy',
                name: 'Energy Law',
                description: 'Energy law domain',
                document_types: ['law', 'regulation'],
                metadata: { agent_config: {} },
                active: true,
            }
        ],
        error: null,
    });
  });

  it('should be a singleton', () => {
    const instance1 = DomainRegistry.getInstance();
    const instance2 = DomainRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should load domains from the database', async () => {
    await registry.loadDomainsFromDb();
    const domain = registry.getDomain('energy');
    expect(domain).toBeDefined();
    expect(domain?.name).toBe('Energy Law');
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should retrieve a registered domain', () => {
    registry.registerDomain(mockDomain);
    const domain = registry.getDomain('energy');
    expect(domain).toEqual(mockDomain);
  });

  it('should return null for a non-existent domain', () => {
    const domain = registry.getDomain('non-existent');
    expect(domain).toBeNull();
  });

  it('should list all active domains', () => {
    registry.registerDomain(mockDomain);
    const domains = registry.getActiveDomains();
    expect(domains).toHaveLength(1);
    expect(domains[0]).toEqual(mockDomain);
  });

  it('should handle errors when loading from DB', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (supabase.from('legal_domains').select('*').eq as vi.Mock).mockResolvedValue({
        data: null,
        error: new Error('DB Error'),
    });

    await expect(registry.loadDomainsFromDb()).rejects.toThrow('Could not load legal domains from the database.');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading domains:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
}); 