# Product Requirements Document (PRD)
**Project:** Tiger Bot Scout — Virtual Fleet Refactor
**Version:** 3.1.0 (The "Trash Can Cluster" Edition)
**Date:** 2026-02-10
**Status:** APPROVED FOR BUILD

## 1. EXECUTIVE SUMMARY
Tiger Bot Scout is a prospecting tool for network marketers. The current architecture (process-per-customer) is non-viable. We are refactoring to a **Hybrid Virtual Fleet**.
- **The Shift:** From "One Process per Customer" to "One Worker Cluster managing thousands of Bot Identities."
- **The Hardware:** We leverage a Cloud Gateway for reliability and a cluster of existing Mac Pro "Trash Cans" for heavy compute (AI/Scraping).

## 2. SYSTEM ACTORS
1.  **The Gateway (Cloud):** A lightweight, crash-proof Express server. It receives Webhooks from Telegram/Stripe and pushes them to a Redis Queue. It never executes business logic.
2.  **The Worker Cluster (Home):** Two Mac Pro "Trash Cans" running identical Node.js workers. They race to consume jobs from Redis, executing AI, Scraping, and Telegram responses.
3.  **The Provisioner (Userbot):** An automated script utilizing `gramjs` that programmatically speaks to @BotFather to create new bot tokens without human intervention.

## 3. USER STORIES
### US-01: High-Volume Ingress
*As a system,* I must handle the "Thundering Herd" at 7:00 AM (500+ simultaneous reports) without timing out webhooks.
*Solution:* Redis Queue buffering.

### US-02: Automated Onboarding
*As a new customer,* I must receive my dedicated bot link within 30 seconds of payment.
*Solution:* The Userbot automates the chat with BotFather.

### US-03: Failure Isolation
*As a business owner,* one customer getting banned must not affect others.
*Solution:* Each customer has a unique Bot Token, but they are all managed by the unified Fleet logic.

## 4. SUCCESS METRICS
- **Throughput:** Process 50 messages/second across the Trash Can cluster.
- **Uptime:** Gateway remains 100% available even if the Home Internet drops (webhooks queue up).
- **Enrichment:** 100% of new prospects are scraped and summarized using Mini-RAG logic.
