import { CitationGraphBuilder } from '../CitationGraphBuilder';
import { vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

vi.mock('@supabase/supabase-js', () => {
  const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: 'mock-doc-id' }, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  };

  const mockSupabase = {
    from: vi.fn(() => mockQueryBuilder),
  };

  return {
    createClient: vi.fn(() => mockSupabase),
  };
});

// Mock dependencies
const mockEmbeddingService = {
  findSimilarDocuments: vi.fn().mockResolvedValue([
    { id: 'doc2', content: 'Related document', embedding: [0.1, 0.2] }
  ])
};

describe('CitationGraphBuilder', () => {
  let builder: CitationGraphBuilder;
  const testDocument = {
    id: 'doc1',
    content: 'Reference to 42 U.S.C. § 1983',
    embedding: [0.1, 0.2, 0.3],
    metadata: {
      title: 'Test Document',
      citation: 'Test Citation',
      documentType: 'Statute',
      date: '2023-01-01'
    }
  };

  beforeEach(() => {
    builder = new CitationGraphBuilder(
      mockEmbeddingService as any
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should process a document and store citations', async () => {
    const processDocumentSpy = vi.spyOn(builder, 'processDocument');
    await builder.processDocument(testDocument as any);
    expect(processDocumentSpy).toHaveBeenCalledWith(testDocument);
  });
}); 
