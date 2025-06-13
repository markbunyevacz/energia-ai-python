import { BHTCrawler } from '../lib/crawler/bht-crawler';
import { CURIACrawler } from '../lib/crawler/curia-crawler';
import { MagyarKozlonyCrawler } from '../lib/crawler/MagyarKozlonyCrawler';
import { BaseCrawler } from '../lib/crawler/base-crawler';
import dotenv from 'dotenv';

dotenv.config();

const CRAWLERS: { [key: string]: new () => BaseCrawler } = {
  bht: BHTCrawler,
  curia: CURIACrawler,
  magyarkozlony: MagyarKozlonyCrawler,
};

async function main() {
  const crawlerArg = process.argv[2];
  if (!crawlerArg) {
    console.error('Please specify which crawler to run. Available:', Object.keys(CRAWLERS).join(', '));
    process.exit(1);
  }

  const CrawlerClass = CRAWLERS[crawlerArg.toLowerCase()];
  if (!CrawlerClass) {
    console.error(`Invalid crawler specified: ${crawlerArg}. Available:`, Object.keys(CRAWLERS).join(', '));
    process.exit(1);
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Missing Supabase credentials. Please check your .env file.');
    process.exit(1);
  }

  const crawler = new CrawlerClass();
  
  try {
    console.log(`Starting ${crawler.config.name}...`);
    const result = await crawler.crawl();
    
    if (result.success) {
      console.log(`Crawl completed successfully. Found ${result.documents.length} documents.`);
    } else {
      console.error('Crawl finished with errors:', result.errors.join('\n'));
    }
  } catch (error: any) {
    console.error('Crawl failed:', error?.message || 'Unknown error');
    process.exit(1);
  }
}

main().catch(console.error); 