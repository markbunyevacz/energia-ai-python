/**
 * @file ChangeAnalyzer.ts
 *
 * @summary This service is responsible for analyzing legal documents to detect changes.
 * It will perform differential analysis between document versions and use NLP to summarize the changes.
 */

import { diffLines, type Change } from 'diff';
import embeddingService from '@/core-legal-platform/embedding/EmbeddingService';

const SIMILARITY_THRESHOLD = 0.75;
const MAX_MATCH_COUNT = 10;

export class ChangeAnalyzer {
  constructor() {
    // Service initialization will go here
  }

  /**
   * Analyzes the difference between two versions of a legal text.
   * @param oldText The previous version of the text.
   * @param newText The new version of the text.
   * @returns A summary of the detected changes.
   */
  public async analyzeChanges(oldText: string, newText: string): Promise<string> {
    const changes: Change[] = diffLines(oldText, newText);
    let addedLines = 0;
    let removedLines = 0;
    let summary = '';

    changes.forEach(part => {
      if (part.added) {
        addedLines += part.count || 0;
      } else if (part.removed) {
        removedLines += part.count || 0;
      }
    });

    if (addedLines > 0 || removedLines > 0) {
      summary = `Document updated. ${addedLines} line(s) added, ${removedLines} line(s) removed.`;
    } else {
      summary = 'Document content has been modified, but line counts are the same.';
    }

    // In a future implementation, this could be enhanced with an LLM call
    // to provide a more semantic summary of the changes.
    // For now, we return the basic diff summary.
    return summary;
  }

  /**
   * Identifies user documents that are impacted by a specific legal change.
   * @param changeContent The content of the legal change.
   * @returns A list of potentially impacted user document IDs and their relevance scores.
   */
  public async findImpactedDocuments(changeContent: string): Promise<{ documentId: string; score: number }[]> {
    console.log('Finding impacted documents...');
    
    try {
      // 1. Generate an embedding for the content of the legal change.
      const changeEmbedding = await embeddingService.getEmbedding(changeContent);

      // 2. Use the embedding service to find similar documents in the vector store.
      const similarDocuments = await embeddingService.findSimilarDocuments(
        changeEmbedding,
        SIMILARITY_THRESHOLD,
        MAX_MATCH_COUNT
      );

      // 3. Map the results to the required format.
      const impactedDocuments = similarDocuments.map(doc => ({
        documentId: doc.id,
        score: doc.metadata.similarity || 0,
      }));

      console.log(`Found ${impactedDocuments.length} potentially impacted documents.`);
      return impactedDocuments;

    } catch (error) {
      console.error('Error finding impacted documents:', error);
      return [];
    }
  }
} 