export class DocumentUpdater {
  constructor(
    private readonly hierarchyManager: import('@/types').HierarchyManager
  ) {}

  public async updateDocument(doc: import('@/types').Document): Promise<void> {
    // ... existing update logic
    
    // Trigger cascade invalidation
    await this.hierarchyManager.cascadeInvalidation(doc.id);
  }
} 