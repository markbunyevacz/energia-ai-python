import type { Database } from '@/integrations/supabase/types';

export type LegalDomainRow = Database['public']['Tables']['legal_domains']['Row'];

export interface LegalDomain {
  code: string;
  name: string;
  description: string;
  documentTypes: string[];
  agentConfig: {
    contract?: { keywords: string[] };
    legal_research?: { keywords: string[] };
    compliance?: { keywords: string[] };
  };
  active: boolean;
}

export type DocumentType = 'law' | 'regulation' | 'policy' | 'decision' | 'other';
export type LegalHierarchyLevel = Database['public']['Enums']['legal_hierarchy_level'];

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId: string;
  metadata: {
    [key: string]: any;
  };
}

export interface LegalHierarchy {
  id: string;
  parentDocumentId: string;
  childDocumentId: string;
  relationshipType: string;
  metadata?: Record<string, any>;
} 