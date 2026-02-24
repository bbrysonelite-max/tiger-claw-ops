# The Two-Key Architecture: Presentation Script

**Duration:** 12–15 minutes  
**Audience:** Investors, customers, agent team, or technical partners  
**Tone:** Direct, confident, grounded in a real failure story  
**Date:** February 14, 2026

---

## SECTION 1: THE FAILURE (2 minutes)

*[Open with silence. Let it land.]*

Here is what happened two weeks ago.

I was on a live Zoom call. Nine people watching. I was demonstrating Tiger Claw — our AI-powered prospecting agent for gig economy workers. I said, "Watch this. The bot is going to find you three qualified leads right now."

The bot went silent.

Not a slow response. Not a bad answer. **Silent.** Dead. Nothing.

My Anthropic API key had expired. Mid-sentence. In front of nine paying customers.

I want you to understand what that feels like. You have sold someone an autonomous employee — a tireless worker that never sleeps, never forgets, never quits. And in the moment they are watching it work for the first time, it dies. Not because the software was broken. Not because the logic was wrong. Because a single API key — a string of characters — ran out of credits.

That is the problem the two-key architecture solves. Not theoretically. Not as a nice-to-have. It exists because I stood in that room and watched it happen.

---

## SECTION 2: THE PRINCIPLE (2 minutes)

The principle is simple. Say it out loud and it sounds obvious:

> **A bot should never go silent.**

If a human employee's phone dies, they borrow someone else's phone and call you back. They do not stand in the corner staring at the wall until someone notices. The two-key architecture gives Tiger Claw a second phone.

Every Tiger Claw ships with two LLM connections. Not one. Two. They are not interchangeable — each has a specific job, a specific cost, and specific rules for when it activates.

| | Fallback Key | Primary Key |
|---|---|---|
| **Who owns it** | We do | The customer does |
| **Provider** | Google Gemini 2.0 Flash | Customer's choice — OpenAI, Anthropic, OpenRouter, Gemini |
| **When it's active** | Onboarding and emergencies | Daily operations |
| **Cost** | $0.002 per customer onboarding | Customer pays their own usage |
| **Can it be removed** | Never. Hardwired. | Customer can swap it anytime |

The fallback key is permanent. It is baked into every bot at birth. It cannot be deleted, overridden, or disabled. It is the bot's survival instinct.

---

## SECTION 3: THE THREE JOBS OF THE FALLBACK KEY (3 minutes)

The fallback key does exactly three things. Not four. Not "whatever is needed." Three.

**Job 1: Onboarding.**

When a new customer taps START on their Tiger Claw for the first time, the bot needs a brain to conduct the interview. It asks six questions about the customer, six questions about their ideal client, generates two briefing documents, and sets up the prospecting configuration. All of this runs on the fallback Gemini key. The customer has not set up their own key yet — they do not even know what an API key is at this point. The fallback handles it.

Cost per onboarding: two-tenths of one cent. At a thousand customers, that is three dollars a month. Total.

**Job 2: Error Recovery.**

This is the job that matters most. When the customer's primary key fails — expired, revoked, out of credits, rate-limited, provider outage — the fallback key wakes up. It does not try to run the full bot. It does one thing: it tells the customer what happened, in plain English, and tells them how to fix it.

"Your OpenAI key stopped working — it might be expired. Check your dashboard at platform.openai.com and type /setkey with a new key. I'll be right here waiting."

Not a stack trace. Not silence. Not a cryptic error code. A human sentence. The bot borrows someone else's phone and calls you back.

**Job 3: Trial Management.**

Every new customer gets 72 hours on our Gemini key. During that window, the bot is fully operational — prospecting, nurturing, running campaigns. At 48 hours, the bot sends a gentle reminder. At 64 hours, a more direct one. At 72 hours, the bot pauses operations and asks for the customer's own key. One command — `/setkey` — and the bot switches to their brain instantly. Zero downtime.

That is it. Three jobs. Onboarding, error recovery, trial management. The fallback key does nothing else.

---

## SECTION 4: THE SWITCHING RULE (2 minutes)

The logic that decides which key to use at any given moment is deterministic. There is no machine learning. There is no "smart routing." There is no ambiguity. The customer's state determines the key. Period.

*[If presenting to a technical audience, show this. If presenting to customers, skip to the next paragraph.]*

```
IF state is ONBOARDING → use fallback key
IF state is ACTIVE → use primary key
IF primary key fails → switch to fallback, tell customer, wait for /setkey
```

Three lines. That is the entire decision tree.

For the non-technical version: when you are setting up your bot, it runs on our brain. When setup is complete and you have entered your own key, it runs on your brain. If your brain has a problem, our brain wakes up just long enough to tell you what happened and how to fix it. Then it goes back to sleep.

There is no scenario where the bot is silent. There is no scenario where the customer is left wondering what happened. There is no scenario where a Zoom call goes dark.

---

## SECTION 5: THE CUSTOMER EXPERIENCE (3 minutes)

Let me walk you through what the customer actually sees. Not the code. The experience.

**Minute 0:** They purchase Tiger Claw. Payment processes. Within five seconds, their Telegram bot is live.

**Minute 1:** They tap START. The bot says hello. It knows their name from the purchase. It says: "I'm your Tiger Claw. Before I start working for you, I need to understand your business and who you're looking for. This takes about five minutes. Ready?"

**Minutes 2–5:** The bot conducts two interviews. Conversational, not a form. "What business are you in?" "Tell me about your ideal customer." "What words would they use to describe their biggest problem?" The bot listens, acknowledges, asks follow-ups. All running on the fallback Gemini key. Cost: two-tenths of a cent.

**Minute 6:** The bot says: "I've got everything I need. I'm going to start finding prospects for you right now. You're running on a free starter brain for the next 72 hours. When you're ready, I'll help you set up your own — it takes two minutes."

**Hour 1:** The bot delivers its first batch of prospects. The customer sees names, profiles, suggested opening messages. The flywheel is spinning.

**Hour 48:** "Hey — just a heads up. Your free trial brain has 24 hours left. Want me to help you set up your own key?"

**Hour 72:** If they have not rotated: "Your starter brain trial has ended. Type /setkey YOUR_KEY and I'll be back in action instantly."

**After rotation:** The bot runs on the customer's key. If that key ever fails — six months later, a year later — the fallback wakes up, delivers the error message, and waits. The bot is never silent.

---

## SECTION 6: THE BUSINESS CASE (2 minutes)

Three numbers.

**$0.002** — the cost per customer onboarding on the fallback key. That is two-tenths of one cent. At a thousand customers, the total monthly fallback cost is three dollars. Not three hundred. Three.

**Zero** — the number of times a customer will see a dead bot. The architecture makes it structurally impossible. The fallback key is hardwired. It cannot be removed. It cannot expire (we control it). It cannot run out of credits (Gemini's free tier handles 15 requests per minute, and the paid tier costs a fraction of a cent).

**Two minutes** — the time it takes a customer to rotate their key. One command: `/setkey` followed by their key. The bot auto-detects the provider from the key prefix, makes a 10-token test call to verify it works, encrypts it with AES-256, stores it, and confirms. The customer never touches a config file, never edits an environment variable, never restarts anything.

The two-key architecture is not a feature. It is the foundation. Every other system — prospecting, nurturing, aftercare, the Hive — calls `getActiveKey()` before making any LLM request. Every system is protected by the error recovery wrapper. Every system benefits from the trial timer. Build this once, and everything else inherits it.

---

## SECTION 7: THE CLOSE (1 minute)

*[Pause. Make eye contact.]*

Two weeks ago, I watched a bot die on a live call. Nine people saw it happen. It was the most embarrassing moment of my professional life.

Today, that failure is structurally impossible. Not because we added a retry loop. Not because we added a monitoring dashboard. Because every Tiger Claw now carries two brains — one that belongs to the customer, and one that belongs to us. And ours never sleeps.

The bot is never silent again.

*[End.]*

---

## SPEAKER NOTES BY AUDIENCE

### For Investors

Emphasize the unit economics. $0.002 per onboarding means the fallback key cost is negligible at any scale. The 72-hour trial creates a natural conversion point — customers must engage with the product within three days, which drives activation rates. The error recovery system reduces churn by eliminating the single biggest reason customers abandon AI tools: unexplained silence. Mention that the architecture supports four LLM providers (OpenAI, Anthropic, OpenRouter, Gemini), which eliminates vendor lock-in risk.

### For the Agent Team (Claude Code, Birdie, Agent Zero)

The code is already committed to `gateway/src/keys/` — seven files, 743 lines. Start with `key-encryption.ts` (simplest, testable in isolation), then `key-validator.ts` (requires a real Gemini key for testing), then `key-manager.ts` (the brain). Integration point is wherever the gateway currently makes LLM calls — replace the direct API call with `getActiveKey()` + `callLLM()`. The migration script resets all 9 existing customers to IDLE state. Test on Tiger_Brent_bot first. Two environment variables needed: `FALLBACK_GEMINI_KEY` and `KEY_ENCRYPTION_SECRET`.

### For Customers

Skip Sections 4 and 6 entirely. Focus on the experience (Section 5). The key message is: "Your bot will never go silent. If anything ever goes wrong with your AI connection, the bot will tell you exactly what happened and exactly how to fix it. One command, two minutes, and you're back." Do not mention AES-256, HTTP status codes, or cron jobs. Do not mention the cost model — customers do not need to know the fallback costs two-tenths of a cent. They need to know the bot always works.

### For Technical Partners / Integrators

Emphasize the clean separation of concerns: encryption is isolated in one file, validation in another, orchestration in a third. The barrel export (`index.ts`) provides a single import point. The `callLLM()` wrapper normalizes four different API formats into one interface. The `handlePrimaryKeyError()` function maps every HTTP status code to a customer-facing message and a retry strategy. The architecture is provider-agnostic — adding a fifth provider (e.g., Mistral, Cohere) requires adding one `test` function to `key-validator.ts` and one branch to `callLLM()`. No other files change.
