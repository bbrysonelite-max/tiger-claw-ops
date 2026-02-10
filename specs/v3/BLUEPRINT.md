# Technical Blueprint
**Architecture:** Hybrid Event-Driven Monolith
**Infrastructure:** Cloud Ingress + Residential Compute Cluster

## 1. INFRASTRUCTURE MAP

| Component | Host | Tech | Responsibility |
| :--- | :--- | :--- | :--- |
| **Gateway** | Cloud (Railway/VPS) | Node.js / Express | **Ingress Only.** Validates Webhook Signatures. Enqueues Jobs to Redis. Returns 200 OK. |
| **Queue** | Cloud (Upstash) | Redis (BullMQ) | **The Spine.** Holds state. Balances load between the two Trash Cans automatically. |
| **Worker A** | Mac Pro "Trash Can" 1 | Node.js / BullMQ | **The Muscle.** Consumes jobs. Runs AI, DB queries, Telegram calls, Puppeteer. |
| **Worker B** | Mac Pro "Trash Can" 2 | Node.js / BullMQ | **Redundancy.** Runs identical code to Worker A. Adds capacity. |
| **Database** | Cloud (Supabase) | Postgres + `pgvector` | **The Brain.** Stores Tenants, Prospects, and Vector Embeddings for Hive Learning. |

> **CRITICAL:** The Mac Pro "Cheese Grater" (Dev Machine) is NOT to be used as a production worker.

## 2. DATABASE SCHEMA (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [vector] // REQUIRED: pgvector extension
}

model Tenant {
  id              String   @id @default(uuid())
  stripeId        String?  @unique
  email           String   @unique
  
  // Bot Identity
  botToken        String   @unique // AES-256 Encrypted
  botTokenHash    String   @unique // Public SHA-256 hash for Webhook Routing
  botUsername     String
  
  status          String   @default("provisioning")
  createdAt       DateTime @default(now())
  
  prospects       Prospect[]
  reports         DailyReport[]
}

model HivePattern {
  id              String   @id @default(uuid())
  content         String   // The script template or objection handler
  contextVector   Unsupported("vector(1536)")? // Embedding of the context
  successCount    Int      @default(0)
  uses            Int      @default(0)
}

model Prospect {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  name            String
  summary         String?  // From Mini-RAG scraping
  status          String   // 'new', 'contacted', 'converted'
  score           Int      @default(0)
}

model DailyReport {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  date            DateTime @default(now())
  status          String   // 'sent', 'failed'
  prospectCount   Int
}
```

## 3. PM2 ECOSYSTEM (Worker Nodes)

```javascript
module.exports = {
  apps: [{
    name: "tiger-worker",
    script: "./dist/fleet/worker.js",
    instances: "max", // Utilize all available cores
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      REDIS_URL: process.env.REDIS_URL, 
      CONCURRENCY: 25
    }
  }]
}
```
