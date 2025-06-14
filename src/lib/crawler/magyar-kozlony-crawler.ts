/**
 * Magyar Közlöny Crawler - Frontend Integration Version
 * 
 * PURPOSE: User-Initiated & Frontend Integration
 * This crawler is designed for on-demand crawling triggered by users or frontend components.
 * It provides immediate results for interactive use cases.
 * 
 * ARCHITECTURE: Extends BaseCrawler
 * - Optimized for frontend integration
 * - Simple, immediate document extraction
 * - Returns CrawlerResult for immediate frontend display
 * - Integrated with the main application's Supabase client
 * 
 * USE CASES:
 * - Manual crawling triggered by users
 * - Real-time document discovery
 * - Interactive legal research sessions
 * - Quick document verification
 * 
 * PERFORMANCE: Optimized for speed and immediate feedback
 * SCOPE: Focused, targeted crawling based on user queries
 * 
 * UPDATED: Enhanced based on analysis of magyarkozlony.hu/segitseg
 * - Improved search strategies matching human usage patterns
 * - Better document type recognition
 * - Enhanced metadata extraction
 * - More robust selectors based on actual site structure
 */

import { BaseCrawler } from './base-crawler';
import type { CrawlerResult, DocumentMetadata, CrawlerConfig } from './types';
import { supabase } from '@/integrations/supabase/client';
// import { PDFDocument } from 'pdf-lib'; // Unused import

export const MAGYAR_KOZLONY_CRAWLER_CONFIG: CrawlerConfig = {
  name: 'MagyarKozlonyCrawler',
  baseUrl: 'https://magyarkozlony.hu',
  maxRequestsPerMinute: 10,
  minDelayBetweenRequests: 1000,
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  }
};

export class MagyarKozlonyCrawler extends BaseCrawler {
  private readonly baseUrl = 'https://magyarkozlony.hu';
  private readonly searchUrl = `${this.baseUrl}/kereses`;
  private readonly advancedSearchUrl = `${this.baseUrl}/kereses/reszletes`;

  constructor() {
    super(MAGYAR_KOZLONY_CRAWLER_CONFIG);
  }

  async crawl(): Promise<CrawlerResult> {
    const startTime = new Date();
    const documents: DocumentMetadata[] = [];
    const errors: string[] = [];

    try {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      
      // Strategy 1: Recent publications (most common user pattern)
      const recentDocs = await this.crawlRecentPublications();
      documents.push(...recentDocs);

      // Strategy 2: Search by major legal categories
      const categoryDocs = await this.crawlByCategories();
      documents.push(...categoryDocs);

      // Strategy 3: Search by issuing authorities
      const authorityDocs = await this.crawlByAuthorities();
      documents.push(...authorityDocs);

    } catch (error) {
      const errorMsg = `Magyar Közlöny crawler error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }

    return {
      source: { name: 'Magyar Közlöny', url: this.baseUrl },
      documents: this.removeDuplicates(documents),
      errors,
      startTime,
      endTime: new Date()
    };
  }

  /**
   * Crawl recent publications - matches most common user behavior
   */
  private async crawlRecentPublications(): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    try {
      // Navigate to search page
      await this.page.goto(this.searchUrl, { waitUntil: 'networkidle' });
      
      // Set date filter to last 30 days (common user pattern)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      await this.page.fill('input[name="datum_tol"]', this.formatDate(thirtyDaysAgo));
      await this.page.fill('input[name="datum_ig"]', this.formatDate(new Date()));
      
      // Submit search
      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForLoadState('networkidle');
      
      // Extract documents from results
      const resultDocs = await this.extractDocumentsFromResults();
      documents.push(...resultDocs);
      
    } catch (error) {
      console.error('Error crawling recent publications:', error);
    }
    
    return documents;
  }

  /**
   * Crawl by major legal categories that users commonly search for
   */
  private async crawlByCategories(): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    // Common legal categories based on user behavior analysis
    const categories = [
      'adózás', 'egészségügy', 'oktatás', 'környezetvédelem', 
      'közigazgatás', 'gazdaság', 'munkaügy', 'szociális'
    ];
    
    for (const category of categories) {
      try {
        await this.page.goto(this.searchUrl, { waitUntil: 'networkidle' });
        
        // Search by category
        await this.page.fill('input[name="szoveg"], input[name="keresoszo"]', category);
        await this.page.click('button[type="submit"], input[type="submit"]');
        await this.page.waitForLoadState('networkidle');
        
        const categoryDocs = await this.extractDocumentsFromResults();
        documents.push(...categoryDocs);
        
        // Respect rate limiting
        await this.page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`Error crawling category ${category}:`, error);
      }
    }
    
    return documents;
  }

  /**
   * Crawl by major issuing authorities
   */
  private async crawlByAuthorities(): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    // Major Hungarian government authorities
    const authorities = [
      'Kormány', 'Belügyminisztérium', 'Pénzügyminisztérium',
      'Igazságügyi Minisztérium', 'Egészségügyi Minisztérium'
    ];
    
    for (const authority of authorities) {
      try {
        await this.page.goto(this.advancedSearchUrl, { waitUntil: 'networkidle' });
        
        // Search by issuing authority
        await this.page.fill('input[name="kiado"], select[name="kiado"]', authority);
        await this.page.click('button[type="submit"], input[type="submit"]');
        await this.page.waitForLoadState('networkidle');
        
        const authorityDocs = await this.extractDocumentsFromResults();
        documents.push(...authorityDocs);
        
        await this.page.waitForTimeout(1000);
        
      } catch (error) {
        console.error(`Error crawling authority ${authority}:`, error);
      }
    }
    
    return documents;
  }

  /**
   * Enhanced document extraction with better selectors and metadata
   */
  private async extractDocumentsFromResults(): Promise<DocumentMetadata[]> {
    const documents: DocumentMetadata[] = [];
    
    try {
      // Wait for results to load
      await this.page.waitForSelector('.talalat, .eredmeny, .dokumentum, .result-item', { timeout: 5000 });
      
      // Multiple selector strategies for different page layouts
      const resultSelectors = [
        '.talalat-lista .talalat',
        '.eredmeny-lista .eredmeny', 
        '.dokumentum-lista .dokumentum',
        '.result-list .result-item',
        'tr.talalat',
        '.search-result'
      ];
      
      let resultElements = [];
      for (const selector of resultSelectors) {
        resultElements = await this.page.locator(selector).all();
        if (resultElements.length > 0) break;
      }
      
      for (const element of resultElements) {
        try {
          const doc = await this.extractDocumentMetadata(element);
          if (doc) {
            documents.push(doc);
          }
        } catch (error) {
          console.error('Error extracting document metadata:', error);
        }
      }
      
    } catch (error) {
      console.error('Error extracting documents from results:', error);
    }
    
    return documents;
  }

  /**
   * Enhanced metadata extraction with better field recognition
   */
  private async extractDocumentMetadata(element: any): Promise<DocumentMetadata | null> {
    try {
      // Extract title with multiple strategies
      const titleSelectors = [
        '.cim', '.title', '.dokumentum-cim', 'h3', 'h4', '.result-title',
        'a[href*="dokumentum"]', '.doc-title'
      ];
      
      let title = '';
      for (const selector of titleSelectors) {
        const titleEl = element.locator(selector).first();
        if (await titleEl.count() > 0) {
          title = await titleEl.textContent() || '';
          if (title.trim()) break;
        }
      }
      
      if (!title.trim()) return null;
      
      // Extract document URL
      const linkSelectors = [
        'a[href*="dokumentum"]', 'a[href*="pdf"]', '.link', 'a.cim'
      ];
      
      let url = '';
      for (const selector of linkSelectors) {
        const linkEl = element.locator(selector).first();
        if (await linkEl.count() > 0) {
          url = await linkEl.getAttribute('href') || '';
          if (url) {
            url = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
            break;
          }
        }
      }
      
      // Extract publication date
      const dateSelectors = [
        '.datum', '.date', '.pub-date', '.kiadas-datum'
      ];
      
      let publishedDate = '';
      for (const selector of dateSelectors) {
        const dateEl = element.locator(selector).first();
        if (await dateEl.count() > 0) {
          publishedDate = await dateEl.textContent() || '';
          if (publishedDate.trim()) break;
        }
      }
      
      // Extract document type
      const typeSelectors = [
        '.tipus', '.type', '.doc-type', '.jogszabaly-tipus'
      ];
      
      let documentType = '';
      for (const selector of typeSelectors) {
        const typeEl = element.locator(selector).first();
        if (await typeEl.count() > 0) {
          documentType = await typeEl.textContent() || '';
          if (documentType.trim()) break;
        }
      }
      
      // Extract issuing authority
      const authoritySelectors = [
        '.kiado', '.authority', '.issuer', '.miniszterium'
      ];
      
      let issuingAuthority = '';
      for (const selector of authoritySelectors) {
        const authEl = element.locator(selector).first();
        if (await authEl.count() > 0) {
          issuingAuthority = await authEl.textContent() || '';
          if (issuingAuthority.trim()) break;
        }
      }
      
      // Extract document number/identifier
      const numberSelectors = [
        '.szam', '.number', '.doc-number', '.azonosito'
      ];
      
      let documentNumber = '';
      for (const selector of numberSelectors) {
        const numEl = element.locator(selector).first();
        if (await numEl.count() > 0) {
          documentNumber = await numEl.textContent() || '';
          if (documentNumber.trim()) break;
        }
      }
      
      return {
        title: title.trim(),
        url: url || `${this.baseUrl}/search-result`,
        content: '', // Will be extracted when document is accessed
        publishedDate: this.parseDate(publishedDate),
        documentType: documentType.trim() || 'Magyar Közlöny Document',
        issuingAuthority: issuingAuthority.trim(),
        documentNumber: documentNumber.trim(),
        keywords: this.extractKeywords(title, documentType, issuingAuthority),
        language: 'hu',
        jurisdiction: 'Hungary',
        source: 'Magyar Közlöny'
      };
      
    } catch (error) {
      console.error('Error extracting document metadata:', error);
      return null;
    }
  }

  /**
   * Enhanced keyword extraction based on Hungarian legal terminology
   */
  private extractKeywords(title: string, documentType: string, authority: string): string[] {
    const keywords = new Set<string>();
    
    // Add document type as keyword
    if (documentType) {
      keywords.add(documentType.toLowerCase());
    }
    
    // Add authority as keyword
    if (authority) {
      keywords.add(authority.toLowerCase());
    }
    
    // Hungarian legal keywords
    const legalTerms = [
      'törvény', 'rendelet', 'határozat', 'utasítás', 'szabályzat',
      'módosítás', 'kihirdetés', 'végrehajtás', 'eljárás', 'szabály',
      'adó', 'illeték', 'bírság', 'engedély', 'nyilvántartás',
      'egészségügy', 'oktatás', 'környezetvédelem', 'közigazgatás'
    ];
    
    const titleLower = title.toLowerCase();
    for (const term of legalTerms) {
      if (titleLower.includes(term)) {
        keywords.add(term);
      }
    }
    
    return Array.from(keywords);
  }

  /**
   * Improved date parsing for Hungarian date formats
   */
  private parseDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Hungarian date patterns: YYYY.MM.DD, YYYY-MM-DD, DD.MM.YYYY
    const patterns = [
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/,  // YYYY.MM.DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/  // DD.MM.YYYY
    ];
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        if (pattern === patterns[2]) { // DD.MM.YYYY format
          return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
        } else { // YYYY.MM.DD or YYYY-MM-DD format
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        }
      }
    }
    
    return dateStr;
  }

  /**
   * Format date for search inputs
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Remove duplicate documents based on title and URL
   */
  private removeDuplicates(documents: DocumentMetadata[]): DocumentMetadata[] {
    const seen = new Set<string>();
    return documents.filter(doc => {
      const key = `${doc.title}|${doc.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
} 