import { vi } from 'vitest';

vi.mock('../../../core-legal-platform/embedding/EmbeddingService', () => {
  return {
    EmbeddingService: vi.fn().mockImplementation(() => {
      return {
        getEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      };
    }),
  };
}); 