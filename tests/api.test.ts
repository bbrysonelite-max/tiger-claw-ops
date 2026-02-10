/**
 * Tiger Bot Scout API Integration Tests
 * Comprehensive test suite for all API endpoints
 * Run with: npm test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const API_BASE = process.env.API_URL || 'http://localhost:4000';

// ==================== HEALTH CHECK ====================

describe('GET /health', () => {
  it('returns health status', async () => {
    const response = await request(API_BASE).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });
});

// ==================== DASHBOARD ENDPOINTS ====================

describe('GET /dashboard/overview', () => {
  it('returns overview data with all 4 cards', async () => {
    const response = await request(API_BASE).get('/dashboard/overview');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('todaysProspects');
    expect(response.body).toHaveProperty('scriptPerformance');
    expect(response.body).toHaveProperty('conversionFunnel');
    expect(response.body).toHaveProperty('hivePulse');
  });

  it('returns correct data types for todaysProspects', async () => {
    const response = await request(API_BASE).get('/dashboard/overview');
    expect(response.status).toBe(200);
    const { todaysProspects } = response.body;
    expect(typeof todaysProspects.count).toBe('number');
    expect(typeof todaysProspects.qualified).toBe('number');
  });

  it('returns correct data types for scriptPerformance', async () => {
    const response = await request(API_BASE).get('/dashboard/overview');
    expect(response.status).toBe(200);
    const { scriptPerformance } = response.body;
    expect(typeof scriptPerformance.total).toBe('number');
    expect(typeof scriptPerformance.successRate).toBe('number');
    expect(scriptPerformance).toHaveProperty('breakdown');
  });

  it('returns correct data types for conversionFunnel', async () => {
    const response = await request(API_BASE).get('/dashboard/overview');
    expect(response.status).toBe(200);
    const { conversionFunnel } = response.body;
    expect(Array.isArray(conversionFunnel.stages)).toBe(true);
  });

  it('returns correct data types for hivePulse', async () => {
    const response = await request(API_BASE).get('/dashboard/overview');
    expect(response.status).toBe(200);
    const { hivePulse } = response.body;
    expect(typeof hivePulse.totalLearnings).toBe('number');
  });
});

// ==================== LEADS/PROSPECTS ENDPOINTS ====================

describe('GET /ai-crm/leads', () => {
  it('returns paginated leads list', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('leads');
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.leads)).toBe(true);
    expect(response.body.leads.length).toBeLessThanOrEqual(10);
  });

  it('filters by status correctly', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ status: 'new' });
    expect(response.status).toBe(200);
    response.body.leads.forEach((lead: any) => {
      expect(lead.status).toBe('new');
    });
  });

  it('filters by score range correctly (min_score)', async () => {
    const minScore = 70;
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ min_score: minScore });
    expect(response.status).toBe(200);
    response.body.leads.forEach((lead: any) => {
      expect(lead.ai_score).toBeGreaterThanOrEqual(minScore);
    });
  });

  it('filters by score range correctly (max_score)', async () => {
    const maxScore = 80;
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ max_score: maxScore });
    expect(response.status).toBe(200);
    response.body.leads.forEach((lead: any) => {
      expect(lead.ai_score).toBeLessThanOrEqual(maxScore);
    });
  });

  it('supports search parameter', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ search: 'test' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('leads');
    expect(Array.isArray(response.body.leads)).toBe(true);
  });

  it('handles empty results gracefully', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ search: 'nonexistent_xyz_abc_123' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('leads');
    expect(response.body.leads).toEqual([]);
    expect(response.body.count).toBe(0);
  });

  it('supports pagination with offset', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 5, offset: 0 });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('leads');
    expect(response.body.leads.length).toBeLessThanOrEqual(5);
  });

  it('supports sorting by score descending by default', async () => {
    const response = await request(API_BASE).get('/ai-crm/leads');
    expect(response.status).toBe(200);
    const leads = response.body.leads;
    for (let i = 1; i < leads.length; i++) {
      expect(leads[i - 1].ai_score).toBeGreaterThanOrEqual(leads[i].ai_score);
    }
  });

  it('filters by source correctly', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ source: 'telegram' });
    expect(response.status).toBe(200);
    response.body.leads.forEach((lead: any) => {
      expect(lead.source).toBe('telegram');
    });
  });

  it('filters by date range (since)', async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ since });
    expect(response.status).toBe(200);
    response.body.leads.forEach((lead: any) => {
      expect(new Date(lead.created_at).getTime()).toBeGreaterThanOrEqual(new Date(since).getTime());
    });
  });
});

describe('GET /ai-crm/leads/:id', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('returns a single lead by ID', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE).get(`/ai-crm/leads/${existingLeadId}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(existingLeadId);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('source');
    expect(response.body).toHaveProperty('ai_score');
    expect(response.body).toHaveProperty('status');
  });

  it('returns 404 for non-existent lead', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(API_BASE).get(`/ai-crm/leads/${fakeId}`);
    expect(response.status).toBe(404);
  });
});

describe('PUT /ai-crm/leads/:id', () => {
  let existingLeadId: string;
  let originalStatus: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
      originalStatus = response.body.leads[0].status;
    }
  });

  it('updates lead status', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const newStatus = originalStatus === 'new' ? 'contacted' : 'new';
    const response = await request(API_BASE)
      .put(`/ai-crm/leads/${existingLeadId}`)
      .send({ status: newStatus });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(newStatus);
    // Restore original status
    await request(API_BASE)
      .put(`/ai-crm/leads/${existingLeadId}`)
      .send({ status: originalStatus });
  });

  it('returns 404 for non-existent lead', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(API_BASE)
      .put(`/ai-crm/leads/${fakeId}`)
      .send({ status: 'contacted' });
    expect(response.status).toBe(404);
  });
});

describe('PATCH /ai-crm/leads/:id', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('partially updates lead', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE)
      .patch(`/ai-crm/leads/${existingLeadId}`)
      .send({ notes: 'Test note from API test' });
    expect([200, 201]).toContain(response.status);
  });
});

describe('GET /ai-crm/leads/:id/scripts', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('returns scripts for a lead', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE).get(`/ai-crm/leads/${existingLeadId}/scripts`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('scripts');
    expect(Array.isArray(response.body.scripts)).toBe(true);
  });
});

describe('GET /ai-crm/leads/:id/activities', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('returns activities for a lead', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE).get(`/ai-crm/leads/${existingLeadId}/activities`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('activities');
    expect(Array.isArray(response.body.activities)).toBe(true);
  });
});

describe('GET /ai-crm/leads/:id/notes', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('returns notes for a lead', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE).get(`/ai-crm/leads/${existingLeadId}/notes`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('notes');
    expect(Array.isArray(response.body.notes)).toBe(true);
  });
});

describe('POST /ai-crm/leads/:id/notes', () => {
  let existingLeadId: string;

  beforeAll(async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/leads')
      .query({ limit: 1 });
    if (response.body.leads && response.body.leads.length > 0) {
      existingLeadId = response.body.leads[0].id;
    }
  });

  it('creates a new note for a lead', async () => {
    if (!existingLeadId) {
      console.log('Skipping test: no leads in database');
      return;
    }
    const response = await request(API_BASE)
      .post(`/ai-crm/leads/${existingLeadId}/notes`)
      .send({ content: 'Test note from API test suite' });
    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('id');
  });
});

// ==================== ANALYTICS ENDPOINTS ====================

describe('GET /analytics/funnel', () => {
  it('returns funnel data with all stages', async () => {
    const response = await request(API_BASE).get('/analytics/funnel');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('stages');
    expect(Array.isArray(response.body.stages)).toBe(true);
    expect(response.body.stages.length).toBeGreaterThan(0);
  });

  it('calculates conversion rates correctly', async () => {
    const response = await request(API_BASE).get('/analytics/funnel');
    expect(response.status).toBe(200);
    response.body.stages.forEach((stage: any) => {
      expect(stage).toHaveProperty('stage');
      expect(stage).toHaveProperty('count');
      expect(typeof stage.count).toBe('number');
    });
    expect(response.body).toHaveProperty('overallConversion');
    expect(typeof response.body.overallConversion).toBe('number');
  });

  it('supports period parameter', async () => {
    const response = await request(API_BASE)
      .get('/analytics/funnel')
      .query({ period: '7d' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('period');
  });
});

describe('GET /analytics/timeline', () => {
  it('returns timeline data', async () => {
    const response = await request(API_BASE).get('/analytics/timeline');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('supports period parameter', async () => {
    const response = await request(API_BASE)
      .get('/analytics/timeline')
      .query({ period: '30d' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('period');
  });

  it('returns data points with correct structure', async () => {
    const response = await request(API_BASE).get('/analytics/timeline');
    expect(response.status).toBe(200);
    if (response.body.data.length > 0) {
      const dataPoint = response.body.data[0];
      expect(dataPoint).toHaveProperty('date');
      expect(dataPoint).toHaveProperty('leads');
    }
  });
});

describe('GET /analytics/response-rates', () => {
  it('returns response rate data', async () => {
    const response = await request(API_BASE).get('/analytics/response-rates');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rates');
  });
});

describe('GET /analytics/roi', () => {
  it('returns ROI calculation data', async () => {
    const response = await request(API_BASE).get('/analytics/roi');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('roi');
  });
});

// ==================== SETTINGS ENDPOINTS ====================

describe('GET /settings', () => {
  it('returns settings object', async () => {
    const response = await request(API_BASE).get('/settings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenant_id');
    expect(response.body).toHaveProperty('bot_name');
    expect(response.body).toHaveProperty('default_language');
  });

  it('returns notification settings', async () => {
    const response = await request(API_BASE).get('/settings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('notifications');
  });

  it('returns scoring settings', async () => {
    const response = await request(API_BASE).get('/settings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('scoring');
  });
});

describe('PATCH /settings', () => {
  it('updates settings partially', async () => {
    const response = await request(API_BASE)
      .patch('/settings')
      .send({ bot_name: 'Tiger Bot Scout Test' });
    expect(response.status).toBe(200);
    // Restore original
    await request(API_BASE)
      .patch('/settings')
      .send({ bot_name: 'Tiger Bot Scout' });
  });

  it('updates nested notification settings', async () => {
    const response = await request(API_BASE)
      .patch('/settings')
      .send({ notifications: { new_lead: true } });
    expect([200, 201]).toContain(response.status);
  });
});

describe('GET /settings/integrations', () => {
  it('returns integration statuses', async () => {
    const response = await request(API_BASE).get('/settings/integrations');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('telegram');
  });

  it('returns correct structure for each integration', async () => {
    const response = await request(API_BASE).get('/settings/integrations');
    expect(response.status).toBe(200);
    const integrations = Object.values(response.body);
    integrations.forEach((integration: any) => {
      expect(integration).toHaveProperty('connected');
      expect(integration).toHaveProperty('status');
    });
  });
});

describe('POST /settings/test-connection/:service', () => {
  it('tests telegram connection', async () => {
    const response = await request(API_BASE)
      .post('/settings/test-connection/telegram');
    expect([200, 400, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

// ==================== CRM STATS ENDPOINTS ====================

describe('GET /ai-crm/stats', () => {
  it('returns pipeline statistics', async () => {
    const response = await request(API_BASE).get('/ai-crm/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('this_week');
    expect(response.body).toHaveProperty('avg_score');
    expect(response.body).toHaveProperty('by_status');
    expect(typeof response.body.total).toBe('number');
    expect(typeof response.body.this_week).toBe('number');
    expect(typeof response.body.avg_score).toBe('number');
  });
});

describe('GET /ai-crm/priority-prospects', () => {
  it('returns priority prospects list', async () => {
    const response = await request(API_BASE).get('/ai-crm/priority-prospects');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('prospects');
    expect(Array.isArray(response.body.prospects)).toBe(true);
  });
});

describe('GET /ai-crm/feedback/stats', () => {
  it('returns feedback statistics', async () => {
    const response = await request(API_BASE).get('/ai-crm/feedback/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('total_scripts');
    expect(response.body).toHaveProperty('with_feedback');
    expect(response.body).toHaveProperty('conversion_rate');
    expect(response.body).toHaveProperty('by_feedback');
    expect(typeof response.body.total_scripts).toBe('number');
    expect(typeof response.body.conversion_rate).toBe('number');
  });
});

describe('GET /ai-crm/feedback/recent', () => {
  it('returns recent feedback', async () => {
    const response = await request(API_BASE).get('/ai-crm/feedback/recent');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('feedback');
    expect(Array.isArray(response.body.feedback)).toBe(true);
  });
});

// ==================== HIVE ENDPOINTS ====================

describe('GET /ai-crm/hive/leaderboard', () => {
  it('returns top 10 scripts by default', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/leaderboard');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('leaderboard');
    expect(Array.isArray(response.body.leaderboard)).toBe(true);
    expect(response.body.leaderboard.length).toBeLessThanOrEqual(10);
  });

  it('orders by success_count descending', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/leaderboard');
    expect(response.status).toBe(200);
    const leaderboard = response.body.leaderboard;
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i - 1].success_count).toBeGreaterThanOrEqual(leaderboard[i].success_count);
    }
  });

  it('returns script details in each entry', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/leaderboard');
    expect(response.status).toBe(200);
    if (response.body.leaderboard.length > 0) {
      const entry = response.body.leaderboard[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('script_text');
      expect(entry).toHaveProperty('success_count');
    }
  });
});

describe('GET /ai-crm/hive/learnings', () => {
  it('returns hive learnings', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/learnings');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('learnings');
    expect(response.body).toHaveProperty('count');
    expect(Array.isArray(response.body.learnings)).toBe(true);
  });

  it('filters by learning type', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/hive/learnings')
      .query({ type: 'winning_approach' });
    expect(response.status).toBe(200);
    response.body.learnings.forEach((learning: any) => {
      expect(learning.learning_type).toBe('winning_approach');
    });
  });

  it('supports pagination', async () => {
    const response = await request(API_BASE)
      .get('/ai-crm/hive/learnings')
      .query({ limit: 5 });
    expect(response.status).toBe(200);
    expect(response.body.learnings.length).toBeLessThanOrEqual(5);
  });
});

describe('GET /ai-crm/hive/source-performance', () => {
  it('returns source performance data', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/source-performance');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sources');
  });
});

describe('GET /ai-crm/hive/trends', () => {
  it('returns hive trends data', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/trends');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('trends');
  });
});

describe('GET /ai-crm/hive/top-signals', () => {
  it('returns top signals data', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/top-signals');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('signals');
  });
});

describe('GET /ai-crm/hive/tenant-stats', () => {
  it('returns tenant statistics', async () => {
    const response = await request(API_BASE).get('/ai-crm/hive/tenant-stats');
    expect(response.status).toBe(200);
  });
});

// ==================== INTEGRATION ENDPOINTS ====================

describe('GET /integrations/health', () => {
  it('returns integration health status', async () => {
    const response = await request(API_BASE).get('/integrations/health');
    expect(response.status).toBe(200);
  });
});

describe('GET /integrations/calendly/link', () => {
  it('returns calendly link', async () => {
    const response = await request(API_BASE).get('/integrations/calendly/link');
    expect([200, 404]).toContain(response.status);
  });
});

describe('GET /integrations/brevo/stats', () => {
  it('returns brevo statistics', async () => {
    const response = await request(API_BASE).get('/integrations/brevo/stats');
    expect([200, 404, 500]).toContain(response.status);
  });
});

// ==================== EXPORT ====================


// ==================== ADMIN API ENDPOINTS ====================

// Admin API - Tenants
describe('Admin API - Tenants', () => {
  describe('GET /admin/tenants', () => {
    it('should return list of tenants with admin header', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('plan');
      expect(response.body[0]).toHaveProperty('stats');
      expect(response.body[0]).toHaveProperty('health');
    });

    it('should filter tenants by plan', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants?plan=Pro')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      response.body.forEach((tenant: any) => {
        expect(tenant.plan).toBe('Pro');
      });
    });

    it('should filter tenants by health status', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants?health=warning')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
    });

    it('should search tenants by name or email', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants?search=sarah')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /admin/tenants/:id', () => {
    it('should return detailed tenant info', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants/1')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tenant');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body).toHaveProperty('billing');
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request(API_BASE)
        .get('/admin/tenants/99999')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(404);
    });
  });
});

// Admin API - System Health
describe('Admin API - System Health', () => {
  describe('GET /admin/system-health', () => {
    it('should return system health metrics', async () => {
      const response = await request(API_BASE)
        .get('/admin/system-health')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('resources');
      expect(response.body).toHaveProperty('version');
    });

    it('should return service statuses', async () => {
      const response = await request(API_BASE)
        .get('/admin/system-health')
        .set('x-admin-mode', 'true');
      expect(response.body.services).toHaveProperty('api');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('queue');
      expect(response.body.services).toHaveProperty('cache');
    });
  });

  describe('GET /admin/errors', () => {
    it('should return error logs', async () => {
      const response = await request(API_BASE)
        .get('/admin/errors')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});

// Admin API - Costs
describe('Admin API - Costs', () => {
  describe('GET /admin/costs', () => {
    it('should return cost summary and breakdown', async () => {
      const response = await request(API_BASE)
        .get('/admin/costs')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('byService');
      expect(response.body).toHaveProperty('byTenant');
      expect(response.body).toHaveProperty('trend');
    });

    it('should include cost metrics', async () => {
      const response = await request(API_BASE)
        .get('/admin/costs')
        .set('x-admin-mode', 'true');
      expect(response.body.summary).toHaveProperty('thisMonth');
      expect(response.body.summary).toHaveProperty('lastMonth');
      expect(response.body.summary).toHaveProperty('projected');
    });
  });
});

// Admin API - Hive Management
describe('Admin API - Hive Management', () => {
  describe('GET /admin/hive/stats', () => {
    it('should return hive statistics', async () => {
      const response = await request(API_BASE)
        .get('/admin/hive/stats')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalLearnings');
      expect(response.body).toHaveProperty('pendingReview');
      expect(response.body).toHaveProperty('featured');
      expect(response.body).toHaveProperty('flagged');
    });
  });

  describe('GET /admin/hive/pending', () => {
    it('should return pending scripts', async () => {
      const response = await request(API_BASE)
        .get('/admin/hive/pending')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });

  describe('POST /admin/hive/:id/approve', () => {
    it('should approve a pending script', async () => {
      const response = await request(API_BASE)
        .post('/admin/hive/1/approve')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /admin/hive/:id/reject', () => {
    it('should reject a pending script', async () => {
      const response = await request(API_BASE)
        .post('/admin/hive/1/reject')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /admin/hive/:id/feature', () => {
    it('should feature a script', async () => {
      const response = await request(API_BASE)
        .post('/admin/hive/1/feature')
        .set('x-admin-mode', 'true')
        .send({ featured: true });
      expect(response.status).toBe(200);
      expect(response.body.featured).toBe(true);
    });
  });
});

// Admin API - Actions
describe('Admin API - Actions', () => {
  describe('POST /admin/actions/send-help-email', () => {
    it('should send help email to tenant', async () => {
      const response = await request(API_BASE)
        .post('/admin/actions/send-help-email')
        .set('x-admin-mode', 'true')
        .send({ tenantId: '1', message: 'Need help?' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /admin/actions/broadcast', () => {
    it('should send broadcast message', async () => {
      const response = await request(API_BASE)
        .post('/admin/actions/broadcast')
        .set('x-admin-mode', 'true')
        .send({ subject: 'Update', message: 'New features!' });
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /admin/activity-log', () => {
    it('should return admin activity log', async () => {
      const response = await request(API_BASE)
        .get('/admin/activity-log')
        .set('x-admin-mode', 'true');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
    });
  });
});
export {};
