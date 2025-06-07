import { DomainService } from '../registry/DomainService';
import { LegalDomain, ProcessingRule, ComplianceRequirement } from '../types';
import { supabase } from '../../../integrations/supabase/client';

const mockDomainData = {
  id: '1',
  code: 'energy',
  name: 'Energy Law',
  description: 'Energy law domain',
  active: true,
  document_types: ['law', 'regulation'],
  created_at: '2024-03-23T00:00:00Z',
  updated_at: '2024-03-23T00:00:00Z',
  processing_rules: [
    { id: 'pr1', name: 'Rule 1', description: 'Rule 1 desc', pattern: '.*', priority: 1 },
  ],
  compliance_requirements: [
    { id: 'cr1', name: 'Req 1', description: 'Req 1 desc', deadline_type: 'standard', standard_period_days: 30, grace_period_days: 10, affected_entities: ['entity1'] },
  ],
};

jest.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockDomainData,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

const mockDomain: LegalDomain & { processingRules: ProcessingRule[], complianceRequirements: ComplianceRequirement[] } = {
  id: '1',
  code: 'energy',
  name: 'Energy Law',
  description: 'Energy law domain',
  active: true,
  documentTypes: ['law', 'regulation'],
  processingRules: [
    { id: 'pr1', name: 'Rule 1', description: 'Rule 1 desc', pattern: '.*', priority: 1 },
  ],
  complianceRequirements: [
    { id: 'cr1', name: 'Req 1', description: 'Req 1 desc', deadlineType: 'standard', standardPeriod: 30, gracePeriod: 10, affectedEntities: ['entity1'] },
  ],
  metadata: {
    created_at: '2024-03-23T00:00:00Z',
    updated_at: '2024-03-23T00:00:00Z',
  },
};

describe('DomainService', () => {
  let service: DomainService;

  beforeEach(() => {
    service = DomainService.getInstance();
    jest.clearAllMocks();
  });

  it('should throw an error when trying to register a new domain', async () => {
    const domain: Omit<LegalDomain, 'id' | 'metadata'> = {
      code: 'energy',
      name: 'Energy Law',
      description: 'Energy law domain',
      active: true,
      documentTypes: ['law', 'regulation'],
    };

    await expect(service.registerDomain(domain)).rejects.toThrow('registerDomain is not implemented for normalized schema');
  });

  it('should get a domain by code with rules and requirements', async () => {
    const domain = await service.getDomain('energy');
    expect(domain).toEqual(mockDomain);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should list all domains with rules and requirements', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [mockDomainData],
          error: null,
        })),
      })),
    }));

    const domains = await service.listDomains();
    expect(domains).toEqual([mockDomain]);
    expect(supabase.from).toHaveBeenCalledWith('legal_domains');
  });

  it('should throw an error when trying to update a domain', async () => {
    const updates = {
      name: 'Updated Energy Law',
      description: 'Updated description',
    };

    await expect(service.updateDomain('energy', updates)).rejects.toThrow('updateDomain is not implemented for normalized schema');
  });
}); 