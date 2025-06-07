export class EmbeddingService {
  async generateEmbedding(text: string): Promise<number[]> {
    // Mock implementation for now
    return new Array(1536).fill(0).map(() => Math.random());
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }

  async findSimilar(
    embedding: number[], 
    threshold: number, 
    limit: number, 
    options?: { excludeDomainId?: string }
  ): Promise<Array<{ id: string; similarity: number; content: string }>> {
    // Mock implementation for now
    return [];
  }
} 