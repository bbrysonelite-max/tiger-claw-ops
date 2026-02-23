import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import TelegramBot from 'node-telegram-bot-api';

export interface ToolContext {
  tenantId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tenant: any;           // Full Prisma Tenant record (typed as any until flavorSlug migration)
  prisma: PrismaClient;
  bot: TelegramBot;
  chatId: number;
  anthropic: Anthropic;
}

export interface ToolDefinition {
  definition: Anthropic.Tool;
  execute: (input: Record<string, unknown>, ctx: ToolContext) => Promise<string>;
}
