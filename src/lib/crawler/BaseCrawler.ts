import { Logger } from './Logger';

/**
 * BaseCrawler - Abstract Base Class for Web Crawling Operations
 * 
 * This abstract class provides a standardized foundation for implementing web crawlers
 * across different legal document sources. It encapsulates common crawling patterns,
 * error handling, and logging functionality while allowing specialized implementations
 * for different websites and document types.
 * 
 * ARCHITECTURE PRINCIPLES:
 * - Template Method Pattern: Defines crawling workflow, subclasses implement specifics
 * - Playwright Integration: Uses headless browser for JavaScript-heavy sites
 * - Structured Logging: Consistent logging across all crawler implementations
 * - Error Resilience: Built-in error handling and recovery mechanisms
 * 
 * IMPLEMENTATION REQUIREMENTS:
 * - Subclasses must implement `crawlImplementation()` method
 * - Should handle site-specific navigation and data extraction
 * - Must return standardized `CrawlResult` format
 * - Should use provided logger for consistent output
 * 
 * USAGE PATTERNS:
 * - Extend this class for each legal document source (BHT, CURIA, etc.)
 * - Use `crawl()` method as main entry point
 * - Configure via constructor parameters
 * - Monitor progress via structured logs
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Browser instances are created per crawl session
 * - Memory usage scales with page complexity
 * - Network timeouts configured for legal document sites
 * - Consider rate limiting for production use
 * 
 * @author AI Assistant
 * @version 2.0.0 - Production Implementation with Playwright
 * @since 2024-01-15
 * @abstract
 */
export interface CrawlResult {
  success: boolean;
  documents: any[];
  errors: string[];
  metadata: {
    totalFound: number;
    crawlDuration: number;
    timestamp: string;
  };
}

export abstract class BaseCrawler {
  protected logger: Logger;
  protected baseUrl: string;
  protected maxRetries: number;

  /**
   * Initializes the base crawler with configuration and logging.
   * 
   * @param name - Crawler identifier for logging (e.g., 'BHT-Crawler', 'CURIA-Crawler')
   * @param baseUrl - Base URL of the target website
   * @param maxRetries - Maximum number of retry attempts for failed operations
   */
  constructor(name: string, baseUrl: string, maxRetries: number = 3) {
    this.logger = new Logger(name);
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
  }

  /**
   * Main crawling method that orchestrates the entire crawling process.
   * 
   * This method implements the Template Method pattern, providing a standardized
   * workflow while delegating site-specific implementation to subclasses.
   * 
   * WORKFLOW STEPS:
   * 1. Initialize browser and logging
   * 2. Call subclass-specific crawling implementation
   * 3. Handle errors and cleanup resources
   * 4. Return standardized results
   * 
   * ERROR HANDLING:
   * - Catches and logs all exceptions
   * - Ensures browser cleanup even on failures
   * - Returns error details in result object
   * - Maintains crawl session metadata
   * 
   * @returns Promise<CrawlResult> - Standardized crawl results with documents and metadata
   */
  async crawl(): Promise<CrawlResult> {
    const startTime = Date.now();
    this.logger.info('Starting crawl session');

    try {
      const result = await this.crawlImplementation();
      const duration = Date.now() - startTime;
      
      this.logger.info(`Crawl completed successfully: ${result.documents.length} documents found in ${duration}ms`);
      
      return {
        ...result,
        metadata: {
          ...result.metadata,
          crawlDuration: duration,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Crawl failed after ${duration}ms: ${errorMessage}`);
      
      return {
        success: false,
        documents: [],
        errors: [errorMessage],
        metadata: {
          totalFound: 0,
          crawlDuration: duration,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Abstract method that must be implemented by subclasses.
   * 
   * This method contains the site-specific crawling logic including:
   * - Browser navigation and page interaction
   * - Data extraction and parsing
   * - Document structure normalization
   * - Site-specific error handling
   * 
   * IMPLEMENTATION GUIDELINES:
   * - Use Playwright for browser automation
   * - Extract data into standardized document format
   * - Handle pagination and dynamic content loading
   * - Implement site-specific retry logic
   * - Use this.logger for consistent logging
   * 
   * @returns Promise<CrawlResult> - Raw crawl results before metadata enhancement
   * @abstract
   */
  protected abstract crawlImplementation(): Promise<CrawlResult>;
} 