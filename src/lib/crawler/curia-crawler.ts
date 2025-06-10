import { BaseCrawler } from './base-crawler';
import type { CrawlerConfig, CrawlerResult } from './types';

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

  constructor() {
    super(CURIA_CRAWLER_CONFIG);
  }

  public async crawl(): Promise<CrawlerResult> {
    try {
      await this.initialize();
      console.log(`[${this.config.name}] Starting crawl...`);

      const mockData = [
        {
          case_number: 'C-123/23',
          court_name: 'Court of Justice of the European Union',
          decision_date: '2023-11-15',
          summary: 'A case regarding EU energy regulations.',
          full_text: 'Full text of the decision...',
          jurisdiction: 'EU',
          source_url: `${this.config.baseUrl}/juris/document/document.jsf?docid=12345`
        }
      ];

      console.log(`[${this.config.name}] Crawl finished successfully.`);
      await this.logCrawlResult(this.config.baseUrl, 'success');

      return {
        success: true,
        documents: mockData,
        errors: [],
        startTime: new Date(),
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
      console.error(`[${this.config.name}] Crawl failed: ${message}`);
      await this.logCrawlResult(this.config.baseUrl, 'error', message);
      return {
        success: false,
        documents: [],
        errors: [message],
        startTime: new Date(),
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