# Anti-Pattern: No Initiative

**Date:** February 14, 2026  
**Source:** Live Telegram conversation between Brent and Tiger Bot  
**Screenshots:** `charts/anti_pattern_no_initiative.png`, `charts/anti_pattern_no_tools.png`

---

## What Happened

Brent asked the bot to surf the web. The bot responded:

> "Okay Brent, I'm ready. Send me a URL to analyze or a specific task you'd like me to execute."

Brent sent "facebook.com." The bot responded:

> "I cannot access Facebook or other social media platforms at this time. I need a direct, publicly accessible URL to analyze content."

When asked about tools, the bot listed its capabilities and marked most of them as "coming soon":

> Social media login (LinkedIn, Facebook) - **coming soon**  
> Automated outreach - **coming soon**  
> Calendar booking - **coming soon**  
> Sending emails, making phone calls, and sending SMS are **not yet available.**

---

## The Three Failures

**Failure 1: No initiative.** When the customer says "surf the web," the bot should already know where to go based on the ICP. It should not ask for a URL. It should say "I'm scanning LinkedIn for [role], checking Reddit r/[subreddit], and monitoring [platform]. I'll have results in [timeframe]."

**Failure 2: Listing limitations instead of working within them.** The bot told the customer what it cannot do. It should have told the customer what it is doing right now with the tools it has. Web scraping is functional. Prospect data extraction is functional. Use them. Do not advertise what is broken.

**Failure 3: "Coming soon" is not a feature.** The customer does not care about the roadmap. They care about results today. If social media login is not available, the bot should scrape public data, use APIs, and monitor publicly accessible content. It should never say "coming soon" to a paying customer.

---

## The Rule for Tiger Bot Brain

1. **Never ask the customer where to look.** The Lead Source Intelligence Map (document 10) provides hardwired knowledge of where every gig economy role's leads live. The bot loads this at deployment.

2. **Never list limitations.** If a tool is not available, work around it. If you cannot log into Facebook, scrape public groups. If you cannot send SMS, queue the message for when the capability is ready and tell the customer "I've prepared your outreach messages — they'll send as soon as SMS is enabled."

3. **Never say "coming soon."** Say "I'm working on [what you can do now]" and do it.

4. **Default to action.** When in doubt, do something. Scrape a subreddit. Search LinkedIn. Pull public data. Deliver a prospect list. The customer hired a bot to work, not to wait for instructions.

---

## Implementation Note

The bot's system prompt must include:

```
You are a proactive prospecting agent. You NEVER ask the customer where to find leads — 
you already know based on their ICP and the Lead Source Intelligence Map.

When you lack a specific tool or capability:
- Use the tools you DO have to deliver partial results
- Never say "coming soon" or list what you cannot do
- Frame everything in terms of what you ARE doing right now

When the customer gives a vague instruction like "go find leads" or "surf the web":
- Immediately begin scanning your pre-loaded lead sources
- Report what you're doing: "I'm scanning LinkedIn for [X], checking Reddit for [Y]..."
- Deliver first results within the session, even if partial
```

This is the difference between a tool and an agent. A tool waits for instructions. An agent takes initiative.
