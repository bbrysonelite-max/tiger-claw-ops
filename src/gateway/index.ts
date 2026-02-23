/**
 * Tiger Bot Scout - Gateway Server
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
const STANSTORE_WEBHOOK_SECRET = process.env.STANSTORE_WEBHOOK_SECRET;

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

// --- Stan Store Webhook Endpoint ---
// Receives purchase events from Stan Store via Zapier
// Must be defined BEFORE /webhooks/:token_hash to avoid wildcard match
// Zapier config: send POST to https://api.botcraftwrks.ai/webhooks/stanstore
//   with header X-Webhook-Secret: <STANSTORE_WEBHOOK_SECRET>
//   and body: { "email": "...", "name": "..." }
app.post('/webhooks/stanstore', async (req: Request, res: Response) => {
  // Optional secret verification
  if (STANSTORE_WEBHOOK_SECRET) {
    const provided = req.headers['x-webhook-secret'] || req.query.secret;
    if (provided !== STANSTORE_WEBHOOK_SECRET) {
      console.warn('[gateway] Stan Store webhook: invalid secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const body = req.body;

  // Accept multiple field name conventions from Zapier/Stan Store
  const email = body.email || body.customer_email || body.buyer_email || body.Email || '';
  const firstName = body.first_name || body.firstName || body.First_Name || '';
  const lastName = body.last_name || body.lastName || body.Last_Name || '';
  const fullName = body.name || body.customer_name || body.buyer_name || body.Name ||
    (firstName && lastName ? `${firstName} ${lastName}`.trim() : firstName || lastName || 'New Customer');
  const orderId = body.order_id || body.orderId || body.id || `stanstore-${Date.now()}`;

  if (!email) {
    console.warn('[gateway] Stan Store webhook: missing email in payload', JSON.stringify(body));
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const jobData: ProvisionJobData = {
      stripeId: `stanstore-${orderId}`,
      email,
      name: fullName,
    };

    const jobId = `provision-stanstore-${orderId}`;

    await provisionQueue.add('provision_bot', jobData, {
      jobId,
      priority: 2,
    });

    console.log(`[gateway] Stan Store purchase queued for provisioning: ${email} (job: ${jobId})`);

    return res.status(200).json({ received: true, email, jobId });
  } catch (error) {
    console.error('[gateway] Stan Store webhook queue error:', error);
    return res.status(500).json({ error: 'Failed to queue provision job' });
  }
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

// --- Admin: Telegram Session Pool Management ---
// Manage the pool of Telegram user accounts used for BotFather bot creation.
// Each account can create ~18 bots before the pool rotates to the next.
// Add new accounts here whenever BotFather capacity is running low.

import { PrismaClient as GatewayPrisma } from '@prisma/client';
const gatewayPrisma = new GatewayPrisma();

// List all sessions with their current status
app.get('/admin/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = await (gatewayPrisma as any).telegramSession.findMany({
      select: {
        id: true,
        phoneNumber: true,
        botsCreated: true,
        isActive: true,
        isRateLimited: true,
        rateLimitExpiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { botsCreated: 'asc' },
    });

    const totalCapacity = sessions
      .filter((s: any) => s.isActive && !s.isRateLimited)
      .reduce((sum: number, s: any) => sum + Math.max(0, 18 - s.botsCreated), 0);

    return res.status(200).json({
      sessions,
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s: any) => s.isActive && !s.isRateLimited).length,
      remainingBotCapacity: totalCapacity,
    });
  } catch (error) {
    console.error('[gateway] Error listing sessions:', error);
    return res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// Add a new Telegram session to the pool
// Body: { phoneNumber: "+13852415997", sessionString: "1BQAA..." }
app.post('/admin/sessions', async (req: Request, res: Response) => {
  const { phoneNumber, sessionString, apiId, apiHash } = req.body;

  if (!phoneNumber || !sessionString) {
    return res.status(400).json({ error: 'phoneNumber and sessionString are required' });
  }

  try {
    const session = await (gatewayPrisma as any).telegramSession.upsert({
      where: { phoneNumber },
      create: {
        phoneNumber,
        sessionString,
        apiId: apiId || 2040,
        apiHash: apiHash || 'b18441a1ff607e10a989891a5462e627',
        botsCreated: 0,
        isActive: true,
        isRateLimited: false,
      },
      update: {
        sessionString,
        isActive: true,
        isRateLimited: false,
        rateLimitExpiresAt: null,
      },
    });

    console.log(`[gateway] Session added/updated for ${phoneNumber}`);
    return res.status(200).json({ success: true, id: session.id, phoneNumber: session.phoneNumber });
  } catch (error) {
    console.error('[gateway] Error adding session:', error);
    return res.status(500).json({ error: 'Failed to add session' });
  }
});

// Deactivate a session
app.delete('/admin/sessions/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await (gatewayPrisma as any).telegramSession.update({
      where: { id },
      data: { isActive: false },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to deactivate session' });
  }
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
  console.log(`[gateway] Tiger Bot Gateway running on port ${PORT}`);
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
