/**
 * Tiger Bot Scout - Web Search Module
 * Tools for hunting prospects across the web
 *
 * This module provides actual search capabilities:
 * - LinkedIn profile search (public data)
 * - Reddit post/comment search
 * - Google search for prospects
 * - Public Facebook group scraping
 */

import axios from "axios";

// --- Types ---
export interface SearchResult {
  source: string;
  title: string;
  url: string;
  snippet: string;
  name?: string;
  relevanceScore?: number;
}

export interface ProspectData {
  name: string;
  source: string;
  sourceUrl: string;
  summary: string;
  interests: string[];
  painPoints: string[];
  contactMethod?: string;
  score: number;
}

// --- Search Engines ---

/**
 * Serper.dev — Google search with automatic key rotation.
 * Tries SERPER_KEY_1 first, falls back to SERPER_KEY_2, then SERPER_KEY_3.
 * Rotates on quota exhaustion (403) or rate limit (429).
 */
async function serperSearch(query: string, siteFilter?: string): Promise<SearchResult[]> {
  const keys = [
    process.env.SERPER_KEY_1,
    process.env.SERPER_KEY_2,
    process.env.SERPER_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    console.log("[web-search] No Serper keys configured");
    return [];
  }

  const fullQuery = siteFilter ? `site:${siteFilter} ${query}` : query;

  for (let i = 0; i < keys.length; i++) {
    try {
      const response = await axios.post(
        "https://google.serper.dev/search",
        { q: fullQuery, num: 10 },
        { headers: { "X-API-KEY": keys[i], "Content-Type": "application/json" } }
      );

      const results = (response.data.organic || []).map((item: any) => ({
        source: "google",
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
      }));

      if (i > 0) {
        console.log(`[web-search] Using Serper key ${i + 1} (key ${i} exhausted)`);
      }

      return results;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 403 || status === 429) {
        console.warn(`[web-search] Serper key ${i + 1} quota/rate limit hit, trying next key`);
        continue;
      }
      console.error(`[web-search] Serper search failed:`, error.message);
      return [];
    }
  }

  console.error("[web-search] All Serper keys exhausted");
  return [];
}

export async function googleSearch(
  query: string,
  siteFilter?: string
): Promise<SearchResult[]> {
  return serperSearch(query, siteFilter);
}

/**
 * Reddit Search via their JSON API (no auth needed for public data)
 */
export async function redditSearch(
  query: string,
  subreddits?: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  try {
    // Search specific subreddits or all of reddit
    const subredditStr = subreddits?.length
      ? subreddits.map(s => s.replace("r/", "")).join("+")
      : "all";

    const response = await axios.get(
      `https://www.reddit.com/r/${subredditStr}/search.json`,
      {
        params: {
          q: query,
          sort: "relevance",
          limit: 25,
          restrict_sr: subreddits ? "on" : "off"
        },
        headers: {
          // Reddit requires a descriptive User-Agent per their API rules
          "User-Agent": "web:com.botcraftwrks.tiger-bot-scout:v3.1.0 (by /u/tigerbotscout)"
        }
      }
    );

    for (const post of response.data.data.children || []) {
      const data = post.data;
      results.push({
        source: "reddit",
        title: data.title,
        url: `https://reddit.com${data.permalink}`,
        snippet: data.selftext?.substring(0, 300) || "",
        name: data.author
      });
    }
  } catch (error: any) {
    console.error("[web-search] Reddit search failed:", error.message);
  }

  return results;
}

/**
 * LinkedIn search via Google (public profiles only)
 * LinkedIn's API is heavily restricted, so we search via Google
 */
export async function linkedinSearch(
  role: string,
  keywords: string[],
  location?: string
): Promise<SearchResult[]> {
  const keywordStr = keywords.join(" OR ");
  const locationStr = location ? ` "${location}"` : "";
  const query = `"${role}" (${keywordStr})${locationStr}`;

  return await googleSearch(query, "linkedin.com/in");
}

/**
 * Search for prospects expressing pain points
 */
export async function painPointSearch(
  painPoints: string[],
  platforms: string[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Search phrases that indicate frustration/need
  const searchModifiers = [
    "frustrated with",
    "looking for",
    "need help with",
    "struggling with",
    "any recommendations for",
    "how do I"
  ];

  for (const painPoint of painPoints.slice(0, 3)) {
    for (const modifier of searchModifiers.slice(0, 2)) {
      const query = `"${modifier}" "${painPoint}"`;

      // Search Reddit
      if (platforms.includes("reddit")) {
        const redditResults = await redditSearch(query);
        results.push(...redditResults);
      }

      // Search Google
      const googleResults = await googleSearch(query);
      results.push(...googleResults);

      // Rate limiting - be nice to APIs
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

// --- Prospect Extraction ---

/**
 * Extract prospect data from search result using AI
 */
export async function extractProspectFromResult(
  result: SearchResult,
  icp: {
    description: string;
    painPoints?: string;
    keywords?: string;
    triggers?: string;
    exclusions?: string;
  },
  generateAI: (prompt: string) => Promise<string>
): Promise<ProspectData | null> {
  const prompt = `Analyze this search result and score how well this person matches the Ideal Customer Profile.

Search Result:
Title: ${result.title}
URL: ${result.url}
Content: ${result.snippet}
${result.name ? `Author/Name: ${result.name}` : ""}

=== IDEAL CUSTOMER PROFILE ===
Who they are: ${icp.description}
${icp.painPoints ? `Their pain points: ${icp.painPoints}` : ""}
${icp.keywords ? `Keywords they use: ${icp.keywords}` : ""}
${icp.triggers ? `Buying triggers: ${icp.triggers}` : ""}
${icp.exclusions ? `EXCLUDE these people: ${icp.exclusions}` : ""}

=== SCORING CRITERIA (add points) ===
+30 points: Matches the ICP description (role, profession, situation)
+25 points: Expresses a pain point from the list
+20 points: Uses keywords from the list
+15 points: Shows a buying trigger (ready to act, asking for solutions)
+10 points: Active engagement (asking questions, seeking advice)
-50 points: Matches an exclusion criteria (auto-reject if exclusion match)

Return a JSON object:
{
  "isProspect": true/false,
  "name": "extracted name or username",
  "summary": "1-2 sentence summary of who they are and why they match",
  "interests": ["detected interests"],
  "painPoints": ["detected pain points"],
  "matchReasons": ["why they scored points"],
  "score": 0-100 (sum of applicable points, cap at 100)
}

If they match an exclusion or are clearly not a prospect (company page, bot, irrelevant), return:
{"isProspect": false, "reason": "why excluded"}

Return ONLY valid JSON.`;

  try {
    const response = await generateAI(prompt);
    const parsed = JSON.parse(response.replace(/```json\n?|\n?```/g, "").trim());

    if (!parsed.isProspect) return null;

    return {
      name: parsed.name || result.name || "Unknown",
      source: result.source,
      sourceUrl: result.url,
      summary: parsed.summary || result.snippet,
      interests: parsed.interests || [],
      painPoints: parsed.painPoints || [],
      score: parsed.score || 50
    };
  } catch (error) {
    console.error("[web-search] Prospect extraction failed:", error);
    return null;
  }
}

// --- Main Hunting Function ---

export interface HuntConfig {
  role: string;
  icpDescription: string;
  icpPainPoints?: string;
  icpKeywords?: string;
  sources: { sources: string[]; subreddits: string[]; groups: string[] };
  maxResults?: number;
}

/**
 * Hunt for prospects based on ICP and role
 * This is the main function called when bot goes ACTIVE
 */
export async function huntProspects(
  config: HuntConfig,
  generateAI: (prompt: string) => Promise<string>
): Promise<ProspectData[]> {
  const prospects: ProspectData[] = [];
  const maxResults = config.maxResults || 20;

  console.log(`[web-search] Starting hunt for: ${config.icpDescription}`);
  console.log(`[web-search] Role detected: ${config.role}`);
  console.log(`[web-search] Sources: ${config.sources.sources.join(", ")}`);

  // Build search queries from ICP
  const searchTerms = [
    config.icpDescription,
    config.icpPainPoints,
    config.icpKeywords
  ].filter(Boolean).join(" ");

  // 1. Reddit Search
  if (config.sources.subreddits.length > 0) {
    console.log(`[web-search] Searching Reddit: ${config.sources.subreddits.join(", ")}`);
    const redditResults = await redditSearch(searchTerms, config.sources.subreddits);

    for (const result of redditResults.slice(0, 10)) {
      const prospect = await extractProspectFromResult(result, {
        description: config.icpDescription,
        painPoints: config.icpPainPoints,
        keywords: config.icpKeywords
      }, generateAI);

      if (prospect && prospect.score >= 40) {
        prospects.push(prospect);
        if (prospects.length >= maxResults) break;
      }
    }
  }

  // 2. LinkedIn Search (via Google)
  if (config.sources.sources.includes("LinkedIn")) {
    console.log("[web-search] Searching LinkedIn...");
    const keywords = config.icpKeywords?.split(",").map(k => k.trim()) || [config.icpDescription];
    const linkedinResults = await linkedinSearch(config.role, keywords);

    for (const result of linkedinResults.slice(0, 10)) {
      const prospect = await extractProspectFromResult(result, {
        description: config.icpDescription,
        painPoints: config.icpPainPoints,
        keywords: config.icpKeywords
      }, generateAI);

      if (prospect && prospect.score >= 40) {
        prospects.push(prospect);
        if (prospects.length >= maxResults) break;
      }
    }
  }

  // 3. Pain point search
  if (config.icpPainPoints) {
    console.log("[web-search] Searching for pain point expressions...");
    const painPoints = config.icpPainPoints.split(",").map(p => p.trim());
    const painResults = await painPointSearch(painPoints, ["reddit"]);

    for (const result of painResults.slice(0, 10)) {
      const prospect = await extractProspectFromResult(result, {
        description: config.icpDescription,
        painPoints: config.icpPainPoints,
        keywords: config.icpKeywords
      }, generateAI);

      if (prospect && prospect.score >= 40) {
        prospects.push(prospect);
        if (prospects.length >= maxResults) break;
      }
    }
  }

  console.log(`[web-search] Hunt complete. Found ${prospects.length} prospects.`);

  // Sort by score descending
  return prospects.sort((a, b) => b.score - a.score);
}

/**
 * Format prospects for Telegram display
 */
export function formatProspectsForTelegram(prospects: ProspectData[]): string {
  if (prospects.length === 0) {
    return "No prospects found yet. I'll keep hunting.";
  }

  let message = `Found ${prospects.length} prospects:\n\n`;

  for (let i = 0; i < Math.min(prospects.length, 5); i++) {
    const p = prospects[i];
    message += `${i + 1}. **${p.name}** (Score: ${p.score})\n`;
    message += `   ${p.summary}\n`;
    message += `   Source: ${p.source}\n`;
    if (p.painPoints.length > 0) {
      message += `   Pain points: ${p.painPoints.join(", ")}\n`;
    }
    message += `   [View Profile](${p.sourceUrl})\n\n`;
  }

  if (prospects.length > 5) {
    message += `...and ${prospects.length - 5} more. Say "show all" to see the full list.`;
  }

  return message;
}
