import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

// Initialize integration clients
const apollo = new ApolloClient(process.env.APOLLO_API_KEY!);
const brevo = new BrevoClient(process.env.BREVO_API_KEY!);
const twilio = new TwilioClient(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
  process.env.TWILIO_PHONE_NUMBER!
);
const calendly = new CalendlyClient(process.env.CALENDLY_API_KEY!, process.env.CALENDLY_LINK!);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

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
