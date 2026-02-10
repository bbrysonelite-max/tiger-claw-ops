# Gemini Red Team Analysis - Critical Fixes
**Date:** 2026-02-10
**Version:** 3.2.0 (Hardened)
**Status:** APPROVED FOR BUILD

## 🚩 CRITICAL RISKS IDENTIFIED

### Risk 1: The "20 Bot" Ceiling (CRITICAL)

**Problem:** Telegram limits each User Account to owning **20 Bots** via BotFather.

**Impact:** The Provisioner script would crash at Customer #21, stopping business growth.

**Fix:** 
- Track which admin session created each bot in database
- Add `createdByAdminSession` field to Tenant model
- Alert admin when 20-bot limit is reached
- Rotate `TELEGRAM_SESSION_STRING` (swap admin accounts)
- **Rule:** Need ~1 Telegram account per 20 customers

```prisma
model Tenant {
  // ... existing fields ...
  createdByAdminSession  String?  // Track which admin created this bot
}
```

### Risk 2: The "Trash Can" OS Trap

**Problem:** Modern Puppeteer (Headless Chrome) requires **macOS 11 (Big Sur)** or higher.

**Impact:** If Mac Pros run Mojave (10.14) or Catalina (10.15), scrapers will **silently fail**.

**Fix:**
- **REQUIREMENT:** macOS Monterey (12.x) minimum
- macOS Monterey is the latest supported OS for 2013 Mac Pros
- Verify OS before deployment: `sw_vers -productVersion`

### Risk 3: The "Zombie Chrome" Leak

**Problem:** On Mac, Puppeteer often fails to close Chrome processes if Node worker crashes.

**Impact:** Eventually eats all 128GB RAM.

**Fix:**
- Use `dumb-init` in Docker/PM2 setup to prevent zombie processes
- Set `CONCURRENCY: 20` limit in ecosystem.config.js
- Add process cleanup on worker shutdown

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "tiger-worker",
    script: "./dist/fleet/worker.js",
    instances: "max", 
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      CONCURRENCY: 20  // Prevents Puppeteer spawning too many browsers
    }
  }]
}
```

---

## Updated Schemas

### Prisma Schema Addition
```prisma
model Tenant {
  id              String   @id @default(uuid())
  stripeId        String?  @unique
  botToken        String   @unique // Encrypted
  botTokenHash    String   @unique // Public SHA-256 for Routing
  botUsername     String
  status          String   @default("provisioning")
  
  // NEW: Track which Admin Account created this bot (to manage 20-bot limit)
  createdByAdminSession  String?  
}
```

### Assets & Constraints
```markdown
## HARDWARE REQUIREMENTS
- **Worker Machines:** 2x Mac Pro (Late 2013)
- **OS Requirement:** **macOS Monterey (12.x)** or later
  - *Risk:* Older OS versions (Mojave/Catalina) will fail to run Chrome for Testing
- **Dependency:** `dumb-init` to prevent zombie processes
```

---

## Pre-Flight Checklist (Before Deployment)

- [ ] Verify Mac Pro OS: `sw_vers -productVersion` → must be 12.x+
- [ ] Count existing bots under admin account (max 20)
- [ ] Prepare backup Telegram account for bots 21-40
- [ ] Set CONCURRENCY=20 in ecosystem.config.js
- [ ] Test Puppeteer Chrome launch manually first

---

*Analysis by Gemini, integrated by Agent Zero*
