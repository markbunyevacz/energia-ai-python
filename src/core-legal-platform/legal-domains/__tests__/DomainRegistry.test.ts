import { DomainRegistry } from '../registry/DomainRegistry';
import { DomainService } from '../registry/DomainService';
import { LegalDomain, ProcessingRule, ComplianceRequirement } from '../types';

jest.mock('../registry/DomainService');

const mockFullDomain: LegalDomain & { processingRules: ProcessingRule[], complianceRequirements: ComplianceRequirement[] } = {
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

describe('DomainRegistry', () => {
  let registry: DomainRegistry;
  let mockDomainService: jest.Mocked<DomainService>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance for DomainRegistry
    (DomainRegistry as any).instance = undefined;
    mockDomainService = {
      registerDomain: jest.fn().mockResolvedValue(mockFullDomain),
      getDomain: jest.fn().mockResolvedValue(mockFullDomain),
      listDomains: jest.fn().mockResolvedValue([mockFullDomain]),
      updateDomain: jest.fn().mockResolvedValue(mockFullDomain),
    } as any;
    (DomainService.getInstance as jest.Mock).mockReturnValue(mockDomainService);
    registry = DomainRegistry.getInstance();
  });

  it('should register a new domain', async () => {
    const domain: Omit<LegalDomain, 'id' | 'metadata'> = {
      code: 'energy',
      name: 'Energy Law',
      description: 'Energy law domain',
      active: true,
      documentTypes: ['law', 'regulation'],
    };
    const registered = await registry.registerDomain(domain);
    expect(registered).toEqual(mockFullDomain);
    expect(mockDomainService.registerDomain).toHaveBeenCalledWith(domain);
  });

  it('should retrieve a registered domain', async () => {
    const domain = await registry.getDomain('energy');
    expect(domain).toEqual(mockFullDomain);
    expect(mockDomainService.getDomain).toHaveBeenCalledWith('energy');
  });

  it('should list all domains', async () => {
    const domains = await registry.listDomains();
    expect(domains).toEqual([mockFullDomain]);
    expect(mockDomainService.listDomains).toHaveBeenCalled();
  });

  it('should update a domain', async () => {
    const updates = {
      name: 'Updated Energy Law',
      description: 'Updated description',
    };
    await registry.updateDomain('energy', updates);
    expect(mockDomainService.updateDomain).toHaveBeenCalledWith('energy', updates);
  });

  it('should validate domain configuration', () => {
    const invalidDomain = {
      code: '',
      name: '',
      description: 'Invalid domain',
      active: true,
      documentTypes: [],
    };
    // @ts-expect-error: Accessing private method for test
    expect(() => registry.validateDomain(invalidDomain)).toThrow('Domain must have a code, name, and description');
  });
}); 