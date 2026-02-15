/**
 * Tiger Bot Scout - Agent Brain
 * The proactive hunting behavior for ACTIVE state
 *
 * RULES (from anti-pattern docs):
 * 1. Never ask the customer where to look - we already know
 * 2. Never list limitations - work around them
 * 3. Never say "coming soon" - do what we CAN do
 * 4. Default to action - always be hunting
 */

import { PrismaClient } from "@prisma/client";
import { huntProspects, formatProspectsForTelegram, ProspectData } from "./web-search.js";

// Lead Source Intelligence Map (from doc 10)
const LEAD_SOURCE_MAP: Record<string, { sources: string[]; subreddits: string[]; groups: string[] }> = {
  "network_marketer": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "YouTube", "Telegram"],
    subreddits: ["r/antiMLM", "r/networkmarketing", "r/mlm", "r/sidehustle"],
    groups: ["Network Marketing Tips", "MLM Success Stories", "Side Hustle Nation"]
  },
  "hair_stylist": {
    sources: ["LinkedIn", "Facebook Groups", "Reddit", "Yelp", "Google Maps"],
    subreddits: ["r/hairstylist", "r/cosmetology", "r/beauty", "r/smallbusiness"],
    groups: ["Hair Stylists Unite", "Behind the Chair"]
  },
  "rideshare_driver": {
    sources: ["Reddit", "Facebook Groups", "LinkedIn", "YouTube", "Craigslist"],
    subreddits: ["r/uberdrivers", "r/lyftdrivers", "r/rideshare", "r/gigeconomy"],
    groups: ["Uber/Lyft Drivers", "Rideshare Profits", "Gig Economy Workers"]
  },
  "real_estate": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Zillow", "BiggerPockets"],
    subreddits: ["r/realestate", "r/realtor", "r/realestateinvesting"],
    groups: ["Real Estate Agents", "New Realtors", "Real Estate Leads"]
  },
  "tutor": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Wyzant", "YouTube"],
    subreddits: ["r/tutoring", "r/onlinetutor", "r/teachers", "r/sidehustle"],
    groups: ["Online Tutoring", "Teachers Making Extra Money", "EdTech"]
  },
  "teacher": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "YouTube"],
    subreddits: ["r/teachers", "r/teaching", "r/education", "r/sidehustle"],
    groups: ["Teachers Who Side Hustle", "Educator Entrepreneurs"]
  },
  "fitness_coach": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "YouTube", "Google Maps", "Meetup"],
    subreddits: ["r/personaltraining", "r/fitness", "r/fitnessindustry", "r/entrepreneur"],
    groups: ["Personal Trainers", "Online Fitness Coaching", "Fitness Business"]
  },
  "default": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Google Search", "Twitter/X"],
    subreddits: ["r/entrepreneur", "r/smallbusiness", "r/sidehustle"],
    groups: ["Small Business Owners", "Entrepreneurs", "Side Hustle Community"]
  }
};

// Role detection from interview data
const ROLE_KEYWORDS: Record<string, string[]> = {
  "network_marketer": ["network marketing", "mlm", "multi-level", "distributor", "downline", "recruit"],
  "hair_stylist": ["hair", "stylist", "salon", "cosmetology", "beauty", "barber"],
  "rideshare_driver": ["uber", "lyft", "rideshare", "driving", "rides"],
  "real_estate": ["real estate", "realtor", "property", "homes", "broker"],
  "tutor": ["tutor", "education", "students", "lessons"],
  "teacher": ["teacher", "school", "classroom", "educator"],
  "fitness_coach": ["fitness", "trainer", "gym", "workout", "personal training"]
};

function detectRole(businessType: string, businessDescription?: string): string {
  const text = `${businessType} ${businessDescription || ""}`.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      return role;
    }
  }
  return "default";
}

// --- Agent Brain Types ---
interface TenantContext {
  tenantId: string;
  chatId: number;
  interviewData: {
    interview1?: {
      full_name?: string;
      business_type?: string;
      business_description?: string;
      extracted_role?: string;
    };
    interview2?: {
      icp_description?: string;
      icp_pain_points?: string;
      icp_keywords?: string;
      icp_exclusions?: string;
      location_preference?: string;
    };
  };
}

// --- Main Agent Functions ---

/**
 * Start hunting immediately when bot goes ACTIVE
 * This is called right after Interview 2 completes
 */
export async function startHunting(
  prisma: PrismaClient,
  ctx: TenantContext,
  sendMessage: (text: string) => Promise<void>,
  generateAI: (prompt: string) => Promise<string>
): Promise<void> {
  const { interview1, interview2 } = ctx.interviewData;

  if (!interview1 || !interview2) {
    console.log("[agent-brain] Missing interview data, cannot hunt");
    return;
  }

  // Detect role
  const role = interview1.extracted_role ||
    detectRole(interview1.business_type || "", interview1.business_description);

  // Get lead sources for this role
  const sources = LEAD_SOURCE_MAP[role] || LEAD_SOURCE_MAP["default"];

  console.log(`[agent-brain] Starting hunt for tenant ${ctx.tenantId}`);
  console.log(`[agent-brain] Role: ${role}`);
  console.log(`[agent-brain] ICP: ${interview2.icp_description}`);

  // Send "hunting" notification
  await sendMessage(`I'm scanning ${sources.sources.slice(0, 3).join(", ")} and Reddit communities now. I'll send you prospects as I find them.`);

  try {
    // Start the hunt
    const prospects = await huntProspects({
      role: role,
      icpDescription: interview2.icp_description || "",
      icpPainPoints: interview2.icp_pain_points,
      icpKeywords: interview2.icp_keywords,
      sources: sources,
      maxResults: 10
    }, generateAI);

    if (prospects.length > 0) {
      // Save prospects to database
      await saveProspects(prisma, ctx.tenantId, prospects);

      // Send results
      const formattedResults = formatProspectsForTelegram(prospects);
      await sendMessage(formattedResults);
    } else {
      // No immediate results - be honest but not defeatist
      await sendMessage(`Initial scan complete. I'm monitoring these communities for prospects matching your ICP. I'll notify you when I find matches.

In the meantime, you can:
- Send me a URL to analyze
- Ask me to research a specific person or company
- Say "hunt again" to run another search`);
    }
  } catch (error) {
    console.error("[agent-brain] Hunt failed:", error);
    // Don't tell user about the error - just say we're working on it
    await sendMessage(`I'm setting up monitoring for your ideal prospects. I'll have results for you shortly.`);
  }
}

/**
 * Handle messages when bot is in ACTIVE state
 */
export async function handleActiveMessage(
  prisma: PrismaClient,
  ctx: TenantContext,
  userMessage: string,
  sendMessage: (text: string) => Promise<void>,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ handled: boolean }> {
  const lowerMessage = userMessage.toLowerCase().trim();

  // Hunt command
  if (lowerMessage.includes("hunt") || lowerMessage.includes("find") ||
      lowerMessage.includes("search") || lowerMessage.includes("look for")) {
    await sendMessage("On it. Starting a new hunt...");
    await startHunting(prisma, ctx, sendMessage, generateAI);
    return { handled: true };
  }

  // Show prospects
  if (lowerMessage.includes("show") || lowerMessage.includes("prospects") ||
      lowerMessage.includes("leads") || lowerMessage.includes("results")) {
    const prospects = await getProspects(prisma, ctx.tenantId);
    if (prospects.length === 0) {
      await sendMessage("No prospects saved yet. Say 'hunt' to start searching.");
    } else {
      await sendMessage(formatProspectsForTelegram(prospects as any));
    }
    return { handled: true };
  }

  // URL analysis
  if (userMessage.includes("http://") || userMessage.includes("https://")) {
    await sendMessage("Analyzing that URL...");
    // URL analysis would go here - for now, acknowledge
    const analysis = await generateAI(`Analyze this URL and explain what you can learn about the person or company for prospecting: ${userMessage}`);
    await sendMessage(analysis);
    return { handled: true };
  }

  // Research request
  if (lowerMessage.startsWith("research") || lowerMessage.includes("look up") ||
      lowerMessage.includes("find out about")) {
    const target = userMessage.replace(/research|look up|find out about/gi, "").trim();
    await sendMessage(`Researching ${target}...`);
    const research = await generateAI(`Research and provide prospecting insights about: ${target}. Include what we know, potential pain points, and how to approach them.`);
    await sendMessage(research);
    return { handled: true };
  }

  // General question - use AI
  const response = await generateAI(`You are Tiger Bot, an AI prospecting assistant.
The user (${ctx.interviewData.interview1?.full_name || "a customer"}) said: "${userMessage}"

Their business: ${ctx.interviewData.interview1?.business_type || "unknown"}
Their ideal customer: ${ctx.interviewData.interview2?.icp_description || "unknown"}

Respond helpfully. If they're asking about prospects, offer to hunt. If they need something you can't do, focus on what you CAN do.
NEVER say "coming soon" or list limitations. Always offer an action.`);

  await sendMessage(response);
  return { handled: true };
}

// --- Database Functions ---

async function saveProspects(
  prisma: PrismaClient,
  tenantId: string,
  prospects: ProspectData[]
): Promise<void> {
  for (const prospect of prospects) {
    try {
      await prisma.prospect.create({
        data: {
          tenantId: tenantId,
          name: prospect.name,
          source: prospect.source,
          sourceUrl: prospect.sourceUrl,
          summary: prospect.summary,
          interests: prospect.interests,
          painPoints: prospect.painPoints,
          score: prospect.score,
          status: "new"
        }
      });
    } catch (error) {
      console.error("[agent-brain] Failed to save prospect:", error);
    }
  }
}

async function getProspects(prisma: PrismaClient, tenantId: string) {
  return await prisma.prospect.findMany({
    where: { tenantId: tenantId },
    orderBy: { score: "desc" },
    take: 20
  });
}
