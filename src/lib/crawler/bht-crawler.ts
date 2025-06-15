import { BaseCrawler } from './base-crawler';
import type { CrawlerConfig, CrawlerResult, CrawlerProxy } from './types';
import { Page } from 'playwright';

export const BHT_CRAWLER_CONFIG: CrawlerConfig = {
  name: 'BHTCrawler',
  baseUrl: 'https://birosag.hu/birosagi-hatarozatok-tara',
  maxRequestsPerMinute: 10,
  minDelayBetweenRequests: 1000,
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
  },
};

export class BHTCrawler extends BaseCrawler {
  private readonly searchTerms = ['energia', 'villamos energia', 'földgáz'];

  constructor(proxies: CrawlerProxy[] = []) {
    super(BHT_CRAWLER_CONFIG, proxies);
  }

  private async searchAndScrape(page: Page) {
    const documents: any[] = [];
    for (const term of this.searchTerms) {
      this.logger.info(`Searching for term: "${term}"`);
      await page.waitForSelector('#ujKeresesLink', { timeout: 60000 });
      await page.click('#ujKeresesLink');
      
      await page.waitForSelector('#szavakszovegben', { timeout: 60000 });
      await page.fill('#szavakszovegben', term);
      await page.click('button[type="submit"]');

      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 });

      const results = await this.scrapeResults(page);
      documents.push(...results);
    }
    return documents;
  }

  private async scrapeResults(page: Page) {
    const scrapedDocuments: any[] = [];
    const resultRows = await page.$$('table.table-striped tbody tr');

    for (const row of resultRows) {
        const caseNumber = await row.$eval('td:nth-child(2)', el => el.textContent?.trim());
        const courtName = await row.$eval('td:nth-child(3)', el => el.textContent?.trim());
        const decisionDate = await row.$eval('td:nth-child(4)', el => el.textContent?.trim());
        const summary = await row.$eval('td:nth-child(5)', el => el.textContent?.trim());
        const link = await row.$eval('td:nth-child(2) a', el => el.getAttribute('href'));

        if (caseNumber && courtName && decisionDate && summary && link) {
            scrapedDocuments.push({
                case_number: caseNumber,
                court_name: courtName,
                decision_date: decisionDate,
                summary: summary,
                full_text: '', // Will be fetched on demand
                jurisdiction: 'HU',
                source_url: `${this.config.baseUrl}/${link}`
            });
        }
    }
    this.logger.info(`Scraped ${scrapedDocuments.length} documents.`);
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

      await this.page.goto(this.config.baseUrl, { waitUntil: 'networkidle' });

      const iframeElement = await this.page.waitForSelector('#bht-iframe');
      if (!iframeElement) {
        throw new Error('Could not find the BHT iframe.');
      }

      const frame = await iframeElement.contentFrame();
      if (!frame) {
        throw new Error('Could not get content frame of BHT iframe.');
      }
      
      const documents = await this.searchAndScrape(frame);
      
      this.logger.info(`[${this.config.name}] Crawl finished successfully.`);
      await this.logCrawlResult(this.config.baseUrl, 'success');

      return {
        success: true,
        documents: documents,
        errors: [],
        startTime: startTime,
        endTime: new Date(),
        source: {
            id: 'bht',
            name: 'Bírósági Határozatok Tára',
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
            id: 'bht',
            name: 'Bírósági Határozatok Tára',
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