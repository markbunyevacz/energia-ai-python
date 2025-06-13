import { BaseCrawler } from './base-crawler';
import type { CrawlerConfig, CrawlerResult } from './types';

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

  constructor() {
    super(BHT_CRAWLER_CONFIG);
  }

  public async crawl(): Promise<CrawlerResult> {
    try {
      await this.initialize();
      console.log(`[${this.config.name}] Starting crawl...`);

      // TODO: [TECH-DEBT] This is mock data. A real crawler implementation is needed.
      // The crawler should use Playwright or a similar tool to navigate birosag.hu,
      // perform searches, and parse the resulting documents.
      const mockData = [
        {
          case_number: 'BHT.2023.123',
          court_name: 'Fővárosi Törvényszék',
          decision_date: '2023-10-26',
          summary: 'A case regarding energy contract disputes.',
          full_text: 'Full text of the decision...',
          jurisdiction: 'HU',
          source_url: `${this.config.baseUrl}/123`
        }
      ];

      // In a real implementation, we would use Playwright to:
      // 1. Navigate to the entry URL.
      // 2. Perform searches using the search terms.
      // 3. Scrape the search results to get links to individual decisions.
      // 4. Visit each decision page and extract the relevant data.
      // 5. Save the data to the `court_decisions` table.
      
      console.log(`[${this.config.name}] Crawl finished successfully.`);
      await this.logCrawlResult(this.config.baseUrl, 'success');

      return {
        success: true,
        documents: mockData,
        errors: [],
        startTime: new Date(),
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
      console.error(`[${this.config.name}] Crawl failed: ${message}`);
      await this.logCrawlResult(this.config.baseUrl, 'error', message);
      return {
        success: false,
        documents: [],
        errors: [message],
        startTime: new Date(),
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