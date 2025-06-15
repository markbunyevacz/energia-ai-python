import { CitationGraphBuilder } from '../citation-graph/CitationGraphBuilder';
import { EmbeddingService } from '../embedding/EmbeddingService';
import { supabase } from '@/integrations/supabase/client';
import { Document } from './Document';
import { LegalTranslationManager, LanguageCode } from '../i18n/LegalTranslationManager';

// Stub for franc
const franc = (text: string, options?: { only?: string[] }): string => {
  if (text.includes('és') || text.includes('vagy') || text.includes('törvény')) return 'hun';
  if (text.includes('und') || text.includes('der') || text.includes('die')) return 'deu';
  return 'eng';
};

export interface ProcessingResult {
  originalText: string;
  detectedLanguage: LanguageCode | 'unknown';
}

export class DocumentProcessingService {
  private citationBuilder: CitationGraphBuilder;
  private translationManager: LegalTranslationManager;

  constructor(embeddingService: EmbeddingService, translationManager: LegalTranslationManager) {
    this.citationBuilder = new CitationGraphBuilder(
      supabase,
      embeddingService
    );
    this.translationManager = translationManager;
  }

  async processDocument(document: Document): Promise<void> {
    // This is a consolidated method.
    // The original logic for citation processing is preserved.
    // You can add calls to other processing steps like language detection here.
    const processingResult = await this.analyzeText(document.content);
    console.log(`Detected language: ${processingResult.detectedLanguage}`);
    
    // Process citations
    await this.citationBuilder.processDocument(document);
  }

  public detectLanguage(text: string): LanguageCode | 'unknown' {
    const langCode = franc(text, { only: ['hun', 'eng', 'deu'] });
    if (langCode === 'hun') return 'hu';
    if (langCode === 'eng') return 'en';
    if (langCode === 'deu') return 'de';
    return 'unknown';
  }

  public async analyzeText(documentText: string): Promise<ProcessingResult> {
    const language = this.detectLanguage(documentText);
    return {
      originalText: documentText,
      detectedLanguage: language,
    };
  }

  public async translate(text: string, targetLanguage: LanguageCode): Promise<string> {
    return this.translationManager.translateFullDocument(text, targetLanguage);
  }
} 