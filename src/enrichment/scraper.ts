/**
 * TIGER BOT SCOUT - Web Scraper
 * Puppeteer-based scraper with server stability flags
 * 
 * Gemini Red Team Recommendation: Use sandbox flags for stability
 */

import puppeteer, { Browser, Page } from 'puppeteer';

export interface ScrapeResult {
  title: string;
  content: string;
  url: string;
  scrapedAt: Date;
}

export interface ScraperConfig {
  headless?: boolean | 'new';
  timeout?: number;
  userAgent?: string;
}

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Launch browser with server-stability flags
 * CRITICAL: These flags prevent crashes on Mac Pro workers
 */
export async function launchBrowser(config: ScraperConfig = {}): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: config.headless ?? 'new',
    // Crucial for server stability (Gemini Red Team recommendation)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // Additional stability flags for Mac Pro
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--single-process',
      // Reduce memory footprint
      '--disable-extensions',
      '--disable-background-networking'
    ]
  });
  return browser;
}

/**
 * Scrape a single URL and extract content
 */
export async function scrapeUrl(url: string, config: ScraperConfig = {}): Promise<ScrapeResult> {
  let browser: Browser | null = null;
  
  try {
    browser = await launchBrowser(config);
    const page: Page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent(config.userAgent ?? DEFAULT_USER_AGENT);
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: config.timeout ?? 30000
    });
    
    // Extract content
    const title = await page.title();
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach(el => el.remove());
      
      // Get main content
      const main = document.querySelector('main, article, .content, #content');
      if (main) return main.textContent?.trim() || '';
      
      // Fallback to body
      return document.body.textContent?.trim() || '';
    });
    
    return {
      title,
      content,
      url,
      scrapedAt: new Date()
    };
    
  } finally {
    // CRITICAL: Always close browser to prevent zombie processes
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Scrape multiple URLs with rate limiting
 */
export async function scrapeMultiple(
  urls: string[],
  config: ScraperConfig = {},
  delayMs: number = 2000
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];
  
  for (const url of urls) {
    try {
      const result = await scrapeUrl(url, config);
      results.push(result);
      
      // Rate limiting - human-like delay between requests
      if (urls.indexOf(url) < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs + Math.random() * 1000));
      }
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      // Continue with next URL instead of failing entirely
    }
  }
  
  return results;
}

export default {
  launchBrowser,
  scrapeUrl,
  scrapeMultiple
};
