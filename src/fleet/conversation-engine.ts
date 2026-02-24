/**
 * Tiger Claw Scout - Conversation Engine v2
 * ANTI-PATTERN AWARE: Extracts intent from natural language, never re-asks, takes action
 *
 * Rules from Manus docs:
 * 1. Extract intent from natural language - parse paragraphs, don't force forms
 * 2. Never ask for fields already answered or explicitly rejected
 * 3. Never contradict customer's stated intent
 * 4. After ICP is gathered, TAKE ACTION - don't ask where to look
 * 5. Never say "coming soon" or list limitations
 */

import { PrismaClient } from "@prisma/client";

// --- Types ---
export type CustomerState =
  | "IDLE"
  | "WELCOME"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "KEY_PROMPT"
  | "ACTIVE"
  | "ERROR_RECOVERY";

export interface Interview1Data {
  full_name?: string;
  phone?: string;
  business_type?: string;
  business_description?: string;
  experience_years?: string;
  mission?: string;
  current_methods?: string;
  pain_points?: string;
  raw_responses?: string[];
  extracted_role?: string;
}

export interface Interview2Data {
  icp_description?: string;
  icp_pain_points?: string;
  icp_channels?: string;
  icp_keywords?: string;
  icp_triggers?: string;
  icp_exclusions?: string;
  raw_responses?: string[];
  location_preference?: string;
}

export interface InterviewData {
  interview1?: Interview1Data;
  interview2?: Interview2Data;
}

// --- Lead Source Intelligence Map ---
// Pre-loaded knowledge - NEVER ask the customer where to find leads
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
  "fitness_coach": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "YouTube", "Google Maps", "Meetup"],
    subreddits: ["r/personaltraining", "r/fitness", "r/fitnessindustry", "r/entrepreneur"],
    groups: ["Personal Trainers", "Online Fitness Coaching", "Fitness Business"]
  },
  "photographer": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Google Maps", "Thumbtack"],
    subreddits: ["r/photography", "r/videography", "r/freelance", "r/smallbusiness"],
    groups: ["Freelance Photographers", "Wedding Photography", "Video Production"]
  },
  "handyman": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Yelp", "Google Maps", "Nextdoor"],
    subreddits: ["r/handyman", "r/homeimprovement", "r/contractor", "r/smallbusiness"],
    groups: ["Handyman Business", "Contractors Network", "Home Repair Pros"]
  },
  "freelance_writer": {
    sources: ["LinkedIn", "Reddit", "Twitter/X", "Medium", "Upwork"],
    subreddits: ["r/freelancewriters", "r/copywriting", "r/contentcreation", "r/freelance"],
    groups: ["Freelance Writers", "Content Marketing", "Copywriters"]
  },
  "food_delivery": {
    sources: ["Reddit", "Facebook Groups", "LinkedIn", "YouTube", "Craigslist"],
    subreddits: ["r/doordash", "r/ubereats", "r/grubhub", "r/couriersofreddit"],
    groups: ["DoorDash Drivers", "Food Delivery Tips", "Gig Workers Unite"]
  },
  "teacher": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "YouTube"],
    subreddits: ["r/teachers", "r/teaching", "r/education", "r/sidehustle"],
    groups: ["Teachers Who Side Hustle", "Educator Entrepreneurs", "Teachers Making Extra Income"]
  },
  "default": {
    sources: ["LinkedIn", "Reddit", "Facebook Groups", "Google Search", "Twitter/X"],
    subreddits: ["r/entrepreneur", "r/smallbusiness", "r/sidehustle"],
    groups: ["Small Business Owners", "Entrepreneurs", "Side Hustle Community"]
  }
};

// Role detection keywords
const ROLE_KEYWORDS: Record<string, string[]> = {
  "network_marketer": ["network marketing", "mlm", "multi-level", "distributor", "downline", "recruit", "amway", "herbalife"],
  "hair_stylist": ["hair", "stylist", "salon", "cosmetology", "beauty", "barber", "cuts"],
  "rideshare_driver": ["uber", "lyft", "rideshare", "driving", "rides"],
  "real_estate": ["real estate", "realtor", "property", "homes", "listings", "broker"],
  "tutor": ["tutor", "teach", "education", "students", "lessons", "learning"],
  "teacher": ["teacher", "school", "classroom", "educator", "teaching"],
  "fitness_coach": ["fitness", "trainer", "gym", "workout", "health coach", "personal training"],
  "photographer": ["photo", "video", "shoot", "camera", "wedding", "portrait"],
  "handyman": ["handyman", "repair", "contractor", "renovation", "home improvement", "fix"],
  "freelance_writer": ["writing", "content", "copywriting", "blog", "articles", "freelance writer"],
  "food_delivery": ["doordash", "uber eats", "grubhub", "delivery", "food delivery"]
};

// --- Welcome Message ---
function getWelcomeMessage(firstName: string): string {
  return `Hey ${firstName}!

I'm your Tiger Claw - your AI prospecting machine.

I find customers, nurture them, and help you close deals. But first, I need to learn about you.

This takes about 3 minutes. Just talk naturally - tell me about yourself and your business. I'll ask follow-up questions if I need more details.

Ready?`;
}

// --- Detect Role from Text ---
function detectRole(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return role;
    }
  }
  return "default";
}

// --- Extract Interview Data from Natural Language ---
async function extractInterview1Data(
  userMessage: string,
  existingData: Interview1Data,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ data: Interview1Data; missingFields: string[]; shouldAsk: string | null }> {

  const data = { ...existingData };
  data.raw_responses = data.raw_responses || [];
  data.raw_responses.push(userMessage);

  // Detect role from combined responses
  const allText = data.raw_responses.join(" ");
  data.extracted_role = detectRole(allText);

  // Use AI to extract structured data
  const extractionPrompt = `Extract business information from this conversation. The user said:
"${userMessage}"

Previous responses: ${data.raw_responses.slice(0, -1).join(" | ")}

Extract and return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "full_name": "extracted name or null",
  "phone": "extracted phone or null",
  "business_type": "what they do in 3-5 words or null",
  "business_description": "detailed description or null",
  "experience_years": "how long they've been doing this or null",
  "mission": "their goals/vision or null",
  "current_methods": "how they find customers now or null"
}

Return null for fields you cannot extract. If they mention a duration like "2 years" or "since 2020", put that in experience_years.`;

  try {
    const extraction = await generateAI(extractionPrompt);
    const parsed = JSON.parse(extraction.replace(/```json\n?|\n?```/g, "").trim());

    // Merge extracted data (don't overwrite existing with null)
    for (const [key, value] of Object.entries(parsed)) {
      if (value && !(data as any)[key]) {
        (data as any)[key] = value;
      }
    }
  } catch (e) {
    console.log("[conversation-engine] AI extraction failed:", e);
  }

  // Determine what's missing - minimal required fields
  const requiredFields: { field: keyof Interview1Data; question: string }[] = [
    { field: "full_name", question: "What's your name?" },
    { field: "business_type", question: "What kind of business are you in?" }
  ];

  const missingFields: string[] = [];
  let shouldAsk: string | null = null;

  for (const { field, question } of requiredFields) {
    if (!data[field]) {
      missingFields.push(field);
      if (!shouldAsk) shouldAsk = question;
    }
  }

  return { data, missingFields, shouldAsk };
}

// --- Extract ICP Data from Natural Language ---
async function extractInterview2Data(
  userMessage: string,
  existingData: Interview2Data,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ data: Interview2Data; missingFields: string[]; shouldAsk: string | null }> {

  const data = { ...existingData };
  data.raw_responses = data.raw_responses || [];
  data.raw_responses.push(userMessage);

  // Check for "any" location statements
  const lowerMessage = userMessage.toLowerCase();
  if (lowerMessage.includes("any state") || lowerMessage.includes("anywhere") ||
      lowerMessage.includes("any location") || lowerMessage.includes("don't care where") ||
      lowerMessage.includes("doesn't matter where") || lowerMessage.includes("can be in any")) {
    data.location_preference = "any";
  }

  // Check for explicit rejections of fields
  if (lowerMessage.includes("not looking for certain") || lowerMessage.includes("don't care about skills") ||
      lowerMessage.includes("no specific skills")) {
    // Mark skills as answered (not required)
    data.icp_keywords = "open/flexible";
  }

  // Use AI to extract ICP data
  const extractionPrompt = `Extract ideal customer profile from this conversation. The user said:
"${userMessage}"

Previous responses: ${data.raw_responses.slice(0, -1).join(" | ")}

Extract and return ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "icp_description": "who is their ideal customer (role, profession, characteristics) or null",
  "icp_pain_points": "what problems do these customers have or null",
  "icp_channels": "where these customers hang out online or null",
  "icp_keywords": "words/phrases customers use when searching or null",
  "icp_triggers": "what makes them finally take action or null",
  "icp_exclusions": "who to avoid or null"
}

CRITICAL RULES:
- If user says "I don't care about X" or "any X" or "doesn't matter", mark that field as "any/open"
- If user says "school teachers who tried network marketing", icp_description = "school teachers with network marketing experience"
- If user says "not poaching" or "not targeting specific companies", icp_exclusions = "no specific company targeting"
- Extract EVERYTHING from their natural language - they might answer multiple questions at once`;

  try {
    const extraction = await generateAI(extractionPrompt);
    const parsed = JSON.parse(extraction.replace(/```json\n?|\n?```/g, "").trim());

    // Merge extracted data
    for (const [key, value] of Object.entries(parsed)) {
      if (value && !(data as any)[key]) {
        (data as any)[key] = value;
      }
    }
  } catch (e) {
    console.log("[conversation-engine] AI extraction failed:", e);
  }

  // Only require icp_description - everything else is optional
  const missingFields: string[] = [];
  let shouldAsk: string | null = null;

  if (!data.icp_description) {
    missingFields.push("icp_description");
    shouldAsk = "Who is your ideal customer? Describe them - their role, situation, what they're looking for.";
  }

  return { data, missingFields, shouldAsk };
}

// --- Generate Action Message (NOT passive) ---
function generateActivationMessage(
  firstName: string,
  interview1: Interview1Data,
  interview2: Interview2Data
): string {
  const role = interview1.extracted_role || "default";
  const sources = LEAD_SOURCE_MAP[role] || LEAD_SOURCE_MAP["default"];

  const icpSummary = interview2.icp_description || "your ideal customers";
  const locationNote = interview2.location_preference === "any" ? ", anywhere in the US" : "";

  // Build exclusion note if they specified any
  const exclusionNote = interview2.icp_exclusions && interview2.icp_exclusions !== "any/open"
    ? `\n\nI'll avoid: ${interview2.icp_exclusions}`
    : "";

  return `Got it, ${firstName}. I know who you're looking for: ${icpSummary}${locationNote}.${exclusionNote}

I'm already hunting. Here's where I'm looking:
- ${sources.sources.slice(0, 3).join(", ")}
- Reddit: ${sources.subreddits.slice(0, 2).join(", ")}
- Groups: ${sources.groups.slice(0, 2).join(", ")}

I'll have your first prospect list ready soon. If you know of specific groups or communities I should also watch, send me the link anytime.

Your Tiger Claw is LIVE.`;
}

// --- Generate confirmation message for ICP ---
function generateICPConfirmation(interview2: Interview2Data): string {
  let confirmation = "Got it. I'm looking for ";
  confirmation += interview2.icp_description || "your ideal customers";

  if (interview2.location_preference === "any") {
    confirmation += ", anywhere in the US";
  }

  if (interview2.icp_exclusions && interview2.icp_exclusions !== "any/open") {
    confirmation += `. No ${interview2.icp_exclusions}`;
  }

  confirmation += ". I'll start searching now. Sound right?";
  return confirmation;
}

// --- State Handler ---
export async function handleStateBasedMessage(
  prisma: PrismaClient,
  tenantId: string,
  chatId: number,
  firstName: string,
  userMessage: string,
  sendMessage: (text: string) => Promise<void>,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ handled: boolean; newState?: CustomerState }> {

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { state: true, interview_data: true, name: true }
  });

  if (!tenant) return { handled: false };

  const state = (tenant.state || "IDLE") as CustomerState;
  const interviewData: InterviewData = (tenant.interview_data as InterviewData) || {};

  // Update chat_id (convert to string for DB storage)
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { chat_id: String(chatId) }
  });

  switch (state) {
    case "IDLE":
      await sendMessage(getWelcomeMessage(firstName));
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { state: "WELCOME" }
      });
      return { handled: true, newState: "WELCOME" };

    case "WELCOME":
      const affirmatives = ["yes", "yeah", "yep", "sure", "ok", "okay", "ready", "let's go", "lets go", "start", "begin", "y"];
      const lowerMessage = userMessage.toLowerCase().trim();
      if (affirmatives.some(a => lowerMessage.includes(a))) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            state: "INTERVIEW_1",
            interview_data: { interview1: { raw_responses: [] } } as any
          }
        });
        await sendMessage("Great! Tell me about yourself and your business. What do you do, and what does success look like for you?");
        return { handled: true, newState: "INTERVIEW_1" };
      } else {
        // They might have just started talking - treat it as interview data
        const { data, shouldAsk } = await extractInterview1Data(userMessage, {}, generateAI);
        if (data.business_type || data.full_name) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              state: "INTERVIEW_1",
              interview_data: { interview1: data } as any,
              name: data.full_name || firstName
            }
          });
          if (shouldAsk) {
            await sendMessage(`Got it. ${shouldAsk}`);
          } else {
            // We have enough - move to ICP
            await prisma.tenant.update({
              where: { id: tenantId },
              data: {
                state: "INTERVIEW_2",
                interview_data: { interview1: data, interview2: { raw_responses: [] } } as any
              }
            });
            await sendMessage(`Perfect, I've got a picture of you and your business.

Now tell me about your ideal customer. Who are you looking for?`);
            return { handled: true, newState: "INTERVIEW_2" };
          }
          return { handled: true, newState: "INTERVIEW_1" };
        } else {
          const response = await generateAI(`The user said: "${userMessage}" when asked if ready to start. Warmly acknowledge and ask again if they're ready. Keep it brief.`);
          await sendMessage(response);
          return { handled: true };
        }
      }

    case "INTERVIEW_1":
      return await handleInterview1(prisma, tenantId, firstName, userMessage, interviewData, sendMessage, generateAI);

    case "INTERVIEW_2":
      return await handleInterview2(prisma, tenantId, firstName, userMessage, interviewData, sendMessage, generateAI);

    case "KEY_PROMPT":
    case "ACTIVE":
    case "ERROR_RECOVERY":
      return { handled: false };

    default:
      return { handled: false };
  }
}

async function handleInterview1(
  prisma: PrismaClient,
  tenantId: string,
  firstName: string,
  userMessage: string,
  interviewData: InterviewData,
  sendMessage: (text: string) => Promise<void>,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ handled: boolean; newState?: CustomerState }> {

  const { data, missingFields, shouldAsk } = await extractInterview1Data(
    userMessage,
    interviewData.interview1 || {},
    generateAI
  );

  const updatedInterviewData: InterviewData = {
    ...interviewData,
    interview1: data
  };

  // Move to Interview 2 if we have enough info OR user has answered 2+ times
  if (missingFields.length === 0 || (data.raw_responses && data.raw_responses.length >= 2)) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        state: "INTERVIEW_2",
        interview_data: { ...updatedInterviewData, interview2: { raw_responses: [] } } as any,
        name: data.full_name || firstName
      }
    });

    const name = data.full_name || firstName;
    await sendMessage(`Perfect, ${name}. I've got a picture of you and your business.

Now tell me about your ideal customer. Who are you looking for? Describe them - their situation, what they need.`);

    return { handled: true, newState: "INTERVIEW_2" };
  } else {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { interview_data: updatedInterviewData as any }
    });

    const ack = await generateAI(`User said: "${userMessage}" about their business.
Missing: ${missingFields.join(", ")}.
Give a brief acknowledgment (1 sentence) and naturally ask: ${shouldAsk}
Be conversational, not robotic. Don't re-ask anything they already answered.`);
    await sendMessage(ack);

    return { handled: true };
  }
}

async function handleInterview2(
  prisma: PrismaClient,
  tenantId: string,
  firstName: string,
  userMessage: string,
  interviewData: InterviewData,
  sendMessage: (text: string) => Promise<void>,
  generateAI: (prompt: string) => Promise<string>
): Promise<{ handled: boolean; newState?: CustomerState }> {

  const { data, missingFields } = await extractInterview2Data(
    userMessage,
    interviewData.interview2 || {},
    generateAI
  );

  const updatedInterviewData: InterviewData = {
    ...interviewData,
    interview2: data
  };

  // Activate bot if we have ICP description OR user has given us enough info
  if (missingFields.length === 0 || (data.raw_responses && data.raw_responses.length >= 2)) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        state: "ACTIVE",
        interview_data: updatedInterviewData as any
      }
    });

    // Send activation message with WHERE we're hunting
    const activationMsg = generateActivationMessage(
      interviewData.interview1?.full_name || firstName,
      interviewData.interview1 || {},
      data
    );
    await sendMessage(activationMsg);

    return { handled: true, newState: "ACTIVE" };
  } else {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { interview_data: updatedInterviewData as any }
    });

    // Just need ICP description
    await sendMessage("Who exactly are you looking for? Describe your ideal customer - their role, their situation, what makes them a good fit.");

    return { handled: true };
  }
}

// --- Reset function ---
export async function resetCustomerState(prisma: PrismaClient, tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      state: "IDLE",
      interview_data: {}
    }
  });
}
