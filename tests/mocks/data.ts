// Mock data for Tiger Claw Scout API tests

export const mockLeads = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'สมชาย ใจดี',
    source: 'telegram',
    channel: 'group_chat',
    status: 'new',
    ai_score: 92,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    telegram_id: '123456789',
    telegram_username: 'somchai_jaidee',
    profile_data: {
      interests: ['health', 'wellness'],
      language: 'th'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'มาลี สุขใจ',
    source: 'instagram',
    channel: 'dm',
    status: 'contacted',
    ai_score: 85,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    telegram_id: null,
    telegram_username: null,
    profile_data: {
      interests: ['beauty', 'skincare'],
      language: 'th'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'วิชัย มั่งมี',
    source: 'facebook',
    channel: 'comment',
    status: 'qualified',
    ai_score: 78,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    telegram_id: '987654321',
    telegram_username: 'wichai_m',
    profile_data: {
      interests: ['business', 'network marketing'],
      language: 'th'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'นภา ดวงดี',
    source: 'telegram',
    channel: 'private_chat',
    status: 'converted',
    ai_score: 95,
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date().toISOString(),
    telegram_id: '555666777',
    telegram_username: 'napa_d',
    profile_data: {
      interests: ['supplements', 'fitness'],
      language: 'th'
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'ประเสริฐ รุ่งเรือง',
    source: 'referral',
    channel: 'direct',
    status: 'lost',
    ai_score: 45,
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date().toISOString(),
    telegram_id: null,
    telegram_username: null,
    profile_data: {
      interests: [],
      language: 'th'
    }
  }
];

export const mockDashboardOverview = {
  todaysProspects: {
    count: 12,
    qualified: 5,
    trend: 'up',
    change: 15,
    topProspects: [
      { id: mockLeads[0].id, name: mockLeads[0].name, score: mockLeads[0].ai_score, source: mockLeads[0].source }
    ]
  },
  scriptPerformance: {
    total: 48,
    withFeedback: 32,
    successRate: 67,
    breakdown: {
      converted: 12,
      got_reply: 10,
      no_response: 10,
      pending: 16
    }
  },
  conversionFunnel: {
    stages: [
      { name: 'Leads', count: 150, rate: 100 },
      { name: 'Contacted', count: 95, rate: 63 },
      { name: 'Qualified', count: 45, rate: 47 },
      { name: 'Converted', count: 18, rate: 40 }
    ]
  },
  hivePulse: {
    totalLearnings: 234,
    topScript: {
      id: 'script-001',
      preview: 'สวัสดีค่ะ! เห็นว่าคุณสนใจเรื่องสุขภาพ...',
      successCount: 15
    },
    myContributions: 8
  }
};

export const mockAnalyticsFunnel = {
  period: '30d',
  stages: [
    { stage: 'new', count: 150, conversionRate: null },
    { stage: 'contacted', count: 95, conversionRate: 63.3 },
    { stage: 'qualified', count: 45, conversionRate: 47.4 },
    { stage: 'converted', count: 18, conversionRate: 40.0 }
  ],
  overallConversion: 12.0
};

export const mockAnalyticsTimeline = {
  period: '7d',
  data: [
    { date: '2026-02-03', leads: 8, scripts: 5, conversions: 1 },
    { date: '2026-02-04', leads: 12, scripts: 8, conversions: 2 },
    { date: '2026-02-05', leads: 6, scripts: 4, conversions: 0 },
    { date: '2026-02-06', leads: 15, scripts: 10, conversions: 3 },
    { date: '2026-02-07', leads: 9, scripts: 6, conversions: 1 },
    { date: '2026-02-08', leads: 11, scripts: 7, conversions: 2 },
    { date: '2026-02-09', leads: 7, scripts: 5, conversions: 1 }
  ]
};

export const mockSettings = {
  tenant_id: 'tenant-001',
  bot_name: 'Tiger Claw Scout',
  default_language: 'th',
  timezone: 'Asia/Bangkok',
  notifications: {
    new_lead: true,
    high_score_lead: true,
    daily_digest: true,
    weekly_report: false
  },
  scoring: {
    min_score_threshold: 60,
    auto_qualify_score: 85
  },
  sources: {
    telegram: true,
    instagram: true,
    facebook: true,
    referral: true
  }
};

export const mockIntegrations = {
  telegram: { connected: true, status: 'active', lastSync: new Date().toISOString() },
  apollo: { connected: false, status: 'not_configured', lastSync: null },
  brevo: { connected: true, status: 'active', lastSync: new Date().toISOString() },
  twilio: { connected: false, status: 'error', lastSync: null, error: 'Invalid credentials' },
  calendly: { connected: true, status: 'active', lastSync: new Date().toISOString() }
};

export const mockHiveLeaderboard = {
  leaderboard: [
    {
      id: 'script-001',
      script_text: 'สวัสดีค่ะ! เห็นว่าคุณสนใจเรื่องสุขภาพและความงาม อยากแนะนำผลิตภัณฑ์ที่จะช่วยให้คุณดูดีและรู้สึกดีขึ้นค่ะ',
      success_count: 15,
      source: 'telegram',
      lead_type: 'health_interested',
      created_at: new Date(Date.now() - 604800000).toISOString()
    },
    {
      id: 'script-002',
      script_text: 'คุณเคยลองอาหารเสริมที่ช่วยเพิ่มพลังงานและความกระปรี้กระเปร่าไหมคะ? มีตัวเลือกดีๆ อยากแนะนำค่ะ',
      success_count: 12,
      source: 'instagram',
      lead_type: 'energy_boost',
      created_at: new Date(Date.now() - 432000000).toISOString()
    },
    {
      id: 'script-003',
      script_text: 'สวัสดีครับ! ผมเห็นว่าคุณสนใจธุรกิจออนไลน์ มีโอกาสดีๆ อยากนำเสนอครับ',
      success_count: 10,
      source: 'facebook',
      lead_type: 'business_opportunity',
      created_at: new Date(Date.now() - 259200000).toISOString()
    }
  ],
  total: 3
};

export const mockScriptFeedbackStats = {
  total_scripts: 48,
  with_feedback: 32,
  conversion_rate: 37.5,
  by_feedback: {
    converted: 12,
    got_reply: 10,
    no_response: 10
  }
};

export const mockLeadStats = {
  total: 150,
  this_week: 35,
  avg_score: 72.5,
  by_status: {
    new: 45,
    contacted: 50,
    qualified: 30,
    converted: 18,
    lost: 7
  }
};

export const mockLeadActivities = [
  {
    id: 'activity-001',
    lead_id: mockLeads[0].id,
    activity_type: 'script_generated',
    description: 'Generated outreach script',
    created_at: new Date().toISOString()
  },
  {
    id: 'activity-002',
    lead_id: mockLeads[0].id,
    activity_type: 'status_change',
    description: 'Status changed from new to contacted',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

export const mockLeadNotes = [
  {
    id: 'note-001',
    lead_id: mockLeads[0].id,
    content: 'Very interested in weight management products',
    created_at: new Date().toISOString()
  }
];

export const mockLeadScripts = [
  {
    id: 'gen-script-001',
    lead_id: mockLeads[0].id,
    script_text: 'สวัสดีค่ะคุณสมชาย! เห็นว่าคุณสนใจเรื่องสุขภาพ...',
    feedback: 'got_reply',
    created_at: new Date().toISOString()
  }
];
