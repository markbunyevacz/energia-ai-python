import { BaseCrawler } from './base-crawler';
import type { CrawlerConfig, CrawlerResult, CrawlerProxy } from './types';
import { Page } from 'playwright';

export const CURIA_CRAWLER_CONFIG: CrawlerConfig = {
  name: 'CURIACrawler',
  baseUrl: 'https://curia.europa.eu',
  maxRequestsPerMinute: 10,
  minDelayBetweenRequests: 1000,
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
  },
};

export class CURIACrawler extends BaseCrawler {
  private readonly searchTerms = ['energy', 'electricity', 'natural gas'];

  constructor(proxies: CrawlerProxy[] = []) {
    super(CURIA_CRAWLER_CONFIG, proxies);
  }

  private async searchAndScrape(page: Page) {
    const documents: any[] = [];
    const searchUrl = `${this.config.baseUrl}/jcms/jcms/j_6/en/jurisprudences`;
    
    for (const term of this.searchTerms) {
      this.logger.info(`Navigating to search page for term: "${term}"`);
      await page.goto(searchUrl, { waitUntil: 'networkidle' });

      await page.fill('input[name="sps"]', term);
      await page.click('button[type="submit"][name="j_id__v_0"]');
      await page.waitForNavigation({ waitUntil: 'networkidle' });
      
      // Scrape first 5 pages
      for (let i = 0; i < 5; i++) {
        const results = await this.scrapeResults(page);
        documents.push(...results);
        
        const nextButton = await page.$('a.next');
        if (nextButton) {
            await nextButton.click();
            await page.waitForNavigation({ waitUntil: 'networkidle' });
        } else {
            break;
        }
      }
    }
    return documents;
  }

  private async scrapeResults(page: Page) {
    const scrapedDocuments: any[] = [];
    const resultRows = await page.$$('div.content-results-item');

    for (const row of resultRows) {
        try {
            const caseNumber = await row.$eval('h3', el => el.textContent?.trim());
            const decisionDate = await row.$eval('p.date', el => el.textContent?.trim());
            const summary = await row.$eval('p.document-type', el => el.textContent?.trim());
            const link = await row.$eval('h3 a', el => el.getAttribute('href'));

            if (caseNumber && decisionDate && summary && link) {
                scrapedDocuments.push({
                    case_number: caseNumber,
                    court_name: 'Court of Justice of the European Union',
                    decision_date: decisionDate,
                    summary: summary,
                    full_text: '', // Will be fetched on demand
                    jurisdiction: 'EU',
                    source_url: `${this.config.baseUrl}${link}`
                });
            }
        } catch (error) {
            this.logger.warn('Could not scrape a result row.', error);
        }
    }
    this.logger.info(`Scraped ${scrapedDocuments.length} documents from page.`);
    return scrapedDocuments;
  }

  public async crawl(): Promise<CrawlerResult> {
    const startTime = new Date();
    try {
      await this.initialize();
      if (!this.page) {
        throw new Error("Page not initialized");
      }
      this.logger.info(`[${this.config.name}] Starting crawl...`);

      const documents = await this.searchAndScrape(this.page);
      
      this.logger.info(`[${this.config.name}] Crawl finished successfully.`);
      await this.logCrawlResult(this.config.baseUrl, 'success');

      return {
        success: true,
        documents: documents,
        errors: [],
        startTime: startTime,
        endTime: new Date(),
        source: {
            id: 'curia',
            name: 'CURIA - Court of Justice of the European Union',
            url: this.config.baseUrl,
            type: 'court_decision_portal',
            crawlFrequency: 1440
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      this.logger.error(`[${this.config.name}] Crawl failed: ${message}`);
      await this.logCrawlResult(this.config.baseUrl, 'error', message);
      return {
        success: false,
        documents: [],
        errors: [message],
        startTime: startTime,
        endTime: new Date(),
        source: {
            id: 'curia',
            name: 'CURIA - Court of Justice of the European Union',
            url: this.config.baseUrl,
            type: 'court_decision_portal',
            crawlFrequency: 1440
        }
      };
    } finally {
      await this.cleanup();
    }
  }
} 