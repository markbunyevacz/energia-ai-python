import { LegalDocument } from '@/core-legal-platform/legal-domains/types';

export interface AgentTask<T = any> {
  query?: string;
  documentId?: string;
  context?: AgentContext;
  sessionId: string;
  user?: { id: string; role?: string };
  data?: T;
}

export interface AgentResponse {
  [key: string]: any;
}

export interface AgentConfig {
  id: string;
  name:string;
  description: string;
  domainCode: string;
  enabled: boolean;
  metadata?: Record<string, any>;
  cacheConfig?: {
    ttl: number; // Time to live in seconds
    maxSize: number; // Maximum number of items in cache
  };
  batchConfig?: {
    maxBatchSize: number; // Maximum number of documents to process in a batch
    batchTimeout: number; // Maximum time to wait for batch completion in milliseconds
  };
  securityConfig?: {
    requireAuth: boolean; // Whether authentication is required
    allowedRoles: string[]; // Roles that can access this agent
    allowedDomains: string[]; // Domains this agent can access
  };
}

export interface AgentContext {
  document?: LegalDocument;
  sessionId: string;
  user?: { id: string; role?: string };
  domain: string;
  query?: string;
}

export interface AgentResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  confidence?: number;
} 