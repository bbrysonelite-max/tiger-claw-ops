import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';

export const definition: Anthropic.Tool = {
  name: 'send_followup_message',
  description: 'Queue a follow-up reminder for a specific prospect. Sends the user a nudge about a prospect they should follow up with, including a suggested message.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prospect_id: {
        type: 'string',
        description: 'The ID of the prospect to follow up on (8-character short ID or full UUID)',
      },
    },
    required: ['prospect_id'],
  },
};

export async function execute(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const prospectIdInput = String(input.prospect_id || '');

  // Find prospect — support short ID prefix or full UUID
  const prospects = await ctx.prisma.prospect.findMany({
    where: { tenantId: ctx.tenantId },
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  const prospect = prospects.find(
    (p) => p.id === prospectIdInput || p.id.startsWith(prospectIdInput)
  );

  if (!prospect) {
    return JSON.stringify({ error: `Prospect "${prospectIdInput}" not found.` });
  }

  // Generate a follow-up suggestion using Claude
  const followUpPrompt = `Write a SHORT 2-sentence follow-up reminder for a network marketer.
The prospect: ${prospect.name} (${prospect.summary || 'potential lead'})
Last status: ${prospect.status}
Keep it motivating and action-focused. No fluff.`;

  const response = await ctx.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 150,
    messages: [{ role: 'user', content: followUpPrompt }],
  });

  const suggestion =
    response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  // Send the follow-up reminder directly to the tenant via their bot
  const followUpText = [
    `🔔 *Follow-up reminder: ${prospect.name}*`,
    ``,
    suggestion,
    ``,
    `Use /script ${prospect.name.split(' ')[0]} to generate a fresh script.`,
  ].join('\n');

  await ctx.bot.sendMessage(ctx.chatId, followUpText, { parse_mode: 'Markdown' });

  return JSON.stringify({
    success: true,
    prospect_name: prospect.name,
    message: 'Follow-up reminder sent.',
  });
}
