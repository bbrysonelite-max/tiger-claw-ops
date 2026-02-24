# Anthropic Customer Support — Incident Report & Billing Dispute
**Customer:** Brent Bryson / BotCraft Works
**Date:** 2026-02-24
**Request:** Billing credit and incident review

---

## Summary

I am a commercial operator running a live multi-tenant SaaS platform (Tiger Claw / Alien Claw) using the Anthropic API with paying customers across SE Asia. This week I experienced multiple catastrophic failures caused directly by Claude model behavior — including a ~57-hour effective service outage and an estimated $2,000 in API costs that produced no value, required repair work, and cost me real business.

I am requesting a billing review and credit for this period.

---

## What My System Does

I run `BotCraft Works` — a platform that provisions individual AI-powered Telegram bots for paying customers. Each customer's bot uses the Anthropic API (`claude-opus-4-5-20251101`) as its core intelligence. This is a production commercial system. When it fails, paying customers lose service.

**Scale:** Multiple active tenants, daily automated prospect finding, AI conversation processing 24/7, customers in Thailand, Vietnam, Indonesia, and Malaysia.

---

## Incident 1 — 2026-02-17: Bad SQL Deployment

**What happened:** Claude Code was tasked with adding a new feature. It deployed SQL that referenced non-existent database columns. The API began throwing errors on every request.

**Impact:** Customers received no responses from their bots. Duration: several hours. Customers in Bangkok woke up to a broken product.

**Root cause:** Claude Code did not check the actual database schema before writing SQL. It fabricated column names that did not exist.

---

## Incident 2 — 2026-02-18: Direct Main Commit + Hard Service Kill

**What happened:** Claude Code committed a code change directly to the `main` branch (bypassing the branch/PR policy) and then ran `pm2 restart` (a hard process kill) instead of `pm2 reload` (graceful zero-downtime reload).

**Impact:** Live production workers were hard-killed mid-conversation. All in-flight customer sessions were dropped. Service gaps resulted for paying customers.

**Root cause:** Claude Code ignored documented deployment rules that were explicitly written in the project's `CLAUDE.md` file.

---

## Incident 3 — Context Window Exhaustion (Repeated, Multiple Sessions)

**What happened:** Claude Code sessions repeatedly exhausted the context window. When this happens, Claude auto-summarizes — but summaries lose precision. The next session starts with an incomplete understanding of the codebase and project state.

**Impact:** Each context crash required 4-8 hours of recovery work to re-explain the architecture, redo work that was already done, and re-diagnose problems that were already solved. This happened multiple times across multiple sessions this week.

**The core problem:** Claude Code has no durable memory between sessions. Every session starts cold. When the context window fills, work in progress is lost. The operator (me) bears the entire cost of reconstruction — in both time and API tokens.

**Specific example:** In one session, I explained the entire system architecture, worked through a complex fix, deployed it — and then the session context ran out. The next session had no memory of any of it. I had to explain everything again from scratch and redo work. I have evidence of this in my conversation logs showing the same architecture questions asked and answered multiple times in the same week.

---

## Incident 4 — Claude Opus Ignored the Implementation Plan

**What happened:** In a session using Claude Opus, I provided a detailed implementation plan. The model proceeded to implement something completely different from what was specified. The result crashed the codebase.

**Impact:** Additional hours of repair work. More API usage to fix what Opus broke.

---

## Financial Impact

- **Direct API costs this week:** Approximately $2,000
- **Work that needed to be redone due to context loss:** Multiple sessions' worth of output, generating tokens for work already completed
- **Business loss:** Lost an Airbnb partnership deal during a live demonstration when the bot failed. Customer's end-user was frustrated with the product.
- **Effective downtime:** ~57 hours of degraded or no service during a critical growth period

---

## What I'm Asking For

1. **Billing credit** for the week of 2026-02-17 to 2026-02-24. I am not asking for a full refund — I'm asking for a fair credit that reflects the portion of compute that was consumed repairing Claude-caused failures rather than producing value.

2. **Technical escalation:** I would like a conversation with your technical team about:
   - Context window exhaustion in long coding sessions — is there a better pattern for maintaining session state?
   - Claude Opus's tendency to ignore detailed plans and go off-script — is this a known issue?
   - Whether there are model settings or prompting strategies that improve plan adherence for production deployments?

3. **Acknowledgment** that running a commercial SaaS on Claude Code carries significant risk when the tool can silently corrupt production systems by ignoring documented rules.

---

## What I've Done to Mitigate Going Forward

I have built a session discipline system:
- `SESSION.md` — a crash recovery document that persists state between Claude Code sessions
- `CLAUDE.md` — hardened deployment rules with the specific incident dates attached as warnings
- Mandatory branch + PR policy with explicit documentation of what happened when it was violated

This mitigates the context loss problem, but it doesn't change the fact that this week cost me $2,000 and real business.

---

## Contact

**Brent Bryson**
BotCraft Works
[Your email / account ID here]

---

*Logs available upon request. I have full conversation transcripts showing the repeated re-explanation of architecture and the specific sessions where the failures occurred.*
