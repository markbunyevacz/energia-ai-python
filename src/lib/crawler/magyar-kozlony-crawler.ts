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
import type { CrawlerResult, CrawlerConfig, CrawlerProxy } from './types';
import { supabase } from '@/integrations/supabase/client';
import type { Locator } from 'playwright';

// Custom interface for Magyar Közlöny documents
interface MagyarKozlonyDocument {
  title: string;
  url: string;
  content: string;
  publishedDate: string;
  documentType: string;
  issuingAuthority: string;
  documentNumber: string;
  keywords: string[];
  language: string;
  jurisdiction: string;
  source: string;
}

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

  constructor(proxies: CrawlerProxy[] = []) {
    super(MAGYAR_KOZLONY_CRAWLER_CONFIG, proxies);
  }

  async crawl(): Promise<CrawlerResult> {
    const startTime = new Date();
    const documents: MagyarKozlonyDocument[] = [];
    const errors: string[] = [];

    try {
      await this.initialize();
      if (!this.page) {
        throw new Error('Failed to initialize browser page');
      }

      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle' });
      await this.handleCookieBanner();
      
      const recentDocs = await this.crawlRecentPublications();
      documents.push(...recentDocs);

      const categoryDocs = await this.crawlByCategories();
      documents.push(...categoryDocs);

      const authorityDocs = await this.crawlByAuthorities();
      documents.push(...authorityDocs);

    } catch (error) {
      const errorMsg = `Magyar Közlöny crawler error: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(errorMsg, error);
      errors.push(errorMsg);
    } finally {
      await this.cleanup();
    }

    this.logger.info(`Crawl finished. Found ${documents.length} documents.`);
    return {
      success: errors.length === 0,
      source: { id: 'magyar_kozlony', name: 'Magyar Közlöny', url: this.baseUrl, type: 'official_gazette', crawlFrequency: 1440 },
      documents: this.removeDuplicates(documents),
      errors,
      startTime,
      endTime: new Date()
    };
  }

  private async humanLikeWait(min: number = 500, max: number = 1500): Promise<void> {
    if (!this.page) return;
    await this.page.waitForTimeout(Math.random() * (max - min) + min);
  }

  private async handleCookieBanner(): Promise<void> {
    if (!this.page) return;
    const cookieSelectors = [
        'button:has-text("Elfogadom")',
        'button:has-text("Accept all")',
        '#cookie-accept',
        '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll'
    ];
    try {
        this.logger.info('Looking for a cookie banner...');
        let clicked = false;
        for (const selector of cookieSelectors) {
            const button = this.page.locator(selector).first();
            if (await button.isVisible({ timeout: 2000 })) {
                this.logger.info(`Cookie banner found with selector "${selector}", clicking...`);
                await button.click();
                await this.page.waitForLoadState('networkidle', { timeout: 5000 });
                this.logger.info('Clicked cookie banner and waited for network idle.');
                clicked = true;
                break;
            }
        }
        if (!clicked) {
            this.logger.info('No cookie banner found matching known selectors.');
        }
    } catch (e) {
        this.logger.info('No cookie banner visible or an error occurred while handling it.');
    }
  }

  private async crawlRecentPublications(): Promise<MagyarKozlonyDocument[]> {
    if (!this.page) return [];
    this.logger.info('Crawling recent publications...');
    const documents: MagyarKozlonyDocument[] = [];
    try {
      await this.page.goto(this.searchUrl, { waitUntil: 'networkidle' });
      await this.humanLikeWait();

      this.logger.info('Setting date filter...');
      await this.page.waitForSelector('input[name="datum_tol"]', { timeout: 10000 });
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      await this.page.fill('input[name="datum_tol"]', this.formatDate(thirtyDaysAgo));
      await this.page.fill('input[name="datum_ig"]', this.formatDate(new Date()));
      
      this.logger.info('Submitting search...');
      await this.page.locator('button[type="submit"], input[type="submit"]').first().click();
      await this.page.waitForLoadState('networkidle');
      
      const resultDocs = await this.extractDocumentsFromResults();
      documents.push(...resultDocs);
    } catch (error) {
      this.logger.error('Error crawling recent publications:', error);
      await this.page.screenshot({ path: `error_recent_publications_${Date.now()}.png` });
    }
    return documents;
  }

  private async crawlByCategories(): Promise<MagyarKozlonyDocument[]> {
    if (!this.page) return [];
    this.logger.info('Crawling by categories...');
    const documents: MagyarKozlonyDocument[] = [];
    const categories = ['adózás', 'egészségügy', 'oktatás', 'környezetvédelem', 'közigazgatás', 'gazdaság', 'munkaügy', 'szociális'];
    
    for (const category of categories) {
      try {
        await this.page.goto(this.searchUrl, { waitUntil: 'networkidle' });
        this.logger.info(`Searching for category: ${category}`);
        await this.page.waitForSelector('input[name="szoveg"], input[name="keresoszo"]', { timeout: 10000 });
        await this.page.fill('input[name="szoveg"], input[name="keresoszo"]', category);
        await this.humanLikeWait();
        await this.page.locator('button[type="submit"], input[type="submit"]').first().click();
        await this.page.waitForLoadState('networkidle');
        
        const categoryDocs = await this.extractDocumentsFromResults();
        documents.push(...categoryDocs);
      } catch (error) {
        this.logger.error(`Error crawling category ${category}:`, error);
        await this.page.screenshot({ path: `error_category_${category}_${Date.now()}.png` });
      }
    }
    return documents;
  }

  private async crawlByAuthorities(): Promise<MagyarKozlonyDocument[]> {
    if (!this.page) return [];
    this.logger.info('Crawling by authorities...');
    const documents: MagyarKozlonyDocument[] = [];
    const authorities = ['Kormány', 'Belügyminisztérium', 'Pénzügyminisztérium', 'Igazságügyi Minisztérium', 'Egészségügyi Minisztérium'];
    
    for (const authority of authorities) {
      try {
        await this.page.goto(this.advancedSearchUrl, { waitUntil: 'networkidle' });
        this.logger.info(`Searching for authority: ${authority}`);
        await this.page.waitForSelector('input[name="kiado"], select[name="kiado"]', { timeout: 10000 });
        await this.page.fill('input[name="kiado"], select[name="kiado"]', authority);
        await this.humanLikeWait();
        await this.page.locator('button[type="submit"], input[type="submit"]').first().click();
        await this.page.waitForLoadState('networkidle');
        
        const authorityDocs = await this.extractDocumentsFromResults();
        documents.push(...authorityDocs);
      } catch (error) {
        this.logger.error(`Error crawling authority ${authority}:`, error);
        await this.page.screenshot({ path: `error_authority_${authority}_${Date.now()}.png` });
      }
    }
    return documents;
  }

  /**
   * Enhanced document extraction with better selectors and metadata
   */
  private async extractDocumentsFromResults(): Promise<MagyarKozlonyDocument[]> {
    const documents: MagyarKozlonyDocument[] = [];
    
    try {
      // Add null check for this.page
      if (!this.page) {
        throw new Error('Browser page not initialized');
      }
      
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
      
      let resultElements: Locator[] = [];
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
          // console.error('Error extracting document metadata:', error);
        }
      }
      
    } catch (error) {
      // console.error('Error extracting documents from results:', error);
    }
    
    return documents;
  }

  /**
   * Enhanced metadata extraction with better field recognition
   */
  private async extractDocumentMetadata(element: Locator): Promise<MagyarKozlonyDocument | null> {
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
      // console.error('Error extracting document metadata:', error);
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
  private removeDuplicates(documents: MagyarKozlonyDocument[]): MagyarKozlonyDocument[] {
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

// Module Priority Implementation
const implementationPhases = {
  phase1_foundation: [
    "Constitutional", "Criminal", "Civil", "Administrative", "Labor"
  ],
  phase2_economic: [
    "Corporate", "Tax", "Financial", "Competition"
  ],
  phase3_specialized: [
    "Environmental", "Healthcare", "Education", "Data Protection"
  ],
  phase4_remaining: [
    "All other specialized domains"
  ]
};

interface CrossDomainReferences {
  criminal_civil: "Damages, restitution",
  labor_tax: "Employment taxation",
  corporate_tax: "Business taxation",
  environmental_criminal: "Environmental crimes",
  administrative_constitutional: "Administrative review"
}

// Proposed Legal Domain Structure
const hungarianLegalDomains = {
  // 1. CONSTITUTIONAL & ADMINISTRATIVE LAW
  constitutional: {
    code: 'constitutional',
    name: 'Alkotmányjog és Közigazgatás',
    sources: ['Constitutional Court', 'Administrative Courts', 'Ombudsman'],
    agents: ['ConstitutionalAnalysisAgent', 'AdministrativeComplianceAgent'],
    keywords: ['alaptörvény', 'alkotmány', 'közigazgatás', 'eljárás']
  },

  // 2. CRIMINAL LAW
  criminal: {
    code: 'criminal',
    name: 'Büntetőjog',
    sources: ['BTK', 'Be.', 'Criminal Courts'],
    agents: ['CriminalLawAgent', 'CriminalProcedureAgent'],
    keywords: ['btk', 'büntetőjog', 'bűncselekmény', 'eljárás']
  },

  // 3. CIVIL LAW
  civil: {
    code: 'civil',
    name: 'Polgári Jog',
    sources: ['PTK', 'Civil Courts', 'Notary Regulations'],
    agents: ['CivilLawAgent', 'ContractAnalysisAgent', 'PropertyLawAgent'],
    keywords: ['ptk', 'szerződés', 'tulajdon', 'kártérítés']
  },

  // 4. COMMERCIAL & CORPORATE LAW
  commercial: {
    code: 'commercial',
    name: 'Társasági és Kereskedelmi Jog',
    sources: ['Gt.', 'Commercial Courts', 'Company Registry'],
    agents: ['CorporateLawAgent', 'CommercialContractAgent'],
    keywords: ['gt', 'társaság', 'cég', 'kereskedelmi']
  },

  // 5. LABOR LAW
  labor: {
    code: 'labor',
    name: 'Munkajog',
    sources: ['Mt.', 'Labor Courts', 'Labor Inspectorate'],
    agents: ['LaborLawAgent', 'EmploymentContractAgent'],
    keywords: ['mt', 'munkajog', 'foglalkoztatás', 'bér']
  },

  // 6. TAX LAW
  tax: {
    code: 'tax',
    name: 'Adójog',
    sources: ['Tax Code', 'NAV', 'Tax Courts'],
    agents: ['TaxLawAgent', 'TaxComplianceAgent'],
    keywords: ['adó', 'áfa', 'nav', 'adózás']
  },

  // 7. FINANCIAL LAW
  financial: {
    code: 'financial',
    name: 'Pénzügyi Jog',
    sources: ['Hpt.', 'MNB', 'Financial Supervisory Authority'],
    agents: ['BankingLawAgent', 'FinancialComplianceAgent'],
    keywords: ['hpt', 'bank', 'pénzügy', 'mnb']
  },

  // 8. ENERGY LAW (Already implemented)
  energy: {
    code: 'energy',
    name: 'Energiajog',
    sources: ['MEKH', 'Energy Regulations', 'EU Energy Directives'],
    agents: ['EnergyContractAgent', 'EnergyComplianceAgent'],
    keywords: ['energia', 'mekh', 'villamos', 'gáz']
  },

  // 9. ENVIRONMENTAL LAW
  environmental: {
    code: 'environmental',
    name: 'Környezetjog',
    sources: ['Environmental Ministry', 'Environmental Courts'],
    agents: ['EnvironmentalComplianceAgent', 'EnvironmentalImpactAgent'],
    keywords: ['környezet', 'hulladék', 'levegő', 'víz']
  },

  // 10. DATA PROTECTION & IT LAW
  dataProtection: {
    code: 'data_protection',
    name: 'Adatvédelem és IT Jog',
    sources: ['NAIH', 'GDPR', 'IT Security Regulations'],
    agents: ['DataProtectionAgent', 'CyberSecurityAgent'],
    keywords: ['gdpr', 'adatvédelem', 'naih', 'informatika']
  }
};

// Example domain configuration (for reference only)
export const hungarianLegalDomainsConfig = hungarianLegalDomains; 
