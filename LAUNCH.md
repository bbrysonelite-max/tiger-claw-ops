# 🐯 Tiger Claw Scout — 2-Click Launch Guide

## Quick Start (2 Clicks)

### Click 1: Open Terminal
```bash
cd ~/Desktop/tiger-bot-website/tiger-bot-scout
```

### Click 2: Run Deploy
```bash
./deploy.sh local      # For local testing
# OR
./deploy.sh production # For production server
```

That's it! 🎉

---

## What It Does

1. ✅ Installs dependencies
2. ✅ Builds TypeScript
3. ✅ Starts API server
4. ✅ Creates database tables
5. ✅ Provisions all 7 customers
6. ✅ Starts Telegram bot

---

## The 7 Customers (Auto-Provisioned)

| # | Name | Email |
|---|------|-------|
| 1 | Nancy Lim | nancylimsk@gmail.com |
| 2 | Chana Lohasaptawee | chana.loh@gmail.com |
| 3 | Phaitoon S. | phaitoon2010@gmail.com |
| 4 | Tarida Sukavanich | taridadew@gmail.com |
| 5 | Lily Vergara | lily.vergara@gmail.com |
| 6 | Theera Phetmalaigul | phetmalaigul@gmail.com |
| 7 | John & Noon | vijohn@hotmail.com |

---

## After Deploy

- **API**: http://localhost:4001 (local) or https://api.botcraftwrks.ai (prod)
- **Dashboard**: http://localhost:3000/dashboard (local)
- **Telegram Bot**: @TigerClawScout_bot

---

## Individual Scripts

| Script | What It Does |
|--------|-------------|
| `./deploy.sh local` | Full local deploy |
| `./deploy.sh production` | Full production deploy |
| `./provision-all-customers.sh` | Just provision the 7 customers |
| `./provision-customer.sh email@example.com "Name"` | Add one new customer |

---

## Troubleshooting

**Server won't start?**
```bash
tail -f /tmp/tiger-bot.log
```

**Database issues?**
```bash
curl http://localhost:4001/health
```

**Check provisioned customers:**
```bash
curl http://localhost:4001/admin/tenants/db | python3 -m json.tool
```
