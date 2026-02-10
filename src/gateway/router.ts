/**
 * Tiger Bot Scout - Fleet Router
 * Extracted router class for testability
 * Handles webhook routing without business logic
 */

import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { InboundJobData, ProvisionJobData, QUEUE_NAMES } from '../shared/types.js';

export interface RouterConfig {
  redisUrl?: string;
  redisConnection?: Redis;
}

export class FleetRouter {
  private inboundQueue: Queue;
  private provisionQueue: Queue;
  private redisConnection: Redis;
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
   * @param hash - The public webhook hash (identifies tenant)
   * @param update - The Telegram Update object
   */
  async handleWebhook(hash: string, update: any): Promise<string> {
    if (!update || typeof update !== 'object') {
      throw new Error('Invalid update payload');
    }

    const jobData: InboundJobData = {
      hash,
      update,
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
   * Route Stripe checkout session to provisioning queue
   * @param session - Stripe checkout session object
   */
  async handleStripeCheckout(session: { customer: string; customer_email?: string; customer_details?: { name?: string } } | null): Promise<string> {
    if (!session) {
      return 'skipped-null-session';
    }

    const jobData: ProvisionJobData = {
      stripeId: session.customer,
      email: session.customer_email || '',
      name: session.customer_details?.name || 'Customer',
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
