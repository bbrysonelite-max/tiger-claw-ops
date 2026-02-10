/**
 * Tiger Bot Scout - Fleet Router
 * Extracted router class for testability
 * Handles webhook routing without business logic
 */

import { Queue } from 'bullmq';
import Redis, { Redis as RedisClient } from 'ioredis';
import { InboundJobData, ProvisionJobData, QUEUE_NAMES } from '../shared/types.js';

export interface RouterConfig {
  redisUrl?: string;
  redisConnection?: RedisClient;
}

export class FleetRouter {
  private inboundQueue: Queue;
  private provisionQueue: Queue;
  private redisConnection: RedisClient;
  private ownsConnection: boolean = false;

  constructor(config: RouterConfig = {}) {
    const redisUrl = config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
    
    if (config.redisConnection) {
      this.redisConnection = config.redisConnection;
    } else {
      this.redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
      this.ownsConnection = true;
    }

    this.inboundQueue = new Queue(QUEUE_NAMES.INBOUND, {
      connection: this.redisConnection,
    });

    this.provisionQueue = new Queue(QUEUE_NAMES.PROVISION, {
      connection: this.redisConnection,
    });
  }

  /**
   * Route incoming Telegram webhook to processing queue
   */
  async routeInbound(botToken: string, update: any): Promise<string> {
    const jobData: InboundJobData = {
      botToken,
      update,
      receivedAt: new Date().toISOString(),
    };

    const job = await this.inboundQueue.add('telegram-update', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });

    return job.id || 'unknown';
  }

  /**
   * Route provisioning request to queue
   */
  async routeProvision(customerId: string, email: string, displayName: string): Promise<string> {
    const jobData: ProvisionJobData = {
      customerId,
      email,
      displayName,
      requestedAt: new Date().toISOString(),
    };

    const job = await this.provisionQueue.add('provision-bot', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return job.id || 'unknown';
  }

  /**
   * Get queue metrics for monitoring
   */
  async getMetrics(): Promise<{
    inbound: { waiting: number; active: number; completed: number; failed: number };
    provision: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const [inboundCounts, provisionCounts] = await Promise.all([
      this.inboundQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
      this.provisionQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
    ]);

    return {
      inbound: inboundCounts as any,
      provision: provisionCounts as any,
    };
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    await this.inboundQueue.close();
    await this.provisionQueue.close();
    if (this.ownsConnection) {
      await this.redisConnection.quit();
    }
  }
}
