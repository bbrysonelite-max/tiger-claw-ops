/**
 * Tiger Claw Scout — Claude Tool Use
 * All tools available to Claude during conversations.
 * getToolsForFlavor() returns the tool set for a given tenant flavor.
 * executeToolCall() dispatches a tool_use block to the correct handler.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';
import * as getTodaysProspects from './get-todays-prospects.js';
import * as generateScript from './generate-script.js';
import * as searchWeb from './search-web.js';
import * as updateProspectStatus from './update-prospect-status.js';
import * as getCalendarLink from './get-calendar-link.js';
import * as sendFollowupMessage from './send-followup-message.js';

export type { ToolContext } from './types.js';

// --- Tool registry ---

const ALL_TOOLS = [
  getTodaysProspects,
  generateScript,
  searchWeb,
  updateProspectStatus,
  getCalendarLink,
  sendFollowupMessage,
];

// Map of tool name → execute function (built once)
const TOOL_HANDLERS = new Map<
  string,
  (input: Record<string, unknown>, ctx: ToolContext) => Promise<string>
>(ALL_TOOLS.map((t) => [t.definition.name, t.execute]));

// --- Flavor → tool set mapping ---
// Each flavor can restrict which tools are available.
// An empty array means ALL tools are enabled.

const FLAVOR_TOOL_OVERRIDES: Record<string, string[]> = {
  // 'airbnb-host': ['get_todays_prospects', 'generate_script', 'search_web', 'get_calendar_link'],
};

/**
 * Return the Anthropic tool definitions for a given flavor slug.
 * Falls back to all tools if the flavor has no override.
 */
export function getToolsForFlavor(flavorSlug: string): Anthropic.Tool[] {
  const override = FLAVOR_TOOL_OVERRIDES[flavorSlug];

  if (!override || override.length === 0) {
    return ALL_TOOLS.map((t) => t.definition);
  }

  return ALL_TOOLS.filter((t) => override.includes(t.definition.name)).map(
    (t) => t.definition
  );
}

/**
 * Execute a tool_use block returned by Claude.
 * Returns the result as a string (JSON for structured data, plain text for errors).
 */
export async function executeToolCall(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const handler = TOOL_HANDLERS.get(name);

  if (!handler) {
    console.error(`[tools] Unknown tool: ${name}`);
    return JSON.stringify({ error: `Unknown tool: ${name}` });
  }

  try {
    console.log(`[tools] Executing ${name} for tenant ${ctx.tenantId}`);
    const result = await handler(input, ctx);
    console.log(`[tools] ${name} completed`);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[tools] ${name} failed:`, message);
    return JSON.stringify({ error: `Tool ${name} failed: ${message}` });
  }
}
