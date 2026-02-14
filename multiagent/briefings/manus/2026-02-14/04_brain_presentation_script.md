# Tiger Bot Brain: Presentation Script

**Duration:** 18–22 minutes  
**Audience:** Investors, team members, agent developers, or customers  
**Tone:** Direct, confident, no fluff. You lived the failure. Now you're showing the fix.

---

## OPENING — The Zoom Story (2 minutes)

> "Let me tell you what happened on a live Zoom call with my first nine customers.
>
> I was demonstrating Tiger Bot — the AI prospecting system I've been building for gig economy workers. Network marketers, hair stylists, rideshare drivers, freelancers — people who need customers but don't have a marketing department.
>
> In the middle of the demo, my API key died. The bot went brain-dead. On camera. In front of the people who had already paid me.
>
> Nine people watched my product do absolutely nothing.
>
> That was the most humiliating moment of my professional career. But it was also the most important, because it showed me exactly what needed to be built — and what could never be allowed to happen again.
>
> What I'm about to show you is the system that makes that impossible."

---

## SECTION 1 — The Two-Key Architecture (3 minutes)

> "Every Tiger Bot now ships with two brains. Not one. Two.
>
> The first is a fallback key — that's mine. It's a Google Gemini key hardwired into every bot. It costs me two-tenths of a cent per customer to run an entire onboarding. At a hundred customers, my total cost is twenty cents. It is always present. It never gets removed.
>
> The second is the customer's own key. They choose their provider — OpenAI, Gemini, Qwen, OpenRouter — and they pay for their own usage. That key handles all the daily work: prospecting, nurturing, reports.
>
> Here's the rule: if the customer's key is working, my fallback key sleeps. The moment their key fails — expired, out of credits, rate limited, anything — my fallback key wakes up. But it wakes up for exactly one purpose: to tell the customer what happened and how to fix it.
>
> The bot is never silent again. It always has a voice, even if that voice is just saying 'I need help.'
>
> What happened on that Zoom call? That can never happen again. This architecture makes it structurally impossible."

**[Pause. Let that land.]**

---

## SECTION 2 — The State Machine (2 minutes)

> "The bot's brain runs on a state machine. Six states, linear progression. Every customer moves through the same path.
>
> State one: IDLE. The bot exists but hasn't been activated yet. It's waiting for the customer to tap START in Telegram.
>
> State two: WELCOME. Customer taps START, the bot greets them by name and asks if they're ready to begin setup. This is a fixed template — no AI cost, no variability. Consistent every time.
>
> State three: INTERVIEW ONE. The bot asks six questions about the customer — who they are, what they do, their experience, their mission. It's conversational, not a form. The AI acknowledges each answer naturally, then moves to the next question.
>
> State four: INTERVIEW TWO. Six questions about their ideal customer — who they're looking for, what problems they solve, where their prospects hang out online, what keywords to monitor.
>
> State five: KEY PROMPT. The bot explains the 72-hour free trial and helps them set up their own API key.
>
> State six: ACTIVE. The bot is fully operational. Prospecting, nurturing, delivering leads.
>
> And there's a seventh state — ERROR RECOVERY — which is the fallback system I just described. If anything breaks, the bot catches it, tells the customer, and waits for the fix.
>
> Forward motion only. No going backward. No getting stuck."

---

## SECTION 3 — The Onboarding Interview (4 minutes)

> "Let me walk you through what the customer actually experiences.
>
> They buy Tiger Bot on Stan Store. Payment goes through Stripe. Within seconds, a Telegram bot is created just for them — their own dedicated bot, not a shared one. They get a welcome email with a link.
>
> They click the link, open Telegram, and tap START.
>
> The bot says: 'Hey Nancy! I'm your Tiger Bot — your personal AI prospecting machine. I'm going to help you find customers, nurture them, and close deals while you focus on what you do best. But first, I need to learn about you. It'll take about five minutes. Ready to get started?'
>
> Nancy says yes.
>
> The bot asks: 'What's your full name — first and family name?'
>
> She answers. The bot says something like: 'Great to meet you, Nancy Lim. Next question — what's the best phone number to reach you?'
>
> It's a conversation, not a survey. The AI acknowledges each answer warmly — one or two sentences — then moves on. Six questions total:
>
> Name. Phone number. What's your business. How long have you been doing it. What's your mission — what does success look like. And how are you finding customers right now.
>
> Behind the scenes, after each answer, a separate AI call extracts the structured data — business type, experience level, pain points — and stores it. If the answer is unclear, the bot asks a gentle follow-up. It never skips a question. It never lectures.
>
> When Interview One is done, the bot generates a Customer Briefing — a markdown file that becomes the bot's permanent memory of who this person is.
>
> Then it says: 'Great — I've got a solid picture of you and your business. Now I need to understand who you're looking for. Who's your ideal customer? Six more questions.'
>
> Interview Two asks: Describe your ideal customer. What problem do they have that you solve. Where do they hang out online. What keywords would they use. What triggers them to buy. And who should I avoid.
>
> On completion, the bot generates an Ideal Customer Profile — another markdown file with the prospecting configuration baked in. Keywords to monitor. Platforms to watch. Exclusion criteria.
>
> Total time: about five minutes. Total AI cost to me: two-tenths of a cent. And now the bot knows exactly who it's working for and exactly who it's hunting."

---

## SECTION 4 — The 72-Hour Key Rotation (3 minutes)

> "After both interviews, the bot says: 'One more thing before I get to work. Right now I'm running on a starter brain that Brent provided for your first 72 hours — totally free. After that, you'll need your own AI key. It costs about one to ten dollars a month, and it takes about two minutes to set up. Want me to walk you through it now, or later?'
>
> If they say now, the bot walks them through it — pick a provider, go to their dashboard, copy the key, come back and type slash-setkey followed by the key. The bot auto-detects which provider it is from the key prefix. It makes a test call to verify it works. If valid, it switches over instantly. If invalid, it tells them exactly what went wrong.
>
> If they say later, the bot says no problem and starts working on the free trial key.
>
> At 48 hours, the bot sends a reminder. At 64 hours, another reminder — more urgent. At 72 hours, the trial ends. The bot says: 'Your starter brain trial has ended. Type slash-setkey with your own key to get me back to work.'
>
> If they don't rotate, the bot pauses. It doesn't die. It doesn't go silent. It responds to every message with: 'I'm paused until you add your API key. Type slash-setkey and I'll be back in action instantly.'
>
> My cost exposure is capped at 72 hours of Gemini Flash usage per customer. After that, they're on their own key. And if their key ever fails in the future, the fallback wakes up, tells them what happened, and goes back to sleep when they fix it."

---

## SECTION 5 — Error Recovery (2 minutes)

> "This is the part that exists because of what happened on that Zoom call.
>
> When the customer's API key fails — for any reason — the bot does not crash. It does not go silent. It does not show a stack trace.
>
> It catches the error silently. It switches to the Gemini fallback. And it sends a plain-English message based on what went wrong.
>
> If the key is expired or revoked: 'Your AI key stopped working. Check your dashboard and type slash-setkey with a new one.'
>
> If they hit a rate limit: 'Your key hit its usage limit. This usually resets in an hour. I'll try again automatically.'
>
> If they're out of credits: 'Your account ran out of credits. Add more and I'll pick right back up.'
>
> If the provider itself is down: 'Your AI provider is having technical issues. This isn't on your end. I'll keep trying every 15 minutes.'
>
> For temporary errors — rate limits, server issues — the bot retries automatically with increasing wait times. For permanent errors — expired key, no credits — it waits for the customer to fix it.
>
> The customer never sees a dead bot. Ever."

---

## SECTION 6 — The Build Plan (2 minutes)

> "This is a six-step build, estimated at three days for a competent developer.
>
> Day one: the slash-start handler. When a customer taps START, the bot greets them by name. This is pure template substitution — zero AI calls. We can test it on all nine existing bots immediately.
>
> Day one to two: the conversation engine. The state machine that routes messages based on customer state, calls Gemini for natural conversation, extracts structured data, and advances through the interview.
>
> Day two: Interview Two and briefing generation. Same engine, different questions. Two markdown files generated per customer.
>
> Day two to three: the slash-setkey command. Key detection, validation, encryption, and provider switching.
>
> Day three: error recovery. Try-catch on every primary key call, fallback to Gemini, human-readable error messages.
>
> Day three: the timer system. 48-hour and 64-hour reminders, 72-hour pause.
>
> Each step has a specific test. Each test can be run on the nine bots that already exist. We don't need new infrastructure to start — we need the bot to talk."

---

## CLOSING — What This Means (2 minutes)

> "Right now, nine people have Tiger Bots that do nothing. They tapped START and got silence. That changes with this build.
>
> After three days of development, those same nine people will tap START and get a bot that greets them by name, interviews them about their business, learns who their ideal customer is, helps them set up their own AI key, and starts prospecting for them.
>
> And if anything ever goes wrong with their AI connection — their key expires, their credits run out, their provider goes down — the bot will tell them what happened and how to fix it. In plain English. Every time.
>
> The bot is never silent again.
>
> That's the Tiger Bot brain."

**[End.]**

---

## Speaker Notes

**If presenting to investors or partners:** Emphasize the unit economics. Two-tenths of a cent per onboarding. 72-hour cap on your cost exposure. Customer pays for their own AI after that. The fallback key is insurance, not expense.

**If presenting to the agent team (Agent Zero, Birdie, Claude Code Terminal):** Emphasize the implementation sequence and test criteria. Each step has a pass/fail test. The state machine is the contract — if the bot is in state X, it does Y. No ambiguity.

**If presenting to customers:** Skip the technical details. Focus on the experience: "You tap START, the bot learns about you in five minutes, and then it goes to work finding you customers. If anything ever breaks, it tells you how to fix it."

**On the Zoom story:** Use it. It's real, it's vulnerable, and it proves you learned from failure. People trust founders who admit mistakes more than founders who pretend everything is perfect.
