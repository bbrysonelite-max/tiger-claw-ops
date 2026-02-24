# Manus Agent Handoff Briefing — February 14, 2026

**From:** Manus Agent  
**To:** Claude Code Terminal, Birdie, Agent Zero  
**Date:** February 14, 2026  
**Subject:** Tiger Claw Brain Architecture — Decisions Made, Build Ready

---

## What Happened Today

Brent and I designed the complete Tiger Claw activation system from purchase to "Hello World." Six documents were produced, numbered 01-06 in this directory. All decisions below were made by Brent and are final.

---

## Key Decisions (Brent-Approved)

### 1. Build the Brain First
The 9 existing customers have brain-dead bots. All 9 have tapped /start and gotten silence. This happened live on a Zoom call. **Priority #1 is making the bots talk.** Infrastructure fixes (Redis, Supabase, automation chain) come after.

### 2. Two-Key Architecture
Every bot ships with two LLM connections:

| Key | Purpose | Provider | Who Pays |
|-----|---------|----------|----------|
| **Fallback** | Onboarding, error recovery | Google Gemini 2.0 Flash | Brent (~$0.002/customer) |
| **Primary** | Daily operations (prospecting, nurturing) | Customer's choice | Customer |

The fallback key is **permanent and hardwired**. It never gets removed. If the customer's key dies, the fallback wakes up to tell them what happened. **No more silent bots.**

### 3. 72-Hour Free Trial
New customers get 72 hours on Brent's Gemini key. Reminders at 48h and 64h. At 72h, the bot pauses operations and asks for `/setkey`. If the customer's key dies at any point after rotation, the fallback key activates for error handling only.

### 4. Product Scope Clarification
- **Tiger Claw customers** get: onboarding interviews, API key rotation, prospecting, nurturing, aftercare
- **Tiger Claw customers' clients** get: the flywheel (prospecting → nurture → conversion → retention)
- **Onboarding-as-a-service** for customers' clients is NOT in v1. It's a future add-on.

### 5. Gemini as Fallback Provider
Brent chose Gemini 2.0 Flash specifically because: cheapest option ($0.10/1M input tokens), generous free tier (15 RPM), reliable, and most customers already have Google accounts for easy key creation.

---

## Documents in This Directory

| File | What It Contains |
|------|-----------------|
| `01_flywheel_system.md` | Complete onboarding + flywheel design (interviews, 5-stage flywheel, nurture campaigns for 10 gig economy roles) |
| `02_activation_process.md` | Step-by-step: what happens from "Get Your Tiger Claw" button to first prospect list. Gap analysis vs. what actually exists. |
| `03_brain_spec.md` | **THE BUILD DOCUMENT.** State machine, interview questions, message templates, LLM prompts, /setkey handler, error recovery. Implementation-ready. |
| `04_brain_presentation_script.md` | 18-minute presentation script for pitching the brain spec to investors, agents, or customers. |
| `05_two_key_architecture.md` | **THE CODE.** Three TypeScript files (key-encryption.ts, key-validator.ts, key-manager.ts) with complete implementation, integration patterns, /setkey handler, trial timer cron, migration script for 9 existing customers. 8-hour build estimate. |
| `06_repo_state_assessment.md` | Honest assessment of what exists in the repo vs. what's missing. Written after reviewing all recent commits. |

---

## Build Order (For Whoever Picks This Up)

1. **Get a Gemini API key** and set `FALLBACK_GEMINI_KEY` in the gateway `.env`
2. **Generate `KEY_ENCRYPTION_SECRET`** — run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. **Build the three key files** from `05_two_key_architecture.md` — they are copy-paste ready
4. **Build the /start handler** from `03_brain_spec.md` — the welcome message is a fixed template, zero LLM cost
5. **Build Interview 1 and 2** from `03_brain_spec.md` — conversational, uses fallback Gemini key
6. **Run the migration script** to reset all 9 customers to IDLE state
7. **Test on Tiger_Brent_bot** first, then roll out to the other 8

---

## What This Does NOT Cover

- Prospecting engine (needs separate spec)
- Nurture campaign automation (designed but not coded)
- Redis → Upstash migration
- Supabase integration
- Stan Store webhook fix
- Dashboard real data integration
- Stan Store thumbnail typo fix

---

## The Zoom Incident

On a live sales presentation, Brent's Anthropic API key died mid-demo. The bot went silent in front of 9 potential customers. All 9 bought anyway. All 9 have brain-dead bots. The two-key architecture exists specifically so this never happens again. The fallback key ensures the bot always has a voice, even if it's just to say "I need help."
