# Changelog

All notable changes to Tiger Bot Scout Dashboard.

## [1.1.0] - 2026-02-09

### 🚀 Major Update - Enterprise Features & Admin Dashboard

This release adds enterprise-grade features including admin dashboard, AI insights, and extensive UX improvements.

### ✨ New Features

#### Admin Dashboard (Ctrl+Shift+A to toggle)
- **Tenant Overview** - View all tenants with performance stats, health indicators, filtering
- **System Health** - Monitor API, database, queue, cache status with real-time metrics
- **API Costs** - Track costs by service and tenant with projections
- **Hive Management** - Moderate scripts, approve/reject/feature content
- **Admin Actions** - Send help emails, broadcast messages, impersonate tenants

#### AI Insights Panel
- Smart suggestions based on user data
- Contextual tips for improving conversion rates
- Achievement badges with gamification (12 badges)
- Daily goals tracker with progress bars

#### Command Palette (Cmd+K / Ctrl+K)
- Quick access to all navigation and actions
- Fuzzy search through commands
- Recent commands memory
- Keyboard shortcut hints

#### Onboarding Tutorial
- 6-step guided tour for new users
- Spotlight effect on target elements
- Progress indicators and skip option
- Restartable from Settings

#### Notification Center
- Bell icon with unread badge
- System, prospect, and script notifications
- Mark as read / clear all
- Time-ago formatting

#### Data Management
- **Caching** - localStorage-based with TTL
- **Filter Persistence** - Remember filter preferences
- **Recently Viewed** - Quick access to last 10 prospects
- **Pinned Prospects** - Pin important prospects to top
- **Search History** - Recent searches dropdown
- **Batch Actions** - Multi-select with bulk operations
- **Undo System** - Ctrl+Z to undo status changes

#### UX Improvements
- **Context Menu** - Right-click on prospects for quick actions
- **Loading Screen** - Animated splash screen on init
- **Empty States** - Friendly messages when no data
- **Print Styles** - Optimized for printing reports
- **Error Boundaries** - Graceful error handling
- **Connection Status** - Live indicator in header

### 🔧 API Additions

| Endpoint | Description |
|----------|-------------|
| `GET /admin/tenants` | List all tenants with stats |
| `GET /admin/tenants/:id` | Detailed tenant info |
| `GET /admin/system-health` | System metrics |
| `GET /admin/errors` | Error logs |
| `GET /admin/costs` | API usage and costs |
| `GET /admin/hive/stats` | Hive statistics |
| `GET /admin/hive/pending` | Pending scripts |
| `POST /admin/hive/:id/approve` | Approve script |
| `POST /admin/hive/:id/reject` | Reject script |
| `POST /admin/hive/:id/feature` | Feature script |
| `POST /admin/actions/*` | Admin actions |

### 🧪 Testing
- Added 220 lines of admin API tests
- Total test coverage: 894 lines

### 📊 Stats
- **Dashboard**: 10,001 lines
- **API**: 2,530 lines
- **Tests**: 1,383 lines
- **Total**: 17,014 lines
- **Commits**: 25

---

## [1.0.0] - 2026-02-09

### 🎉 Initial Release - Complete Dashboard Implementation

This release implements the full Tiger Bot Scout Dashboard per PRD specifications.

### ✨ Features

#### Dashboard Sections
- **Overview** - 4 metric cards: Today's Prospects, Script Performance, Conversion Funnel, Hive Pulse
- **Prospects** - Full CRM with filters, pagination, sorting, detail modal, status management
- **Scripts** - History table, winning scripts gallery, AI script generator
- **Hive Learnings** - Leaderboard (top 10), source performance, learning trends
- **Analytics** - Conversion funnel chart, timeline visualization, response rate heatmap, ROI calculator
- **Settings** - Bot configuration, notification preferences, integration status

#### UI/UX Enhancements
- 🌓 **Dark Mode** - Toggle with system preference detection, localStorage persistence
- 📤 **Export Functionality** - CSV exports for prospects, text reports for analytics/scripts
- 📱 **Mobile Responsive** - Hamburger menu, collapsible sidebar, responsive grids
- ♿ **Accessibility** - WCAG 2.1 AA compliance, keyboard navigation, screen reader support
- 🔄 **Real-time Updates** - Auto-refresh (30s overview, 60s data, 120s analytics)
- ⌨️ **Keyboard Shortcuts** - Power user shortcuts (1-6 for nav, R refresh, / search, ? help)

### 📝 PRD Compliance

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Core Dashboard (Overview, Prospects, Modal) |
| Phase 2 | ✅ Complete | Scripts & Feedback |
| Phase 3 | ✅ Complete | Hive Learnings |
| Phase 4 | ✅ Complete | Analytics & Settings |
| Phase 5 | ✅ Complete | Testing & Documentation |

