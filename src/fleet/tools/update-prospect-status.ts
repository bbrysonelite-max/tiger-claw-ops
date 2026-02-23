import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';

const VALID_STATUSES = ['new', 'delivered', 'scripted', 'contacted', 'replied', 'converted', 'archived'];

export const definition: Anthropic.Tool = {
  name: 'update_prospect_status',
  description: 'Update the pipeline status of a prospect. Use this when the user reports they contacted someone, got a reply, made a conversion, or wants to archive a lead.',
  input_schema: {
    type: 'object' as const,
    properties: {
      prospect_id: {
        type: 'string',
        description: 'The ID of the prospect to update (8-character short ID or full UUID)',
      },
      status: {
        type: 'string',
        enum: VALID_STATUSES,
        description: 'The new status: new, delivered, scripted, contacted, replied, converted, or archived',
      },
    },
    required: ['prospect_id', 'status'],
  },
};

export async function execute(
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const prospectIdInput = String(input.prospect_id || '');
  const status = String(input.status || '');

  if (!VALID_STATUSES.includes(status)) {
    return JSON.stringify({ error: `Invalid status "${status}". Valid: ${VALID_STATUSES.join(', ')}` });
  }

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

  const timestampFields: Record<string, object> = {
    contacted: { contactedAt: new Date() },
    replied:   { contactedAt: new Date(), repliedAt: new Date() },
    converted: { contactedAt: new Date(), repliedAt: new Date(), convertedAt: new Date() },
  };

  await ctx.prisma.prospect.update({
    where: { id: prospect.id },
    data: { status, ...(timestampFields[status] ?? {}) },
  });

  return JSON.stringify({
    success: true,
    prospect_name: prospect.name,
    new_status: status,
  });
}
