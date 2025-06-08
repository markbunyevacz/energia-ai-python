import { supabase } from '@/integrations/supabase/client';
import { LegalDomain, LegalDomainRow } from '../types';

export class DomainRegistry {
  private static instance: DomainRegistry;
  private domains: Map<string, LegalDomain> = new Map();

  private constructor() {}

  public static getInstance(): DomainRegistry {
    if (!DomainRegistry.instance) {
      DomainRegistry.instance = new DomainRegistry();
    }
    return DomainRegistry.instance;
  }

  public async loadDomainsFromDb(): Promise<void> {
    const { data, error } = await supabase
      .from('legal_domains')
      .select('*')
      .eq('active', true);

    if (error) {
      console.error('Error loading domains:', error);
      throw new Error('Could not load legal domains from the database.');
    }

    this.domains.clear();
    data.forEach((row: LegalDomainRow) => {
        // The 'agent_config' is not a direct column. We'll assume it's part of the metadata.
        const metadata = row.metadata as Record<string, any> | null;
        const agentConfig = metadata?.agent_config ?? {};

        const domain: LegalDomain = {
            code: row.code,
            name: row.name,
            description: row.description ?? '',
            documentTypes: row.document_types ?? [],
            agentConfig: agentConfig,
            active: row.active ?? true,
        };
        this.domains.set(domain.code, domain);
    });
  }

  public getDomain(code: string): LegalDomain | null {
    return this.domains.get(code) || null;
  }

  public getActiveDomains(): LegalDomain[] {
    return Array.from(this.domains.values());
  }

  public registerDomain(domain: LegalDomain): void {
    if (this.domains.has(domain.code)) {
        console.warn(`Domain with code "${domain.code}" is already registered. Overwriting.`);
    }
    this.domains.set(domain.code, domain);
    console.log(`Domain "${domain.name}" registered successfully.`);
  }
} 