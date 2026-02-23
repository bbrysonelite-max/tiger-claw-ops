import Anthropic from '@anthropic-ai/sdk';
import { googleSearch } from '../web-search.js';
import { ToolContext } from './types.js';

export const definition: Anthropic.Tool = {
  name: 'search_web',
  description: 'Search the web for information about a prospect, company, or topic. Use this when the user asks you to look something up or find information about a person.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
    },
    required: ['query'],
  },
};

export async function execute(
  input: Record<string, unknown>,
  _ctx: ToolContext
): Promise<string> {
  const query = String(input.query || '');
  const results = await googleSearch(query);

  if (results.length === 0) {
    return JSON.stringify({ results: [], message: 'No results found.' });
  }

  return JSON.stringify({
    results: results.slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    })),
  });
}
