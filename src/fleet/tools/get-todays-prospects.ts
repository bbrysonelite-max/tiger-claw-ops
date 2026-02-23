import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';

export const definition: Anthropic.Tool = {
  name: 'get_todays_prospects',
  description: 'Fetch the top 5 prospects from the pipeline (score 70+, status new). Use this when the user asks who to contact today, wants to see their prospects, or asks for their daily report.',
  input_schema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },
};

export async function execute(
  _input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const prospects = await ctx.prisma.prospect.findMany({
    where: {
      tenantId: ctx.tenantId,
      status: 'new',
      score: { gte: 70 },
    },
    orderBy: { score: 'desc' },
    take: 5,
  });

  if (prospects.length === 0) {
    return JSON.stringify({
      count: 0,
      message: 'No high-quality prospects queued yet. The scout is still hunting.',
    });
  }

  return JSON.stringify({
    count: prospects.length,
    prospects: prospects.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      source: p.source,
      summary: p.summary,
      signals: p.signals,
      language: p.language,
    })),
  });
}
