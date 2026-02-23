import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';

export const definition: Anthropic.Tool = {
  name: 'generate_script',
  description: 'Generate a personalized outreach script for a specific prospect. Use this when the user asks for a script for a named prospect, or wants to know what to say to someone.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prospect_name: {
        type: 'string',
        description: 'The name or partial name of the prospect to generate a script for',
      },
    },
    required: ['prospect_name'],
  },
};

export async function execute(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const prospectName = String(input.prospect_name || '');

  // Find prospect by name (partial, case-insensitive)
  const allProspects = await ctx.prisma.prospect.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { score: 'desc' },
    take: 50,
  });

  const prospect = allProspects.find((p) =>
    p.name.toLowerCase().includes(prospectName.toLowerCase())
  );

  if (!prospect) {
    return JSON.stringify({
      error: `No prospect named "${prospectName}" found. Tell the user to check /today for current prospects.`,
    });
  }

  const interview = (ctx.tenant?.interview_data as Record<string, Record<string, string>>) ?? {};
  const i1 = interview.interview1 ?? {};
  const icpProduct = i1.product ?? 'health and wellness';
  const icpApproach = i1.approach_style ?? 'friendly, authentic';
  const icpIncomeExample = i1.income_example ?? 'flexible income';
  const signals = (Array.isArray(prospect.signals) ? prospect.signals : []) as string[];

  const prompt = `You are a network marketing sales coach. Generate a personalized outreach script.

RULES:
1. Write in ${prospect.language || 'English'} ONLY
2. Opening MUST reference something specific from what they posted or their situation
3. NEVER mention the company or product name in the opening message
4. Sound like a real person, not a template
5. Keep the full message under 160 words
6. Soft ask only — no pressure, no hype

PROSPECT:
Name: ${prospect.name}
Source: ${prospect.source || 'online'}
What they posted/said: ${signals.length > 0 ? signals.join(' | ') : prospect.summary || 'Looking for opportunities'}
Summary: ${prospect.summary || ''}

YOU (the person sending this):
Product you represent: ${icpProduct}
Approach style: ${icpApproach}
Income example: ${icpIncomeExample}

Return ONLY the script message text. No labels, no JSON, no explanation.`;

  const response = await ctx.anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });

  const scriptText =
    response.content[0].type === 'text' ? response.content[0].text.trim() : '';

  // Persist the script to DB
  const saved = await ctx.prisma.script.create({
    data: {
      tenantId: ctx.tenantId,
      prospectId: prospect.id,
      language: prospect.language || 'en',
      opening: scriptText.split('\n')[0] || scriptText.slice(0, 100),
      fullScript: scriptText,
      aiModel: 'claude-sonnet-4-6',
    },
  });

  // Update prospect status
  await ctx.prisma.prospect.update({
    where: { id: prospect.id },
    data: { status: 'scripted', scriptedAt: new Date() },
  });

  const shortId = saved.id.slice(0, 8);

  return JSON.stringify({
    prospect_name: prospect.name,
    script: scriptText,
    script_id: shortId,
    feedback_commands: {
      no_response: `/fb_${shortId}_no`,
      replied: `/fb_${shortId}_replied`,
      converted: `/fb_${shortId}_converted`,
    },
  });
}
