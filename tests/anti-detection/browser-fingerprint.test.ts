import { BrowserContext, chromium } from 'playwright';
import { TestCrawler } from '../lib/crawler/TestCrawler';

describe('Browser Fingerprint Protection', () => {
    let context: BrowserContext | null;

    beforeAll(async () => {
        const crawler = new TestCrawler({
            name: 'TestCrawler',
            baseUrl: 'http://test.com',
            maxRequestsPerMinute: 60,
            minDelayBetweenRequests: 1000,
            timeout: 5000,
            retryConfig: { maxAttempts: 3, initialDelay: 1000, maxDelay: 5000, backoffFactor: 2 }
        }, []);
        await crawler.publicInitialize();
        context = crawler.getContext();
    });

    afterAll(async () => {
        if (context) {
            await context.close();
        }
    });

    it('should hide navigator.webdriver flag', async () => {
        const page = await context?.newPage();
        await page?.goto('about:blank');
        
        const webdriverFlag = await page?.evaluate(() => (navigator as any).webdriver);
        expect(webdriverFlag).toBe(false);
    });

    it('should have realistic viewport dimensions', async () => {
        const page = await context?.newPage();
        const viewport = page?.viewportSize();
        
        expect(viewport?.width).toBeGreaterThanOrEqual(1200);
        expect(viewport?.height).toBeGreaterThanOrEqual(800);
    });

    it('should have randomized hardware concurrency', async () => {
        const page = await context?.newPage();
        await page?.goto('about:blank');
        
        const hardwareConcurrency = await page?.evaluate(() => (navigator as any).hardwareConcurrency);
        expect(hardwareConcurrency).toBeGreaterThanOrEqual(2);
        expect(hardwareConcurrency).toBeLessThanOrEqual(16);
    });
}); 