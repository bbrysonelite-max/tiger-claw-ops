# Feature Specifications

## F-01: Virtual Fleet Routing
**Description:** Decouples the Webhook Listener from the Bot Logic using a hash map.
**Logic Flow:**
1.  **Ingress:** Cloud Gateway receives `POST /webhooks/:token_hash`.
2.  **Queue:** Gateway pushes `{ hash: req.params.token_hash, update: req.body }` to Redis `inbound` queue.
3.  **Routing:** 
    - Worker pulls job.
    - Queries DB: `SELECT botToken FROM Tenant WHERE botTokenHash = job.hash`.
    - Decrypts Token.
    - Instantiates `const bot = new TelegramBot(token, { polling: false });`.
    - Passes `update` to existing command handlers.

## F-02: Automated Provisioning (The Userbot)
**Description:** Automates bot creation via BotFather using `gramjs`.
**Logic Flow:**
1.  **Trigger:** Stripe Webhook `subscription.created`.
2.  **Action:** Worker loads `TELEGRAM_SESSION_STRING` (MTProto Session) from env.
3.  **Interaction:** 
    - Worker sends `/newbot` to `@BotFather`.
    - Worker sends Name: `Tiger Claw - {CustomerName}`.
    - Worker sends User: `Tiger_{RandomID}_bot`.
    - Worker parses the returned Token using Regex.
4.  **Storage:** Encrypts Token, generates Hash, saves to DB.
5.  **Webhook:** Worker calls `setWebhook` on the new token pointing to Cloud Gateway.

## F-03: Prospect Enrichment (Mini-RAG Harvest)
**Description:** Port the logic from the existing "Mini-RAG" repo to scrape and summarize prospects.
**Logic Flow:**
1.  **Trigger:** Prospect added manually or via list import.
2.  **Scrape:** Puppeteer (on Trash Can) searches Google for `"{Name}" "Nu Skin" OR "MLM"`.
3.  **Chunking:** Use the `chunking_strategy` from Mini-RAG repo to split text.
4.  **Vectorize:** Generate embeddings for chunks.
5.  **Summary:** Use LLM to generate a 3-sentence summary of the prospect's likely needs.

## F-04: Hive Learning
**Description:** Semantic search for successful sales scripts.
**Logic Flow:**
1.  **Input:** User asks "How do I approach a stressed mom?"
2.  **Vector:** Embed the query ("stressed mom").
3.  **Search:** Query `HivePattern` table using `pgvector` for nearest neighbors.
4.  **Output:** Return scripts that worked for similar profiles.

## F-05: Failsafe Feedback Loop (Report to HQ)
**Description:** Escalation system allowing users to report issues directly to headquarters.
**Priority:** CRITICAL
**Status:** NEW - Added 2026-02-11

**Trigger Phrases:**
- "Report to HQ"
- "Report this to headquarters"
- "I need help"
- "Contact support"
- "Talk to a human"

**Logic Flow:**
1.  **Detection:** Bot detects escalation trigger phrase in user message.
2.  **Acknowledgment:** Bot responds: "I'm escalating this to our support team. They'll contact you within 24 hours."
3.  **Capture:** System captures:
    - Customer ID (Tenant)
    - Full conversation history (last 10 messages)
    - User's stated issue
    - Timestamp
4.  **Notification:** System sends alert via:
    - **Email:** support@botcraftwrks.ai (via Brevo)
    - **Telegram:** Alert to admin bot (@TigerClawHQ_bot)
    - **Dashboard:** Creates support ticket in admin panel
5.  **Logging:** All escalations stored in `SupportTicket` table for tracking.

**Support Contact Information (User-Facing):**
- **Hotline:** +1-801-369-5488
- **Email:** support@botcraftwrks.ai
- **Help Documentation:** https://help.botcraftwrks.ai

**Database Model:**
```prisma
model SupportTicket {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  issue           String   // User's stated problem
  conversationLog String   // JSON array of last 10 messages
  status          String   @default("open") // 'open', 'in_progress', 'resolved'
  priority        String   @default("normal") // 'low', 'normal', 'high', 'urgent'
  createdAt       DateTime @default(now())
  resolvedAt      DateTime?
  resolvedBy      String?  // Admin who resolved
}
```

## F-06: OpenClaw Update Tracking
**Description:** Mechanism to track and apply OpenClaw/Birdie updates automatically.
**Priority:** CRITICAL
**Status:** NEW - Added 2026-02-11

**Components:**
1.  **Version Checker:** Cron job (hourly) that checks npm registry for OpenClaw updates.
2.  **Update Notification:** Alerts admin when new version available.
3.  **One-Click Update:** Existing birdie-control.ts endpoints enable remote updates.

**Logic Flow:**
1.  **Check:** Worker runs `npm view openclaw version` hourly.
2.  **Compare:** Compare against installed version.
3.  **Alert:** If newer version exists:
    - Send notification to admin dashboard
    - Log to `SystemUpdate` table
4.  **Apply:** Admin triggers update via:
    - `POST /birdie/update` endpoint
    - Dashboard UI button
5.  **Verify:** After update, run health check to confirm Birdie is operational.

**Existing Endpoints (from birdie-control.ts):**
- `POST /birdie/update` - Stops Birdie, runs `npm update -g openclaw`, restarts
- `POST /birdie/restart` - Restarts gateway
- `GET /birdie/status` - Shows version and online status
- `GET /birdie/logs` - View recent logs

**Database Model:**
```prisma
model SystemUpdate {
  id              String   @id @default(uuid())
  component       String   // 'openclaw', 'gateway', 'worker'
  fromVersion     String
  toVersion       String
  status          String   // 'available', 'installing', 'completed', 'failed'
  triggeredBy     String?  // Admin who triggered update
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  errorLog        String?  // If failed, capture error
}
```

**Automation Rule:**
- MINOR updates (1.2.x → 1.2.y): Auto-apply during low-traffic hours (2-4 AM local)
- MAJOR updates (1.x → 2.x): Require admin approval
