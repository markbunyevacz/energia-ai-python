export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  hierarchyLevel: import('@/types').LegalHierarchyLevel;
  // ... other existing properties ...
} 
