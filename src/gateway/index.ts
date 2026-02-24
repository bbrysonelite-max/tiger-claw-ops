/**
 * Tiger Claw Scout - Gateway Server
 * Lightweight Express server that receives webhooks and pushes to Redis queues
 * NO business logic - just queue and respond
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { InboundJobData, ProvisionJobData, QUEUE_NAMES } from '../shared/types.js';

// --- Configuration ---
const PORT = process.env.GATEWAY_PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// --- Redis Connection ---
const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('connect', () => {
  console.log('[gateway] Connected to Redis');
});

redisConnection.on('error', (err: Error) => {
  console.error('[gateway] Redis connection error:', err.message);
});

// --- BullMQ Queues ---
const inboundQueue = new Queue(QUEUE_NAMES.INBOUND, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const provisionQueue = new Queue(QUEUE_NAMES.PROVISION, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// --- Express App ---
const app = express();

// Raw body for Stripe signature verification
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON body for Telegram webhooks
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[gateway] ${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'tiger-bot-gateway',
    timestamp: new Date().toISOString(),
    redis: redisConnection.status,
  });
});

// --- Telegram Webhook Endpoint ---
// Receives updates from Telegram for any tenant bot
// The token_hash in the URL identifies which tenant
app.post('/webhooks/:token_hash', async (req: Request, res: Response) => {
  const { token_hash } = req.params;
  const update = req.body;

  if (!update || typeof update !== 'object') {
    console.warn(`[gateway] Invalid webhook body for hash: ${token_hash}`);
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const jobData: InboundJobData = {
      hash: String(token_hash),
      update: update,
    };

    // Push to inbound queue with job ID based on update_id for deduplication
    const jobId = `${token_hash}-${update.update_id || Date.now()}`;
    
    await inboundQueue.add('telegram_update', jobData, {
      jobId,
      priority: 1, // High priority for user messages
    });

    console.log(`[gateway] Queued inbound job: ${jobId}`);
    
    // Return 200 immediately - Telegram requires fast response
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(`[gateway] Error queueing webhook:`, error);
    // Still return 200 to prevent Telegram retry storms
    return res.status(200).json({ ok: true, warning: 'queue_error' });
  }
});

// --- Stripe Webhook Endpoint ---
// Receives payment events from Stripe
app.post('/stripe/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const rawBody = req.body;

  // In production, verify Stripe signature
  // For now, parse the event directly
  let event: any;

  try {
    // If we have Stripe SDK and secret, verify signature
    // For minimal gateway, we trust the payload
    if (typeof rawBody === 'string') {
      event = JSON.parse(rawBody);
    } else if (Buffer.isBuffer(rawBody)) {
      event = JSON.parse(rawBody.toString('utf8'));
    } else {
      event = rawBody;
    }
  } catch (err) {
    console.error('[gateway] Stripe webhook parse error:', err);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Handle checkout.session.completed for new subscriptions
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      const jobData: ProvisionJobData = {
        stripeId: session.customer || session.id,
        email: session.customer_email || session.customer_details?.email || '',
        name: session.customer_details?.name || 'New Customer',
      };

      const jobId = `provision-${session.id}`;
      
      await provisionQueue.add('provision_bot', jobData, {
        jobId,
        priority: 2,
      });

      console.log(`[gateway] Queued provision job: ${jobId} for ${jobData.email}`);
    } catch (error) {
      console.error('[gateway] Error queueing provision job:', error);
    }
  }

  // Handle subscription cancellation
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    console.log(`[gateway] Subscription cancelled: ${subscription.id}`);
    // Could queue a suspension job here
  }

  // Always acknowledge Stripe webhooks
  return res.status(200).json({ received: true });
});


// --- Admin Provisioning Endpoints ---
// Manual customer provisioning for admin use
app.post('/admin/provision', async (req: Request, res: Response) => {
  const { email, name, stripeId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const jobData: ProvisionJobData = {
      stripeId: stripeId || `manual-${Date.now()}`,
      email: email,
      name: name || 'Customer',
    };

    const jobId = `provision-manual-${Date.now()}`;

    await provisionQueue.add('provision_bot', jobData, {
      jobId,
      priority: 2,
    });

    console.log(`[gateway] Queued manual provision job: ${jobId} for ${email}`);

    return res.status(200).json({ 
      success: true, 
      jobId,
      email,
      name: jobData.name 
    });
  } catch (error) {
    console.error('[gateway] Error queueing manual provision:', error);
    return res.status(500).json({ error: 'Failed to queue provision job' });
  }
});

// Batch provisioning
app.post('/admin/provision/batch', async (req: Request, res: Response) => {
  const { customers } = req.body;

  if (!customers || !Array.isArray(customers)) {
    return res.status(400).json({ error: 'customers array is required' });
  }

  const results = [];

  for (const customer of customers) {
    try {
      const jobData: ProvisionJobData = {
        stripeId: customer.stripeId || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: customer.email,
        name: customer.name || 'Customer',
      };

      const jobId = `provision-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await provisionQueue.add('provision_bot', jobData, {
        jobId,
        priority: 3,
      });

      results.push({ email: customer.email, success: true, jobId });
    } catch (error) {
      results.push({ email: customer.email, success: false, error: String(error) });
    }
  }

  return res.status(200).json({ 
    success: true, 
    total: customers.length,
    results 
  });
});

// --- 404 Handler ---
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Error Handler ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[gateway] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
const server = app.listen(PORT, () => {
  console.log(`[gateway] Tiger Claw Gateway running on port ${PORT}`);
  console.log(`[gateway] Redis: ${REDIS_URL}`);
  console.log(`[gateway] Endpoints:`);
  console.log(`[gateway]   POST /webhooks/:token_hash - Telegram webhooks`);
  console.log(`[gateway]   POST /stripe/webhook - Stripe webhooks`);
  console.log(`[gateway]   GET  /health - Health check`);
});

// --- Graceful Shutdown ---
const shutdown = async () => {
  console.log('[gateway] Shutting down...');

  // Close HTTP server first so the port is released before PM2 restarts
  await new Promise<void>((resolve) => server.close(() => resolve()));

  await inboundQueue.close();
  await provisionQueue.close();
  await redisConnection.quit();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app };
