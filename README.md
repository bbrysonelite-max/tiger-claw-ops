# Tiger Claw Scout

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-85%25-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)]()
[![Node](https://img.shields.io/badge/Node-20%2B-green)]()
[![License](https://img.shields.io/badge/license-Proprietary-red)]()

AI Recruiting Partner for Network Marketing - delivered via Telegram.

**Product of [BotCraftWrks.ai](https://botcraftwrks.ai)**

<!-- TODO: Add screenshot of dashboard -->
<!-- ![Dashboard Overview](./docs/images/dashboard-overview.png) -->

## Overview

Tiger Claw Scout is an intelligent prospect discovery and relationship management platform designed for network marketing professionals. It monitors social platforms for high-potential prospects, delivers daily reports via Telegram, and generates personalized approach scripts powered by AI.

### Key Capabilities

- 🔍 **Automated Prospect Discovery** - Monitors social platforms for buying signals
- 📊 **AI-Powered Scoring** - Ranks prospects by conversion likelihood
- 💬 **Script Generation** - Creates personalized approach messages
- 📈 **Performance Analytics** - Track conversion funnels and ROI
- 🐝 **Hive Learning** - Collective intelligence from successful interactions
- 🤖 **Telegram Integration** - Daily reports and on-demand commands

---

## Features

### Dashboard Command Center

A comprehensive web-based dashboard for managing prospects and analyzing performance.

#### Overview
4 metric cards providing at-a-glance insights:
- **Today's Prospects** - New discoveries with AI scores
- **Script Performance** - Response rates and conversion metrics
- **Conversion Funnel** - Pipeline stage breakdown
- **Hive Pulse** - Active learnings and success patterns

#### Prospects (CRM)
Full-featured prospect management:
- Filterable/sortable data table with pagination
- Status management (New → Contacted → Qualified → Converted)
- Priority levels with AI scoring
- Detail modal with activity timeline
- Notes and script history per prospect

#### Scripts
- Script generation history table
- Winning scripts gallery with feedback metrics
- AI script generator with context awareness
- Support for approach, follow-up, and objection handling

#### Hive Learnings
- **Leaderboard** - Top performing scripts by conversion rate
- **Source Performance** - Success metrics by discovery source
- **Learning Trends** - Pattern analysis over time

#### Analytics
- **Conversion Funnel** - Visual pipeline analysis
- **Timeline Charts** - Prospects over time with trends
- **Response Rate Heatmap** - Best contact times
- **ROI Calculator** - Investment vs. return metrics

#### Settings
- Bot configuration and preferences
- Notification settings (daily reports, alerts)
- Integration status and connection testing

### UI Features

- 🌓 **Dark/Light Mode** - System preference detection with manual toggle
- 📤 **Export Functionality** - CSV exports for prospects, scripts, and reports
- 🔄 **Real-time Refresh** - Auto-updating data with manual refresh option
- 📱 **Mobile Responsive** - Optimized for all screen sizes
- 🔔 **Toast Notifications** - Success/error feedback

### Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and onboarding |
| `/report` | Today's prospect report |
| `/pipeline` | Pipeline summary with counts |
| `/script <name>` | Generate approach script for prospect |
| `/objection <text>` | Handle a specific objection |
| `/stats` | Weekly performance statistics |
| `/recent` | Last 5 discovered prospects |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.7 |
| **Backend** | Express.js 4.x |
| **Database** | PostgreSQL 14+ |
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript |
| **Testing** | Jest 30 with TypeScript support |
| **AI** | Anthropic Claude API |
| **Messaging** | Telegram Bot API |
| **Process Manager** | PM2 (production) |

### Integrations

- **Apollo** - B2B contact enrichment
- **Brevo** - Email automation
- **Twilio** - SMS notifications
- **Calendly** - Meeting scheduling
- **Stripe** - Subscription billing
- **LINE** - Thai market messaging (optional)

---

## Project Structure

```
tiger-bot-scout/
├── api/                      # Backend API
│   ├── server.ts             # Express app & route definitions
│   ├── telegram-bot.ts       # Telegram bot handlers
│   ├── channels.ts           # Multi-channel messaging
│   ├── provisioning.ts       # Tenant provisioning
│   └── integrations/         # Third-party integrations
│       ├── apollo.ts
│       ├── brevo.ts
│       ├── twilio.ts
│       └── calendly.ts
├── website/                  # Frontend
│   ├── index.html            # Landing page
│   └── dashboard.html        # Dashboard SPA
├── types/                    # TypeScript definitions
│   └── dashboard.ts          # Shared types
├── tests/                    # Test suites
│   ├── api.test.ts
│   ├── dashboard.test.ts
│   ├── utils.test.ts
│   └── mocks/
│       └── data.ts
├── docs/                     # Documentation
│   └── DASHBOARD_PRD.md
├── dist/                     # Compiled output
├── coverage/                 # Test coverage reports
├── serve.js                  # Static file server (dev)
├── package.json
├── tsconfig.json
├── jest.config.js
└── .env.example
```

---

## Getting Started

### Prerequisites

- **Node.js** 20.0.0 or higher
- **PostgreSQL** 14 or higher
- **npm** or **yarn**
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))
- Anthropic API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/bbrysonelite-max/tiger-bot-scout.git
cd tiger-bot-scout

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: 4001) |
| `NODE_ENV` | ❌ | Environment: development/production |
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from BotFather |
| `TELEGRAM_REPORT_CHAT_ID` | ❌ | Default chat for reports |
| `TELEGRAM_ALLOWED_USERS` | ❌ | Comma-separated allowed user IDs |
| `ANTHROPIC_API_KEY` | ✅ | Claude API key for script generation |
| `APOLLO_API_KEY` | ❌ | Apollo.io integration |
| `BREVO_API_KEY` | ❌ | Brevo email integration |
| `TWILIO_ACCOUNT_SID` | ❌ | Twilio SMS integration |
| `TWILIO_AUTH_TOKEN` | ❌ | Twilio authentication |
| `TWILIO_PHONE_NUMBER` | ❌ | Twilio sender number |
| `CALENDLY_API_KEY` | ❌ | Calendly integration |
| `CALENDLY_LINK` | ❌ | Default scheduling link |
| `STRIPE_SECRET_KEY` | ❌ | Stripe billing |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Stripe webhook verification |
| `LINE_CHANNEL_ACCESS_TOKEN` | ❌ | LINE messaging (Thai market) |
| `LINE_CHANNEL_SECRET` | ❌ | LINE authentication |

### Database Setup

```bash
# Create database
createdb tiger_bot

# The application will auto-create tables on first run
# Or import schema manually if provided
```

### Running Locally

```bash
# Development mode (API with hot reload)
npm run dev

# Serve static files (dashboard)
npm run serve

# Run both simultaneously
npm run dev:all

# Production build
npm run build
npm start
```

The API runs on `http://localhost:4001` and the dashboard on `http://localhost:3000`.

---

## API Documentation

### Health Check

```http
GET /health
```

Returns server status and version.

---

### Dashboard Endpoints

#### Get Overview Metrics

```http
GET /dashboard/overview
```

Returns aggregated dashboard metrics including today's prospects, script performance, conversion funnel, and hive pulse.

**Response:**
```json
{
  "todaysProspects": { "count": 12, "highScore": 3 },
  "scriptPerformance": { "sent": 45, "responseRate": 0.32 },
  "conversionFunnel": { "new": 50, "contacted": 30, "qualified": 15, "converted": 5 },
  "hivePulse": { "activeLearnings": 127, "topPattern": "wellness-signal" }
}
```

---

### Leads/Prospects

#### List Prospects

```http
GET /ai-crm/leads?status=new&priority=high&limit=20&offset=0
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (new, contacted, qualified, converted, lost) |
| `priority` | string | Filter by priority (low, medium, high) |
| `source` | string | Filter by discovery source |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |

#### Get Single Prospect

```http
GET /ai-crm/leads/:id
```

#### Update Prospect

```http
PUT /ai-crm/leads/:id
Content-Type: application/json

{
  "status": "contacted",
  "notes": "Reached out via LINE"
}
```

#### Get Prospect Scripts

```http
GET /ai-crm/leads/:id/scripts
```

#### Get Prospect Activities

```http
GET /ai-crm/leads/:id/activities
```

#### Manage Prospect Notes

```http
GET /ai-crm/leads/:id/notes
POST /ai-crm/leads/:id/notes
```

#### Get Priority Prospects

```http
GET /ai-crm/priority-prospects?limit=10
```

---

### Analytics

#### Conversion Funnel

```http
GET /analytics/funnel
```

Returns conversion funnel data with stages: New → Contacted → Qualified → Converted.

#### Timeline Data

```http
GET /analytics/timeline?period=daily&since=2024-01-01&until=2024-12-31
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | Aggregation period: daily, weekly, monthly |
| `since` | string | Start date (ISO format) |
| `until` | string | End date (ISO format) |

#### Response Rates

```http
GET /analytics/response-rates
```

Returns heatmap data (7x17 grid: Mon-Sun × 6am-10pm) for best contact times.

#### ROI Metrics

```http
GET /analytics/roi
```

Calculates time saved, conversions, revenue, and ROI percentage.

---

### Settings

#### Get Settings

```http
GET /settings
```

#### Update Settings

```http
PATCH /settings
Content-Type: application/json

{
  "notificationPreferences": {
    "dailyReport": true,
    "newHighScoreProspect": true,
    "weeklyDigest": false
  },
  "timezone": "Asia/Bangkok"
}
```

#### Integration Status

```http
GET /settings/integrations
```

Returns connection status for all configured integrations.

#### Test Integration Connection

```http
POST /settings/test-connection/:service
```

Where `:service` is one of: `apollo`, `brevo`, `twilio`, `calendly`

---

### Hive Learnings

#### Leaderboard

```http
GET /ai-crm/hive/leaderboard?limit=10
```

Returns top performing scripts ranked by conversion rate.

#### Source Performance

```http
GET /ai-crm/hive/source-performance-v2
```

Returns success metrics grouped by discovery source.

#### Learning Trends

```http
GET /ai-crm/hive/trends-v2?days=30
```

Returns learning pattern trends over the specified time period.

---

### Scripts

#### Generate Script (v2)

```http
POST /scripts/generate-v2
Content-Type: application/json

{
  "prospectId": "uuid",
  "scriptType": "approach",
  "context": "Optional additional context"
}
```

**Script Types:**
- `approach` - Initial outreach message
- `follow_up` - Follow-up message
- `objection` - Objection handling response

---

### Admin Endpoints

#### Provision New Tenant

```http
POST /admin/provision
Content-Type: application/json

{
  "email": "distributor@example.com",
  "name": "John Doe"
}
```

#### List Tenants

```http
GET /admin/tenants
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── api.test.ts        # Core API endpoint tests
├── dashboard.test.ts  # Dashboard-specific endpoint tests
├── utils.test.ts      # Utility function tests
└── mocks/
    └── data.ts        # Shared test fixtures and mock data
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory:

```bash
# Generate and view coverage report
npm run test:coverage
open coverage/lcov-report/index.html
```

### Writing Tests

Tests use Jest with supertest for API testing:

```typescript
import request from 'supertest';
import { app } from '../api/server';

describe('GET /ai-crm/leads', () => {
  it('returns paginated prospects', async () => {
    const response = await request(app)
      .get('/ai-crm/leads?limit=10&offset=0')
      .expect(200);

    expect(response.body.leads).toBeInstanceOf(Array);
    expect(response.body.total).toBeDefined();
  });
});
```

---

## Deployment

### Production Server

The API runs on DreamCompute at `208.113.131.83`.

### Deployment Steps

```bash
# SSH into server
ssh -i "botcraft key pair.pem" ubuntu@208.113.131.83

# Navigate to project
cd /home/ubuntu/tiger-bot-api

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build TypeScript
npm run build

# Restart with PM2
pm2 restart tiger-bot
```

### PM2 Commands

```bash
# View logs
pm2 logs tiger-bot

# Monitor processes
pm2 monit

# Restart on crash
pm2 startup
pm2 save
```

### Environment Configuration

Production environment variables are stored in `/home/ubuntu/tiger-bot-api/.env`.

> ⚠️ Never commit `.env` files to the repository.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes with appropriate tests
3. Ensure all tests pass: `npm test`
4. Submit a pull request

### Code Style

- TypeScript strict mode enabled
- ESLint configuration in `.eslintrc`
- Prettier for formatting

---

## Troubleshooting

### Common Issues

**Database connection fails**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection string
psql $DATABASE_URL
```

**Telegram bot not responding**
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check bot is not blocked or stopped
- Review PM2 logs for errors

**API returns 500 errors**
```bash
# Check application logs
pm2 logs tiger-bot --lines 100

# Verify environment variables
cat .env | grep -v "KEY\|TOKEN\|SECRET"
```

---

## Roadmap

- [ ] Multi-language support (Thai, English)
- [ ] LINE integration for Thai market
- [ ] Mobile app companion
- [ ] Advanced ML scoring models
- [ ] Team collaboration features
- [ ] Webhook integrations

---

## License

Proprietary - © 2024-2026 BotCraft LLC. All rights reserved.

This software is confidential and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

## Support

- **Documentation**: [docs.botcraftwrks.ai](https://docs.botcraftwrks.ai)
- **Email**: support@botcraftwrks.ai
- **Issues**: [GitHub Issues](https://github.com/bbrysonelite-max/tiger-bot-scout/issues)

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://botcraftwrks.ai">BotCraftWrks.ai</a></sub>
</p>
