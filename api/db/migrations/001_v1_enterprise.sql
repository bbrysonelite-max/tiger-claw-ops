-- Tiger Bot Scout v1.0.0 "Command Center" Migration
-- Enterprise multi-tenant database schema
-- Run: psql $DATABASE_URL -f 001_v1_enterprise.sql

-- ==================== TENANTS ====================
-- Each paying customer is a tenant

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,

    -- Subscription
    plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('scout', 'coach', 'closer', 'scout_free', 'trial')),
    status TEXT NOT NULL DEFAULT 'pending_setup' CHECK (status IN ('lead', 'trial', 'pending_setup', 'active', 'paused', 'cancelled', 'churned')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,

    -- Bot Connection
    telegram_chat_id TEXT,
    telegram_username TEXT,
    line_user_id TEXT,

    -- Preferences
    language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'th', 'es')),
    timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    daily_report_time TEXT DEFAULT '07:00',

    -- Metrics (denormalized for fast reads)
    prospects_found INTEGER DEFAULT 0,
    scripts_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe ON tenants(stripe_customer_id);

-- ==================== BOTS ====================
-- Each tenant has one or more bots

CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Identity
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'scout' CHECK (type IN ('scout', 'assistant', 'discovery', 'support')),
    description TEXT,
    avatar_url TEXT,

    -- Platform
    platform TEXT NOT NULL CHECK (platform IN ('telegram', 'line', 'docker', 'whatsapp', 'messenger')),
    platform_id TEXT,
    platform_token TEXT, -- Encrypted at rest
    platform_webhook_url TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'starting', 'stopping', 'maintenance')),
    last_ping_at TIMESTAMP WITH TIME ZONE,
    last_error_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    -- Configuration
    config JSONB DEFAULT '{}',
    features TEXT[] DEFAULT ARRAY['daily_report', 'script_generation'],

    -- Metrics (denormalized)
    messages_today INTEGER DEFAULT 0,
    messages_total INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    uptime NUMERIC(5,2) DEFAULT 0.00,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    stopped_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_bots_tenant ON bots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
CREATE INDEX IF NOT EXISTS idx_bots_platform ON bots(platform);

-- ==================== SCRIPT LIBRARY ====================
-- Curated scripts with translations (Max Steingart methodology)

CREATE TABLE IF NOT EXISTS script_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- null = global library

    -- Content
    category TEXT NOT NULL CHECK (category IN ('opening', 'qualifying', 'transition', 'objection', 'follow_up', 'closing')),
    name TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_th TEXT,
    content_es TEXT,

    -- Metadata
    source TEXT DEFAULT 'Custom', -- "Max Steingart", "Hive Learning", "Custom"
    author TEXT,
    context TEXT, -- "Facebook Group", "LinkedIn", "Cold DM"
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Performance
    usage_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    conversion_rate NUMERIC(5,2) DEFAULT 0.00,
    reply_rate NUMERIC(5,2) DEFAULT 0.00,

    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'pending_review')),
    featured BOOLEAN DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_scripts_tenant ON script_library(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scripts_category ON script_library(category);
CREATE INDEX IF NOT EXISTS idx_scripts_source ON script_library(source);
CREATE INDEX IF NOT EXISTS idx_scripts_featured ON script_library(featured) WHERE featured = TRUE;

-- ==================== MESSAGES ====================
-- Conversation history (all channels)

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Channel
    channel TEXT NOT NULL CHECK (channel IN ('telegram', 'line', 'email', 'sms', 'whatsapp', 'messenger')),
    channel_id TEXT, -- External ID on the platform

    -- Contact
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contact_avatar_url TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'snoozed')),
    unread_count INTEGER DEFAULT 0,

    -- Timestamps
    last_message_at TIMESTAMP WITH TIME ZONE,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Direction
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),

    -- Content
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'script', 'template', 'system')),

    -- Sender
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'contact', 'system')),
    sender_id TEXT,

    -- Status
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ==================== PROSPECTS ====================
-- Extend existing leads table with tenant isolation

-- First, add tenant_id to leads if missing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);

-- ==================== AUDIT LOG ====================
-- Track all changes for compliance

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ==================== SEED DATA ====================
-- Insert your 7 customers

INSERT INTO tenants (name, slug, email, plan, status, language, timezone) VALUES
('Nancy Lim', 'nancy-lim', 'nancylimsk@gmail.com', 'scout', 'active', 'th', 'Asia/Bangkok'),
('Chana Lohasaptawee', 'chana-loh', 'chana.loh@gmail.com', 'scout', 'active', 'th', 'Asia/Bangkok'),
('Phaitoon S.', 'phaitoon-s', 'phaitoon2010@gmail.com', 'scout', 'active', 'th', 'Asia/Bangkok'),
('Tarida Sukavanich', 'tarida-dew', 'taridadew@gmail.com', 'scout', 'active', 'th', 'Asia/Bangkok'),
('Lily Vergara', 'lily-vergara', 'lily.vergara@gmail.com', 'scout', 'active', 'es', 'America/Los_Angeles'),
('Theera Phetmalaigul', 'theera-p', 'phetmalaigul@gmail.com', 'scout', 'active', 'th', 'Asia/Bangkok'),
('John & Noon', 'john-noon', 'vijohn@hotmail.com', 'scout', 'active', 'en', 'Asia/Bangkok')
ON CONFLICT (email) DO NOTHING;

-- Insert Max Steingart scripts (global library, tenant_id = NULL)
INSERT INTO script_library (tenant_id, category, name, content_en, content_th, source, context) VALUES
(NULL, 'opening', 'Curiosity Opener',
 'Hey! I noticed we''re in the same group. What got you interested in [topic]?',
 'สวัสดีค่ะ! เห็นว่าเราอยู่กลุ่มเดียวกัน สนใจเรื่อง [topic] ด้วยเหรอคะ?',
 'Max Steingart', 'Facebook Group'),

(NULL, 'opening', 'Compliment Opener',
 'Hey! I''ve been seeing your posts and love your energy. How long have you been into [interest]?',
 'สวัสดีค่ะ! ติดตามโพสต์มาสักพัก ชอบความคิดเห็นของคุณมากค่ะ ทำเรื่อง [interest] มานานแค่ไหนแล้วคะ?',
 'Max Steingart', 'Facebook/LinkedIn'),

(NULL, 'opening', 'Value-First Opener',
 'Hey! Saw your question about [topic]. I actually have some experience with that — happy to share if you''d like!',
 'สวัสดีค่ะ! เห็นคำถามเรื่อง [topic] พอดีมีประสบการณ์เรื่องนี้ ถ้าสนใจแชร์ได้นะคะ!',
 'Max Steingart', 'Any'),

(NULL, 'qualifying', 'The Job Question',
 'So what do you do for work? How''s that going for you?',
 'ตอนนี้ทำงานอะไรอยู่คะ? เป็นยังไงบ้าง?',
 'Max Steingart', 'After opening'),

(NULL, 'qualifying', 'The Dream Question',
 'If you could do anything and money wasn''t an issue, what would you be doing?',
 'ถ้าไม่ต้องกังวลเรื่องเงิน อยากทำอะไรมากที่สุดคะ?',
 'Max Steingart', 'Deep qualifying'),

(NULL, 'qualifying', 'The Open Question',
 'Are you open to looking at other ways to make money, or are you totally happy with what you''re doing?',
 'เปิดรับโอกาสใหม่ๆ ในการหารายได้เสริมไหมคะ หรือตอนนี้โอเคกับงานที่ทำอยู่?',
 'Max Steingart', 'Key qualifying question'),

(NULL, 'transition', 'The Soft Intro',
 'You know, based on what you just told me, I might have something that could help. Would you be open to taking a look?',
 'จากที่คุยกันมา คิดว่ามีอะไรที่น่าจะช่วยคุณได้นะคะ สนใจดูข้อมูลไหมคะ?',
 'Max Steingart', 'After qualifying'),

(NULL, 'transition', 'The No-Pressure Intro',
 'I''m not sure if it would be a fit for you, but I work with a company in the wellness space. Would you be open to hearing about it?',
 'ไม่แน่ใจว่าจะตรงกับที่มองหาไหม แต่ทำธุรกิจด้านสุขภาพอยู่ค่ะ สนใจฟังข้อมูลไหมคะ?',
 'Max Steingart', 'Soft transition'),

(NULL, 'objection', 'No Time',
 'I totally get it — I felt the same way. What if I told you it only takes 30 minutes a day to get started? Would that be doable?',
 'เข้าใจเลยค่ะ ตอนแรกก็คิดแบบนั้น แต่ถ้าบอกว่าใช้เวลาแค่วันละ 30 นาที ลองได้ไหมคะ?',
 'Max Steingart', 'Time objection'),

(NULL, 'objection', 'No Money',
 'I hear you. The good news is, most people make back their starter cost within the first week. Would it help if I showed you how?',
 'เข้าใจค่ะ ข่าวดีคือคนส่วนใหญ่คืนทุนได้ภายในสัปดาห์แรก ถ้าอธิบายวิธีให้ฟัง สนใจไหมคะ?',
 'Max Steingart', 'Money objection'),

(NULL, 'objection', 'Is This MLM',
 'Great question! Yes, it''s network marketing. The difference is how we do it — no pushy tactics, just sharing products we love. Most of my sales come from social media, not chasing friends.',
 'คำถามดีค่ะ! ใช่ค่ะ เป็นธุรกิจเครือข่าย แต่วิธีทำต่างจากที่เคยเห็น ไม่มีการไล่ล่าเพื่อน ส่วนใหญ่หาลูกค้าจากโซเชียลค่ะ',
 'Max Steingart', 'MLM objection'),

(NULL, 'objection', 'I Need To Think',
 'Of course! What specifically do you want to think about? Maybe I can help clarify.',
 'ได้เลยค่ะ! มีอะไรที่อยากให้อธิบายเพิ่มไหมคะ? อาจช่วยให้ตัดสินใจง่ายขึ้น',
 'Max Steingart', 'Stalling objection'),

(NULL, 'follow_up', 'The Check-In',
 'Hey! Just checking in. Did you get a chance to look at that info I sent?',
 'สวัสดีค่ะ! แวะมาทักทาย ได้ดูข้อมูลที่ส่งไปแล้วยังคะ?',
 'Max Steingart', 'After sending info'),

(NULL, 'follow_up', 'The Value Add',
 'Hey! Thought of you when I saw this article about [topic]. Hope you''re doing well!',
 'สวัสดีค่ะ! เห็นบทความนี้แล้วนึกถึงเลย [topic] หวังว่าสบายดีนะคะ!',
 'Max Steingart', 'Soft follow-up'),

(NULL, 'follow_up', 'The Direct Ask',
 'Hey! I know you said you''d think about it. Any questions I can answer to help you decide?',
 'สวัสดีค่ะ! รู้ว่าบอกจะคิดดู มีคำถามอะไรที่ช่วยตอบได้ไหมคะ?',
 'Max Steingart', 'After waiting'),

(NULL, 'closing', 'The Enrollment Close',
 'So what do you think? Ready to get started? I''ll be with you every step of the way.',
 'เป็นยังไงบ้างคะ? พร้อมเริ่มต้นไหม? ดิฉันจะคอยช่วยเหลือทุกขั้นตอนค่ะ',
 'Max Steingart', 'Final close')
ON CONFLICT DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bots_updated_at ON bots;
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_script_library_updated_at ON script_library;
CREATE TRIGGER update_script_library_updated_at BEFORE UPDATE ON script_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
