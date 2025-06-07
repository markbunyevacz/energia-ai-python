import { supabase } from '../../../integrations/supabase/client';
import { LegalDomain, ProcessingRule, ComplianceRequirement } from '../types';
import { Database } from '../../../integrations/supabase/types';

export class DomainService {
  private static instance: DomainService;

  private constructor() {}

  public static getInstance(): DomainService {
    if (!DomainService.instance) {
      DomainService.instance = new DomainService();
    }
    return DomainService.instance;
  }

  async registerDomain(domain: Omit<LegalDomain, 'id' | 'metadata'>): Promise<LegalDomain> {
    throw new Error('registerDomain is not implemented for normalized schema');
  }

  async getDomain(code: string): Promise<(LegalDomain & { processingRules: ProcessingRule[], complianceRequirements: ComplianceRequirement[] }) | null> {
    const { data, error } = await supabase
      .from('legal_domains')
      .select(`
        *,
        processing_rules (*),
        compliance_requirements (*)
      `)
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get domain: ${error.message}`);
    }

    return this.mapToDomain(data);
  }

  async listDomains(): Promise<(LegalDomain & { processingRules: ProcessingRule[], complianceRequirements: ComplianceRequirement[] })[]> {
    const { data, error } = await supabase
      .from('legal_domains')
      .select(`
        *,
        processing_rules (*),
        compliance_requirements (*)
      `)
      .eq('active', true);

    if (error) {
      throw new Error(`Failed to list domains: ${error.message}`);
    }

    return data.map(this.mapToDomain);
  }

  async updateDomain(code: string, updates: Partial<LegalDomain>): Promise<LegalDomain> {
    throw new Error('updateDomain is not implemented for normalized schema');
  }

  private mapToDomain(data: any): (LegalDomain & { processingRules: ProcessingRule[], complianceRequirements: ComplianceRequirement[] }) {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      active: data.active,
      documentTypes: data.document_types,
      processingRules: data.processing_rules.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        pattern: r.pattern,
        priority: r.priority,
      })),
      complianceRequirements: data.compliance_requirements.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        deadlineType: r.deadline_type,
        standardPeriod: r.standard_period_days,
        gracePeriod: r.grace_period_days,
        affectedEntities: r.affected_entities,
      })),
      metadata: {
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    };
  }
} 