import { BHTCrawler } from '../lib/crawler/bht-crawler';
import { CURIACrawler } from '../lib/crawler/curia-crawler';
import { MagyarKozlonyCrawler } from '../lib/crawler/magyar-kozlony-crawler';
import { BaseCrawler } from '../lib/crawler/base-crawler';
import type { CrawlerProxy } from '../lib/crawler/types';
import dotenv from 'dotenv';

dotenv.config();

const CRAWLERS: { [key: string]: new (proxies: CrawlerProxy[]) => BaseCrawler } = {
  bht: BHTCrawler,
  curia: CURIACrawler,
  magyarkozlony: MagyarKozlonyCrawler,
};

function parseProxies(proxyString: string | undefined): CrawlerProxy[] {
  if (!proxyString) {
    return [];
  }
  return proxyString.split(',').map(p => {
    const url = new URL(p.trim());
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username,
      password: url.password,
    };
  });
}

async function main() {
  const crawlerArg = process.argv[2];
  if (!crawlerArg) {
    // console.error('Please specify which crawler to run. Available:', Object.keys(CRAWLERS).join(', '));
    process.exit(1);
  }

  const CrawlerClass = CRAWLERS[crawlerArg.toLowerCase()];
  if (!CrawlerClass) {
    // console.error(`Invalid crawler specified: ${crawlerArg}. Available:`, Object.keys(CRAWLERS).join(', '));
    process.exit(1);
  }

  // Check for Supabase credentials (both VITE_ prefixed and non-prefixed)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    // console.error('Missing Supabase credentials. Please check your .env file.');
    // console.error('Required: SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_KEY/VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }
  
  // Set the non-prefixed versions for the crawlers
  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_KEY = supabaseKey;

  // Parse proxies from environment
  const proxies = parseProxies(process.env.PROXY_LIST);

  const crawler = new CrawlerClass(proxies);
  
  try {
    // console.log(`Starting ${crawlerArg} crawler...`);
    const result = await crawler.crawl();
    
    if (result.success) {
      // console.log(`Crawl completed successfully. Found ${result.documents.length} documents.`);
    } else {
      // console.error('Crawl finished with errors:', result.errors.join('\n'));
    }
  } catch (error: any) {
    // console.error('Crawl failed:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

main().catch(console.error); 
