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

// Extend existing DocumentType enum
export type DocumentType = Database['public']['Enums']['document_type'];
export type LegalHierarchyLevel = Database['public']['Enums']['legal_hierarchy_level'];

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId: string;
  hierarchyLevel?: LegalHierarchyLevel;
  crossReferences?: {
    documentId: string;
    relationshipType: string;
    metadata?: Record<string, any>;
  }[];
  metadata: {
    created_at: string;
    updated_at: string;
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