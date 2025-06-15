// tests/lib/crawler/TestCrawler.ts
import { BaseCrawler } from '@/lib/crawler/base-crawler';
import type { CrawlerConfig, CrawlerProxy, CrawlerResult } from '@/lib/crawler/types';
import { Browser, BrowserContext, Page } from 'playwright';
import { AdvancedProxyManager } from '@/lib/crawler/advanced-proxy-manager';

export class TestCrawler extends BaseCrawler {
    constructor(
        config: CrawlerConfig,
        proxies: CrawlerProxy[],
        proxyManager?: AdvancedProxyManager
    ) {
        super(config, proxies, proxyManager);
    }

    public async crawl(): Promise<CrawlerResult> {
        return {
            success: true,
            documents: [],
            errors: [],
            startTime: new Date(),
            endTime: new Date(),
            source: { id: 'test', name: 'test', url: 'test', type: 'test', crawlFrequency: 0 }
        };
    }

    public async publicInitialize() {
        try {
            return await this.initialize();
        } catch (error) {
            console.error('Error in publicInitialize:', error);
            throw error;
        }
    }

    public getContext(): BrowserContext | null {
        return this.context;
    }

    public getPage(): Page | null {
        return this.page;
    }

    public async publicNavigate(url: string, options?: Parameters<Page['goto']>[1]): Promise<void> {
        return this.navigate(url, options);
    }
}
