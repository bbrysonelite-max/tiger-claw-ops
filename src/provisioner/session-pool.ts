/**
 * Tiger Bot Scout - Telegram Session Pool
 *
 * Manages a rotating pool of Telegram user sessions for BotFather automation.
 * Each Telegram account can create up to ~20 bots before hitting BotFather limits.
 * The pool automatically rotates to the next available session when one is exhausted.
 *
 * Sessions are stored in the PostgreSQL `telegram_sessions` table and persist
 * across restarts. Add new sessions via the admin API or CLI.
 *
 * Usage:
 *   const pool = new SessionPool(prisma);
 *   const session = await pool.acquireSession();
 *   // use session.sessionString to create TelegramClient
 *   await pool.recordBotCreated(session.id);
 *   await pool.releaseSession(session.id);
 */

import { PrismaClient } from '@prisma/client';

// BotFather allows ~20 bots per account. Use 18 as safe limit before rotating.
const MAX_BOTS_PER_SESSION = 18;

// API credentials — use Telegram Desktop official (whitelisted, no restrictions)
export const POOL_API_ID = 2040;
export const POOL_API_HASH = 'b18441a1ff607e10a989891a5462e627';

export interface PoolSession {
  id: string;
  phoneNumber: string;
  sessionString: string;
  apiId: number;
  apiHash: string;
  botsCreated: number;
}

export class SessionPool {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get the best available session — active, not rate-limited, fewest bots created.
   * Returns null if no sessions are available.
   */
  async acquireSession(): Promise<PoolSession | null> {
    const now = new Date();

    const row = await (this.prisma as any).telegramSession.findFirst({
      where: {
        isActive: true,
        botsCreated: { lt: MAX_BOTS_PER_SESSION },
        OR: [
          { isRateLimited: false },
          { rateLimitExpiresAt: { lt: now } },
        ],
      },
      orderBy: { botsCreated: 'asc' },
    });

    if (!row) return null;

    // Auto-clear expired rate limits
    if (row.isRateLimited && row.rateLimitExpiresAt && row.rateLimitExpiresAt < now) {
      await (this.prisma as any).telegramSession.update({
        where: { id: row.id },
        data: { isRateLimited: false, rateLimitExpiresAt: null },
      });
      row.isRateLimited = false;
    }

    await (this.prisma as any).telegramSession.update({
      where: { id: row.id },
      data: { lastUsedAt: now },
    });

    return {
      id: row.id,
      phoneNumber: row.phoneNumber,
      sessionString: row.sessionString,
      apiId: row.apiId || POOL_API_ID,
      apiHash: row.apiHash || POOL_API_HASH,
      botsCreated: row.botsCreated,
    };
  }

  /**
   * Increment the bot count for a session after a successful bot creation.
   */
  async recordBotCreated(sessionId: string): Promise<void> {
    await (this.prisma as any).telegramSession.update({
      where: { id: sessionId },
      data: { botsCreated: { increment: 1 } },
    });
  }

  /**
   * Mark a session as rate-limited (BotFather rejected with "too many attempts").
   * Parses the wait time from BotFather's response if possible.
   */
  async markRateLimited(sessionId: string, botFatherMessage: string): Promise<void> {
    // Parse seconds from "Please try again in 82936 seconds"
    const match = botFatherMessage.match(/(\d+)\s*seconds?/i);
    const waitSeconds = match ? parseInt(match[1], 10) : 86400; // default 24h
    const expiresAt = new Date(Date.now() + waitSeconds * 1000);

    console.log(`[session-pool] Session ${sessionId} rate limited for ${Math.ceil(waitSeconds / 3600)}h until ${expiresAt.toISOString()}`);

    await (this.prisma as any).telegramSession.update({
      where: { id: sessionId },
      data: {
        isRateLimited: true,
        rateLimitExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Add a new session to the pool.
   */
  async addSession(phoneNumber: string, sessionString: string, apiId?: number, apiHash?: string): Promise<void> {
    await (this.prisma as any).telegramSession.upsert({
      where: { phoneNumber },
      create: {
        phoneNumber,
        sessionString,
        apiId: apiId || POOL_API_ID,
        apiHash: apiHash || POOL_API_HASH,
        botsCreated: 0,
        isActive: true,
        isRateLimited: false,
      },
      update: {
        sessionString,
        apiId: apiId || POOL_API_ID,
        apiHash: apiHash || POOL_API_HASH,
        isActive: true,
        isRateLimited: false,
      },
    });
    console.log(`[session-pool] Session added/updated for ${phoneNumber}`);
  }

  /**
   * Deactivate a session (e.g., account deleted, 2FA changed).
   */
  async deactivateSession(sessionId: string): Promise<void> {
    await (this.prisma as any).telegramSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
  }

  /**
   * List all sessions with their status.
   */
  async listSessions(): Promise<Array<{
    id: string;
    phoneNumber: string;
    botsCreated: number;
    isActive: boolean;
    isRateLimited: boolean;
    rateLimitExpiresAt: Date | null;
    lastUsedAt: Date | null;
  }>> {
    return await (this.prisma as any).telegramSession.findMany({
      select: {
        id: true,
        phoneNumber: true,
        botsCreated: true,
        isActive: true,
        isRateLimited: true,
        rateLimitExpiresAt: true,
        lastUsedAt: true,
      },
      orderBy: { botsCreated: 'asc' },
    });
  }

  /**
   * How many sessions are currently available (not rate limited, under limit).
   */
  async availableCount(): Promise<number> {
    const now = new Date();
    return await (this.prisma as any).telegramSession.count({
      where: {
        isActive: true,
        botsCreated: { lt: MAX_BOTS_PER_SESSION },
        OR: [
          { isRateLimited: false },
          { rateLimitExpiresAt: { lt: now } },
        ],
      },
    });
  }

  /**
   * Total bot capacity remaining across all available sessions.
   */
  async remainingCapacity(): Promise<number> {
    const now = new Date();
    const sessions = await (this.prisma as any).telegramSession.findMany({
      where: {
        isActive: true,
        botsCreated: { lt: MAX_BOTS_PER_SESSION },
        OR: [
          { isRateLimited: false },
          { rateLimitExpiresAt: { lt: now } },
        ],
      },
      select: { botsCreated: true },
    });
    return sessions.reduce((sum: number, s: any) => sum + (MAX_BOTS_PER_SESSION - s.botsCreated), 0);
  }
}
