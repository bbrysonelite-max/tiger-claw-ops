/**
 * Tiger Claw Scout - Prospect Summarizer
 * AI-powered summarization using OpenAI API
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { ScrapeResult } from '../shared/types.js';

// --- Configuration ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MAX_TOKENS = 200;

// OpenAI client instance
let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Build the summarization prompt from scrape results
 */
function buildSummarizationPrompt(results: ScrapeResult[]): string {
  const combinedContent = results
    .map((r, i) => `Source ${i + 1}: ${r.title}\n${r.content}`)
    .join('\n\n---\n\n');
  
  return `You are a network marketing recruiting assistant. Based on the following search results about a prospect, write a 3-sentence summary that:
1. Identifies who this person is and their likely background
2. Notes any indicators of their current situation or needs
3. Suggests potential pain points or opportunities for connection

Focus on information relevant to network marketing/MLM recruiting. Be concise and actionable.

--- SEARCH RESULTS ---
${combinedContent}
--- END RESULTS ---

Write your 3-sentence summary:`;
}

/**
 * Summarize prospect information from scrape results
 * 
 * @param scrapeResults - Array of web scrape results for the prospect
 * @returns 3-sentence summary of prospect's likely needs and background
 */
export async function summarizeProspect(scrapeResults: ScrapeResult[]): Promise<string> {
  if (!scrapeResults || scrapeResults.length === 0) {
    return 'No information available for this prospect.';
  }
  
  // Filter out empty results
  const validResults = scrapeResults.filter(r => r.content && r.content.length > 10);
  
  if (validResults.length === 0) {
    return 'Limited information available. Consider reaching out to learn more about this prospect.';
  }
  
  console.log(`[summarizer] Summarizing ${validResults.length} sources...`);
  
  try {
    const client = getOpenAIClient();
    const prompt = buildSummarizationPrompt(validResults);
    
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for network marketing professionals. Provide concise, actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
    });
    
    const summary = response.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      console.warn('[summarizer] Empty response from OpenAI');
      return 'Unable to generate summary. Please try again later.';
    }
    
    console.log('[summarizer] Summary generated successfully');
    return summary;
    
  } catch (error: any) {
    console.error('[summarizer] Error generating summary:', error.message);
    
    // Return graceful fallback
    if (error.code === 'insufficient_quota') {
      return 'Summary unavailable (API quota exceeded).';
    }
    
    return 'Unable to generate summary at this time.';
  }
}

/**
 * Generate a personalized outreach script for a prospect
 * 
 * @param prospectName - Name of the prospect
 * @param summary - Pre-generated summary of the prospect
 * @param product - Product/opportunity being offered
 * @returns Personalized outreach script
 */
export async function generateOutreachScript(
  prospectName: string,
  summary: string,
  product: string = 'Nu Skin'
): Promise<string> {
  console.log(`[summarizer] Generating outreach script for: ${prospectName}`);
  
  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert network marketing coach. Write natural, non-pushy outreach messages that focus on building genuine connections. Never be salesy or mention money/income first.`,
        },
        {
          role: 'user',
          content: `Write a short, friendly initial outreach message (2-3 sentences max) to ${prospectName} based on this background:

${summary}

The goal is to start a genuine conversation that could eventually lead to discussing ${product} opportunities, but DO NOT mention the product or opportunity in this first message. Just focus on connection and showing genuine interest.`,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });
    
    const script = response.choices[0]?.message?.content?.trim();
    
    if (!script) {
      return `Hey ${prospectName}! I came across your profile and thought we might have some things in common. Would love to connect!`;
    }
    
    return script;
    
  } catch (error: any) {
    console.error('[summarizer] Error generating script:', error.message);
    return `Hey ${prospectName}! I came across your profile and would love to connect. How's your day going?`;
  }
}

/**
 * Score a prospect based on their summary
 * 
 * @param summary - Prospect summary
 * @returns Score from 0-100 indicating prospect quality
 */
export async function scoreProspect(summary: string): Promise<number> {
  if (!summary || summary.length < 20) {
    return 50; // Neutral score for unknown prospects
  }
  
  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a network marketing prospect scoring system. Respond with ONLY a number from 0-100.',
        },
        {
          role: 'user',
          content: `Score this prospect from 0-100 based on their likely fit for network marketing opportunities. Consider factors like: entrepreneurial mindset, current life situation, openness to new opportunities, and network size. Higher scores = better fit.

Prospect summary: ${summary}

Respond with ONLY the numeric score (0-100):`,
        },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });
    
    const scoreText = response.choices[0]?.message?.content?.trim();
    const score = parseInt(scoreText || '50', 10);
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, isNaN(score) ? 50 : score));
    
  } catch (error: any) {
    console.error('[summarizer] Error scoring prospect:', error.message);
    return 50; // Default neutral score on error
  }
}

/**
 * Batch summarize multiple prospects
 * 
 * @param prospects - Map of prospect names to their scrape results
 * @returns Map of prospect names to summaries
 */
export async function batchSummarize(
  prospects: Map<string, ScrapeResult[]>
): Promise<Map<string, string>> {
  const summaries = new Map<string, string>();
  
  for (const [name, results] of prospects) {
    const summary = await summarizeProspect(results);
    summaries.set(name, summary);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return summaries;
}
