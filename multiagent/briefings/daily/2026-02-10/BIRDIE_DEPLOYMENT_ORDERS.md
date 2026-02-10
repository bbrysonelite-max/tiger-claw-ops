# 🐦 BIRDIE DEPLOYMENT ORDERS
## Tiger Bot Scout v3.1.0 - URGENT LAUNCH
## Deadline: 6:00 PM MST (4 hours from now)

---

## 🎯 MISSION OBJECTIVE

Deploy Tiger Bot Scout and provision 7 paying customers with dedicated Telegram bots.

---

## 📋 TASK SEQUENCE

### TASK 1: Install Redis on Mac Pro (~5 min)

```bash
# Install Homebrew if not present
which brew || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install and start Redis
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
# Expected output: PONG
```

✅ **Success criteria:** `redis-cli ping` returns `PONG`

---

### TASK 2: Pull Latest Code (~2 min)

```bash
cd ~/tiger-bot-scout
git pull origin main
npm install
npm run build
```

✅ **Success criteria:** Build completes with no TypeScript errors

---

### TASK 3: Configure Environment (~3 min)

Create/update `.env` file:

```bash
cd ~/tiger-bot-scout
cat > .env << 'ENVFILE'
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tigerbot

# Redis (local)
REDIS_URL=redis://localhost:6379

# Telegram API (for gramjs bot creation)
TG_APP_ID=30733538
TG_APP_HASH=a99b03e178e6d3e8f9ea6e3ce3a77d4e
TG_PHONE=+1XXXXXXXXXX

# OpenAI
OPENAI_API_KEY=sk-XXXXXXXXXX

# Server
PORT=4000
NODE_ENV=production

# Concurrency (adjusted for 32GB RAM)
CONCURRENCY=10
ENVFILE
```

⚠️ **IMPORTANT:** Replace placeholder values:
- `DATABASE_URL` - Your PostgreSQL connection string
- `TG_PHONE` - Your Telegram phone number (for one-time auth)
- `OPENAI_API_KEY` - Your OpenAI API key

---

### TASK 4: Initialize Telegram Session (One-Time) (~5 min)

This authenticates gramjs with Telegram. You'll receive a code via Telegram.

```bash
cd ~/tiger-bot-scout
npx ts-node src/provisioner/session-generator.ts
```

Follow prompts:
1. Enter phone number when prompted
2. Enter the code Telegram sends you
3. Session file will be saved to `telegram-session.txt`

✅ **Success criteria:** `telegram-session.txt` file exists

---

### TASK 5: Create 7 Customer Bots via BotFather (~10 min)

Run the automated provisioner:

```bash
cd ~/tiger-bot-scout
npx ts-node -e "
import { TelegramProvisioner } from './src/provisioner/userbot';

const customers = [
  { email: 'nancylimsk@gmail.com', name: 'Nancy Lim', botUsername: 'TigerBot_Nancy_bot' },
  { email: 'chana.loh@gmail.com', name: 'Chana Lohasaptawee', botUsername: 'TigerBot_Chana_bot' },
  { email: 'phaitoon2010@gmail.com', name: 'Phaitoon S.', botUsername: 'TigerBot_Phaitoon_bot' },
  { email: 'taridadew@gmail.com', name: 'Tarida Sukavanich', botUsername: 'TigerBot_Tarida_bot' },
  { email: 'lily.vergara@gmail.com', name: 'Lily Vergara', botUsername: 'TigerBot_Lily_bot' },
  { email: 'phetmalaigul@gmail.com', name: 'Theera Phetmalaigul', botUsername: 'TigerBot_Theera_bot' },
  { email: 'vijohn@hotmail.com', name: 'John & Noon', botUsername: 'TigerBot_John_bot' }
];

(async () => {
  const provisioner = new TelegramProvisioner();
  await provisioner.init();
  
  for (const customer of customers) {
    console.log('Creating bot for:', customer.name);
    const result = await provisioner.createBot(customer.botUsername, 'Tiger Bot ' + customer.name);
    console.log('Token:', result.token);
    console.log('---');
  }
  
  await provisioner.disconnect();
})();
"
```

📋 **Save the bot tokens!** You'll see output like:
```
Creating bot for: Nancy Lim
Token: 1234567890:ABC-DEF...
---
```

✅ **Success criteria:** 7 bot tokens displayed

---

### TASK 6: Start Fleet Worker (~2 min)

```bash
cd ~/tiger-bot-scout
pm2 start ecosystem.config.js
pm2 status
```

✅ **Success criteria:** PM2 shows `fleet-worker` status `online`

---

### TASK 7: Deploy Gateway to Production Server (~5 min)

```bash
# SSH into production
ssh -i ~/Desktop/"botcraft key pair.pem" ubuntu@208.113.131.83

# On production server:
cd /home/ubuntu/tiger-bot-api
git pull origin main
npm install
npm run build
pm2 restart tiger-bot || pm2 start dist/src/gateway/index.js --name tiger-bot
pm2 status
exit
```

✅ **Success criteria:** PM2 shows `tiger-bot` status `online`

---

### TASK 8: Provision Customers in Database (~2 min)

```bash
# From Mac Pro, call the provisioning API:
curl -X POST http://208.113.131.83:4000/admin/provision/batch \
  -H "Content-Type: application/json" \
  -d '{
    "customers": [
      {"email": "nancylimsk@gmail.com", "name": "Nancy Lim", "botToken": "TOKEN_1"},
      {"email": "chana.loh@gmail.com", "name": "Chana Lohasaptawee", "botToken": "TOKEN_2"},
      {"email": "phaitoon2010@gmail.com", "name": "Phaitoon S.", "botToken": "TOKEN_3"},
      {"email": "taridadew@gmail.com", "name": "Tarida Sukavanich", "botToken": "TOKEN_4"},
      {"email": "lily.vergara@gmail.com", "name": "Lily Vergara", "botToken": "TOKEN_5"},
      {"email": "phetmalaigul@gmail.com", "name": "Theera Phetmalaigul", "botToken": "TOKEN_6"},
      {"email": "vijohn@hotmail.com", "name": "John & Noon", "botToken": "TOKEN_7"}
    ]
  }'
```

⚠️ Replace `TOKEN_1` through `TOKEN_7` with the actual tokens from Task 5!

✅ **Success criteria:** API returns `{"success": true, "provisioned": 7}`

---

### TASK 9: Verify Deployment (~3 min)

```bash
# Check gateway health
curl http://208.113.131.83:4000/health
# Expected: {"status": "ok"}

# Check Redis connection
redis-cli ping
# Expected: PONG

# Check PM2 processes
pm2 status
# Expected: fleet-worker = online

# Test a customer bot (send /start to @TigerBot_Nancy_bot in Telegram)
```

---

## 📊 COMPLETION CHECKLIST

| Task | Status |
|------|--------|
| 1. Redis installed | ☐ |
| 2. Code pulled & built | ☐ |
| 3. Environment configured | ☐ |
| 4. Telegram session created | ☐ |
| 5. 7 customer bots created | ☐ |
| 6. Fleet worker running | ☐ |
| 7. Gateway deployed | ☐ |
| 8. Customers provisioned | ☐ |
| 9. Deployment verified | ☐ |

---

## 🚨 TROUBLESHOOTING

### Redis won't start
```bash
brew services restart redis
tail -f /opt/homebrew/var/log/redis.log
```

### gramjs auth fails
- Ensure phone number includes country code (+1...)
- Check Telegram app for auth code
- May need to allow "unknown devices" in Telegram settings

### Bot creation fails
- Telegram has 20 bot limit per account
- If hit limit, use second account
- BotFather may rate limit - wait 1 min between bots

### Production SSH fails
- Check key permissions: `chmod 400 ~/Desktop/"botcraft key pair.pem"`
- Verify IP: 208.113.131.83

---

## 📞 REPORT BACK

When complete, report:
1. All 7 bot tokens
2. PM2 status screenshot
3. Health check results
4. Any errors encountered

**Deadline: 6:00 PM MST**

---

*Generated by Agent Zero - 2026-02-10 14:05 MST*
