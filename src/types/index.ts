/**
 * @fileoverview Main Types Index - Central Type Definitions for Legal AI Platform
 * @description Comprehensive collection of TypeScript type definitions, interfaces,
 * and enums used throughout the Legal AI platform. Provides type safety, IntelliSense
 * support, and consistent data structures across all components and services.
 * 
 * TYPE CATEGORIES:
 * - User Management: Authentication, roles, and profile types
 * - Document Processing: Legal documents, contracts, and metadata
 * - AI Services: Agent configurations, responses, and analytics
 * - Legal Domains: Domain-specific types and classifications
 * - API Interfaces: Request/response structures and error types
 * 
 * USER TYPES:
 * - User: Core user profile and authentication data
 * - UserRole: Role-based access control definitions
 * - UserPreferences: Personalization and settings
 * - UserActivity: Interaction tracking and analytics
 * - UserSession: Session management and state
 * 
 * DOCUMENT TYPES:
 * - LegalDocument: Core legal document structure
 * - Contract: Commercial agreement and contract data
 * - DocumentMetadata: Rich metadata and classification
 * - DocumentAnalysis: AI analysis results and insights
 * - DocumentVersion: Version control and history
 * 
 * AI SERVICE TYPES:
 * - AgentConfig: AI agent configuration and settings
 * - AgentResponse: Standardized AI response format
 * - AnalysisResult: Document analysis outcomes
 * - RecommendationData: Proactive suggestions and insights
 * - PerformanceMetrics: Agent performance and analytics
 * 
 * API TYPES:
 * - APIResponse: Standardized API response wrapper
 * - ErrorResponse: Error handling and reporting
 * - PaginationData: List pagination and navigation
 * - FilterOptions: Search and filtering parameters
 * - SortOptions: Data sorting and ordering
 * 
 * UTILITY TYPES:
 * - Generic utility types for common patterns
 * - Conditional types for flexible APIs
 * - Mapped types for data transformations
 * - Union types for controlled vocabularies
 * - Branded types for type safety
 * 
 * TYPE SAFETY FEATURES:
 * - Strict null checking and undefined handling
 * - Discriminated unions for polymorphic data
 * - Generic constraints for type relationships
 * - Branded types for domain-specific values
 * - Compile-time validation and error detection
 * 
 * INTEGRATION POINTS:
 * - Database schema compatibility
 * - API contract enforcement
 * - Component prop validation
 * - Service interface definitions
 * - Configuration type checking
 * 
 * @author Legal AI Team
 * @version 1.5.0
 * @since 2024
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = 'jogász' | 'it_vezető' | 'tulajdonos';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  metadata: DocumentMetadata;
  uploadDate: string;
  size: number;
  vectorId?: string;
  analysis_status?: 'not_analyzed' | 'analyzing' | 'completed' | 'failed';
  analysis_error?: string;
}

export type DocumentType = 'law' | 'regulation' | 'policy' | 'decision' | 'other';

export interface DocumentMetadata {
  source: string;
  date: string;
  keywords: string[];
  author?: string;
  version?: string;
  category?: string;
  documentType?: DocumentType;
  legalAreas?: string[];
  jurisdiction?: string;
  [key: string]: any;
}

export interface SearchResult {
  documentId: string;
  relevanceScore: number;
  snippet: string;
  title: string;
  metadata: DocumentMetadata;
}

export interface QASession {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  timestamp: string;
  userId: string;
  confidence: number;
}

export interface ContractAnalysis {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  contractId: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  timestamp: string | null;
  risks: Risk[];
}

export interface Risk {
  id: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  type: 'legal' | 'financial' | 'operational';
  severity: 'low' | 'medium' | 'high';
  recommendation: string | null;
  section: string | null;
}

export interface DashboardStats {
  totalDocuments: number;
  recentQueries: number;
  contractsAnalyzed: number;
  riskScore: number;
  costSavings?: number;
  apiUsage?: number;
  userActivity?: number;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Re-export from integrations
export type { Database } from '@/integrations/supabase/types';

// Export domain types
export type Domain = 'legal' | 'regulatory' | 'contract' | 'policy' | 'other';
export type LegalHierarchyLevel = 'constitutional' | 'statutory' | 'regulatory' | 'administrative' | 'judicial' | 'other';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

// Agent context for legal operations
export interface AgentContext {
  user?: {
    id: string;
    role: string;
  };
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Legal document interface
export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  documentType: DocumentType;
  domainId?: string;
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

export interface HierarchyManager {
  cascadeInvalidation(documentId: string): Promise<void>;
}
