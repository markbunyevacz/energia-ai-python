# Development Notes & Implementation Guide

This document serves as a comprehensive guide for developers working on the Energia Legal AI platform. It captures key architectural decisions, implementation patterns, and lessons learned during the development process.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Implementation Patterns](#key-implementation-patterns)
3. [Development Environment Setup](#development-environment-setup)
4. [Testing Strategy](#testing-strategy)
5. [Deployment & Infrastructure](#deployment--infrastructure)
6. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
7. [Performance Considerations](#performance-considerations)
8. [Security Guidelines](#security-guidelines)
9. [Future Development Guidelines](#future-development-guidelines)

---

## 🏗️ Architecture Overview

### Core Principles

The platform follows a **domain-driven design** approach with clear separation of concerns:

- **Agent-Based Architecture**: Each legal domain has specialized agents
- **Vector-Based Semantic Search**: All content is embedded for similarity matching
- **Event-Driven Updates**: Real-time notifications for legal changes
- **Microservice-Ready**: Modular design for future scaling

### Technology Stack

```
Frontend:  React + TypeScript + Vite + Tailwind CSS
Backend:   Supabase (PostgreSQL + Edge Functions + Auth + Storage)
AI/ML:     Custom embedding service + LLM integration
Crawling:  Playwright for web scraping
Testing:   Vitest + Testing Library
```

### Directory Structure

```
src/
├── core-legal-platform/          # Core business logic
│   ├── agents/                   # AI agents for different domains
│   ├── embedding/                # Vector embedding services
│   ├── crawlers/                 # Web crawling infrastructure
│   ├── notifications/            # Alert and notification systems
│   └── personalization/          # User preference management
├── integrations/                 # External service integrations
├── components/                   # Reusable UI components
├── pages/                        # Application pages/routes
└── test/                         # Test configuration and utilities
```

---

## 🔧 Key Implementation Patterns

### 1. Agent Pattern

All AI agents extend the `BaseAgent` class:

```typescript
export abstract class BaseAgent {
  abstract process(context: AgentContext): Promise<AgentResult>;
  
  // Common functionality:
  // - Error handling with structured logging
  // - Performance telemetry
  // - Chain-of-thought reasoning
  // - Memory integration
}
```

**Usage Guidelines:**
- Always implement proper error handling in `process()` method
- Use `this.logger` for consistent logging
- Return structured `AgentResult` with success/error states
- Include reasoning logs for transparency

### 2. Crawler Pattern

All web crawlers extend the `BaseCrawler` class:

```typescript
export abstract class BaseCrawler {
  async crawl(): Promise<CrawlResult> {
    // Template method pattern
    return await this.crawlImplementation();
  }
  
  protected abstract crawlImplementation(): Promise<CrawlResult>;
}
```

**Implementation Notes:**
- Use Playwright for JavaScript-heavy sites
- Implement retry logic for network failures
- Structure extracted data consistently
- Log progress and errors comprehensively

### 3. Service Layer Pattern

Services provide clean abstractions over external dependencies:

```typescript
// Example: EmbeddingService
export class EmbeddingService {
  async getEmbedding(content: string): Promise<number[]> {
    // Calls Supabase Edge Function
    // Handles errors gracefully
    // Returns standardized format
  }
}
```

**Best Practices:**
- Always validate inputs and outputs
- Implement proper error handling
- Use dependency injection where possible
- Document expected behavior clearly

---

## 🛠️ Development Environment Setup

### Prerequisites

1. **Node.js 18+** with npm/yarn
2. **Supabase CLI** for database management
3. **Docker Desktop** (optional, for Edge Function deployment)
4. **Git** with proper SSH keys configured

### Environment Configuration

Create `.env` file in project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development Settings
NODE_ENV=development
VITE_APP_ENV=development
```

### Database Setup

```bash
# Initialize Supabase locally
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Pull latest schema
supabase db pull

# Generate TypeScript types
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Edge Function Deployment

```bash
# Deploy without Docker (recommended)
npx supabase functions deploy create-embedding --project-ref your-project-ref --use-api
npx supabase functions deploy send-email --project-ref your-project-ref --use-api
```

---

## 🧪 Testing Strategy

### Test Structure

```
src/test/
├── globalSetup.ts              # Environment variable loading
├── setup.ts                    # Test environment configuration
└── __tests__/                  # Test files
    ├── unit/                   # Unit tests
    ├── integration/            # Integration tests
    └── e2e/                    # End-to-end tests
```

### Running Tests

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test:run -- CrossDomainImpactAnalyzer.test.ts
```

### Test Environment Notes

- **Environment Variables**: Loaded via `globalSetup.ts` before any tests run
- **Database**: Tests run against development database (no separate test DB)
- **Authentication**: Uses real Supabase auth for integration tests
- **Edge Functions**: Tests call deployed functions (not mocked)

### Writing Tests

```typescript
// Example test structure
describe('ServiceName', () => {
  beforeEach(() => {
    // Setup test data
  });

  it('should handle success case', async () => {
    // Arrange
    const input = 'test data';
    
    // Act
    const result = await service.method(input);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle error case gracefully', async () => {
    // Test error scenarios
  });
});
```

---

## 🚀 Deployment & Infrastructure

### Supabase Edge Functions

**Current Deployed Functions:**
- `create-embedding`: Generates vector embeddings for text content
- `send-email`: Handles email notifications via external service

**Deployment Process:**
1. Test function locally: `supabase functions serve`
2. Deploy to staging: `supabase functions deploy --project-ref staging-ref`
3. Test in staging environment
4. Deploy to production: `supabase functions deploy --project-ref prod-ref`

### Database Migrations

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Environment Management

- **Development**: Local Supabase + local Edge Functions
- **Staging**: Remote Supabase + deployed Edge Functions
- **Production**: Remote Supabase + deployed Edge Functions + monitoring

---

## ⚠️ Common Pitfalls & Solutions

### 1. Environment Variable Loading

**Problem**: Tests failing with authentication errors
**Solution**: Ensure `.env` file exists and `globalSetup.ts` loads it properly

```typescript
// src/test/globalSetup.ts
export default async () => {
  config({ path: path.resolve(__dirname, '../../.env') });
};
```

### 2. Supabase Type Mismatches

**Problem**: TypeScript errors when calling RPC functions
**Solution**: Regenerate types and use type assertions when necessary

```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 3. Edge Function Deployment Issues

**Problem**: 404 errors when calling Edge Functions
**Solution**: Ensure functions are deployed and use `--use-api` flag

```bash
npx supabase functions deploy function-name --use-api
```

### 4. Crawler Reliability

**Problem**: Crawlers failing due to network issues or site changes
**Solution**: Implement retry logic and robust error handling

```typescript
// Example retry implementation
async crawlWithRetry(maxRetries: number = 3): Promise<CrawlResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.crawlImplementation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await this.delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

---

## ⚡ Performance Considerations

### Database Optimization

1. **Indexing Strategy**:
   - Vector columns: Use `ivfflat` or `hnsw` indexes for embedding searches
   - Text search: Use GIN indexes for full-text search
   - Foreign keys: Always indexed for join performance

2. **Query Optimization**:
   - Use `select()` to limit returned columns
   - Implement pagination for large result sets
   - Use RPC functions for complex queries

### Embedding Service Performance

- **Batch Processing**: Process multiple documents in single requests
- **Caching**: Cache embeddings for frequently accessed content
- **Async Processing**: Use background jobs for large embedding operations

### Crawler Performance

- **Rate Limiting**: Implement delays between requests to avoid blocking
- **Parallel Processing**: Use worker pools for multiple concurrent crawls
- **Resource Management**: Properly close browser instances and connections

---

## 🔒 Security Guidelines

### Authentication & Authorization

1. **Row Level Security (RLS)**: Enabled on all user-accessible tables
2. **Role-Based Access**: Hierarchical roles (admin > legal_manager > analyst > viewer)
3. **API Security**: Service role key only used server-side

### Data Protection

1. **Input Validation**: Sanitize all user inputs
2. **SQL Injection Prevention**: Use parameterized queries
3. **XSS Protection**: Escape output in UI components
4. **CORS Configuration**: Restrict origins in production

### Edge Function Security

```typescript
// Example security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

---

## 🔮 Future Development Guidelines

### Scaling Considerations

1. **Horizontal Scaling**: Design services to be stateless
2. **Database Sharding**: Plan for multi-tenant architecture
3. **Caching Strategy**: Implement Redis for distributed caching
4. **Message Queues**: Use for async processing and job scheduling

### Code Quality Standards

1. **TypeScript Strict Mode**: Enable all strict type checking
2. **ESLint Configuration**: Enforce consistent code style
3. **Documentation**: Use JSDoc for all public APIs
4. **Testing**: Maintain 80%+ test coverage

### Monitoring & Observability

1. **Structured Logging**: Use consistent log formats
2. **Metrics Collection**: Track key performance indicators
3. **Error Tracking**: Implement error aggregation service
4. **Health Checks**: Monitor service availability

### AI/ML Integration

1. **Model Versioning**: Track embedding model versions
2. **A/B Testing**: Compare different AI approaches
3. **Cost Monitoring**: Track API usage and costs
4. **Quality Metrics**: Measure AI output quality

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Maintainer**: AI Assistant

> This document is a living guide that should be updated as the platform evolves. Please keep it current with new patterns, decisions, and lessons learned. 