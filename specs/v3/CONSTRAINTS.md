# Assets & Constraints

## 1. THE "MINI-RAG" REPOSITORY
- **Action:** HARVEST ONLY.
- **Do Not:** Do not install the entire repo as a submodule.
- **Do:** 
  - Copy the `web_search` logic (Puppeteer scripts).
  - Copy the `text_chunker` logic.
  - **Discard** the Vector DB (Chroma/Pinecone) logic. Use the project's native `pgvector` (Supabase) instead.

## 2. HARDWARE CONSTRAINTS
- **Target Workers:** 2x Mac Pro (Late 2013 "Trash Can")
  - CPU: Intel Xeon E5 (x86_64)
  - RAM: 64GB each
- **Dev Machine:** Mac Pro (2019 "Cheese Grater")
  - **RESTRICTION:** Do not configure this machine as a Worker Node. It is for Development only.
- **Cloud Gateway:**
  - Must run on Linux (Railway/AWS).
  - Must NOT contain any Puppeteer/Scraping logic (keep the Gateway lightweight).

## 3. DEVELOPER REQUIREMENTS (Human Actions)
- **Telegram Session:** The Agents cannot log in to Telegram for you.
  - You must run `npm run generate-session` locally.
  - Enter your phone number and code.
  - Copy the string to `.env` as `TELEGRAM_SESSION_STRING`.
- **Redis:** You must have a Redis instance (Upstash or Local) running for the code to boot.
