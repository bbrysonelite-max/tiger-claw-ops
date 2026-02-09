# Tiger Bot Scout Dashboard Migration Blueprint

**Source (legacy):**
- Repo root (assumed): `/usr/projects/tiger-bot-scout`
- Legacy dashboard entry: `website/dashboard.html` (e.g. `#customers` section)

**Target (v2):**
- Modular, API-driven dashboard app with routes like:
  - `/dashboard` → Overview
  - `/dashboard/prospects` → Prospects table + detail modal
  - Future: `/dashboard/scripts`, `/dashboard/hive`, `/dashboard/analytics`, `/dashboard/settings`

This blueprint describes *how* to migrate from the legacy `dashboard.html` to the new structure without breaking existing behavior.

---

## 1. Objectives

1. **Preserve** current working behavior of `website/dashboard.html` while v2 is being built.
2. **Introduce** a new app structure (React/SPA or framework-based) alongside `website/`.
3. **Port** key dashboard functionality into v2:
   - Today’s prospects view
   - Script performance indicators
   - Conversion funnel
   - Hive/network pulse
   - Prospects table and detail view
4. **Wire** v2 to backend APIs defined in the Tiger Bot PRDs (e.g. `/dashboard/overview`, `/ai-crm/leads`).
5. **Retire** `website/dashboard.html` once v2 reaches feature parity (optional, can remain as a fallback).

---

## 2. High-level structure for the new dashboard app

> Note: Exact framework (Next.js, React SPA, etc.) will be inferred from the existing repo when the builder agent inspects it. This blueprint describes the *shape* and *responsibilities*.

### 2.1 Proposed directory layout (under repo root)

```text
/usr/projects/tiger-bot-scout/
  website/
    dashboard.html            # Legacy dashboard (kept intact during migration)
  app/                        # New dashboard app (example; adjust to framework)
    dashboard/
      page.tsx                # Overview route
    dashboard/prospects/
      page.tsx                # Prospects route
  components/
    dashboard/
      TodaysProspectsCard.tsx
      ScriptPerformanceCard.tsx
      ConversionFunnelCard.tsx
      HivePulseCard.tsx
      ProspectsTable.tsx
      ProspectDetailModal.tsx
  types/
    dashboard.ts              # Shared TS types for dashboard data
```

If the repo already uses a different structure (e.g. `src/pages`, `src/routes`), the builder agent should map the above to the closest equivalent while keeping the same *conceptual* separation.

---

## 3. Mapping legacy sections to new components

The legacy `website/dashboard.html` likely contains:
- Top-level layout (nav, header, main content area)
- Metrics cards / summary sections
- A customers/prospects section (e.g. `#customers` anchor)

These map to v2 as follows:

1. **Overall layout**
   - Reference: `website/dashboard.html` structure (header, sidebar, content area).
   - Target: a reusable layout component or route shell under `app/dashboard/page.tsx`.

2. **Summary cards**
   - Reference: any metrics cards in `dashboard.html` (counts, charts, etc.).
   - Target components:
     - `TodaysProspectsCard`
     - `ScriptPerformanceCard`
     - `ConversionFunnelCard`
     - `HivePulseCard`

3. **Customers / Prospects table**
   - Reference: the `#customers` table/section in `dashboard.html`.
   - Target components/routes:
     - Route: `/dashboard/prospects` → `app/dashboard/prospects/page.tsx`
     - Table: `components/dashboard/ProspectsTable.tsx`
     - Detail view: `components/dashboard/ProspectDetailModal.tsx`

During migration, the builder agent should **treat `website/dashboard.html` as read-only context**—do not destructively edit it until v2 is proven.

---

## 4. API contracts (target state)

The v2 dashboard should not hard-code data in the UI. It should consume backend APIs. At minimum:

1. `GET /dashboard/overview`
   - Returns high-level metrics used by:
     - `TodaysProspectsCard`
     - `ScriptPerformanceCard`
     - `ConversionFunnelCard`
     - `HivePulseCard`

2. `GET /ai-crm/leads`
   - Returns a paginated/filterable list of prospects for the Prospects table.
   - Supports query params for status, score, source, date range, pagination.

3. `GET /ai-crm/leads/:id`
   - Returns detailed information for a single prospect for the detail modal.

**Rule:**
- Backend is the **source of truth** for metrics and scoring.
- Frontend only maps and presents, no duplicating core business logic.

The exact TypeScript types derived from these endpoints should live in `types/dashboard.ts`.

---

## 5. Migration phases

### Phase 1 – New structure + Overview + Prospects

Goals:
- Introduce new app structure.
- Implement core Overview and Prospects experiences.
- Keep `website/dashboard.html` fully intact.

Steps (high-level, encoded as tasks for the Builder Agent):

1. **Create new dashboard app shell**
   - Add `/dashboard` and `/dashboard/prospects` routes.
   - Basic layout, no real data yet.

2. **Implement Overview cards**
   - Create the four card components.
   - Hard-code mock data initially if backend is not ready, then switch to `GET /dashboard/overview`.

3. **Implement Prospects list & detail modal**
   - Create `ProspectsTable` and `ProspectDetailModal`.
   - Wire to `GET /ai-crm/leads` and `GET /ai-crm/leads/:id`.

4. **Add types and basic tests**
   - Define `DashboardOverview`, `Prospect`, etc. in `types/dashboard.ts`.
   - Add minimal tests and/or type-check commands.

### Phase 2 – Deepen integration and parity with legacy

Goals:
- Bring in any additional widgets/sections from `dashboard.html` that are still valuable.
- Replace any remaining direct DOM/inline behavior with components.

Steps:

1. **Audit legacy features**
   - From `website/dashboard.html`, list features *not yet present* in v2.

2. **Port or retire each feature**
   - For each feature, decide: port into v2 or drop.
   - Port by creating new components/routes and wiring to existing or new APIs.

3. **Add navigation / entry point**
   - Add a visible link/button in the legacy site pointing to the new dashboard.
   - Optionally make v2 the default once stable.

### Phase 3 – Retire or freeze legacy dashboard.html (optional)

Goals:
- Reduce maintenance load.

Options:
- Keep `website/dashboard.html` as a static redirect or “legacy” view.
- Remove or archive it once confident in v2.

---

## 6. Builder Agent usage of this blueprint

When processing dashboard-related tasks, the Builder Agent should:

1. Treat this file (`dashboard_migration_from_html.md`) and `website/dashboard.html` as **contextFiles**.
2. Never modify `website/dashboard.html` during Phase 1—only read it.
3. Prefer creating new files under:
   - `app/dashboard/` (or equivalent router structure)
   - `components/dashboard/`
   - `types/dashboard.ts`
4. Use the existing HTML to:
   - Align visual layout
   - Preserve UX patterns users may already know

---

## 7. Coordination with tasks and statuses

- Tasks related to this migration will live in:
  - `/usr/projects/tiger_bot_multiagent/tasks/`
- They will reference this blueprint and `website/dashboard.html` via `contextFiles`.
- Builder Agent writes execution results to:
  - `/usr/projects/tiger_bot_multiagent/status/`

Agent Zero (architect/orchestrator) will:
- Generate and refine tasks per this blueprint.
- Interpret status files to determine follow-up work.
- Keep this document updated if the repo layout or API contracts change.
