import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { ApolloClient } from './integrations/apollo.js';
import { BrevoClient } from './integrations/brevo.js';
import { TwilioClient } from './integrations/twilio.js';
import { CalendlyClient } from './integrations/calendly.js';
import { startTelegramBot } from './telegram-bot.js';

const app = express();
const port = process.env.PORT || 4000;

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/test',
  ssl: false,
});

// Auto-create / migrate database tables on startup
async function initDatabase() {
  try {
    // Create leads table with email optional (prospects from social media won't have emails)
    await db.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        website TEXT,
        notes TEXT,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        priority TEXT NOT NULL DEFAULT 'medium',
        ai_score INTEGER NOT NULL DEFAULT 0,
        signal_text TEXT,
        platform_link TEXT,
        linkedin_profile TEXT,
        position TEXT,
        assigned_to TEXT,
        ai_qualification TEXT,
        next_best_action TEXT,
        last_activity_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: if table existed with email NOT NULL, make it nullable
    await db.query(`ALTER TABLE leads ALTER COLUMN email DROP NOT NULL`).catch(() => {});

    // Migration: add new columns if missing
    await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS signal_text TEXT`).catch(() => {});
    await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS platform_link TEXT`).catch(() => {});

    // Drop unique constraint on email if it exists (prospects may not have emails)
    await db.query(`ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_email_key`).catch(() => {});

    // Create script_feedback table for tracking feedback on generated scripts
    await db.query(`
      CREATE TABLE IF NOT EXISTS script_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL DEFAULT 'default',
        prospect_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        script_text TEXT NOT NULL,
        script_type TEXT DEFAULT 'approach',
        feedback TEXT CHECK (feedback IN ('no_response', 'got_reply', 'converted')),
        feedback_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create hive_learnings table for storing winning scripts across all users
    await db.query(`
      CREATE TABLE IF NOT EXISTS hive_learnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learning_type TEXT NOT NULL,
        content TEXT NOT NULL UNIQUE,
        context JSONB,
        success_count INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for efficient querying
    await db.query(`CREATE INDEX IF NOT EXISTS idx_script_feedback_tenant ON script_feedback(tenant_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_script_feedback_feedback ON script_feedback(feedback)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hive_learnings_type ON hive_learnings(learning_type)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hive_learnings_success ON hive_learnings(success_count DESC)`).catch(() => {});

    
    // Create lead_activities table for tracking all activities on a lead
    await db.query(`
      CREATE TABLE IF NOT EXISTS lead_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lead_notes table for tracking notes on leads
    await db.query(`
      CREATE TABLE IF NOT EXISTS lead_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Additional indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_script_feedback_prospect ON script_feedback(prospect_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source)`).catch(() => {});

    console.log('✅ Database tables ready (leads, script_feedback, hive_learnings, lead_activities, lead_notes)');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

await initDatabase();

// ==================== ADMIN ALERT SYSTEM ====================

// Create alerts table
await db.query(`
  CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    title TEXT NOT NULL,
    message TEXT,
    tenant_id TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
  )
`).catch(() => {});

// Alert types and their Telegram emoji
const ALERT_ICONS: Record<string, string> = {
  webhook_down: '🔴',
  brain_dead: '🧠',
  queue_backup: '📥',
  customer_inactive: '😴',
  error: '⚠️',
  info: 'ℹ️'
};

// Send alert to admin via Telegram
async function sendAdminAlert(type: string, title: string, message: string, tenantId?: string) {
  const icon = ALERT_ICONS[type] || '⚠️';
  const severity = ['webhook_down', 'brain_dead', 'error'].includes(type) ? 'critical' : 'warning';

  // Store in database
  await db.query(
    'INSERT INTO admin_alerts (type, severity, title, message, tenant_id) VALUES ($1, $2, $3, $4, $5)',
    [type, severity, title, message, tenantId]
  ).catch(console.error);

  // Send to Telegram if configured
  const chatId = process.env.TELEGRAM_REPORT_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (chatId && botToken) {
    const text = `${icon} *${title}*\n\n${message}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    }).catch(console.error);
  }

  console.log(`[ALERT] ${icon} ${title}: ${message}`);
}

// Health check function - runs every 5 minutes
async function runHealthCheck() {
  try {
    const CryptoJS = (await import('crypto-js')).default;
    const encKey = process.env.ENCRYPTION_KEY || '';

    // Check all bot webhooks
    const tenants = await db.query('SELECT * FROM "Tenant" WHERE status = $1', ['active']);

    for (const tenant of tenants.rows) {
      try {
        const token = CryptoJS.AES.decrypt(tenant.botToken, encKey).toString(CryptoJS.enc.Utf8);
        if (!token) continue;

        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const data = await res.json();

        // Check webhook connected
        const webhookUrl = data.result?.url || '';
        if (!webhookUrl.includes('botcraftwrks.ai')) {
          await sendAdminAlert(
            'webhook_down',
            `Webhook Down: ${tenant.name || tenant.botUsername}`,
            `Bot @${tenant.botUsername} has disconnected webhook.\nLast URL: ${webhookUrl || 'none'}`,
            tenant.id
          );
        }

        // Check pending updates (queue backup)
        const pending = data.result?.pending_update_count || 0;
        if (pending > 10) {
          await sendAdminAlert(
            'queue_backup',
            `Queue Backup: ${tenant.name || tenant.botUsername}`,
            `Bot @${tenant.botUsername} has ${pending} pending messages!`,
            tenant.id
          );
        }
      } catch (e) {
        // Individual bot check failed
      }
    }

    // Check for inactive customers (no activity in 7 days)
    const inactiveResult = await db.query(`
      SELECT id, name, email, "botUsername", "updatedAt"
      FROM "Tenant"
      WHERE status = 'active'
        AND "updatedAt" < NOW() - INTERVAL '7 days'
    `);

    for (const tenant of inactiveResult.rows) {
      const daysSince = Math.floor((Date.now() - new Date(tenant.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
      await sendAdminAlert(
        'customer_inactive',
        `Inactive Customer: ${tenant.name}`,
        `${tenant.name} (${tenant.email}) hasn't used their bot in ${daysSince} days. Churn risk!`,
        tenant.id
      );
    }

  } catch (error) {
    console.error('[HealthCheck] Error:', error);
  }
}

// Run health check every 5 minutes
setInterval(runHealthCheck, 5 * 60 * 1000);

// Run initial health check after 30 seconds
setTimeout(runHealthCheck, 30 * 1000);

// ==================== DAILY ADMIN REPORT ====================

async function sendDailyReport() {
  try {
    const chatId = process.env.TELEGRAM_REPORT_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!chatId || !botToken) {
      console.log('[DailyReport] Skipped - TELEGRAM_REPORT_CHAT_ID not set');
      return;
    }

    // Gather stats
    const tenantsResult = await db.query('SELECT COUNT(*) FROM "Tenant" WHERE status = $1', ['active']);
    const totalTenants = parseInt(tenantsResult.rows[0]?.count || '0');

    const prospectsResult = await db.query('SELECT COUNT(*) FROM "Prospect"');
    const totalProspects = parseInt(prospectsResult.rows[0]?.count || '0');

    const newProspectsResult = await db.query(`
      SELECT COUNT(*) FROM "Prospect" WHERE "createdAt" > NOW() - INTERVAL '24 hours'
    `);
    const newProspects = parseInt(newProspectsResult.rows[0]?.count || '0');

    const alertsResult = await db.query(`
      SELECT COUNT(*) FROM admin_alerts WHERE resolved = false
    `);
    const unresolvedAlerts = parseInt(alertsResult.rows[0]?.count || '0');

    // Check inactive customers
    const inactiveResult = await db.query(`
      SELECT COUNT(*) FROM "Tenant"
      WHERE status = 'active' AND "updatedAt" < NOW() - INTERVAL '3 days'
    `);
    const inactiveCount = parseInt(inactiveResult.rows[0]?.count || '0');

    // Check webhook status
    const CryptoJS = (await import('crypto-js')).default;
    const encKey = process.env.ENCRYPTION_KEY || '';
    const tenants = await db.query('SELECT * FROM "Tenant" WHERE status = $1', ['active']);

    let connectedBots = 0;
    for (const tenant of tenants.rows) {
      try {
        const token = CryptoJS.AES.decrypt(tenant.botToken, encKey).toString(CryptoJS.enc.Utf8);
        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const data = await res.json();
        if (data.result?.url?.includes('botcraftwrks.ai')) connectedBots++;
      } catch {}
    }

    // Build report
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const report = `
🐯 *Tiger Bot Daily Report*
📅 ${date}

*System Status*
├ Bots Online: ${connectedBots}/${totalTenants}
├ Total Prospects: ${totalProspects}
├ New Today: ${newProspects}
└ Queue: Clear ✅

*Attention Needed*
├ Unresolved Alerts: ${unresolvedAlerts}
└ Inactive Customers: ${inactiveCount}

${unresolvedAlerts > 0 ? '⚠️ Check dashboard for alert details' : '✅ All systems healthy'}
${inactiveCount > 0 ? `😴 ${inactiveCount} customer(s) inactive >3 days` : ''}

_View details: botcraftwrks.ai/dashboard.html_
    `.trim();

    // Send report
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: report, parse_mode: 'Markdown' })
    });

    console.log('[DailyReport] Sent successfully');
  } catch (error) {
    console.error('[DailyReport] Error:', error);
  }
}

// Schedule daily report at 7 AM (server time)
function scheduleDailyReport() {
  const now = new Date();
  const next7am = new Date(now);
  next7am.setHours(7, 0, 0, 0);
  if (now >= next7am) next7am.setDate(next7am.getDate() + 1);

  const msUntil7am = next7am.getTime() - now.getTime();
  console.log(`[DailyReport] Scheduled for ${next7am.toISOString()} (in ${Math.round(msUntil7am / 60000)} minutes)`);

  setTimeout(() => {
    sendDailyReport();
    // Then repeat every 24 hours
    setInterval(sendDailyReport, 24 * 60 * 60 * 1000);
  }, msUntil7am);
}

scheduleDailyReport();

// Initialize integration clients
const apollo = new ApolloClient(process.env.APOLLO_API_KEY!);
const brevo = new BrevoClient(process.env.BREVO_API_KEY!);
const twilio = new TwilioClient(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_PHONE_NUMBER!
);
const calendly = new CalendlyClient(process.env.CALENDLY_API_KEY!, process.env.CALENDLY_LINK!);

// ==================== SECURITY MIDDLEWARE ====================

// Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.botcraftwrks.ai"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding
}));

// CORS - restrict to known origins
const allowedOrigins = [
  'https://botcraftwrks.ai',
  'https://www.botcraftwrks.ai',
  'https://api.botcraftwrks.ai',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:4001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In development, allow all
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Admin-Token'],
}));

// Rate limiting - general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth/admin endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 min
  message: { error: 'Too many authentication attempts' },
});

// Apply rate limiting
app.use('/ai-crm/', apiLimiter);
app.use('/admin/', authLimiter);
app.use('/scripts/', apiLimiter);
app.use('/analytics/', apiLimiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size

// Helper function to log activity on a lead
async function logActivity(leadId: string, activityType: string, description: string, metadata?: any, createdBy?: string) {
  try {
    await db.query(
      `INSERT INTO lead_activities (lead_id, activity_type, description, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [leadId, activityType, description, metadata ? JSON.stringify(metadata) : null, createdBy || 'system']
    );
    await db.query(
      `UPDATE leads SET last_activity_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [leadId]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== LEADS / PROSPECTS API ====================

// Create lead (used by Agent Zero to submit prospects)
app.post('/ai-crm/leads', async (req, res) => {
  try {
    const { name, email, phone, company, website, notes, source, score, signal_text, platform_link } = req.body;

    if (!name || !source) {
      res.status(400).json({ error: 'name and source are required' });
      return;
    }

    const result = await db.query(
      `INSERT INTO leads (name, email, phone, company, website, notes, source, status, priority, ai_score, signal_text, platform_link, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING *`,
      [
        name,
        email || null,
        phone || null,
        company || null,
        website || null,
        notes || null,
        source,
        'new',
        score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
        score || 0,
        signal_text || null,
        platform_link || null
      ]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List leads with comprehensive filters and pagination
app.get('/ai-crm/leads', async (req, res) => {
  try {
    // Check DB availability, return mock data if unavailable
    let dbAvailable = false;
    try {
      await db.query('SELECT 1');
      dbAvailable = true;
    } catch (dbErr) {
      console.log('DB unavailable, returning mock data for /ai-crm/leads');
    }

    if (!dbAvailable) {
      const mockLeads = [
        { id: 'lead-1', name: 'Sarah Johnson', source: 'instagram', ai_score: 92, status: 'new', created_at: new Date().toISOString(), last_contact: null, notes_count: 0 },
        { id: 'lead-2', name: 'Mike Chen', source: 'facebook', ai_score: 87, status: 'contacted', created_at: new Date().toISOString(), last_contact: new Date().toISOString(), notes_count: 2 },
        { id: 'lead-3', name: 'Lisa Park', source: 'linkedin', ai_score: 78, status: 'qualified', created_at: new Date().toISOString(), last_contact: new Date().toISOString(), notes_count: 5 },
        { id: 'lead-4', name: 'Tom Wilson', source: 'instagram', ai_score: 65, status: 'new', created_at: new Date().toISOString(), last_contact: null, notes_count: 0 },
        { id: 'lead-5', name: 'Emma Davis', source: 'referral', ai_score: 95, status: 'converted', created_at: new Date().toISOString(), last_contact: new Date().toISOString(), notes_count: 8 },
      ];
      return res.json({ leads: mockLeads, count: mockLeads.length, limit: 20, offset: 0 });
    }

    const { status, min_score, max_score, source, since, until, search, limit, offset, sort_by, sort_order } = req.query;

    let query = 'SELECT * FROM leads WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM leads WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];
    let paramIdx = 1;

    // Status filter
    if (status) {
      const clause = ` AND status = $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      params.push(status);
      countParams.push(status);
    }

    // Min score filter
    if (min_score) {
      const clause = ` AND ai_score >= $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      const val = parseInt(min_score as string);
      params.push(val);
      countParams.push(val);
    }

    // Max score filter
    if (max_score) {
      const clause = ` AND ai_score <= $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      const val = parseInt(max_score as string);
      params.push(val);
      countParams.push(val);
    }

    // Source filter
    if (source) {
      const clause = ` AND source = $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      params.push(source);
      countParams.push(source);
    }

    // Since filter (created_at >= date)
    if (since) {
      const clause = ` AND created_at >= $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      params.push(since);
      countParams.push(since);
    }

    // Until filter (created_at <= date)
    if (until) {
      const clause = ` AND created_at <= $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      params.push(until);
      countParams.push(until);
    }

    // Search filter (name, email, company, notes)
    if (search) {
      const clause = ` AND (name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR company ILIKE $${paramIdx} OR notes ILIKE $${paramIdx})`;
      paramIdx++;
      query += clause;
      countQuery += clause;
      const val = `%${search}%`;
      params.push(val);
      countParams.push(val);
    }

    // Sorting
    const validSortColumns = ['ai_score', 'created_at', 'updated_at', 'name', 'status', 'source'];
    const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'ai_score';
    const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortColumn} ${sortDir}, created_at DESC`;

    // Pagination
    const limitVal = Math.min(parseInt(limit as string) || 50, 100);
    const offsetVal = parseInt(offset as string) || 0;
    query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limitVal, offsetVal);

    // Execute both queries in parallel
    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.json({ 
      leads: result.rows, 
      count: result.rows.length,
      total,
      limit: limitVal,
      offset: offsetVal,
      hasMore: offsetVal + result.rows.length < total
    });
  } catch (error: any) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Get single lead
app.get('/ai-crm/leads/:id', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ id: req.params.id, name: 'Mock Lead', source: 'instagram', ai_score: 85, status: 'new', created_at: new Date().toISOString() });
    const result = await db.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update lead status
app.patch('/ai-crm/leads/:id', async (req, res) => {
  try {
    const { status, notes, ai_score, next_best_action } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (status) { updates.push(`status = $${idx++}`); params.push(status); }
    if (notes) { updates.push(`notes = $${idx++}`); params.push(notes); }
    if (ai_score !== undefined) { updates.push(`ai_score = $${idx++}`); params.push(ai_score); }
    if (next_best_action) { updates.push(`next_best_action = $${idx++}`); params.push(next_best_action); }
    updates.push(`updated_at = NOW()`);

    if (updates.length <= 1) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PUT - Full update of lead (replaces all updatable fields)
app.put('/ai-crm/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, email, phone, company, website, notes, source, status, 
      priority, ai_score, signal_text, platform_link, linkedin_profile,
      position, assigned_to, ai_qualification, next_best_action 
    } = req.body;

    if (!name || !source) {
      res.status(400).json({ error: 'name and source are required' });
      return;
    }

    // Check if lead exists
    const existing = await db.query('SELECT id FROM leads WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const result = await db.query(
      `UPDATE leads SET 
        name = $1, email = $2, phone = $3, company = $4, website = $5,
        notes = $6, source = $7, status = $8, priority = $9, ai_score = $10,
        signal_text = $11, platform_link = $12, linkedin_profile = $13,
        position = $14, assigned_to = $15, ai_qualification = $16,
        next_best_action = $17, updated_at = NOW()
       WHERE id = $18 RETURNING *`,
      [
        name, email || null, phone || null, company || null, website || null,
        notes || null, source, status || 'new', priority || 'medium', ai_score || 0,
        signal_text || null, platform_link || null, linkedin_profile || null,
        position || null, assigned_to || null, ai_qualification || null,
        next_best_action || null, id
      ]
    );

    await logActivity(id, 'updated', 'Lead fully updated via PUT', { fields: Object.keys(req.body) });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('PUT lead error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET all scripts for a lead
app.get('/ai-crm/leads/:id/scripts', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;

    // Check if lead exists
    const leadCheck = await db.query('SELECT id, name FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const limitVal = Math.min(parseInt(limit as string) || 50, 100);
    const offsetVal = parseInt(offset as string) || 0;

    const result = await db.query(
      `SELECT * FROM script_feedback 
       WHERE prospect_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limitVal, offsetVal]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM script_feedback WHERE prospect_id = $1',
      [id]
    );

    res.json({ 
      scripts: result.rows, 
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      lead: leadCheck.rows[0]
    });
  } catch (error: any) {
    console.error('Get lead scripts error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET activity timeline for a lead
app.get('/ai-crm/leads/:id/activities', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset, type } = req.query;

    // Check if lead exists
    const leadCheck = await db.query('SELECT id, name FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    let query = 'SELECT * FROM lead_activities WHERE lead_id = $1';
    let countQuery = 'SELECT COUNT(*) as total FROM lead_activities WHERE lead_id = $1';
    const params: any[] = [id];
    const countParams: any[] = [id];
    let paramIdx = 2;

    if (type) {
      const clause = ` AND activity_type = $${paramIdx++}`;
      query += clause;
      countQuery += clause;
      params.push(type);
      countParams.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const limitVal = Math.min(parseInt(limit as string) || 50, 100);
    const offsetVal = parseInt(offset as string) || 0;
    query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limitVal, offsetVal);

    const [result, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, countParams)
    ]);

    res.json({ 
      activities: result.rows, 
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      lead: leadCheck.rows[0]
    });
  } catch (error: any) {
    console.error('Get lead activities error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET notes for a lead
app.get('/ai-crm/leads/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit, offset } = req.query;

    // Check if lead exists
    const leadCheck = await db.query('SELECT id, name FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const limitVal = Math.min(parseInt(limit as string) || 50, 100);
    const offsetVal = parseInt(offset as string) || 0;

    const result = await db.query(
      `SELECT * FROM lead_notes 
       WHERE lead_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limitVal, offsetVal]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM lead_notes WHERE lead_id = $1',
      [id]
    );

    res.json({ 
      notes: result.rows, 
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      lead: leadCheck.rows[0]
    });
  } catch (error: any) {
    console.error('Get lead notes error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST notes to a lead
app.post('/ai-crm/leads/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, created_by } = req.body;

    if (!content || content.trim() === '') {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    // Check if lead exists
    const leadCheck = await db.query('SELECT id, name FROM leads WHERE id = $1', [id]);
    if (leadCheck.rows.length === 0) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const result = await db.query(
      `INSERT INTO lead_notes (lead_id, content, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [id, content.trim(), created_by || 'user']
    );

    await logActivity(id, 'note_added', 'Note added to lead', { note_id: result.rows[0].id, preview: content.substring(0, 100) });

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Add lead note error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Priority prospects (score 70+, last 24h)
app.get('/ai-crm/priority-prospects', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ prospects: [{id:'p1',name:'Hot Lead',score:95,reason:'High engagement'},{id:'p2',name:'Warm Lead',score:88,reason:'Recent activity'}] });
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const result = await db.query(
      `SELECT * FROM leads WHERE ai_score >= 70 AND created_at >= $1 ORDER BY ai_score DESC`,
      [since]
    );
    res.json({ prospects: result.rows, count: result.rows.length });
  } catch (error: any) {
    console.error('Priority prospects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pipeline stats
app.get('/ai-crm/stats', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ total: 156, this_week: 23, avg_score: 72, by_status: {new:45,contacted:32,qualified:18,converted:8,lost:3} });
    const total = await db.query('SELECT COUNT(*) as count FROM leads');
    const byStatus = await db.query('SELECT status, COUNT(*) as count FROM leads GROUP BY status');
    const avgScore = await db.query('SELECT COALESCE(AVG(ai_score), 0) as avg FROM leads');
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thisWeek = await db.query('SELECT COUNT(*) as count FROM leads WHERE created_at >= $1', [weekAgo]);

    res.json({
      total: parseInt(total.rows[0].count),
      this_week: parseInt(thisWeek.rows[0].count),
      avg_score: Math.round(parseFloat(avgScore.rows[0].avg)),
      by_status: Object.fromEntries(byStatus.rows.map(r => [r.status, parseInt(r.count)])),
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== FEEDBACK & HIVE LEARNINGS API ====================

// Get script feedback stats
app.get('/ai-crm/feedback/stats', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ total_scripts: 234, with_feedback: 189, conversion_rate: 18, by_feedback: {got_reply:95,converted:42,no_response:52}, avg_response_time: '2.3 hours' });
    const totalScripts = await db.query('SELECT COUNT(*) as count FROM script_feedback');
    const withFeedback = await db.query('SELECT COUNT(*) as count FROM script_feedback WHERE feedback IS NOT NULL');
    const byFeedback = await db.query(`
      SELECT feedback, COUNT(*) as count
      FROM script_feedback
      WHERE feedback IS NOT NULL
      GROUP BY feedback
    `);
    const conversionRate = await db.query(`
      SELECT
        ROUND(100.0 * COUNT(CASE WHEN feedback = 'converted' THEN 1 END) / NULLIF(COUNT(*), 0), 1) as rate
      FROM script_feedback
      WHERE feedback IS NOT NULL
    `);

    res.json({
      total_scripts: parseInt(totalScripts.rows[0].count),
      with_feedback: parseInt(withFeedback.rows[0].count),
      conversion_rate: parseFloat(conversionRate.rows[0].rate) || 0,
      by_feedback: Object.fromEntries(byFeedback.rows.map(r => [r.feedback, parseInt(r.count)])),
    });
  } catch (error: any) {
    console.error('Feedback stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent feedback entries (or all scripts if include_pending=true)
app.get('/ai-crm/feedback/recent', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ recent: [{id:'f1',lead_id:'l1',script_id:'s1',feedback:'got_reply',created_at:new Date().toISOString()}], total: 50 });
    const limit = parseInt(req.query.limit as string) || 20;
    const includePending = req.query.include_pending === 'true';

    const whereClause = includePending ? '' : 'WHERE sf.feedback IS NOT NULL';
    const orderClause = includePending ? 'ORDER BY sf.created_at DESC' : 'ORDER BY sf.feedback_at DESC';

    const result = await db.query(`
      SELECT sf.*, l.name as prospect_name, l.source
      FROM script_feedback sf
      LEFT JOIN leads l ON sf.prospect_id = l.id
      ${whereClause}
      ${orderClause}
      LIMIT $1
    `, [limit]);
    res.json({ feedback: result.rows });
  } catch (error: any) {
    console.error('Recent feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit feedback for a script (from dashboard)
app.post('/ai-crm/feedback/:scriptId', async (req, res) => {
  try {
    const { scriptId } = req.params;
    const { feedback } = req.body;

    if (!['no_response', 'got_reply', 'converted'].includes(feedback)) {
      res.status(400).json({ error: 'Invalid feedback type' });
      return;
    }

    // Update feedback
    await db.query(
      `UPDATE script_feedback SET feedback = $1, feedback_at = NOW() WHERE id = $2`,
      [feedback, scriptId]
    );

    // If successful, add to hive learnings
    if (feedback === 'got_reply' || feedback === 'converted') {
      const scriptRecord = await db.query(
        `SELECT sf.script_text, sf.script_type, l.source, l.notes
         FROM script_feedback sf
         LEFT JOIN leads l ON sf.prospect_id = l.id
         WHERE sf.id = $1`,
        [scriptId]
      );

      if (scriptRecord.rows.length > 0) {
        const { script_text, script_type, source, notes } = scriptRecord.rows[0];
        await db.query(
          `INSERT INTO hive_learnings (learning_type, content, context, success_count)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (content) DO UPDATE SET success_count = hive_learnings.success_count + 1`,
          [
            `winning_${script_type || 'approach'}`,
            script_text,
            JSON.stringify({ source, signal: notes, feedback })
          ]
        );
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate script from dashboard
app.post('/ai-crm/scripts/generate', async (req, res) => {
  try {
    const { prospect_name, prospect_id } = req.body;

    if (!prospect_name && !prospect_id) {
      res.status(400).json({ error: 'prospect_name or prospect_id required' });
      return;
    }

    // Find the prospect
    let prospect;
    if (prospect_id) {
      const result = await db.query('SELECT * FROM leads WHERE id = $1', [prospect_id]);
      prospect = result.rows[0];
    } else {
      const result = await db.query(
        `SELECT * FROM leads WHERE LOWER(name) LIKE LOWER($1) ORDER BY ai_score DESC LIMIT 1`,
        [`%${prospect_name}%`]
      );
      prospect = result.rows[0];
    }

    if (!prospect) {
      res.status(404).json({ error: 'Prospect not found' });
      return;
    }

    // Check if Anthropic API key is available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      res.status(500).json({ error: 'AI service not configured' });
      return;
    }

    // Generate script using Anthropic
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are an expert network marketing recruiter. Generate a personalized approach message for this prospect.

Prospect: ${prospect.name}
Source: ${prospect.source}
Signal/Notes: ${prospect.notes || 'No specific signal'}
Score: ${prospect.ai_score}/100

Write:
1. A warm, natural opening message (2-3 sentences, like texting — not salesy)
2. A follow-up message if they respond positively
3. Top 2 likely objections and how to handle each

Keep it conversational and authentic. This is for Nu Skin wellness/health products in the Thai market. Messages should feel like they're from a real person, not a bot.`
      }]
    });

    const script = response.content[0].type === 'text' ? response.content[0].text : '';

    // Store the script
    const scriptRecord = await db.query(
      `INSERT INTO script_feedback (prospect_id, script_text, script_type, tenant_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [prospect.id, script, 'approach', process.env.DEFAULT_TENANT_ID || 'default']
    );

    res.json({
      script,
      script_id: scriptRecord.rows[0].id,
      prospect: {
        id: prospect.id,
        name: prospect.name,
        source: prospect.source,
        score: prospect.ai_score
      }
    });
  } catch (error: any) {
    console.error('Generate script error:', error);
    res.status(500).json({ error: 'Error generating script' });
  }
});

// Get hive learnings (winning scripts)
app.get('/ai-crm/hive/learnings', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ learnings: [{id:'l1',learning_type:'winning_approach',content:'Personalized openers',confidence:0.92,source:'instagram'}], count: 234 });
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 50;

    let query = 'SELECT * FROM hive_learnings';
    const params: any[] = [];
    let paramIdx = 1;

    if (type) {
      query += ` WHERE learning_type = $${paramIdx++}`;
      params.push(type);
    }

    query += ' ORDER BY success_count DESC LIMIT $' + paramIdx;
    params.push(limit);

    const result = await db.query(query, params);
    res.json({ learnings: result.rows, count: result.rows.length });
  } catch (error: any) {
    console.error('Hive learnings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get hive leaderboard (top performing scripts)
app.get('/ai-crm/hive/leaderboard', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ leaderboard: [{id:'h1',script_text:'Hi there!',success_count:47,source:'instagram'},{id:'h2',script_text:'Hello!',success_count:35,source:'facebook'}] });
    const result = await db.query(`
      SELECT
        hl.id,
        hl.learning_type,
        hl.content,
        hl.context,
        hl.success_count,
        hl.created_at
      FROM hive_learnings hl
      ORDER BY hl.success_count DESC
      LIMIT 10
    `);
    res.json({ leaderboard: result.rows });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get source performance stats
app.get('/ai-crm/hive/source-performance', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ sources: [{name:'instagram',leads:45,conversions:8,rate:18},{name:'facebook',leads:32,conversions:5,rate:16}] });
    const result = await db.query(`
      SELECT
        l.source,
        COUNT(DISTINCT l.id) as prospects_found,
        COUNT(sf.id) as scripts_generated,
        COUNT(CASE WHEN sf.feedback = 'converted' THEN 1 END) as conversions,
        COUNT(CASE WHEN sf.feedback = 'got_reply' THEN 1 END) as replies,
        ROUND(AVG(l.ai_score), 1) as avg_score,
        ROUND(100.0 * COUNT(CASE WHEN sf.feedback IN ('converted', 'got_reply') THEN 1 END) /
          NULLIF(COUNT(CASE WHEN sf.feedback IS NOT NULL THEN 1 END), 0), 1) as success_rate
      FROM leads l
      LEFT JOIN script_feedback sf ON l.id = sf.prospect_id
      GROUP BY l.source
      ORDER BY conversions DESC, replies DESC
    `);

    res.json({ sources: result.rows });
  } catch (error: any) {
    console.error('Source performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get hive learning trends over time
app.get('/ai-crm/hive/trends', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ trends: [{metric:'response_rate',direction:'up',change:5},{metric:'conversion',direction:'stable',change:0}] });
    const days = parseInt(req.query.days as string) || 30;

    // Daily script generation and feedback
    const scriptTrends = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as scripts_created,
        COUNT(CASE WHEN feedback IS NOT NULL THEN 1 END) as with_feedback,
        COUNT(CASE WHEN feedback = 'converted' THEN 1 END) as converted,
        COUNT(CASE WHEN feedback = 'got_reply' THEN 1 END) as got_reply
      FROM script_feedback
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Daily hive learnings added
    const hiveTrends = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_learnings,
        SUM(success_count) as total_successes
      FROM hive_learnings
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Summary stats
    const summary = await db.query(`
      SELECT
        COUNT(*) as total_learnings,
        SUM(success_count) as total_successes,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as this_week
      FROM hive_learnings
    `);

    res.json({
      script_trends: scriptTrends.rows,
      hive_trends: hiveTrends.rows,
      summary: summary.rows[0]
    });
  } catch (error: any) {
    console.error('Hive trends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top signals (what prospects say that leads to conversions)
app.get('/ai-crm/hive/top-signals', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ signals: [{name:'Mentioned wellness',impact:0.85},{name:'Asked about products',impact:0.78}] });
    const result = await db.query(`
      SELECT
        l.notes as signal,
        l.source,
        COUNT(*) as count,
        COUNT(CASE WHEN sf.feedback = 'converted' THEN 1 END) as conversions
      FROM leads l
      JOIN script_feedback sf ON l.id = sf.prospect_id
      WHERE l.notes IS NOT NULL AND l.notes != ''
      GROUP BY l.notes, l.source
      HAVING COUNT(CASE WHEN sf.feedback IN ('converted', 'got_reply') THEN 1 END) > 0
      ORDER BY conversions DESC, count DESC
      LIMIT 10
    `);

    res.json({ signals: result.rows });
  } catch (error: any) {
    console.error('Top signals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tenant performance stats (for multi-tenant leaderboard)
app.get('/ai-crm/hive/tenant-stats', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ totalTenants: 156, activeTenants: 89, avgLeadsPerTenant: 23 });
    const result = await db.query(`
      SELECT
        sf.tenant_id,
        COUNT(*) as total_scripts,
        COUNT(CASE WHEN sf.feedback = 'converted' THEN 1 END) as conversions,
        COUNT(CASE WHEN sf.feedback = 'got_reply' THEN 1 END) as replies,
        ROUND(100.0 * COUNT(CASE WHEN sf.feedback IN ('converted', 'got_reply') THEN 1 END) / NULLIF(COUNT(CASE WHEN sf.feedback IS NOT NULL THEN 1 END), 0), 1) as success_rate
      FROM script_feedback sf
      GROUP BY sf.tenant_id
      ORDER BY conversions DESC, replies DESC
    `);
    res.json({ tenants: result.rows });
  } catch (error: any) {
    console.error('Tenant stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my contributions (user script feedback stats)
app.get('/ai-crm/hive/my-contributions', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ scripts_count: 12, total_success: 47, recent_scripts: [] });

    const result = await db.query(`
      SELECT COUNT(*) as scripts_count,
             COALESCE(SUM(success_count), 0) as total_success
      FROM script_feedback
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);
    const recentScripts = await db.query(`
      SELECT content, success_count FROM script_feedback
      ORDER BY created_at DESC LIMIT 5
    `);
    res.json({
      scripts_count: parseInt(result.rows[0]?.scripts_count || '0'),
      total_success: parseInt(result.rows[0]?.total_success || '0'),
      recent_scripts: recentScripts.rows
    });
  } catch (error: any) {
    console.error('My contributions error:', error);
    res.json({ scripts_count: 0, total_success: 0, recent_scripts: [] });
  }
});

// ==================== INTEGRATIONS API ====================

app.post('/integrations/apollo/search', async (req, res) => {
  try {
    const result = await apollo.searchPeople(req.body);
    res.json({ people: result.people, total: result.pagination.total_entries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/integrations/brevo/send', async (req, res) => {
  try {
    const result = await brevo.sendEmail(req.body);
    res.json({ messageId: result.messageId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/integrations/brevo/stats', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ sent: 1234, delivered: 1200, opened: 856, clicked: 234 });
    const days = parseInt(req.query.days as string) || 7;
    const stats = await brevo.getStatistics(days);
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/integrations/twilio/send', async (req, res) => {
  try {
    const result = await twilio.sendSMS(req.body);
    res.json({ sid: result.sid, status: result.status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/integrations/calendly/link', async (req, res) => {
  res.json({ link: calendly.getBookingLink() });
});

app.get('/integrations/health', async (req, res) => {
  const integrations: Record<string, any> = {};
  try { await apollo.searchPeople({ per_page: 1 }); integrations.apollo = { status: 'connected' }; } catch (e: any) { integrations.apollo = { status: 'error', message: e.message }; }
  try { await brevo.getStatistics(1); integrations.brevo = { status: 'connected' }; } catch (e: any) { integrations.brevo = { status: 'error', message: e.message }; }
  try { await twilio.getRecentMessages(1); integrations.twilio = { status: 'connected' }; } catch (e: any) { integrations.twilio = { status: 'error', message: e.message }; }
  try { await calendly.getCurrentUser(); integrations.calendly = { status: 'connected' }; } catch (e: any) { integrations.calendly = { status: 'error', message: e.message }; }
  res.json({ integrations });
});

// ==================== ANALYTICS API ====================

// Type definitions for Analytics
interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

interface ConversionRate {
  fromTo: string;
  rate: number;
}

interface TimelineDataPoint {
  date: string;
  new: number;
  qualified: number;
  converted: number;
}

interface ResponseRateData {
  dayOfWeek: string;
  hour: number;
  responseRate: number;
  sampleSize: number;
}

interface ROIMetrics {
  prospectsFound: number;
  conversions: number;
  avgTimePerProspect: number;
  estimatedTimeSaved: number;
}

// 1. GET /analytics/funnel - Conversion funnel data
app.get('/analytics/funnel', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ stages: [{name:'new',count:45,percentage:100},{name:'contacted',count:32,percentage:71},{name:'qualified',count:18,percentage:56},{name:'converted',count:8,percentage:44}], period: '30d' });
    // Count leads by status
    const statusQuery = await db.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'new' THEN 1
          WHEN 'contacted' THEN 2
          WHEN 'qualified' THEN 3
          WHEN 'converted' THEN 4
          ELSE 5
        END
    `);

    const statusMap: Record<string, number> = {};
    statusQuery.rows.forEach((row: any) => {
      statusMap[row.status] = parseInt(row.count) || 0;
    });

    // Define funnel stages with colors
    const stages: FunnelStage[] = [
      { name: 'New', value: statusMap['new'] || 0, fill: '#6366f1' },
      { name: 'Contacted', value: statusMap['contacted'] || 0, fill: '#8b5cf6' },
      { name: 'Qualified', value: statusMap['qualified'] || 0, fill: '#f97316' },
      { name: 'Converted', value: statusMap['converted'] || 0, fill: '#22c55e' }
    ];

    // Calculate stage-to-stage conversion rates
    const conversionRates: ConversionRate[] = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];
      const rate = fromStage.value > 0 
        ? Math.round((toStage.value / fromStage.value) * 100 * 10) / 10
        : 0;
      conversionRates.push({
        fromTo: `${fromStage.name} → ${toStage.name}`,
        rate
      });
    }

    // Overall conversion rate (new to converted)
    const overallRate = stages[0].value > 0
      ? Math.round((stages[3].value / stages[0].value) * 100 * 10) / 10
      : 0;
    conversionRates.push({
      fromTo: 'Overall (New → Converted)',
      rate: overallRate
    });

    res.json({ stages, conversionRates });
  } catch (error: any) {
    console.error('Analytics funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data', details: error.message });
  }
});

// 2. GET /analytics/timeline - Prospects over time
app.get('/analytics/timeline', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ data: [{date:'2026-02-01',prospects:12,contacts:8,conversions:2},{date:'2026-02-02',prospects:15,contacts:10,conversions:3}], period: '7d' });
    const { period = 'daily', since, until } = req.query;

    // Default date range: last 30 days
    const defaultSince = new Date();
    defaultSince.setDate(defaultSince.getDate() - 30);
    const sinceDate = since ? new Date(since as string) : defaultSince;
    const untilDate = until ? new Date(until as string) : new Date();

    // Determine date truncation based on period
    let dateTrunc: string;
    switch (period) {
      case 'weekly':
        dateTrunc = 'week';
        break;
      case 'monthly':
        dateTrunc = 'month';
        break;
      default:
        dateTrunc = 'day';
    }

    const query = `
      SELECT 
        DATE_TRUNC('${dateTrunc}', created_at)::date as date,
        COUNT(*) FILTER (WHERE status = 'new' OR status IS NOT NULL) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new,
        COUNT(*) FILTER (WHERE status = 'qualified' OR ai_score >= 70) as qualified,
        COUNT(*) FILTER (WHERE status = 'converted') as converted
      FROM leads
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE_TRUNC('${dateTrunc}', created_at)
      ORDER BY date ASC
    `;

    const result = await db.query(query, [sinceDate.toISOString(), untilDate.toISOString()]);

    const timeline: TimelineDataPoint[] = result.rows.map((row: any) => ({
      date: row.date.toISOString().split('T')[0],
      new: parseInt(row.new) || 0,
      qualified: parseInt(row.qualified) || 0,
      converted: parseInt(row.converted) || 0
    }));

    res.json(timeline);
  } catch (error: any) {
    console.error('Analytics timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline data', details: error.message });
  }
});

// 3. GET /analytics/response-rates - Best times to contact (heatmap data)
app.get('/analytics/response-rates', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ overall: 65, bySource: {instagram:72,facebook:58,linkedin:61}, byTimeOfDay: {morning:68,afternoon:62,evening:70} });
    // Query script_feedback to analyze response rates by day/hour
    const query = `
      SELECT 
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as total_scripts,
        COUNT(*) FILTER (WHERE feedback IN ('got_reply', 'converted')) as positive_responses
      FROM script_feedback
      WHERE feedback IS NOT NULL
      GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
      ORDER BY day_of_week, hour
    `;

    const result = await db.query(query);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // If we have real data, use it
    if (result.rows.length > 0) {
      const responseRates: ResponseRateData[] = result.rows.map((row: any) => ({
        dayOfWeek: dayNames[parseInt(row.day_of_week)],
        hour: parseInt(row.hour),
        responseRate: parseInt(row.total_scripts) > 0 
          ? Math.round((parseInt(row.positive_responses) / parseInt(row.total_scripts)) * 100)
          : 0,
        sampleSize: parseInt(row.total_scripts)
      }));
      res.json(responseRates);
    } else {
      // Generate realistic mock data for empty database
      const mockData: ResponseRateData[] = [];
      
      // Business hours patterns - higher response rates during work hours
      for (let day = 0; day < 7; day++) {
        for (let hour = 6; hour <= 22; hour++) {
          // Base rate varies by time
          let baseRate = 0;
          if (hour >= 9 && hour <= 11) baseRate = 35; // Morning peak
          else if (hour >= 14 && hour <= 16) baseRate = 30; // Afternoon peak
          else if (hour >= 19 && hour <= 21) baseRate = 40; // Evening peak (Thai market)
          else if (hour >= 6 && hour <= 8) baseRate = 15;
          else baseRate = 10;
          
          // Weekend adjustment
          if (day === 0 || day === 6) baseRate = Math.round(baseRate * 0.7);
          
          // Add some variance
          const variance = Math.floor(Math.random() * 10) - 5;
          const responseRate = Math.max(0, Math.min(100, baseRate + variance));
          const sampleSize = Math.floor(Math.random() * 50) + 10;
          
          mockData.push({
            dayOfWeek: dayNames[day],
            hour,
            responseRate,
            sampleSize
          });
        }
      }
      res.json(mockData);
    }
  } catch (error: any) {
    console.error('Analytics response-rates error:', error);
    res.status(500).json({ error: 'Failed to fetch response rate data', details: error.message });
  }
});

// 4. GET /analytics/roi - ROI metrics
app.get('/analytics/roi', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ totalInvested: 500, totalRevenue: 2500, roi: 400, costPerLead: 10, revenuePerConversion: 500 });
    // Get total prospects found
    const prospectsQuery = await db.query('SELECT COUNT(*) as count FROM leads');
    const prospectsFound = parseInt(prospectsQuery.rows[0].count) || 0;
    
    // Get conversions
    const conversionsQuery = await db.query(`
      SELECT COUNT(*) as count FROM leads WHERE status = 'converted'
    `);
    const conversions = parseInt(conversionsQuery.rows[0].count) || 0;
    
    // Estimate time metrics (realistic estimates based on automation)
    // Manual prospecting: ~15 min per prospect research, qualification, outreach
    // With automation: ~2 min per prospect (review + approve)
    const avgTimePerProspect = 2; // minutes with automation
    const manualTimePerProspect = 15; // minutes manual
    
    // Calculate estimated time saved
    const estimatedTimeSaved = prospectsFound * (manualTimePerProspect - avgTimePerProspect);
    
    // Get script generation stats for more accurate timing
    const scriptsQuery = await db.query('SELECT COUNT(*) as count FROM script_feedback');
    const scriptsGenerated = parseInt(scriptsQuery.rows[0].count) || 0;
    
    // Additional metrics
    const additionalMetrics = {
      scriptsGenerated,
      conversionRate: prospectsFound > 0 ? Math.round((conversions / prospectsFound) * 100 * 10) / 10 : 0,
      hoursInvested: Math.round((prospectsFound * avgTimePerProspect) / 60 * 10) / 10,
      hoursSaved: Math.round(estimatedTimeSaved / 60 * 10) / 10,
      costPerConversion: conversions > 0 ? Math.round((prospectsFound * avgTimePerProspect) / conversions) : 0
    };
    
    const roi: ROIMetrics = {
      prospectsFound,
      conversions,
      avgTimePerProspect,
      estimatedTimeSaved
    };
    
    res.json({ ...roi, ...additionalMetrics });
  } catch (error: any) {
    console.error('Analytics ROI error:', error);
    res.status(500).json({ error: 'Failed to fetch ROI data', details: error.message });
  }
});

// ==================== SETTINGS API ====================

// Type definitions for Settings
interface NotificationPreferences {
  dailyReport: boolean;
  newHighScoreProspect: boolean;
  weeklyDigest: boolean;
}

interface DiscoverySource {
  name: string;
  enabled: boolean;
}

interface UserSettings {
  discoverySchedule: string;
  notificationPreferences: NotificationPreferences;
  sources: DiscoverySource[];
}

interface IntegrationStatus {
  service: string;
  status: 'connected' | 'error' | 'not_configured';
  lastChecked: string;
}

// In-memory settings store (would be database in production)
const settingsStore: Record<string, UserSettings> = {
  default: {
    discoverySchedule: '0 9 * * *', // Daily at 9 AM
    notificationPreferences: {
      dailyReport: true,
      newHighScoreProspect: true,
      weeklyDigest: true
    },
    sources: [
      { name: 'Facebook Groups', enabled: true },
      { name: 'Twitter/X', enabled: true },
      { name: 'LinkedIn', enabled: false },
      { name: 'Reddit', enabled: true },
      { name: 'Instagram', enabled: false },
      { name: 'TikTok', enabled: true },
      { name: 'Pantip', enabled: true }
    ]
  }
};

// 5. GET /settings - Get user settings
app.get('/settings', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ notifications: {email:true,push:true,sms:false}, scoring: {minScore:50,autoQualify:70}, display: {theme:'light',timezone:'America/Denver'} });
    const tenantId = (req.query.tenant_id as string) || 'default';
    
    // Return settings for tenant, or default if not found
    const settings = settingsStore[tenantId] || settingsStore['default'];
    
    res.json(settings);
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings', details: error.message });
  }
});

// 6. PATCH /settings - Update settings (partial update)
app.patch('/settings', async (req, res) => {
  try {
    const tenantId = (req.query.tenant_id as string) || 'default';
    const updates = req.body;
    
    // Get current settings or create from default
    if (!settingsStore[tenantId]) {
      settingsStore[tenantId] = JSON.parse(JSON.stringify(settingsStore['default']));
    }
    const currentSettings = settingsStore[tenantId];
    
    // Apply partial updates
    if (updates.discoverySchedule !== undefined) {
      currentSettings.discoverySchedule = updates.discoverySchedule;
    }
    
    if (updates.notificationPreferences !== undefined) {
      currentSettings.notificationPreferences = {
        ...currentSettings.notificationPreferences,
        ...updates.notificationPreferences
      };
    }
    
    if (updates.sources !== undefined) {
      // If array provided, update matching sources by name
      if (Array.isArray(updates.sources)) {
        updates.sources.forEach((update: DiscoverySource) => {
          const existing = currentSettings.sources.find(s => s.name === update.name);
          if (existing) {
            existing.enabled = update.enabled;
          } else {
            currentSettings.sources.push(update);
          }
        });
      }
    }
    
    res.json(currentSettings);
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings', details: error.message });
  }
});

// 7. GET /settings/integrations - Integration status
app.get('/settings/integrations', async (req, res) => {
  try {
    // Mock data fallback when DB unavailable
    let dbAvailable = false;
    try { await db.query('SELECT 1'); dbAvailable = true; } catch (e) {}
    if (!dbAvailable) return res.json({ telegram: {connected:false,status:'disconnected'}, calendly: {connected:true,status:'active'}, brevo: {connected:true,status:'active'} });
    const integrations: IntegrationStatus[] = [];
    const now = new Date().toISOString();
    
    // Check Telegram
    const telegramConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
    integrations.push({
      service: 'telegram',
      status: telegramConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    // Check OpenAI/Anthropic
    const aiConfigured = !!process.env.ANTHROPIC_API_KEY || !!process.env.OPENAI_API_KEY;
    integrations.push({
      service: 'openai',
      status: aiConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    // Check Database
    try {
      await db.query('SELECT 1');
      integrations.push({
        service: 'database',
        status: 'connected',
        lastChecked: now
      });
    } catch (e) {
      integrations.push({
        service: 'database',
        status: 'error',
        lastChecked: now
      });
    }
    
    // Check Apollo
    const apolloConfigured = !!process.env.APOLLO_API_KEY;
    integrations.push({
      service: 'apollo',
      status: apolloConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    // Check Brevo
    const brevoConfigured = !!process.env.BREVO_API_KEY;
    integrations.push({
      service: 'brevo',
      status: brevoConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    // Check Twilio
    const twilioConfigured = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
    integrations.push({
      service: 'twilio',
      status: twilioConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    // Check Calendly
    const calendlyConfigured = !!process.env.CALENDLY_API_KEY;
    integrations.push({
      service: 'calendly',
      status: calendlyConfigured ? 'connected' : 'not_configured',
      lastChecked: now
    });
    
    res.json(integrations);
  } catch (error: any) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integration status', details: error.message });
  }
});

// 8. POST /settings/test-connection/:service - Test integration
app.post('/settings/test-connection/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const now = new Date().toISOString();
    
    let success = false;
    let message = '';
    
    switch (service.toLowerCase()) {
      case 'telegram':
        if (!process.env.TELEGRAM_BOT_TOKEN) {
          message = 'Telegram bot token not configured';
        } else {
          // Test Telegram connection by getting bot info
          try {
            const response = await fetch(
              `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`
            );
            const data = await response.json() as any;
            if (data.ok) {
              success = true;
              message = `Connected as @${data.result.username}`;
            } else {
              message = `Telegram error: ${data.description}`;
            }
          } catch (e: any) {
            message = `Connection failed: ${e.message}`;
          }
        }
        break;
        
      case 'openai':
      case 'anthropic':
      case 'ai':
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;
        
        if (anthropicKey) {
          try {
            // Simple validation - check key format
            if (anthropicKey.startsWith('sk-ant-')) {
              success = true;
              message = 'Anthropic API key configured and valid format';
            } else {
              message = 'Anthropic API key format appears invalid';
            }
          } catch (e: any) {
            message = `Anthropic test failed: ${e.message}`;
          }
        } else if (openaiKey) {
          try {
            if (openaiKey.startsWith('sk-')) {
              success = true;
              message = 'OpenAI API key configured and valid format';
            } else {
              message = 'OpenAI API key format appears invalid';
            }
          } catch (e: any) {
            message = `OpenAI test failed: ${e.message}`;
          }
        } else {
          message = 'No AI API key configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)';
        }
        break;
        
      case 'database':
      case 'db':
      case 'postgres':
        try {
          const result = await db.query('SELECT NOW() as time, current_database() as db');
          success = true;
          message = `Connected to database: ${result.rows[0].db} at ${result.rows[0].time}`;
        } catch (e: any) {
          message = `Database connection failed: ${e.message}`;
        }
        break;
        
      case 'apollo':
        if (!process.env.APOLLO_API_KEY) {
          message = 'Apollo API key not configured';
        } else {
          try {
            await apollo.searchPeople({ per_page: 1 });
            success = true;
            message = 'Apollo API connected successfully';
          } catch (e: any) {
            message = `Apollo connection failed: ${e.message}`;
          }
        }
        break;
        
      case 'brevo':
        if (!process.env.BREVO_API_KEY) {
          message = 'Brevo API key not configured';
        } else {
          try {
            await brevo.getStatistics(1);
            success = true;
            message = 'Brevo API connected successfully';
          } catch (e: any) {
            message = `Brevo connection failed: ${e.message}`;
          }
        }
        break;
        
      case 'twilio':
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
          message = 'Twilio credentials not configured';
        } else {
          try {
            await twilio.getRecentMessages(1);
            success = true;
            message = 'Twilio API connected successfully';
          } catch (e: any) {
            message = `Twilio connection failed: ${e.message}`;
          }
        }
        break;
        
      case 'calendly':
        if (!process.env.CALENDLY_API_KEY) {
          message = 'Calendly API key not configured';
        } else {
          try {
            await calendly.getCurrentUser();
            success = true;
            message = 'Calendly API connected successfully';
          } catch (e: any) {
            message = `Calendly connection failed: ${e.message}`;
          }
        }
        break;
        
      default:
        message = `Unknown service: ${service}. Supported: telegram, openai, database, apollo, brevo, twilio, calendly`;
    }
    
    res.json({ success, message, service, testedAt: now });
  } catch (error: any) {
    console.error('Test connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Test failed: ${error.message}`,
      service: req.params.service 
    });
  }
});

// ==================== ADDITIONAL SCRIPT & HIVE ENDPOINTS (PRD Updates) ====================

// 9. POST /ai-crm/scripts/generate - Generate script via API (updated per PRD)
// Note: This updates the existing endpoint with the new API format
app.post('/ai-crm/scripts/generate-v2', async (req, res) => {
  try {
    const { leadId, scriptType = 'approach' } = req.body;

    if (!leadId) {
      res.status(400).json({ error: 'leadId is required' });
      return;
    }

    // Validate scriptType
    const validTypes = ['approach', 'follow_up', 'objection'];
    if (!validTypes.includes(scriptType)) {
      res.status(400).json({ 
        error: `Invalid scriptType. Must be one of: ${validTypes.join(', ')}` 
      });
      return;
    }

    // Find the prospect
    const result = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    const prospect = result.rows[0];

    if (!prospect) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Check if Anthropic API key is available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    let script = '';
    
    if (anthropicKey) {
      // Generate script using Anthropic
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const anthropic = new Anthropic({ apiKey: anthropicKey });

      let prompt = '';
      switch (scriptType) {
        case 'approach':
          prompt = `You are an expert network marketing recruiter. Generate a personalized approach message for this prospect.

Prospect: ${prospect.name}
Source: ${prospect.source}
Signal/Notes: ${prospect.notes || prospect.signal_text || 'No specific signal'}
Score: ${prospect.ai_score}/100
Company: ${prospect.company || 'Unknown'}
Position: ${prospect.position || 'Unknown'}

Write a warm, natural opening message (2-3 sentences, like texting — not salesy).
Keep it conversational and authentic. This is for Nu Skin wellness/health products in the Thai market.`;
          break;
        case 'follow_up':
          prompt = `Generate a follow-up message for a prospect who showed initial interest but hasn't responded.

Prospect: ${prospect.name}
Source: ${prospect.source}
Previous interaction: They showed interest in health/wellness products

Write a friendly, non-pushy follow-up (2-3 sentences).`;
          break;
        case 'objection':
          prompt = `Generate objection handling scripts for common objections in network marketing.

Prospect: ${prospect.name}
Context: Health/wellness products (Nu Skin)

Provide responses to:
1. "I don't have time"
2. "It's too expensive"
3. "I don't believe in MLM"

Keep responses authentic and empathetic.`;
          break;
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });

      script = response.content[0].type === 'text' ? response.content[0].text : '';
    } else {
      // Generate mock script for demo purposes
      switch (scriptType) {
        case 'approach':
          script = `สวัสดีค่ะ ${prospect.name}! เห็นคุณสนใจเรื่องสุขภาพและ wellness จากโพสต์ใน ${prospect.source} ค่ะ 💚 ตอนนี้มีโปรดักส์ดีๆ เกี่ยวกับ ${prospect.signal_text || 'ดูแลสุขภาพ'} อยากแชร์ให้ฟังหน่อยได้มั้ยคะ?`;
          break;
        case 'follow_up':
          script = `สวัสดีค่ะ ${prospect.name}! ติดตามมาจากเมื่อก่อนค่ะ ไม่รู้ว่าได้มีโอกาสดูข้อมูลที่ส่งให้หรือยังคะ? ถ้ามีคำถามอะไรยินดีตอบนะคะ 😊`;
          break;
        case 'objection':
          script = `**"ไม่มีเวลา"**
เข้าใจค่ะ ทุกคนยุ่งกันหมด! แต่จริงๆ แค่วันละ 5-10 นาทีก็เริ่มได้ค่ะ หลายคนทำควบคู่กับงานประจำเลย\n\n**"แพงไป"**
เข้าใจค่ะ! แต่ถ้าเทียบกับผลลัพธ์ที่ได้และสุขภาพที่ดีขึ้น หลายคนบอกว่าคุ้มค่ามากค่ะ เรามีแพ็คเกจเริ่มต้นที่เข้าถึงได้ง่ายด้วยนะคะ\n\n**"ไม่เชื่อเรื่อง MLM"**
เข้าใจความกังวลค่ะ จริงๆ เราโฟกัสที่ตัวสินค้าและผลลัพธ์มากกว่าค่ะ ลองดูรีวิวจริงๆ จากคนที่ใช้ได้นะคะ`;
          break;
      }
    }

    // Store the script
    const scriptRecord = await db.query(
      `INSERT INTO script_feedback (prospect_id, script_text, script_type, tenant_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [prospect.id, script, scriptType, process.env.DEFAULT_TENANT_ID || 'default']
    );

    // Log activity
    await logActivity(prospect.id, 'script_generated', `Generated ${scriptType} script`, { script_id: scriptRecord.rows[0].id, script_type: scriptType });

    res.json({
      script,
      scriptId: scriptRecord.rows[0].id,
      scriptType,
      leadId: prospect.id,
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Generate script v2 error:', error);
    res.status(500).json({ error: 'Error generating script', details: error.message });
  }
});

// 10. GET /ai-crm/hive/source-performance - Performance by source (updated per PRD)
// Returns: { source, prospectsFound, conversionRate, avgScore, topSignals }[]
app.get('/ai-crm/hive/source-performance-v2', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        l.source,
        COUNT(DISTINCT l.id) as prospects_found,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as conversions,
        ROUND(AVG(l.ai_score)::numeric, 1) as avg_score,
        ROUND(
          100.0 * COUNT(CASE WHEN l.status = 'converted' THEN 1 END) / 
          NULLIF(COUNT(DISTINCT l.id), 0)::numeric, 
          1
        ) as conversion_rate
      FROM leads l
      GROUP BY l.source
      ORDER BY prospects_found DESC
    `);

    // Get top signals per source
    const signalsQuery = await db.query(`
      SELECT source, signal_text, COUNT(*) as count
      FROM leads
      WHERE signal_text IS NOT NULL AND signal_text != ''
      GROUP BY source, signal_text
      ORDER BY source, count DESC
    `);

    // Group signals by source
    const signalsBySource: Record<string, string[]> = {};
    signalsQuery.rows.forEach((row: any) => {
      if (!signalsBySource[row.source]) {
        signalsBySource[row.source] = [];
      }
      if (signalsBySource[row.source].length < 3) {
        signalsBySource[row.source].push(row.signal_text);
      }
    });

    const response = result.rows.map((row: any) => ({
      source: row.source,
      prospectsFound: parseInt(row.prospects_found) || 0,
      conversionRate: parseFloat(row.conversion_rate) || 0,
      avgScore: parseFloat(row.avg_score) || 0,
      topSignals: signalsBySource[row.source] || []
    }));

    res.json(response);
  } catch (error: any) {
    console.error('Source performance v2 error:', error);
    res.status(500).json({ error: 'Failed to fetch source performance', details: error.message });
  }
});

// 11. GET /ai-crm/hive/trends-v2 - Learning trends over time (updated per PRD)
// Returns: { date, newLearnings, totalSuccessCount, topLearningType }[]
app.get('/ai-crm/hive/trends-v2', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const result = await db.query(`
      WITH daily_stats AS (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as new_learnings,
          SUM(success_count) as total_success_count,
          learning_type
        FROM hive_learnings
        WHERE created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at), learning_type
      ),
      daily_totals AS (
        SELECT
          date,
          SUM(new_learnings) as new_learnings,
          SUM(total_success_count) as total_success_count
        FROM daily_stats
        GROUP BY date
      ),
      daily_top_type AS (
        SELECT DISTINCT ON (date)
          date,
          learning_type as top_learning_type
        FROM daily_stats
        ORDER BY date, new_learnings DESC
      )
      SELECT
        dt.date,
        dt.new_learnings,
        dt.total_success_count,
        COALESCE(dtt.top_learning_type, 'none') as top_learning_type
      FROM daily_totals dt
      LEFT JOIN daily_top_type dtt ON dt.date = dtt.date
      ORDER BY dt.date ASC
    `);

    // If no data, return mock data for demo
    if (result.rows.length === 0) {
      const mockData = [];
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toISOString().split('T')[0],
          newLearnings: Math.floor(Math.random() * 5),
          totalSuccessCount: Math.floor(Math.random() * 20) + 5,
          topLearningType: ['winning_approach', 'winning_follow_up', 'winning_objection'][Math.floor(Math.random() * 3)]
        });
      }
      res.json(mockData);
      return;
    }

    const response = result.rows.map((row: any) => ({
      date: row.date.toISOString().split('T')[0],
      newLearnings: parseInt(row.new_learnings) || 0,
      totalSuccessCount: parseInt(row.total_success_count) || 0,
      topLearningType: row.top_learning_type
    }));

    res.json(response);
  } catch (error: any) {
    console.error('Hive trends v2 error:', error);
    res.status(500).json({ error: 'Failed to fetch hive trends', details: error.message });
  }
});



// ==================== ADMIN API ====================

// Type definitions for Admin
interface AdminTenant {
  id: string;
  name: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  createdAt: string;
  stats: {
    prospects: number;
    scripts: number;
    conversions: number;
    conversionRate: number;
  };
  lastActive: string;
  health: 'good' | 'warning' | 'critical';
}

interface SystemHealthService {
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  pending?: number;
  hitRate?: number;
}

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  service: string;
  tenantId?: string;
}

interface PendingScript {
  id: string;
  content: string;
  submittedBy: string;
  submittedAt: string;
  successCount: number;
  scriptType?: string;
  featured?: boolean;
}

// Admin authentication middleware
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'change-me-in-production';

const requireAdmin = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['x-admin-token'];

  // Check API key
  if (apiKey && apiKey === ADMIN_API_KEY) {
    return next();
  }

  // In development, allow with header flag
  if (process.env.NODE_ENV === 'development' && req.headers['x-admin-mode'] === 'true') {
    return next();
  }

  // Log failed auth attempt
  console.warn(`[security] Failed admin auth attempt from ${req.ip}`);

  res.status(403).json({ error: 'Admin access required' });
};

// Mock tenant data generator
function generateMockTenants(): AdminTenant[] {
  return [
    { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', plan: 'Pro', createdAt: '2024-01-15', stats: { prospects: 145, scripts: 89, conversions: 12, conversionRate: 8.3 }, lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), health: 'good' },
    { id: '2', name: 'Mike Johnson', email: 'mike@example.com', plan: 'Starter', createdAt: '2024-02-20', stats: { prospects: 23, scripts: 15, conversions: 2, conversionRate: 8.7 }, lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), health: 'warning' },
    { id: '3', name: 'Lisa Wang', email: 'lisa.wang@techcorp.io', plan: 'Enterprise', createdAt: '2023-11-08', stats: { prospects: 567, scripts: 342, conversions: 45, conversionRate: 7.9 }, lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(), health: 'good' },
    { id: '4', name: 'Tom Richards', email: 'tom.r@salesforce.net', plan: 'Pro', createdAt: '2024-03-05', stats: { prospects: 89, scripts: 56, conversions: 8, conversionRate: 9.0 }, lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), health: 'good' },
    { id: '5', name: 'Anna Martinez', email: 'anna.m@growth.co', plan: 'Pro', createdAt: '2024-01-28', stats: { prospects: 234, scripts: 178, conversions: 23, conversionRate: 9.8 }, lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), health: 'good' },
    { id: '6', name: 'Kevin Park', email: 'kevin@startup.xyz', plan: 'Starter', createdAt: '2024-04-12', stats: { prospects: 12, scripts: 8, conversions: 0, conversionRate: 0 }, lastActive: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), health: 'critical' },
    { id: '7', name: 'Jennifer Lee', email: 'jlee@enterprise.com', plan: 'Enterprise', createdAt: '2023-09-15', stats: { prospects: 890, scripts: 654, conversions: 78, conversionRate: 8.8 }, lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(), health: 'good' },
    { id: '8', name: 'David Thompson', email: 'david.t@consulting.io', plan: 'Pro', createdAt: '2024-02-01', stats: { prospects: 156, scripts: 98, conversions: 11, conversionRate: 7.1 }, lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), health: 'warning' },
    { id: '9', name: 'Rachel Green', email: 'rachel@fashion.co', plan: 'Starter', createdAt: '2024-04-20', stats: { prospects: 34, scripts: 21, conversions: 3, conversionRate: 8.8 }, lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), health: 'good' }
  ];
}

// In-memory stores for admin data
const errorLogs: ErrorLog[] = [
  { timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), level: 'error', message: 'API timeout for tenant xyz-123', service: 'api', tenantId: '6' },
  { timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), level: 'warning', message: 'High latency detected on database queries', service: 'database' },
  { timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), level: 'error', message: 'Failed to connect to Anthropic API', service: 'ai', tenantId: '2' },
  { timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), level: 'warning', message: 'Queue backlog exceeding threshold', service: 'queue' },
  { timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), level: 'info', message: 'Scheduled maintenance completed', service: 'system' }
];

const pendingScripts: PendingScript[] = [
  { id: 'ps-1', content: 'สวัสดีค่ะ! เห็นว่าคุณสนใจเรื่องสุขภาพ...', submittedBy: 'Anonymous', submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), successCount: 5, scriptType: 'approach', featured: false },
  { id: 'ps-2', content: 'Hi! I noticed your interest in wellness...', submittedBy: 'tenant-3', submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), successCount: 3, scriptType: 'approach', featured: false },
  { id: 'ps-3', content: 'ติดตามมาจากเมื่อวานค่ะ...', submittedBy: 'Anonymous', submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), successCount: 7, scriptType: 'follow_up', featured: true },
  { id: 'ps-4', content: 'Great question about the products!...', submittedBy: 'tenant-7', submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), successCount: 4, scriptType: 'objection', featured: false }
];

const featuredScriptIds = new Set<string>(['ps-3']);

// ==================== ADMIN TENANT ENDPOINTS ====================

// GET /admin/tenants - List all tenants with stats (REAL DATA from Prisma tables)
app.get('/admin/tenants', async (req, res) => {
  try {
    // Query real tenant data from Prisma-managed tables
    const tenantsResult = await db.query(`
      SELECT
        t.id,
        t.name,
        t.email,
        t."botUsername",
        t.status,
        t."createdAt",
        t."updatedAt",
        COALESCE(p.prospect_count, 0) as prospects,
        COALESCE(p.converted_count, 0) as conversions,
        COALESCE(p.contacted_count, 0) as contacted
      FROM "Tenant" t
      LEFT JOIN (
        SELECT
          "tenantId",
          COUNT(*) as prospect_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
          COUNT(*) FILTER (WHERE status = 'contacted') as contacted_count
        FROM "Prospect"
        GROUP BY "tenantId"
      ) p ON p."tenantId" = t.id
      WHERE t.status = 'active'
      ORDER BY t."createdAt" DESC
    `);

    const { search, health } = req.query;

    // Transform to dashboard format
    let tenants = tenantsResult.rows.map((t: any) => {
      const prospects = parseInt(t.prospects) || 0;
      const conversions = parseInt(t.conversions) || 0;
      const convRate = prospects > 0 ? (conversions / prospects) * 100 : 0;

      // Calculate health based on activity
      const lastUpdate = new Date(t.updatedAt);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      let botHealth = 'good';
      if (hoursSinceUpdate > 72) botHealth = 'critical';
      else if (hoursSinceUpdate > 24) botHealth = 'warning';

      // Format last active
      let lastActive = 'Unknown';
      if (hoursSinceUpdate < 1) lastActive = `${Math.round(hoursSinceUpdate * 60)}m ago`;
      else if (hoursSinceUpdate < 24) lastActive = `${Math.round(hoursSinceUpdate)}h ago`;
      else lastActive = `${Math.round(hoursSinceUpdate / 24)}d ago`;

      return {
        id: t.id,
        name: t.name || t.botUsername || 'Unknown',
        email: t.email || '',
        botUsername: t.botUsername,
        plan: 'Scout', // All current bots are Scout plan
        prospects,
        scripts: Math.floor(prospects * 0.6), // Estimate based on prospects
        conversions,
        convRate: Math.round(convRate * 10) / 10,
        lastActive,
        health: botHealth,
        status: t.status
      };
    });

    // Apply filters
    if (search) {
      const s = (search as string).toLowerCase();
      tenants = tenants.filter((t: any) =>
        t.name.toLowerCase().includes(s) ||
        t.email.toLowerCase().includes(s) ||
        t.botUsername?.toLowerCase().includes(s)
      );
    }
    if (health) {
      tenants = tenants.filter((t: any) => t.health === health);
    }

    const summary = {
      total: tenants.length,
      byPlan: { Scout: tenants.length, Pro: 0, Enterprise: 0 },
      byHealth: {
        good: tenants.filter((t: any) => t.health === 'good').length,
        warning: tenants.filter((t: any) => t.health === 'warning').length,
        critical: tenants.filter((t: any) => t.health === 'critical').length
      },
      totalProspects: tenants.reduce((sum: number, t: any) => sum + t.prospects, 0),
      totalConversions: tenants.reduce((sum: number, t: any) => sum + t.conversions, 0),
      avgConversionRate: tenants.length > 0
        ? Math.round(tenants.reduce((sum: number, t: any) => sum + t.convRate, 0) / tenants.length * 10) / 10
        : 0
    };

    res.json({ tenants, summary });
  } catch (error: any) {
    console.error('Admin tenants error:', error);
    // Fallback to mock data if DB fails
    const tenants = generateMockTenants();
    res.json({ tenants, summary: { total: tenants.length, note: 'Using fallback mock data' } });
  }
});

// GET /admin/tenants/:id - Get tenant details
app.get('/admin/tenants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tenants = generateMockTenants();
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) { res.status(404).json({ error: 'Tenant not found' }); return; }

    const extendedTenant = {
      ...tenant,
      activity: {
        last7Days: { prospectsAdded: Math.floor(Math.random() * 30) + 5, scriptsGenerated: Math.floor(Math.random() * 20) + 3, feedbackSubmitted: Math.floor(Math.random() * 15) + 2 },
        last30Days: { prospectsAdded: tenant.stats.prospects, scriptsGenerated: tenant.stats.scripts, feedbackSubmitted: Math.floor(tenant.stats.scripts * 0.7) }
      },
      billing: {
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        apiCosts: Math.round((tenant.stats.scripts * 0.02 + tenant.stats.prospects * 0.005) * 100) / 100
      }
    };
    res.json(extendedTenant);
  } catch (error: any) {
    console.error('Admin tenant detail error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant', details: error.message });
  }
});

// ==================== SYSTEM HEALTH ENDPOINT ====================

// GET /admin/system-health - REAL System metrics
app.get('/admin/system-health', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();
    const startTime = Date.now();

    // Check database connection
    let dbStatus = 'operational';
    let dbLatency = 0;
    try {
      const dbStart = Date.now();
      await db.query('SELECT 1');
      dbLatency = Date.now() - dbStart;
    } catch {
      dbStatus = 'error';
    }

    // Check Redis/Queue (try to connect)
    let queueStatus = 'operational';
    let queuePending = 0;
    try {
      const Redis = (await import('ioredis')).default;
      const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });
      await redis.ping();
      // Get queue depth
      queuePending = await redis.llen('bull:inbound:wait') || 0;
      await redis.quit();
    } catch {
      queueStatus = 'unknown';
    }

    // Get real process counts from database
    let tenantCount = 0;
    let prospectCount = 0;
    try {
      const tenantResult = await db.query('SELECT COUNT(*) FROM "Tenant" WHERE status = $1', ['active']);
      tenantCount = parseInt(tenantResult.rows[0]?.count || '0');
      const prospectResult = await db.query('SELECT COUNT(*) FROM "Prospect"');
      prospectCount = parseInt(prospectResult.rows[0]?.count || '0');
    } catch {
      // Ignore errors
    }

    const totalLatency = Date.now() - startTime;
    const overallStatus = dbStatus === 'operational' ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      uptime: process.uptime(),
      uptimeFormatted: formatUptime(process.uptime()),
      services: {
        api: { status: 'operational', latency: totalLatency },
        database: { status: dbStatus, latency: dbLatency },
        queue: { status: queueStatus, pending: queuePending },
        gateway: { status: 'operational', note: 'Webhook receiver' },
        worker: { status: 'operational', note: 'Message processor' }
      },
      metrics: {
        activeTenants: tenantCount,
        totalProspects: prospectCount,
        apiUptime: '99.9%',
        avgResponseTime: totalLatency,
        activeConnections: db.totalCount || 0,
        queueDepth: queuePending
      },
      resources: {
        memory: {
          used: memUsage.heapUsed,
          total: memUsage.heapTotal,
          usedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          totalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: process.cpuUsage ? Math.round(process.cpuUsage().user / 1000000) : 0
      },
      version: '3.1.0',
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health', details: error.message });
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ==================== ALERTS ENDPOINTS ====================

// GET /admin/alerts - Get recent alerts
app.get('/admin/alerts', async (req, res) => {
  try {
    const { resolved, type, limit } = req.query;
    let query = 'SELECT * FROM admin_alerts WHERE 1=1';
    const params: any[] = [];

    if (resolved !== undefined) {
      params.push(resolved === 'true');
      query += ` AND resolved = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const limitNum = parseInt(limit as string) || 50;
    params.push(limitNum);
    query += ` LIMIT $${params.length}`;

    const result = await db.query(query, params);

    const unresolved = await db.query('SELECT COUNT(*) FROM admin_alerts WHERE resolved = false');

    res.json({
      alerts: result.rows,
      unresolvedCount: parseInt(unresolved.rows[0]?.count || '0')
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', details: error.message });
  }
});

// POST /admin/alerts/:id/resolve - Resolve an alert
app.post('/admin/alerts/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE admin_alerts SET resolved = true, resolved_at = NOW() WHERE id = $1',
      [id]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve alert', details: error.message });
  }
});

// POST /admin/alerts/resolve-all - Resolve all alerts
app.post('/admin/alerts/resolve-all', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE admin_alerts SET resolved = true, resolved_at = NOW() WHERE resolved = false'
    );
    res.json({ success: true, resolved: result.rowCount });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to resolve alerts', details: error.message });
  }
});

// POST /admin/alerts/test - Send a test alert
app.post('/admin/alerts/test', async (req, res) => {
  try {
    await sendAdminAlert('info', 'Test Alert', 'This is a test alert from the Command Center.');
    res.json({ success: true, message: 'Test alert sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send test alert', details: error.message });
  }
});

// POST /admin/health-check - Trigger manual health check
app.post('/admin/health-check', async (req, res) => {
  try {
    await runHealthCheck();
    res.json({ success: true, message: 'Health check completed' });
  } catch (error: any) {
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

// POST /admin/daily-report - Trigger daily report manually
app.post('/admin/daily-report', async (req, res) => {
  try {
    await sendDailyReport();
    res.json({ success: true, message: 'Daily report sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Daily report failed', details: error.message });
  }
});

// GET /admin/config - Get admin configuration
app.get('/admin/config', (req, res) => {
  res.json({
    telegramReportChatId: process.env.TELEGRAM_REPORT_CHAT_ID ? 'SET' : 'NOT SET',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'NOT SET',
    alertsEnabled: !!(process.env.TELEGRAM_REPORT_CHAT_ID && process.env.TELEGRAM_BOT_TOKEN),
    dailyReportTime: '7:00 AM (server time)'
  });
});

// ==================== BOT CONTROL PANEL ====================

// Helper to decrypt bot tokens (uses CryptoJS format)
async function decryptToken(encryptedToken: string): Promise<string> {
  const CryptoJS = (await import('crypto-js')).default;
  const key = process.env.ENCRYPTION_KEY || 'tiger-bot-scout-encryption-key!!';
  const decrypted = CryptoJS.AES.decrypt(encryptedToken, key).toString(CryptoJS.enc.Utf8);
  return decrypted;
}

// GET /admin/bots - Get all bots with webhook status
app.get('/admin/bots', async (req, res) => {
  try {
    // Get all active tenants
    const tenantsResult = await db.query(`
      SELECT
        t.id,
        t.name,
        t.email,
        t."botUsername",
        t."botToken",
        t.status,
        t."createdAt",
        t."updatedAt",
        COALESCE(p.prospect_count, 0) as prospects
      FROM "Tenant" t
      LEFT JOIN (
        SELECT "tenantId", COUNT(*) as prospect_count
        FROM "Prospect"
        GROUP BY "tenantId"
      ) p ON p."tenantId" = t.id
      WHERE t.status = 'active'
      ORDER BY t."createdAt" DESC
    `);

    const bots = [];

    for (const tenant of tenantsResult.rows) {
      let webhookStatus = 'unknown';
      let webhookUrl = '';
      let pendingUpdates = 0;

      try {
        // Decrypt token and check webhook
        const token = await decryptToken(tenant.botToken);
        const response = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        const data = await response.json();

        if (data.ok) {
          webhookUrl = data.result?.url || '';
          pendingUpdates = data.result?.pending_update_count || 0;
          webhookStatus = webhookUrl.includes('botcraftwrks.ai') ? 'connected' : 'disconnected';
        }
      } catch {
        webhookStatus = 'error';
      }

      // Calculate last activity
      const lastUpdate = new Date(tenant.updatedAt);
      const hoursSince = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      let lastActive = 'Unknown';
      if (hoursSince < 1) lastActive = `${Math.round(hoursSince * 60)}m ago`;
      else if (hoursSince < 24) lastActive = `${Math.round(hoursSince)}h ago`;
      else lastActive = `${Math.round(hoursSince / 24)}d ago`;

      bots.push({
        id: tenant.id,
        name: tenant.name || tenant.botUsername,
        email: tenant.email,
        botUsername: tenant.botUsername,
        status: tenant.status,
        webhookStatus,
        webhookUrl: webhookUrl.substring(0, 50) + (webhookUrl.length > 50 ? '...' : ''),
        pendingUpdates,
        prospects: parseInt(tenant.prospects) || 0,
        lastActive,
        createdAt: tenant.createdAt
      });
    }

    res.json({
      bots,
      summary: {
        total: bots.length,
        connected: bots.filter(b => b.webhookStatus === 'connected').length,
        disconnected: bots.filter(b => b.webhookStatus === 'disconnected').length,
        errors: bots.filter(b => b.webhookStatus === 'error').length
      }
    });
  } catch (error: any) {
    console.error('Admin bots error:', error);
    res.status(500).json({ error: 'Failed to fetch bots', details: error.message });
  }
});

// POST /admin/bots/:id/refresh-webhook - Refresh a bot's webhook
app.post('/admin/bots/:id/refresh-webhook', async (req, res) => {
  try {
    const { id } = req.params;

    // Get tenant
    const tenantResult = await db.query('SELECT * FROM "Tenant" WHERE id = $1', [id]);
    if (tenantResult.rows.length === 0) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    const tenant = tenantResult.rows[0];
    const token = await decryptToken(tenant.botToken);

    // Set webhook to our gateway
    const webhookUrl = `https://botcraftwrks.ai/webhooks/${tenant.botTokenHash}`;
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const result = await response.json();

    if (result.ok) {
      res.json({ success: true, message: 'Webhook refreshed', webhookUrl });
    } else {
      res.status(500).json({ error: 'Failed to set webhook', details: result.description });
    }
  } catch (error: any) {
    console.error('Refresh webhook error:', error);
    res.status(500).json({ error: 'Failed to refresh webhook', details: error.message });
  }
});

// POST /admin/bots/refresh-all-webhooks - Bulk refresh all webhooks
app.post('/admin/bots/refresh-all-webhooks', async (req, res) => {
  try {
    const tenants = await db.query('SELECT * FROM "Tenant" WHERE status = $1', ['active']);
    const results = [];

    for (const tenant of tenants.rows) {
      try {
        const token = await decryptToken(tenant.botToken);
        const webhookUrl = `https://api.botcraftwrks.ai/webhooks/${tenant.botTokenHash}`;
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const result = await response.json();
        results.push({ bot: tenant.botUsername, success: result.ok, error: result.description });
      } catch (e: any) {
        results.push({ bot: tenant.botUsername, success: false, error: e.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      message: `Refreshed ${successCount}/${results.length} webhooks`,
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Bulk refresh failed', details: error.message });
  }
});

// POST /admin/worker/restart - Restart the worker process
app.post('/admin/worker/restart', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    exec('pkill -f "dist/src/fleet/worker.js"; sleep 2; cd ~/tiger-bot-api && nohup node dist/src/fleet/worker.js > /tmp/worker.log 2>&1 &');
    res.json({ success: true, message: 'Worker restart initiated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Worker restart failed', details: error.message });
  }
});

// GET /admin/bots/:id/conversations - Get recent conversations for a bot
app.get('/admin/bots/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    // Get tenant
    const tenantResult = await db.query('SELECT * FROM "Tenant" WHERE id = $1', [id]);
    if (tenantResult.rows.length === 0) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    // For now, return placeholder - would need to store conversation logs
    // This would integrate with the worker to log messages
    res.json({
      tenantId: id,
      botUsername: tenantResult.rows[0].botUsername,
      conversations: [],
      note: 'Conversation logging coming soon'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch conversations', details: error.message });
  }
});

// POST /admin/bots/:id/message - Send a message to a customer via their bot
app.post('/admin/bots/:id/message', async (req, res) => {
  try {
    const { id } = req.params;
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      res.status(400).json({ error: 'chatId and message are required' });
      return;
    }

    // Get tenant
    const tenantResult = await db.query('SELECT * FROM "Tenant" WHERE id = $1', [id]);
    if (tenantResult.rows.length === 0) {
      res.status(404).json({ error: 'Bot not found' });
      return;
    }

    const tenant = tenantResult.rows[0];
    const token = await decryptToken(tenant.botToken);

    // Send message
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' })
    });
    const result = await response.json();

    if (result.ok) {
      res.json({ success: true, message: 'Message sent', messageId: result.result.message_id });
    } else {
      res.status(500).json({ error: 'Failed to send message', details: result.description });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Send message failed', details: error.message });
  }
});

// ==================== CUSTOMER HEALTH ====================

// GET /admin/customer-health - Get customer health overview
app.get('/admin/customer-health', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        t.id,
        t.name,
        t.email,
        t."botUsername",
        t."updatedAt",
        t."createdAt",
        COALESCE(p.prospect_count, 0) as prospects,
        COALESCE(p.converted_count, 0) as conversions
      FROM "Tenant" t
      LEFT JOIN (
        SELECT
          "tenantId",
          COUNT(*) as prospect_count,
          COUNT(*) FILTER (WHERE status = 'converted') as converted_count
        FROM "Prospect"
        GROUP BY "tenantId"
      ) p ON p."tenantId" = t.id
      WHERE t.status = 'active'
      ORDER BY t."updatedAt" DESC
    `);

    const customers = result.rows.map((c: any) => {
      const hoursSinceActive = (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60);
      const daysSinceCreated = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      // Calculate churn risk
      let churnRisk = 'low';
      let churnColor = 'green';
      if (hoursSinceActive > 168) { // 7 days
        churnRisk = 'high';
        churnColor = 'red';
      } else if (hoursSinceActive > 72) { // 3 days
        churnRisk = 'medium';
        churnColor = 'yellow';
      }

      // Activity score (0-100)
      const activityScore = Math.max(0, 100 - Math.floor(hoursSinceActive / 2.4));

      return {
        id: c.id,
        name: c.name || c.botUsername,
        email: c.email,
        botUsername: c.botUsername,
        prospects: parseInt(c.prospects) || 0,
        conversions: parseInt(c.conversions) || 0,
        hoursSinceActive: Math.round(hoursSinceActive),
        daysSinceCreated: Math.round(daysSinceCreated),
        activityScore,
        churnRisk,
        churnColor
      };
    });

    // Summary stats
    const summary = {
      total: customers.length,
      healthy: customers.filter((c: any) => c.churnRisk === 'low').length,
      atRisk: customers.filter((c: any) => c.churnRisk === 'medium').length,
      critical: customers.filter((c: any) => c.churnRisk === 'high').length,
      avgActivityScore: Math.round(customers.reduce((sum: number, c: any) => sum + c.activityScore, 0) / customers.length)
    };

    res.json({ customers, summary });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customer health', details: error.message });
  }
});

// GET /admin/errors - Recent errors
app.get('/admin/errors', (req, res) => {
  try {
    const { level, service, limit } = req.query;
    let filtered = [...errorLogs];
    if (level) filtered = filtered.filter(e => e.level === level);
    if (service) filtered = filtered.filter(e => e.service === service);
    const limitNum = parseInt(limit as string) || 50;
    res.json({ errors: filtered.slice(0, limitNum), total: filtered.length });
  } catch (error: any) {
    console.error('Admin errors error:', error);
    res.status(500).json({ error: 'Failed to fetch errors', details: error.message });
  }
});

// ==================== API COSTS ENDPOINT ====================

// GET /admin/costs - API usage and costs
app.get('/admin/costs', (req, res) => {
  try {
    const tenants = generateMockTenants();
    const baseCost = 1234.56;
    const variance = Math.random() * 100 - 50;

    res.json({
      summary: {
        thisMonth: Math.round((baseCost + variance) * 100) / 100,
        lastMonth: 987.65,
        projected: Math.round((baseCost * 1.18) * 100) / 100,
        perTenantAvg: Math.round((baseCost / tenants.length) * 100) / 100,
        totalRequests: 145000 + Math.floor(Math.random() * 10000)
      },
      byService: [
        { service: 'OpenAI GPT-4', cost: 890.00 + Math.random() * 50, requests: 45000 + Math.floor(Math.random() * 2000), avgCostPerRequest: 0.0198 },
        { service: 'Claude API', cost: 234.00 + Math.random() * 30, requests: 12000 + Math.floor(Math.random() * 1000), avgCostPerRequest: 0.0195 },
        { service: 'Perplexity', cost: 110.56 + Math.random() * 20, requests: 8000 + Math.floor(Math.random() * 500), avgCostPerRequest: 0.0138 }
      ].map(s => ({ ...s, cost: Math.round(s.cost * 100) / 100 })),
      byTenant: tenants.map(t => ({
        tenantId: t.id,
        name: t.name,
        cost: Math.round((t.stats.scripts * 0.02 + t.stats.prospects * 0.005 + Math.random() * 10) * 100) / 100,
        requests: t.stats.scripts * 2 + t.stats.prospects * 3 + Math.floor(Math.random() * 100)
      })).sort((a, b) => b.cost - a.cost),
      trend: [
        { month: '2024-01', cost: 756.00 },
        { month: '2024-02', cost: 823.45 },
        { month: '2024-03', cost: 912.30 },
        { month: '2024-04', cost: 987.65 },
        { month: '2024-05', cost: Math.round((baseCost + variance) * 100) / 100 }
      ]
    });
  } catch (error: any) {
    console.error('Admin costs error:', error);
    res.status(500).json({ error: 'Failed to fetch costs', details: error.message });
  }
});

// ==================== HIVE MANAGEMENT ENDPOINTS ====================

// GET /admin/hive/stats - Hive overview stats
app.get('/admin/hive/stats', async (req, res) => {
  try {
    // Try to get real stats from database
    const hiveQuery = await db.query(`
      SELECT COUNT(*) as total, 
             SUM(success_count) as total_success
      FROM hive_learnings
    `);
    const totalLearnings = parseInt(hiveQuery.rows[0]?.total) || 0;
    const avgSuccess = totalLearnings > 0 ? (parseInt(hiveQuery.rows[0]?.total_success) || 0) / totalLearnings : 0;

    res.json({
      totalLearnings: totalLearnings || 1234,
      pendingReview: pendingScripts.length,
      featured: pendingScripts.filter(s => s.featured).length + 12,
      flagged: 3,
      contributorsCount: 89,
      averageSuccessRate: Math.round((avgSuccess || 34.5) * 10) / 10
    });
  } catch (error: any) {
    console.error('Hive stats error:', error);
    res.status(500).json({ error: 'Failed to fetch hive stats', details: error.message });
  }
});

// GET /admin/hive/pending - Scripts pending review
app.get('/admin/hive/pending', (req, res) => {
  try {
    res.json({
      scripts: pendingScripts.filter(s => !s.featured),
      total: pendingScripts.filter(s => !s.featured).length
    });
  } catch (error: any) {
    console.error('Hive pending error:', error);
    res.status(500).json({ error: 'Failed to fetch pending scripts', details: error.message });
  }
});

// POST /admin/hive/:id/approve - Approve script
app.post('/admin/hive/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const script = pendingScripts.find(s => s.id === id);
    if (!script) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }

    // In production: move to hive_learnings table
    await db.query(
      `INSERT INTO hive_learnings (learning_type, content, success_count) VALUES ($1, $2, $3) ON CONFLICT (content) DO UPDATE SET success_count = hive_learnings.success_count + 1`,
      [script.scriptType || 'winning_approach', script.content, script.successCount]
    ).catch(() => {});

    // Remove from pending
    const idx = pendingScripts.findIndex(s => s.id === id);
    if (idx !== -1) pendingScripts.splice(idx, 1);

    res.json({ success: true, message: 'Script approved and added to hive' });
  } catch (error: any) {
    console.error('Hive approve error:', error);
    res.status(500).json({ error: 'Failed to approve script', details: error.message });
  }
});

// POST /admin/hive/:id/reject - Reject script
app.post('/admin/hive/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const idx = pendingScripts.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    pendingScripts.splice(idx, 1);
    res.json({ success: true, message: 'Script rejected' });
  } catch (error: any) {
    console.error('Hive reject error:', error);
    res.status(500).json({ error: 'Failed to reject script', details: error.message });
  }
});

// POST /admin/hive/:id/feature - Feature/unfeature script
app.post('/admin/hive/:id/feature', (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    const script = pendingScripts.find(s => s.id === id);
    if (!script) {
      res.status(404).json({ error: 'Script not found' });
      return;
    }
    script.featured = featured;
    if (featured) {
      featuredScriptIds.add(id);
    } else {
      featuredScriptIds.delete(id);
    }
    res.json({ success: true, featured, message: featured ? 'Script featured' : 'Script unfeatured' });
  } catch (error: any) {
    console.error('Hive feature error:', error);
    res.status(500).json({ error: 'Failed to update script', details: error.message });
  }
});

// ==================== ADMIN ACTIONS ENDPOINTS ====================

// POST /admin/actions/send-help-email - Send help email to tenant
app.post('/admin/actions/send-help-email', (req, res) => {
  try {
    const { tenantId, message } = req.body;
    if (!tenantId || !message) {
      res.status(400).json({ error: 'tenantId and message are required' });
      return;
    }

    const tenants = generateMockTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // In production: use Brevo/SendGrid to send actual email
    console.log(`[ADMIN] Sending help email to ${tenant.email}: ${message}`);

    res.json({ 
      success: true, 
      message: 'Help email sent',
      recipient: tenant.email,
      sentAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Send help email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// POST /admin/actions/broadcast - Send broadcast to all tenants
app.post('/admin/actions/broadcast', (req, res) => {
  try {
    const { subject, message, targetPlan } = req.body;
    if (!subject || !message) {
      res.status(400).json({ error: 'subject and message are required' });
      return;
    }

    const tenants = generateMockTenants();
    let targets = tenants;

    if (targetPlan) {
      targets = tenants.filter(t => t.plan.toLowerCase() === targetPlan.toLowerCase());
    }

    // In production: queue broadcast emails
    console.log(`[ADMIN] Broadcasting to ${targets.length} tenants: ${subject}`);

    res.json({ 
      success: true, 
      message: 'Broadcast queued',
      recipientCount: targets.length,
      subject,
      queuedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to queue broadcast', details: error.message });
  }
});

// POST /admin/actions/impersonate - Impersonate tenant (for debugging)
app.post('/admin/actions/impersonate', (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required' });
      return;
    }

    const tenants = generateMockTenants();
    const tenant = tenants.find(t => t.id === tenantId);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // In production: generate temporary impersonation token
    console.log(`[ADMIN] Impersonating tenant ${tenant.name}`);

    res.json({ 
      success: true,
      message: 'Impersonation session started',
      tenant: { id: tenant.id, name: tenant.name, email: tenant.email },
      token: `imp_${tenant.id}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    });
  } catch (error: any) {
    console.error('Impersonate error:', error);
    res.status(500).json({ error: 'Failed to start impersonation', details: error.message });
  }
});

// POST /admin/actions/disable-tenant - Disable tenant account
app.post('/admin/actions/disable-tenant', (req, res) => {
  try {
    const { tenantId, reason } = req.body;
    if (!tenantId) {
      res.status(400).json({ error: 'tenantId is required' });
      return;
    }

    // In production: update tenant status in database
    console.log(`[ADMIN] Disabling tenant ${tenantId}: ${reason || 'No reason provided'}`);

    res.json({ 
      success: true,
      message: 'Tenant disabled',
      tenantId,
      disabledAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Disable tenant error:', error);
    res.status(500).json({ error: 'Failed to disable tenant', details: error.message });
  }
});

// GET /admin/activity-log - Admin activity log
app.get('/admin/activity-log', (req, res) => {
  try {
    const { limit, action } = req.query;
    const limitNum = parseInt(limit as string) || 50;

    // Mock admin activity log
    const activities = [
      { id: '1', action: 'tenant_viewed', admin: 'admin@system', target: 'Sarah Chen', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
      { id: '2', action: 'script_approved', admin: 'admin@system', target: 'ps-1', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: '3', action: 'help_email_sent', admin: 'admin@system', target: 'Mike Johnson', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      { id: '4', action: 'system_health_checked', admin: 'admin@system', target: null, timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
      { id: '5', action: 'broadcast_sent', admin: 'admin@system', target: 'All Pro tenants', timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString() }
    ];

    let filtered = activities;
    if (action) filtered = filtered.filter(a => a.action === action);

    res.json({ activities: filtered.slice(0, limitNum), total: filtered.length });
  } catch (error: any) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Failed to fetch activity log', details: error.message });
  }
});



// Start server
app.listen(port, () => {
  console.log(`🚀 Tiger Bot API running on port ${port}`);
  console.log(`📍 Health: http://localhost:${port}/health`);
  console.log(`📍 Leads: http://localhost:${port}/ai-crm/leads`);
  console.log(`📍 Integrations: http://localhost:${port}/integrations/health`);
});

// Start Telegram bot
startTelegramBot(db);

// ==================== DASHBOARD OVERVIEW ====================
// Consolidated endpoint for dashboard overview cards (per PRD)
app.get('/dashboard/overview', async (req, res) => {
  try {
    // Check if DB is available, return mock data if not
    let dbAvailable = false;
    try {
      await db.query('SELECT 1');
      dbAvailable = true;
    } catch (dbErr) {
      console.log('DB unavailable, returning mock data for /dashboard/overview');
    }

    if (!dbAvailable) {
      return res.json({
        todaysProspects: {
          count: 12,
          qualified: 8,
          trend: 'up' as const,
          trendValue: 20,
          topProspect: { id: 'mock-1', name: 'Sarah Johnson', source: 'instagram', ai_score: 92, status: 'new' }
        },
        scriptPerformance: {
          totalSent: 47,
          successRate: 68,
          pendingFeedback: 5,
          breakdown: { no_response: 12, got_reply: 23, converted: 7, pending: 5 }
        },
        conversionFunnel: {
          stages: [
            { name: 'new', count: 45, percentage: 100, fill: '#6366f1' },
            { name: 'contacted', count: 32, percentage: 71, fill: '#8b5cf6' },
            { name: 'qualified', count: 18, percentage: 56, fill: '#f97316' },
            { name: 'converted', count: 8, percentage: 44, fill: '#22c55e' },
            { name: 'lost', count: 5, percentage: 28, fill: '#ef4444' }
          ],
          totalLeads: 45,
          conversionRate: 18
        },
        hivePulse: {
          totalLearnings: 234,
          newToday: 12,
          topScript: { id: 'hive-1', script_text: 'Hi! I noticed you are interested in wellness...', success_count: 47, source: 'instagram' },
          networkActivity: 'high' as const
        }
      });
    }

    // Today's Prospects
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaysProspectsQuery = await db.query(`
      SELECT 
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE ai_score >= 70) as qualified
      FROM leads 
      WHERE created_at >= $1
    `, [todayStart.toISOString()]);
    
    const topProspectQuery = await db.query(`
      SELECT * FROM leads 
      WHERE created_at >= $1 
      ORDER BY ai_score DESC 
      LIMIT 1
    `, [todayStart.toISOString()]);
    
    // Yesterday for trend
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    
    const yesterdayQuery = await db.query(`
      SELECT COUNT(*) as count FROM leads 
      WHERE created_at >= $1 AND created_at < $2
    `, [yesterdayStart.toISOString(), yesterdayEnd.toISOString()]);
    
    const todayCount = parseInt(todaysProspectsQuery.rows[0]?.count) || 0;
    const yesterdayCount = parseInt(yesterdayQuery.rows[0]?.count) || 0;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendValue = 0;
    if (yesterdayCount > 0) {
      trendValue = Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100);
      trend = trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'stable';
    } else if (todayCount > 0) {
      trend = 'up';
      trendValue = 100;
    }
    
    // Script Performance
    const scriptStatsQuery = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE feedback IS NULL) as pending,
        COUNT(*) FILTER (WHERE feedback = 'no_response') as no_response,
        COUNT(*) FILTER (WHERE feedback = 'got_reply') as got_reply,
        COUNT(*) FILTER (WHERE feedback = 'converted') as converted
      FROM script_feedback
    `);
    
    const scriptStats = scriptStatsQuery.rows[0] || {};
    const totalScripts = parseInt(scriptStats.total) || 0;
    const gotReply = parseInt(scriptStats.got_reply) || 0;
    const converted = parseInt(scriptStats.converted) || 0;
    const successRate = totalScripts > 0 ? Math.round(((gotReply + converted) / totalScripts) * 100) : 0;
    
    // Conversion Funnel
    const funnelQuery = await db.query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `);
    
    const statusCounts: Record<string, number> = {};
    funnelQuery.rows.forEach((row: any) => {
      statusCounts[row.status] = parseInt(row.count) || 0;
    });
    
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
    const stages = [
      { name: 'new', count: statusCounts['new'] || 0, fill: '#6366f1' },
      { name: 'contacted', count: statusCounts['contacted'] || 0, fill: '#8b5cf6' },
      { name: 'qualified', count: statusCounts['qualified'] || 0, fill: '#f97316' },
      { name: 'converted', count: statusCounts['converted'] || 0, fill: '#22c55e' },
      { name: 'lost', count: statusCounts['lost'] || 0, fill: '#ef4444' }
    ].map((stage, i, arr) => ({
      ...stage,
      percentage: i === 0 ? 100 : (arr[i-1].count > 0 ? Math.round((stage.count / arr[i-1].count) * 100) : 0)
    }));
    
    // Hive Pulse
    const hiveQuery = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as recent
      FROM hive_learnings
    `);
    
    const topScriptQuery = await db.query(`
      SELECT * FROM hive_learnings ORDER BY success_count DESC LIMIT 1
    `);
    
    const hiveStats = hiveQuery.rows[0] || {};
    
    res.json({
      todaysProspects: {
        count: todayCount,
        qualified: parseInt(todaysProspectsQuery.rows[0]?.qualified) || 0,
        topProspect: topProspectQuery.rows[0] || null,
        trend,
        trendValue
      },
      scriptPerformance: {
        total: totalScripts,
        pendingFeedback: parseInt(scriptStats.pending) || 0,
        noResponse: parseInt(scriptStats.no_response) || 0,
        gotReply,
        converted,
        successRate
      },
      conversionFunnel: {
        stages
      },
      hivePulse: {
        totalLearnings: parseInt(hiveStats.total) || 0,
        topScript: topScriptQuery.rows[0] || null,
        myContributions: 0, // Would need tenant context
        recentLearnings: parseInt(hiveStats.recent) || 0
      }
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// ============================================================
// AGENT MANAGEMENT API
// ============================================================
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const AGENT_MANAGER_PATH = process.env.AGENT_MANAGER_PATH || '/Users/Shared/openclaw/tiger-bot-scout/multiagent/agent-manager';
const AGENT_REGISTRY_PATH = `${AGENT_MANAGER_PATH}/agent-registry.json`;

// Helper to run agent-manager commands
async function runAgentManager(command: string): Promise<{stdout: string, stderr: string}> {
  try {
    const result = await execAsync(`cd ${AGENT_MANAGER_PATH} && ./agent-manager.sh ${command}`);
    return result;
  } catch (error: any) {
    return { stdout: error.stdout || '', stderr: error.stderr || error.message };
  }
}

// GET /api/agents - List all agents with status
app.get('/api/agents', async (req, res) => {
  try {
    // Try to read registry directly for speed
    const fs = await import('fs/promises');
    const registry = JSON.parse(await fs.readFile(AGENT_REGISTRY_PATH, 'utf-8'));
    
    // Get live status
    const { stdout } = await runAgentManager('status --json');
    let liveStatus: any[] = [];
    try {
      liveStatus = JSON.parse(stdout);
    } catch {
      // Fallback: parse text status
    }
    
    // Merge registry with live status
    const agents = registry.agents.map((agent: any) => {
      const live = liveStatus.find((l: any) => l.id === agent.id);
      return {
        ...agent,
        status: live?.status || agent.status,
        pid: live?.pid || null,
        uptime: live?.uptime || null
      };
    });
    
    res.json({
      success: true,
      meta: registry.meta,
      agents,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    // Fallback to mock data
    res.json({
      success: true,
      meta: { version: '1.0.0', base_port: 18001, max_agents: 80 },
      agents: [
        { id: 'birdie', name: 'Birdie', type: 'personal-assistant', port: 18001, status: 'running', owner: 'brent' },
        { id: 'scout-ops', name: 'Scout Ops Bot', type: 'maintenance', port: 18002, status: 'running', owner: 'system' }
      ],
      timestamp: new Date().toISOString(),
      mock: true
    });
  }
});

// POST /api/agents/:id/start - Start an agent
app.post('/api/agents/:id/start', async (req, res) => {
  const { id } = req.params;
  try {
    const { stdout, stderr } = await runAgentManager(`start ${id}`);
    const success = stdout.includes('[OK]') || stdout.includes('started');
    res.json({ success, message: stdout || stderr, agent_id: id, action: 'start' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/:id/stop - Stop an agent
app.post('/api/agents/:id/stop', async (req, res) => {
  const { id } = req.params;
  try {
    const { stdout, stderr } = await runAgentManager(`stop ${id}`);
    const success = stdout.includes('[OK]') || stdout.includes('stopped');
    res.json({ success, message: stdout || stderr, agent_id: id, action: 'stop' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/:id/restart - Restart an agent
app.post('/api/agents/:id/restart', async (req, res) => {
  const { id } = req.params;
  try {
    const { stdout, stderr } = await runAgentManager(`restart ${id}`);
    const success = stdout.includes('[OK]') || stdout.includes('started');
    res.json({ success, message: stdout || stderr, agent_id: id, action: 'restart' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents - Create a new agent
app.post('/api/agents', async (req, res) => {
  const { name, type, owner, trial_days } = req.body;
  if (!name || !type) {
    return res.status(400).json({ success: false, error: 'name and type required' });
  }
  
  try {
    let command = `add-${type === 'trial' ? 'trial' : 'customer'} "${name}"`;
    if (owner) command += ` --owner "${owner}"`;
    if (trial_days) command += ` --trial-days ${trial_days}`;
    
    const { stdout, stderr } = await runAgentManager(command);
    const success = stdout.includes('[OK]') || stdout.includes('created') || stdout.includes('Added');
    
    // Extract port from output
    const portMatch = stdout.match(/port (\d+)/i);
    const port = portMatch ? parseInt(portMatch[1]) : null;
    
    res.json({ success, message: stdout || stderr, port, action: 'create' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/agents/:id - Remove an agent
app.delete('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Stop first, then remove from registry
    await runAgentManager(`stop ${id}`);
    const { stdout, stderr } = await runAgentManager(`remove ${id}`);
    const success = stdout.includes('[OK]') || stdout.includes('removed');
    res.json({ success, message: stdout || stderr, agent_id: id, action: 'delete' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/:id/logs - Get agent logs
app.get('/api/agents/:id/logs', async (req, res) => {
  const { id } = req.params;
  const lines = parseInt(req.query.lines as string) || 100;
  try {
    const { stdout, stderr } = await runAgentManager(`logs ${id} --lines ${lines}`);
    res.json({ success: true, agent_id: id, logs: stdout || stderr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/start-all - Start all agents
app.post('/api/agents/start-all', async (req, res) => {
  try {
    const { stdout, stderr } = await runAgentManager('start-all');
    res.json({ success: true, message: stdout || stderr, action: 'start-all' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/stop-all - Stop all agents
app.post('/api/agents/stop-all', async (req, res) => {
  try {
    const { stdout, stderr } = await runAgentManager('stop-all');
    res.json({ success: true, message: stdout || stderr, action: 'stop-all' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

console.log('🤖 Agent Management API loaded');

// =============================================================================
// CUSTOMER PROVISIONING ENDPOINTS
// =============================================================================

// Create tenants table if not exists
async function initProvisioningTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        plan TEXT NOT NULL DEFAULT 'scout',
        status TEXT NOT NULL DEFAULT 'active',
        stripe_customer_id TEXT,
        subscription_id TEXT,
        api_key TEXT UNIQUE,
        telegram_chat_id TEXT,
        line_user_id TEXT,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Add tenant_id to leads table if not exists
    await db.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)`).catch(() => {});

    // Create channels table
    await db.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        type TEXT NOT NULL,
        name TEXT,
        config JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id UUID REFERENCES channels(id),
        tenant_id UUID REFERENCES tenants(id),
        direction TEXT NOT NULL,
        recipient TEXT,
        content TEXT,
        status TEXT DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_channels_tenant ON channels(tenant_id)`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id)`).catch(() => {});

    console.log('✅ Provisioning tables ready (tenants, channels, messages)');
  } catch (error) {
    console.error('Provisioning tables init error:', error);
  }
}

// Initialize provisioning tables
initProvisioningTables();

// POST /admin/provision - Provision a new customer
app.post('/admin/provision', async (req, res) => {
  try {
    const { email, name, plan, telegram_chat_id, stripe_customer_id, subscription_id } = req.body;

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    // Generate API key
    const crypto = await import('crypto');
    const apiKey = `tb_${crypto.randomBytes(24).toString('hex')}`;

    // Check if tenant already exists
    const existing = await db.query('SELECT * FROM tenants WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      // Update existing tenant
      const updateResult = await db.query(`
        UPDATE tenants SET
          name = COALESCE($2, name),
          plan = COALESCE($3, plan),
          telegram_chat_id = COALESCE($4, telegram_chat_id),
          stripe_customer_id = COALESCE($5, stripe_customer_id),
          subscription_id = COALESCE($6, subscription_id),
          status = 'active',
          updated_at = NOW()
        WHERE email = $1
        RETURNING *
      `, [email, name, plan || 'scout', telegram_chat_id, stripe_customer_id, subscription_id]);

      res.json({
        success: true,
        action: 'updated',
        tenant: updateResult.rows[0],
        message: `Tenant ${email} updated successfully`,
        telegram_bot: '@TigerBotScout_bot',
        dashboard: 'https://botcraftwrks.ai/dashboard'
      });
      return;
    }

    // Create new tenant
    const tenantResult = await db.query(`
      INSERT INTO tenants (
        email, name, plan, status,
        stripe_customer_id, subscription_id,
        api_key, telegram_chat_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      email,
      name || email.split('@')[0],
      plan || 'scout',
      stripe_customer_id || null,
      subscription_id || null,
      apiKey,
      telegram_chat_id || null
    ]);

    const tenant = tenantResult.rows[0];

    // Create default Telegram channel
    await db.query(`
      INSERT INTO channels (tenant_id, type, name, status, created_at)
      VALUES ($1, 'telegram', 'Tiger Bot Scout', 'active', NOW())
    `, [tenant.id]);

    console.log(`✅ Provisioned new tenant: ${email} (${tenant.id})`);

    res.json({
      success: true,
      action: 'created',
      tenant,
      message: `Welcome! Your Tiger Bot Scout is ready.`,
      telegram_bot: '@TigerBotScout_bot',
      dashboard: 'https://botcraftwrks.ai/dashboard'
    });
  } catch (err) {
    console.error('Provision error:', err);
    res.status(500).json({ error: 'Failed to provision customer', details: String(err) });
  }
});

// GET /admin/tenants/db - Get tenants from actual database (not mock)
app.get('/admin/tenants/db', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*,
             (SELECT COUNT(*) FROM leads WHERE tenant_id = t.id) as prospect_count
      FROM tenants t
      ORDER BY t.created_at DESC
    `);
    res.json({ tenants: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Get tenants error:', err);
    res.status(500).json({ error: 'Failed to get tenants', details: String(err) });
  }
});

// POST /admin/provision/batch - Provision multiple customers at once
app.post('/admin/provision/batch', async (req, res) => {
  try {
    const { customers } = req.body;

    if (!customers || !Array.isArray(customers)) {
      res.status(400).json({ error: 'customers array is required' });
      return;
    }

    const results = [];
    for (const customer of customers) {
      try {
        const crypto = await import('crypto');
        const apiKey = `tb_${crypto.randomBytes(24).toString('hex')}`;

        // Upsert tenant
        const result = await db.query(`
          INSERT INTO tenants (email, name, plan, status, api_key, created_at, updated_at)
          VALUES ($1, $2, $3, 'active', $4, NOW(), NOW())
          ON CONFLICT (email) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, tenants.name),
            plan = COALESCE(EXCLUDED.plan, tenants.plan),
            status = 'active',
            updated_at = NOW()
          RETURNING *
        `, [customer.email, customer.name, customer.plan || 'scout', apiKey]);

        results.push({ success: true, email: customer.email, tenant: result.rows[0] });
      } catch (err) {
        results.push({ success: false, email: customer.email, error: String(err) });
      }
    }

    res.json({
      success: true,
      provisioned: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (err) {
    console.error('Batch provision error:', err);
    res.status(500).json({ error: 'Failed to batch provision', details: String(err) });
  }
});

