# Tiger Claw Scout — Product Requirements Document

**Version:** 2.0.0  
**Date:** 2026-02-10  
**Status:** COMPLETE REWRITE  
**Author:** Agent Zero (for human review)  

---

## 1. EXECUTIVE SUMMARY

### 1.1 Product Vision
Tiger Claw Scout is an AI-powered prospecting assistant for network marketing distributors. Each paying customer receives their own dedicated Telegram bot that delivers qualified prospects daily with personalized approach scripts.

### 1.2 Target Users
- Network marketing distributors (primarily Nu Skin)
- Direct sales professionals
- MLM team builders
- Located primarily in Thailand/Southeast Asia

### 1.3 Business Model
- **Price:** $99/month per customer
- **Platform:** Stan Store checkout → Stripe billing
- **Delivery:** Telegram bot (per-customer dedicated bot)

### 1.4 Core Value Proposition
> "Wake up to 5 qualified prospects in your Telegram every morning, with personalized scripts ready to send."

---

## 2. PROBLEM STATEMENT

### 2.1 Current Pain Points
| Problem | Impact |
|---------|--------|
| Manual prospect research | 2+ hours/day wasted scrolling social media |
| Cold outreach without context | Low response rates (<5%) |
| No personalized scripts | Generic messages feel spammy |
| No tracking | Don't know what works |
| Language barriers | Thai prospects need Thai scripts |

### 2.2 Solution
Automated AI system that:
1. Finds prospects matching customer's ideal profile
2. Scores them by quality (only 70+ delivered)
3. Generates personalized approach scripts
4. Delivers to customer's Telegram daily
5. Learns from feedback (Hive Learning)

---

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Customer Onboarding Flow

```
STEP 1: Customer purchases on Stan Store ($99/mo)
    ↓
STEP 2: Stripe processes payment, creates subscription
    ↓
STEP 3: Stripe webhook triggers provisioning API
    ↓
STEP 4: System creates DEDICATED Telegram bot for customer
    ↓
STEP 5: Customer receives welcome email with bot link
    ↓
STEP 6: Customer opens Telegram, sends /start
    ↓
STEP 7: Bot greets customer, begins daily reports
```

### 3.2 Per-Customer Bot Architecture (CRITICAL)

**Each customer gets their own Telegram bot:**

| Customer | Bot Username | Bot Token |
|----------|--------------|----------|
| Nancy Lim | @TigerClaw_NancyL_bot | 7001234567:AAHx... |
| Chana L. | @TigerClaw_ChanaL_bot | 7009876543:BBYz... |
| Phaitoon S. | @TigerClaw_PhaitoonS_bot | 7005551234:CCWa... |

**Why per-customer bots:**
- **Isolation:** One customer's issues don't affect others
- **Branding:** Each bot appears personal to the customer
- **Security:** Tokens are compartmentalized
- **Scalability:** Can deploy/restart individual bots
- **Analytics:** Per-bot metrics are cleaner

### 3.3 Daily Report Delivery

**Trigger:** Cron job at 7:00 AM customer's timezone

**Content:**
```
🐯 Tiger Claw Daily Report
February 10, 2026

Found 5 qualified prospects today:

━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Somchai K. (Score: 85/100) 🔥
📍 LINE OpenChat: "Side Hustle Thailand"
💬 Signal: "ต้องการรายได้เสริม"
✨ Suggested approach:
"สวัสดีครับคุณสมชาย..."

[📝 Get Full Script]

━━━━━━━━━━━━━━━━━━━━━━━━━━━

... (4 more prospects) ...

📊 Your Pipeline: 23 total | 8 contacted
🎯 This week: 2 converted
```

### 3.4 Bot Commands

| Command | Function |
|---------|----------|
| /start | Initialize bot, save chat_id |
| /report | Get today's prospect report |
| /pipeline | View prospect pipeline |
| /script {name} | Get full approach script for prospect |
| /objection {text} | Get AI response for handling objection |
| /settings | Configure preferences |
| /help | List all commands |

### 3.5 Script Generation

**Input:** Prospect profile + customer context
**Output:** Personalized approach script in appropriate language

**Script Components:**
1. Opening message (personalized hook)
2. Value proposition (contextual to prospect's signals)
3. Call to action (soft ask)
4. Objection responses (anticipated)

### 3.6 Feedback & Hive Learning

**After each script:**
```
Did this script work?
[👎 No Response] [👍 Got Reply] [🎯 Converted]
```

**Feedback flow:**
1. Customer clicks feedback button
2. System records outcome
3. If successful, script pattern added to Hive
4. Future scripts learn from successful patterns

---

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance
| Metric | Target |
|--------|--------|
| Daily report delivery | Within 5 minutes of scheduled time |
| Script generation | < 3 seconds |
| Bot response time | < 2 seconds |
| API response time | < 500ms |

### 4.2 Reliability
| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Daily report delivery rate | 99% |
| Bot availability | 24/7 |

### 4.3 Security
- Bot tokens encrypted at rest (AES-256)
- API keys hashed (bcrypt)
- HTTPS everywhere
- Stripe webhook signature verification
- No customer data in logs

### 4.4 Scalability
| Scale | Architecture |
|-------|-------------|
| 1-50 customers | Single server, process-per-bot |
| 50-500 customers | Multiple servers, PM2 clustering |
| 500+ customers | Kubernetes with bot-per-pod |

---

## 5. USER STORIES

### 5.1 Customer Stories

**US-001: Purchase & Onboard**
> As a network marketer, I want to purchase Tiger Claw and have my personal bot ready within minutes so I can start prospecting immediately.

**Acceptance Criteria:**
- [ ] Purchase completes on Stan Store
- [ ] Dedicated bot created within 2 minutes
- [ ] Welcome email sent with bot link
- [ ] Bot responds to /start with personalized welcome

**US-002: Receive Daily Prospects**
> As a subscriber, I want to receive 5 qualified prospects every morning at 7 AM so I can start my outreach while having coffee.

**Acceptance Criteria:**
- [ ] Report delivered at 7 AM local time
- [ ] Contains 5 prospects with scores 70+
- [ ] Each prospect has brief approach suggestion
- [ ] Can tap to get full script

**US-003: Generate Approach Script**
> As a subscriber, I want personalized scripts for each prospect so I can send genuine-feeling messages that get responses.

**Acceptance Criteria:**
- [ ] Script references prospect's specific signals
- [ ] Script is in appropriate language (Thai/English)
- [ ] Includes objection handling
- [ ] One-tap copy to clipboard

**US-004: Track Results**
> As a subscriber, I want to track which scripts worked so I can improve my approach over time.

**Acceptance Criteria:**
- [ ] Can mark outcomes (no response/reply/converted)
- [ ] Pipeline shows all prospects by status
- [ ] Weekly summary shows conversion rate

### 5.2 Admin Stories

**US-010: Monitor Fleet**
> As an admin, I want to see all customer bots at a glance so I can ensure everyone is getting service.

**Acceptance Criteria:**
- [ ] Dashboard shows all bots with status
- [ ] Can see last report delivery time
- [ ] Alert if bot fails to deliver

**US-011: Provision Customer Manually**
> As an admin, I want to manually provision comped customers so I can give free access to strategic partners.

**Acceptance Criteria:**
- [ ] API endpoint accepts email + name
- [ ] Creates bot without Stripe subscription
- [ ] Marks as "comped" in system

---

## 6. OUT OF SCOPE (v1.0)

- Multi-platform (LINE, WhatsApp) — Telegram only for v1
- Admin dashboard UI — API only, dashboard in v1.5
- Prospect sourcing automation — Manual seed data for v1
- Team hierarchy/downline tracking
- CRM integrations
- Mobile app

---

## 7. SUCCESS METRICS

### 7.1 Business Metrics
| Metric | Target (90 days) |
|--------|------------------|
| Paying customers | 25 |
| MRR | $2,475 |
| Churn rate | < 10% |
| Customer satisfaction | > 4.5/5 |

### 7.2 Product Metrics
| Metric | Target |
|--------|--------|
| Daily report open rate | > 80% |
| Scripts generated per customer per week | > 15 |
| Feedback submission rate | > 30% |
| Reported conversions per customer per month | > 2 |

---

## 8. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Telegram bans bots | High | Rate limiting, no spam, appeal process |
| Bot token leak | High | Encryption, per-customer isolation |
| Stripe webhook fails | Medium | Retry logic, manual provision fallback |
| Customer confusion | Medium | Clear onboarding email, /help command |
| AI generates bad scripts | Medium | Human review option, feedback loop |

---

## 9. TIMELINE

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | 3 days | Core bot per customer + daily reports |
| Phase 2 | 3 days | Script generation + commands |
| Phase 3 | 2 days | Stripe provisioning + webhook |
| Phase 4 | 2 days | Testing + deploy 7 customers |
| **Total** | **10 days** | **v1.0 Production** |

---

## 10. APPENDICES

### 10.1 Glossary
| Term | Definition |
|------|------------|
| Prospect | Potential recruit identified by the system |
| Tenant | Paying customer with their own bot |
| Hive | Shared learning database of successful scripts |
| Signal | Indicator that prospect is interested (post, comment, keyword) |
| Pipeline | Customer's list of prospects by status |

### 10.2 Related Documents
- BLUEPRINT.md — Technical architecture
- FEATURES.md — Detailed feature specifications
- TYPES.ts — TypeScript type definitions
- API_SPEC.md — API endpoint documentation

