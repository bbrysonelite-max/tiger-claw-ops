import Anthropic from '@anthropic-ai/sdk';
import { ToolContext } from './types.js';

export const definition: Anthropic.Tool = {
  name: 'get_calendar_link',
  description: 'Get the tenant\'s Calendly or booking link to share with a prospect when they want to schedule a call. Use this when the user needs to share their booking link.',
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
  const interview = (ctx.tenant?.interview_data as Record<string, Record<string, string>>) ?? {};
  const i2 = interview.interview2 ?? {};

  const calendarUrl =
    i2.calendly_url ||
    i2.calendar_link ||
    i2.booking_url ||
    (ctx.tenant as Record<string, string>).calendlyUrl ||
    null;

  if (!calendarUrl) {
    return JSON.stringify({
      found: false,
      message: 'No calendar link set up yet. Tell the user to add their Calendly URL in their profile settings.',
    });
  }

  return JSON.stringify({
    found: true,
    url: calendarUrl,
  });
}
