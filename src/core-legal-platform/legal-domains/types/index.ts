export type DocumentType = 'law' | 'regulation' | 'policy' | 'decision' | 'other';

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId: string;
  metadata: {
    created_at: string;
    updated_at: string;
  };
}

export interface LegalDomain {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  documentTypes: DocumentType[];
  processingRules: any[];
  complianceRequirements: any[];
  metadata: {
    created_at: string;
    updated_at: string;
  };
} 
