import { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { supabase } from '@/integrations/supabase/client';
import type { CrawlerConfig, CrawlerProxy, CrawlerResult } from './types';
// import type { CrawlerProxy } from './types.js'; // Unused import
import { RateLimiter } from './rate-limiter';
import { AdvancedProxyManager } from './advanced-proxy-manager';
import { HeaderRotator } from './header-rotator';
import { Logger } from '../logging/logger';

chromium.use(stealth());

export abstract class BaseCrawler {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected readonly config: CrawlerConfig;
  protected readonly rateLimiter: RateLimiter;
  protected readonly proxyManager: AdvancedProxyManager;
  protected readonly headerRotator: HeaderRotator;
  protected readonly logger: Logger;

  private currentProxy: CrawlerProxy | null = null;

  constructor(
    config: CrawlerConfig,
    proxies: CrawlerProxy[] = [],
    proxyManager?: AdvancedProxyManager
  ) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.maxRequestsPerMinute);
    this.proxyManager = proxyManager || new AdvancedProxyManager(proxies);
    this.headerRotator = new HeaderRotator();
    this.logger = new Logger(this.config.name);
  }

  protected async initialize(): Promise<void> {
    try {
      if (this.browser) return;

      this.currentProxy = this.proxyManager.getNextProxy();
      const headers = this.headerRotator.getRandomHeader();
      
      const launchOptions: any = {
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled', // General anti-detection
        ],
      };

      if (this.currentProxy) {
        launchOptions.proxy = {
          server: this.currentProxy.server,
          username: this.currentProxy.username,
          password: this.currentProxy.password,
        };
      }

      this.browser = await chromium.launch(launchOptions);
      this.context = await this.browser.newContext({
        extraHTTPHeaders: headers,
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true, // Useful for some proxy setups
      });
      
      this.page = await this.context.newPage();
      // Spoof webdriver property
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });
      await this.page.setDefaultTimeout(this.config.timeout || 30000);

    } catch (error) {
      if (this.currentProxy) {
        this.proxyManager.reportFailure(this.currentProxy.server);
      }
      this.logger.error('Failed to initialize browser:', error);
      console.error('Error in initialize:', error);
      throw error;
    }
  }

  protected async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async logCrawlResult(url: string, status: 'success' | 'error', error?: string): Promise<void> {
    if (status === 'success' && this.currentProxy) {
      this.proxyManager.reportSuccess(this.currentProxy.server);
    } else if (status === 'error' && this.currentProxy) {
      this.proxyManager.reportFailure(this.currentProxy.server);
    }
    
    try {
      const { error: dbError } = await supabase
        .from('system_health')
        .insert({
          service_name: this.config.name,
          status,
          error_message: error,
          created_at: new Date().toISOString()
        });

      if (dbError) {
        this.logger.error('Failed to log crawl result:', dbError);
      }
    } catch (error) {
      this.logger.error('Failed to log crawl result:', error);
    }
  }

  protected async navigate(url: string, options?: Parameters<Page['goto']>[1]): Promise<void> {
    try {
      const response = await this.page?.goto(url, options);
      if (response && !response.ok() && this.currentProxy) {
        this.proxyManager.reportFailure(this.currentProxy.server);
        throw new Error(`Navigation failed with status ${response.status()}`);
      }
    } catch (error) {
      if (this.currentProxy) {
        this.proxyManager.reportFailure(this.currentProxy.server);
      }
      throw error;
    }
  }

  public abstract crawl(): Promise<CrawlerResult>;
} 