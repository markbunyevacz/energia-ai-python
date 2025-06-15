/**
 * @fileoverview Legal Domain Types - Domain-Specific Legal Knowledge Structures
 * @description Core type definitions for legal domain management, including document
 * types, legal domains, agent configurations, and domain-specific metadata used
 * throughout the Legal AI platform for specialized legal knowledge processing.
 * 
 * DOMAIN ARCHITECTURE:
 * - Legal domains for specialized knowledge areas (energy, general, etc.)
 * - Document type classification for content organization
 * - Agent configuration for domain-specific AI behavior
 * - Metadata structures for rich document information
 * 
 * LEGAL DOCUMENT TYPES:
 * - law: Legislative acts and statutes
 * - regulation: Administrative regulations and rules
 * - policy: Organizational policies and procedures
 * - decision: Court decisions and administrative rulings
 * - other: Miscellaneous legal documents
 * 
 * DOMAIN SPECIALIZATION:
 * - Energy sector legal knowledge and regulations
 * - General legal principles and common law
 * - Contract law and commercial agreements
 * - Compliance and regulatory frameworks
 * - Extensible domain system for new areas
 * 
 * AGENT CONFIGURATION:
 * - Domain-specific agent behavior settings
 * - Keyword sets for content matching
 * - Confidence thresholds for agent selection
 * - Performance optimization parameters
 * - Integration with MoE routing system
 * 
 * METADATA STRUCTURES:
 * - Document classification and tagging
 * - Legal jurisdiction and authority
 * - Effective dates and version control
 * - Cross-references and citations
 * - Compliance and regulatory mappings
 * 
 * TYPE SAFETY:
 * - Strict TypeScript interfaces for domain data
 * - Enum types for controlled vocabularies
 * - Optional fields for flexible metadata
 * - Union types for polymorphic structures
 * 
 * INTEGRATION POINTS:
 * - Domain Registry for domain management
 * - AI agents for specialized processing
 * - Document services for content handling
 * - Search and filtering systems
 * 
 * EXTENSIBILITY:
 * - Pluggable domain system for new legal areas
 * - Configurable agent behaviors per domain
 * - Flexible metadata schemas
 * - Scalable type definitions
 * 
 * @author Legal AI Team
 * @version 1.2.0
 * @since 2024
 */
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
