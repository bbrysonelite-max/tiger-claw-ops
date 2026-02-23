# Tiger Claw Flywheel — Technical Requirements

**Version:** 1.0  
**Date:** 2026-02-23  
**Author:** Manus AI  
**Status:** Proposed

## 1. Overview

This document outlines the technical requirements for implementing the automated lead flywheel in the Tiger Claw platform. The current system has a basic `leads` table and a hardcoded funnel visualization, but lacks the core automation logic to move prospects through the pipeline. This implementation will close that gap by introducing a state machine, a sequence engine, a scoring model, and the necessary database schema changes.

## 2. Core Components

The flywheel will be composed of three primary components:

1.  **The State Machine:** A robust engine that manages a lead's journey through the flywheel stages.
2.  **The Sequence Engine:** A time-based automation engine that executes multi-touch nurture campaigns.
3.  **The Scoring Engine:** A dynamic model that scores leads based on their profile and engagement.

## 3. Database Schema Modifications

The existing PostgreSQL schema must be extended to support the flywheel logic. All changes will be implemented via a new SQL migration file.

### 3.1. `leads` Table Enhancements

The `status` column in the `leads` table will be converted to an `ENUM` type to enforce valid states and a new `flywheel_stage` column will be added.

```sql
-- Create the ENUM type for flywheel stages
CREATE TYPE flywheel_stage AS ENUM (
    'discovery',       -- Lead identified, not yet contacted
    'contacted',       -- First contact made
    'nurturing',       -- Engaged in an automated sequence
    'qualified',       -- Met ICP criteria, ready for direct ask
    'converted',       -- Took the desired action (booked, purchased)
    'retained',        -- Post-conversion, in retention sequence
    'archived',        -- Inactive, do not contact
    'disqualified'     -- Does not meet ICP
);

-- Add the new column to the leads table
ALTER TABLE leads ADD COLUMN flywheel_stage flywheel_stage NOT NULL DEFAULT 'discovery';

-- Add other necessary columns
ALTER TABLE leads ADD COLUMN lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN current_sequence_id UUID;
ALTER TABLE leads ADD COLUMN current_sequence_step INTEGER;
ALTER TABLE leads ADD COLUMN next_touch_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'granted', 'denied'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_flywheel_stage ON leads(flywheel_stage);
CREATE INDEX IF NOT EXISTS idx_leads_next_touch_at ON leads(next_touch_at);
```

### 3.2. New Table: `nurture_sequences`

This table will store the templates for multi-touch campaigns.

```sql
CREATE TABLE IF NOT EXISTS nurture_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    flavor TEXT, -- e.g., 'network-marketing', 'real-estate'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3. New Table: `sequence_steps`

This table will store the individual steps within each nurture sequence.

```sql
CREATE TABLE IF NOT EXISTS sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES nurture_sequences(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_minutes INTEGER NOT NULL, -- Delay from previous step
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'linkedin_dm', 'line_push')),
    template_id UUID REFERENCES script_library(id),
    action_type TEXT, -- e.g., 'send_message', 'check_engagement'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 4. The Flywheel Engine (State Machine)

The core of the automation will be a new TypeScript module (`flywheel.ts`) that runs as a persistent worker. It will use a cron-based scheduler to periodically query the database for leads that require action.

### 4.1. Main Loop

The worker will execute the following logic every 60 seconds:

1.  Fetch all leads where `next_touch_at <= NOW()`.
2.  For each lead, execute the action defined by its `current_sequence_step`.
3.  Update the lead's `flywheel_stage`, `lead_score`, and `next_touch_at` based on the outcome.

### 4.2. Stage Transition Logic

Transitions between flywheel stages will be governed by a set of hardcoded rules, which will be exposed via a new API endpoint for future customization.

| From Stage | To Stage | Trigger Event |
| :--- | :--- | :--- |
| `discovery` | `contacted` | First message sent successfully. |
| `contacted` | `nurturing` | Positive reply received (classified by `response_classifier` skill). |
| `contacted` | `disqualified` | Negative reply received (e.g., "not interested"). |
| `nurturing` | `qualified` | Lead score exceeds `qualification_threshold` (e.g., 75). |
| `nurturing` | `archived` | No engagement after `max_nurture_touches` (e.g., 5 touches). |
| `qualified` | `converted` | Conversion event received (e.g., webhook from Calendly, Stripe). |
| `qualified` | `nurturing` | "No" to direct ask, but not a hard rejection. |
| `converted` | `retained` | Onboarding sequence initiated. |
| `retained` | `archived` | Customer churns. |

## 5. The Sequence Engine

The sequence engine will be responsible for executing the steps defined in the `sequence_steps` table.

### 5.1. Channel Routing

The engine will use a channel router to dispatch messages through the appropriate integration or OpenClaw skill.

-   **Email:** Use `integrations/brevo/send` endpoint.
-   **SMS:** Use `integrations/twilio/send` endpoint.
-   **LINE:** Use `/line/push` endpoint.
-   **LinkedIn DM:** Use `10madh/linkedin-dm` OpenClaw skill.

### 5.2. Compliance Gates

Before sending any message, the engine **must** verify the lead's consent status, especially for regions with strict privacy laws like Thailand (PDPA).

-   **Rule:** Do not send any communication if `consent_status` is not `'granted'`.
-   **Action:** The first touch of any sequence must be a consent-gathering message if the status is `'pending'`.

## 6. The Scoring Engine

The `lead_score` will be updated based on specific events. This logic will reside in a new `scoring.ts` module.

| Event | Score Change |
| :--- | :--- |
| Positive reply received | +20 |
| Email opened | +5 |
| Link clicked | +10 |
| Value content viewed | +15 |
| Booked a meeting | +50 |
| Negative reply received | -10 |
| Unsubscribed | -50 |

## 7. API Endpoint Modifications

Existing API endpoints will be updated, and new ones will be created to manage the flywheel.

-   **`PATCH /ai-crm/leads/:id`:** This endpoint will be modified to trigger a flywheel state evaluation whenever the `status` or `notes` are updated manually.
-   **`POST /flywheel/sequences`:** Create a new nurture sequence.
-   **`GET /flywheel/sequences`:** List all available sequences.
-   **`POST /flywheel/leads/:id/start-sequence`:** Manually assign a lead to a specific nurture sequence.

## 8. OpenClaw Skill Integration

The flywheel will leverage the `tiger-capabilities` skill to discover and invoke the necessary OpenClaw skills for its operations.

-   **Discovery:** `aspenas/linkedin-scraper`, `alexandr-belogubov/hotmention`
-   **Outreach:** `10madh/linkedin-dm`, `dotcom-squad/telnyx-cli`
-   **Nurturing:** `aspenas/ironclaw-outreach-sequencer`
-   **Conversion:** `dheerg/ai-meeting-scheduling`

## 9. Implementation Plan

1.  **Sprint 1 (DB & State Machine):** Implement schema changes and build the core flywheel worker with state transition logic.
2.  **Sprint 2 (Sequence Engine):** Build the sequence engine, channel router, and compliance gates.
3.  **Sprint 3 (API & UI):** Update API endpoints and integrate flywheel status and controls into the existing dashboard.
4.  **Sprint 4 (Testing & Deployment):** Write unit and integration tests, and deploy the flywheel worker to production.
