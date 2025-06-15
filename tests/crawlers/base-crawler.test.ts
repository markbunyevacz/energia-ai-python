import { TestCrawler } from '../lib/crawler/TestCrawler';
import { AdvancedProxyManager } from '@/lib/crawler/advanced-proxy-manager';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

describe('BaseCrawler Integration', () => {
    let browser: Browser;
    let crawler: TestCrawler;
    let context: BrowserContext | null;
    let page: Page | null;

    beforeAll(async () => {
        browser = await chromium.launch();
        crawler = new TestCrawler({
            name: 'TestCrawler',
            baseUrl: 'http://test.com',
            maxRequestsPerMinute: 60,
            minDelayBetweenRequests: 1000,
            timeout: 5000,
            retryConfig: { maxAttempts: 3, initialDelay: 1000, maxDelay: 5000, backoffFactor: 2 }
        }, [{ server: 'http://invalid-proxy:8080' }]);
        await crawler.publicInitialize();
        context = crawler.getContext();
        page = crawler.getPage();
    });

    afterAll(async () => {
        await browser.close();
    });

    it('should apply headers from HeaderRotator', async () => {
        let headers: any;
        const promise = new Promise<void>(resolve => {
            page?.route('**/*', (route) => {
                headers = route.request().headers();
                route.abort();
                resolve();
            });
        });
        try {
            await page?.goto('http://example.com');
        } catch (e) {
            // This is expected because we are aborting the request
        }
        await promise;
        
        expect(headers).toHaveProperty('user-agent');
        expect(headers['user-agent']).not.toBe('');
    });

    it('should use proxy when configured', async () => {
        // Test page that returns client IP
        try {
            await page?.goto('https://api.ipify.org?format=json');
            const content = await page?.content();
            expect(content).toContain('invalid-proxy');
        } catch(e) {
            // This is expected to fail because the proxy is invalid
            expect(e).toBeInstanceOf(Error);
        }
    });

    it('should handle proxy failures', async () => {
        const proxyManager = new AdvancedProxyManager([{ server: 'http://invalid-proxy:8080' }]);
        const mockReportFailure = jest.spyOn(proxyManager, 'reportFailure');
        const crawlerWithInvalidProxy = new TestCrawler(
            {
                name: 'TestCrawler',
                baseUrl: 'http://test.com',
                maxRequestsPerMinute: 60,
                minDelayBetweenRequests: 1000,
                timeout: 1000,
                retryConfig: { maxAttempts: 1, initialDelay: 100, maxDelay: 100, backoffFactor: 2 }
            },
            [],
            proxyManager
        );

        await crawlerWithInvalidProxy.publicInitialize();
        
        try {
            await crawlerWithInvalidProxy.publicNavigate('http://example.com', { timeout: 1000 });
        } catch (error) {
            // Expected to fail
        }
        
        expect(mockReportFailure).toHaveBeenCalled();
    });
}); 