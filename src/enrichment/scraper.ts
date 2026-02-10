/**
 * Tiger Bot Scout - Prospect Web Scraper
 * Puppeteer-based scraper for enriching prospect data
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { ScrapeResult } from '../shared/types.js';

// --- Configuration ---
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SEARCH_TIMEOUT = 30000; // 30 seconds
const MAX_RESULTS = 5;

// Browser instance pool
let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });
  }
  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Build Google search URL for prospect
 */
function buildSearchUrl(name: string): string {
  const query = `"${name}" "Nu Skin" OR "MLM" OR "network marketing"`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Extract search results from Google page
 */
async function extractResults(page: Page): Promise<ScrapeResult[]> {
  return await page.evaluate((maxResults: number) => {
    const results: { title: string; url: string; content: string }[] = [];
    
    // Google search result selectors (may need updates if Google changes)
    const resultElements = document.querySelectorAll('div.g');
    
    for (const element of resultElements) {
      if (results.length >= maxResults) break;
      
      // Extract title
      const titleElement = element.querySelector('h3');
      const title = titleElement?.textContent?.trim() || '';
      
      // Extract URL
      const linkElement = element.querySelector('a');
      const url = linkElement?.href || '';
      
      // Skip non-http URLs (ads, etc.)
      if (!url.startsWith('http')) continue;
      
      // Extract snippet/description
      const snippetElement = element.querySelector('div[data-sncf], div.VwiC3b, span.st');
      const content = snippetElement?.textContent?.trim() || '';
      
      if (title && url) {
        results.push({ title, url, content });
      }
    }
    
    return results;
  }, MAX_RESULTS);
}

/**
 * Search for prospect information on the web
 * 
 * @param name - Prospect name to search for
 * @returns Array of search results with title, URL, and snippet
 */
export async function searchProspect(name: string): Promise<ScrapeResult[]> {
  if (!name || name.trim().length < 2) {
    console.warn('[scraper] Invalid search name:', name);
    return [];
  }
  
  console.log(`[scraper] Searching for prospect: ${name}`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set user agent to avoid bot detection
    await page.setUserAgent(USER_AGENT);
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Disable images and CSS for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // Navigate to search page
    const searchUrl = buildSearchUrl(name);
    console.log(`[scraper] Fetching: ${searchUrl}`);
    
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: SEARCH_TIMEOUT,
    });
    
    // Wait for results to load
    await page.waitForSelector('div.g', { timeout: 10000 }).catch(() => {
      console.warn('[scraper] No results found or timeout waiting for results');
    });
    
    // Extract results
    const results = await extractResults(page);
    
    console.log(`[scraper] Found ${results.length} results for: ${name}`);
    
    return results;
    
  } catch (error) {
    console.error(`[scraper] Error searching for ${name}:`, error);
    return [];
  } finally {
    await page.close();
  }
}

/**
 * Scrape content from a specific URL
 * 
 * @param url - URL to scrape
 * @param maxLength - Maximum content length to return
 * @returns Scraped content
 */
export async function scrapeUrl(url: string, maxLength: number = 5000): Promise<ScrapeResult | null> {
  console.log(`[scraper] Scraping URL: ${url}`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent(USER_AGENT);
    
    // Disable heavy resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: SEARCH_TIMEOUT,
    });
    
    // Extract page content
    const result = await page.evaluate((maxLen: number) => {
      const title = document.title || '';
      
      // Try to get main content
      const article = document.querySelector('article');
      const main = document.querySelector('main');
      const body = document.body;
      
      const contentElement = article || main || body;
      
      // Extract text, removing scripts and styles
      const clone = contentElement?.cloneNode(true) as HTMLElement;
      if (clone) {
        clone.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());
      }
      
      let content = clone?.textContent || '';
      
      // Clean up whitespace
      content = content.replace(/\s+/g, ' ').trim();
      
      // Truncate if too long
      if (content.length > maxLen) {
        content = content.substring(0, maxLen) + '...';
      }
      
      return { title, content };
    }, maxLength);
    
    return {
      title: result.title,
      content: result.content,
      url,
    };
    
  } catch (error) {
    console.error(`[scraper] Error scraping ${url}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Batch search for multiple prospects
 * 
 * @param names - Array of prospect names
 * @param delayMs - Delay between searches to avoid rate limiting
 * @returns Map of name to results
 */
export async function batchSearchProspects(
  names: string[],
  delayMs: number = 2000
): Promise<Map<string, ScrapeResult[]>> {
  const results = new Map<string, ScrapeResult[]>();
  
  for (const name of names) {
    const searchResults = await searchProspect(name);
    results.set(name, searchResults);
    
    // Delay between searches
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// Cleanup on process exit
process.on('exit', () => {
  closeBrowser().catch(() => {});
});

process.on('SIGTERM', () => {
  closeBrowser().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  closeBrowser().then(() => process.exit(0));
});
