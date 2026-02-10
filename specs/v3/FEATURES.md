# Feature Specifications

## F-01: Virtual Fleet Routing
**Description:** Decouples the Webhook Listener from the Bot Logic using a hash map.
**Logic Flow:**
1.  **Ingress:** Cloud Gateway receives `POST /webhooks/:token_hash`.
2.  **Queue:** Gateway pushes `{ hash: req.params.token_hash, update: req.body }` to Redis `inbound` queue.
3.  **Routing:** 
    - Worker pulls job.
    - Queries DB: `SELECT botToken FROM Tenant WHERE botTokenHash = job.hash`.
    - Decrypts Token.
    - Instantiates `const bot = new TelegramBot(token, { polling: false });`.
    - Passes `update` to existing command handlers.

## F-02: Automated Provisioning (The Userbot)
**Description:** Automates bot creation via BotFather using `gramjs`.
**Logic Flow:**
1.  **Trigger:** Stripe Webhook `subscription.created`.
2.  **Action:** Worker loads `TELEGRAM_SESSION_STRING` (MTProto Session) from env.
3.  **Interaction:** 
    - Worker sends `/newbot` to `@BotFather`.
    - Worker sends Name: `Tiger Bot - {CustomerName}`.
    - Worker sends User: `Tiger_{RandomID}_bot`.
    - Worker parses the returned Token using Regex.
4.  **Storage:** Encrypts Token, generates Hash, saves to DB.
5.  **Webhook:** Worker calls `setWebhook` on the new token pointing to Cloud Gateway.

## F-03: Prospect Enrichment (Mini-RAG Harvest)
**Description:** Port the logic from the existing "Mini-RAG" repo to scrape and summarize prospects.
**Logic Flow:**
1.  **Trigger:** Prospect added manually or via list import.
2.  **Scrape:** Puppeteer (on Trash Can) searches Google for `"{Name}" "Nu Skin" OR "MLM"`.
3.  **Chunking:** Use the `chunking_strategy` from Mini-RAG repo to split text.
4.  **Vectorize:** Generate embeddings for chunks.
5.  **Summary:** Use LLM to generate a 3-sentence summary of the prospect's likely needs.

## F-04: Hive Learning
**Description:** Semantic search for successful sales scripts.
**Logic Flow:**
1.  **Input:** User asks "How do I approach a stressed mom?"
2.  **Vector:** Embed the query ("stressed mom").
3.  **Search:** Query `HivePattern` table using `pgvector` for nearest neighbors.
4.  **Output:** Return scripts that worked for similar profiles.
