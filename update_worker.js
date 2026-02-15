const fs = require("fs");
const path = "/home/ubuntu/tiger-bot-api/src/fleet/worker.ts";
let code = fs.readFileSync(path, "utf8");

// Add import for conversation engine after other imports
if (!code.includes("conversation-engine")) {
  code = code.replace(
    'import { scrapeUrl, ScrapeResult } from',
    'import { handleStateBasedMessage } from "./conversation-engine.js";\nimport { scrapeUrl, ScrapeResult } from'
  );
}

// Replace the handleTelegramUpdate function to check state first
const newHandleUpdate = `// --- Main Update Handler ---
async function handleTelegramUpdate(ctx: any, update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const firstName = message.from?.first_name || "friend";
  const text = (message.text || "").trim();

  // Helper to send messages
  const sendMessage = async (msg: string) => {
    await ctx.bot.sendMessage(chatId, msg, { parse_mode: "Markdown" });
  };

  // Helper to generate AI responses
  const generateAI = async (prompt: string) => {
    return await generateAIResponse(prompt, firstName);
  };

  // Check if this is a /start command - always reset to IDLE first
  if (text.toLowerCase() === "/start") {
    // Reset state to IDLE for fresh onboarding
    await prisma.tenant.update({
      where: { id: ctx.tenantId },
      data: { state: "IDLE", interview_data: {} }
    });
  }

  // Try state-based handling first (onboarding flow)
  const result = await handleStateBasedMessage(
    prisma,
    ctx.tenantId,
    chatId,
    firstName,
    text,
    sendMessage,
    generateAI
  );

  if (result.handled) {
    console.log("[worker] State-based message handled, new state:", result.newState || "unchanged");
    return;
  }

  // If not handled by state machine, use regular command handling
  if (!text) return;

  const command = text.split(" ")[0].toLowerCase().split("@")[0];

  switch (command) {
    case "/help":
      await handleHelpCommand(ctx, message);
      break;
    case "/today":
      await handleTodayCommand(ctx, message);
      break;
    default:
      await handleFreeformMessage(ctx, message);
  }
}`;

// Find and replace the handleTelegramUpdate function
const startMarker = "// --- Main Update Handler ---";
const startIndex = code.indexOf(startMarker);

if (startIndex !== -1) {
  // Find the end of the function (look for the next top-level function or section)
  const afterStart = code.substring(startIndex);

  // Find the next "// ---" marker that indicates a new section
  const nextSectionMatch = afterStart.substring(30).match(/\n\/\/ ---/);
  if (nextSectionMatch) {
    const endIndex = startIndex + 30 + nextSectionMatch.index;
    code = code.substring(0, startIndex) + newHandleUpdate + "\n\n" + code.substring(endIndex);
  }
}

fs.writeFileSync(path, code);
console.log("Worker updated with conversation engine");
