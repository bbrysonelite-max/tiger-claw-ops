# Birdie Briefing: Stan Store Integration Verification
## Date: 2026-02-12
## Priority: HIGH

## Context
Babysitter Brent needs zero-touch automation from Stan Store purchase to bot delivery.

## Current Setup
- Stripe webhook endpoint: https://api.botcraftwrks.ai/stripe/webhook
- Webhook ID: we_1SzVPy0Fp3hGvMoUr8d4WKDz
- Events: checkout.session.completed
- Gateway running on cloud server 208.113.131.83

## Your Tasks

### Task 1: Verify Stripe Webhook Configuration
1. Log into Stripe Dashboard
2. Go to Developers → Webhooks
3. Confirm endpoint URL is https://api.botcraftwrks.ai/stripe/webhook
4. Confirm checkout.session.completed event is enabled
5. Check webhook secret matches: whsec_ltPbywi7uiGkud1i8rHBJWsYjGDIMej1

### Task 2: Test Webhook Flow
1. Use Stripe CLI or Dashboard to send a test webhook
2. Check gateway logs on 208.113.131.83 for incoming requests
3. Verify provision job gets queued in Redis
4. Confirm bot creation triggers

### Task 3: Stan Store Configuration Check
1. Log into Stan Store admin
2. Verify Stripe is connected as payment processor
3. Check if custom webhook URLs can be configured
4. Document the purchase → payment → webhook flow

## Expected Flow
```
Customer buys on Stan Store
    ↓
Stripe processes payment
    ↓
Stripe sends checkout.session.completed
    ↓
Gateway receives at /stripe/webhook
    ↓
Provision job queued to Redis
    ↓
Worker creates bot via BotFather
    ↓
Bravo sends welcome email with bot link
    ↓
Customer clicks link, taps START
    ↓
Bot welcomes customer
```

## Report Back
Please report:
1. Is Stripe webhook receiving test events?
2. Are provision jobs being created?
3. Any Stan Store configuration needed?
4. Blockers or issues found?

## Credentials Location
- Stripe credentials in cloud server .env
- Stan Store login with Brent
