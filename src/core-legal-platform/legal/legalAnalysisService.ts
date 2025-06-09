import { ContractAnalysisError, ErrorCodes } from '@/types/errors';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/types/supabase';
import LRU from 'lru-cache';
import { BaseAgent, AgentContext } from '@/core-legal-platform/agents/base-agents/BaseAgent';
import { LegalDocument } from '@/core-legal-platform/legal-domains/types';
import { MixtureOfExpertsRouter, MoEContext } from '@/core-legal-platform/routing/MixtureOfExpertsRouter';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { conversationContextManager } from '@/core-legal-platform/common/conversationContext';

type DocumentType = Database['public']['Enums']['document_type'];
type RiskLevel = Database['public']['Enums']['risk_level'];
type RiskType = Database['public']['Enums']['risk_type'];

// Optimalizált cache beállítások
const cache = new LRU<string, any>({
  max: 1000, // Növelt cache méret
  maxAge: 1000 * 60 * 30, // 30 perc
  length: (value) => {
    // A cache méretét a memóriahasználat alapján számoljuk
    return JSON.stringify(value).length;
  },
  dispose: (key, _value) => {
    // Cache törléskor felszabadítjuk a memóriát
    console.log(`Cache entry removed: ${key}`);
  }
});

export interface LegalAnalysisResult {
  risk: RiskLevel;
  suggestions: string[];
  fileName: string;
  analysisType: string;
  notes?: string;
  confidence: number;
  processingTime: number;
  metrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  totalTime: number;
  textExtractionTime: number;
  chunkingTime: number;
  analysisTime: number;
  storageTime: number;
  memoryUsage: number;
  chunkCount: number;
  averageChunkSize: number;
  cacheHits: number;
  cacheMisses: number;
}

export class LegalAnalysisService {
  private readonly CHUNK_SIZE = 2000; // Optimalizált chunk méret
  private readonly BATCH_SIZE = 10; // Optimalizált batch méret
  private readonly MIN_CHUNK_SIZE = 500; // Minimális chunk méret
  private readonly MAX_CHUNK_SIZE = 4000; // Maximális chunk méret
  private cacheStats = {
    hits: 0,
    misses: 0
  };

  private moeRouter: MixtureOfExpertsRouter;
  private agentPool: BaseAgent[];

  constructor(moeRouter: MixtureOfExpertsRouter, agentPool: BaseAgent[]) {
    this.moeRouter = moeRouter;
    this.agentPool = agentPool;
  }

  private chunkDocument(text: string, _maxChunkSize: number = this.CHUNK_SIZE): string[] {
    // Use sentence boundaries for better context
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentWordCount = 0;
    let currentSentenceCount = 0;

    for (const sentence of sentences) {
      const sentenceWordCount = sentence.split(/\s+/).length;
      
      // Optimalizált chunk méret számítás
      const optimalChunkSize = Math.min(
        Math.max(this.MIN_CHUNK_SIZE, sentenceWordCount * 2),
        this.MAX_CHUNK_SIZE
      );
      
      if (currentWordCount + sentenceWordCount > optimalChunkSize || currentSentenceCount >= 5) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentWordCount = 0;
          currentSentenceCount = 0;
        }
        
        // Handle long sentences
        if (sentenceWordCount > optimalChunkSize) {
          const words = sentence.split(/\s+/);
          let tempChunk = '';
          let tempWordCount = 0;
          
          for (const word of words) {
            if (tempWordCount + 1 > optimalChunkSize) {
              chunks.push(tempChunk.trim());
              tempChunk = word;
              tempWordCount = 1;
            } else {
              tempChunk += (tempChunk ? ' ' : '') + word;
              tempWordCount++;
            }
          }
          
          if (tempChunk) {
            currentChunk = tempChunk;
            currentWordCount = tempWordCount;
            currentSentenceCount = 1;
          }
        } else {
          currentChunk = sentence;
          currentWordCount = sentenceWordCount;
          currentSentenceCount = 1;
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentWordCount += sentenceWordCount;
        currentSentenceCount++;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  private async processChunksInBatches(
    chunks: string[],
    agent: BaseAgent,
    document: LegalDocument
  ): Promise<{ risks: string; improvements:string }[]> {
    const results: { risks: string; improvements: string }[] = [];
    
    // Process chunks in optimal batch sizes
    for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
      const batch = chunks.slice(i, i + this.BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          const cacheKey = `chunk_${chunk.substring(0, 100)}_${agent.getConfig().id}`;
          const cached = cache.get(cacheKey);
          
          if (cached) {
            this.cacheStats.hits++;
            return cached;
          }

          this.cacheStats.misses++;

          const tempDoc: LegalDocument = { ...document, content: chunk };
          const context: AgentContext = { document: tempDoc, domain: agent.getConfig().domainCode };
          const agentResult = await agent.process(context);
          
          if (!agentResult.success) {
            // For simplicity, we'll return empty results for failed chunks.
            // A more robust implementation might retry or log the error differently.
            return { risks: '', improvements: '' };
          }

          // This part is tricky as the agent result format is generic.
          // We'll assume a structure for now and this should be standardized.
          const risks = agentResult.data?.risks?.map((r: any) => r.description).join('\n') || '';
          const improvements = agentResult.data?.recommendations?.join('\n') || '';

          const result = { risks, improvements };
          cache.set(cacheKey, result);
          return result;
        })
      );
      
      results.push(...batchResults);

      // Add small delay between batches to prevent overload
      if (i + this.BATCH_SIZE < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  private validateInput(file: File, analysisType: string): void {
    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new ContractAnalysisError(
        'Csak PDF fájlok támogatottak',
        ErrorCodes.INVALID_FILE_TYPE,
        'error'
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new ContractAnalysisError(
        'A fájl mérete nem lehet nagyobb 10MB-nál',
        ErrorCodes.FILE_TOO_LARGE,
        'error'
      );
    }

    // Validate analysis type
    const allowedAnalysisTypes = ['contract', 'policy', 'regulation'];
    if (!allowedAnalysisTypes.includes(analysisType)) {
      throw new ContractAnalysisError(
        'Érvénytelen elemzési típus',
        ErrorCodes.INVALID_ANALYSIS_TYPE,
        'error'
      );
    }
  }

  private calculateConfidence(risks: string, improvements: string): number {
    // Implement confidence calculation based on analysis quality
    const riskCount = risks.split('\n').filter(line => line.trim()).length;
    const improvementCount = improvements.split('\n').filter(line => line.trim()).length;
    
    // More detailed analysis = higher confidence
    const baseConfidence = Math.min((riskCount + improvementCount) / 10, 1);
    
    // Adjust based on analysis quality
    const qualityScore = this.assessAnalysisQuality(risks, improvements);
    
    return Math.min(baseConfidence * qualityScore, 1);
  }

  private assessAnalysisQuality(risks: string, improvements: string): number {
    // Implement quality assessment logic
    const hasSpecificRisks = risks.includes('kockázat') || risks.includes('hiányzó');
    const hasSpecificImprovements = improvements.includes('javaslat') || improvements.includes('ajánlott');
    
    return hasSpecificRisks && hasSpecificImprovements ? 1 : 0.7;
  }

  private determineRiskLevel(risks: string): RiskLevel {
    const riskCount = risks.split('\n').filter(line => line.trim()).length;
    
    if (riskCount > 5) return 'high';
    if (riskCount > 2) return 'medium';
    return 'low';
  }

  private formatSuggestions(improvements: string): string[] {
    return improvements
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim());
  }

  private async storeAnalysis(data: {
    fileName: string;
    analysisType: string;
    notes?: string;
    risks: string;
    improvements: string;
    confidence: number;
  }): Promise<void> {
    try {
      const { error } = await supabase.from('legal_documents').insert({
        title: data.fileName,
        document_type: data.analysisType as DocumentType,
        content: `${data.risks}\n${data.improvements}`,
        summary: {
          risks: data.risks,
          improvements: data.improvements,
          notes: data.notes,
        } as unknown as Json
      });

      if (error) {
        throw new ContractAnalysisError(
          `Hiba az elemzés mentése során: ${error.message}`,
          ErrorCodes.API_ERROR,
          'error'
        );
      }
    } catch (error) {
      if (error instanceof ContractAnalysisError) {
        throw error;
      }
      throw new ContractAnalysisError(
        `Ismeretlen hiba az elemzés mentése során: ${(error as Error).message}`,
        ErrorCodes.API_ERROR,
        'error'
      );
    }
  }

  private async collectPerformanceMetrics(
    startTime: number,
    metrics: Partial<PerformanceMetrics>
  ): Promise<void> {
    // This table does not exist, so we comment this out.
    // try {
    //   await supabase.from('performance_metrics').insert({
    //     metric_type: 'legal_analysis',
    //     duration_ms: performance.now() - startTime,
    //     metadata: metrics as Json,
    //   });
    // } catch (error) {
    //   console.error('Error storing performance metrics:', error);
    // }
  }

  async analyzeDocument(
    file: File,
    analysisType: string,
    notes?: string
  ): Promise<LegalAnalysisResult> {
    const startTime = performance.now();
    const metrics: Partial<PerformanceMetrics> = {
      cacheHits: this.cacheStats.hits,
      cacheMisses: this.cacheStats.misses,
    };

    try {
      this.validateInput(file, analysisType);

      // 1. Extract text from the document
      const textExtractionStart = performance.now();
      // This is a placeholder for text extraction. In a real scenario, you'd use a library.
      const documentText = await file.text();
      metrics.textExtractionTime = performance.now() - textExtractionStart;

      // 2. Chunk the document
      const chunkingStart = performance.now();
      const chunks = this.chunkDocument(documentText);
      metrics.chunkingTime = performance.now() - chunkingStart;
      metrics.chunkCount = chunks.length;
      metrics.averageChunkSize = chunks.reduce((acc, c) => acc + c.length, 0) / chunks.length;

      // 3. Find the best agent for the task
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      const conversation = user ? await conversationContextManager.getContext(user.id) : null;
      const moeContext: MoEContext = {
        document: {
          id: file.name,
          title: file.name,
          content: documentText,
          documentType: analysisType as DocumentType,
          domainId: '', // Will be updated by agent
          metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        },
        conversation,
        domain: '', // Domain will be determined by agents
        user: {
          id: user?.id || '',
          role: 'jogász', // Default role
          permissions: [],
        }
      };
      
      const agentScores = await this.moeRouter.routeQuery(notes || documentText, moeContext);
      if (agentScores.length === 0) {
        throw new ContractAnalysisError('Nincs megfelelő AI ágens a feladathoz.', ErrorCodes.API_ERROR);
      }
      const bestAgent = agentScores[0].agent;

      // 4. Analyze chunks in batches
      const analysisStart = performance.now();
      const legalDocument: LegalDocument = {
        id: file.name,
        title: file.name,
        content: documentText,
        documentType: analysisType as DocumentType,
        domainId: bestAgent.getConfig().domainCode,
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      const chunkResults = await this.processChunksInBatches(chunks, bestAgent, legalDocument);
      metrics.analysisTime = performance.now() - analysisStart;

      // 5. Aggregate results
      const allRisks = chunkResults.map(r => r.risks).filter(r => r).join('\n');
      const allImprovements = chunkResults.map(r => r.improvements).filter(i => i).join('\n');

      // 6. Calculate confidence and risk level
      const confidence = this.calculateConfidence(allRisks, allImprovements);
      const riskLevel = this.determineRiskLevel(allRisks);

      // 7. Store the analysis
      const storageStart = performance.now();
      await this.storeAnalysis({
        fileName: file.name,
        analysisType,
        notes,
        risks: allRisks,
        improvements: allImprovements,
        confidence,
      });
      metrics.storageTime = performance.now() - storageStart;

      // 8. Collect performance metrics
      await this.collectPerformanceMetrics(startTime, metrics);

      return {
        risk: riskLevel,
        suggestions: this.formatSuggestions(allImprovements),
        fileName: file.name,
        analysisType,
        notes,
        confidence,
        processingTime: performance.now() - startTime,
        metrics: metrics as PerformanceMetrics,
      };
    } catch (error) {
      // Error handling logic...
      if (error instanceof ContractAnalysisError) {
        throw error;
      }
      throw new ContractAnalysisError(
        `Ismeretlen hiba a dokumentum elemzése során: ${(error as Error).message}`,
        ErrorCodes.API_ERROR,
        'error'
      );
    }
  }
}

export const legalAnalysisService = new LegalAnalysisService(); 