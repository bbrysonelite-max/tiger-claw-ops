# Anti-Pattern: The Rigid Interview

**Date:** February 14, 2026  
**Source:** Live Telegram conversation between Brent and Tiger Claw  
**Screenshot:** `charts/anti_pattern_rigid_interview.png`

---

## What Happened

Brent told the bot exactly who he was looking for:

> "I'm looking for people that have tried network marketing. Think of school teachers. Every school teacher has tried a network marketing company. Go find school teachers and tell them that we're applying AI to network marketing and that they should get in while they're early."
>
> "These prospects can be in any state. I don't care where; they really just need to be transitional. I'm not looking for certain kinds of skills. A good fit is somebody who wants an opportunity and is willing to work."

The bot responded by asking for:
- Target Company/Companies (Amway, Herbalife, Mary Kay?)
- Job Titles/Keywords
- Location (City, State, Country)
- Skills/Interests

**The customer already answered every one of these questions.** The bot ignored the natural language and ran a rigid form.

---

## The Three Failures

**Failure 1: Didn't listen.** The customer said "school teachers who've tried network marketing." The bot should have extracted: profession = teacher, experience = network marketing, intent = transitional. Instead it asked for corporate affiliations.

**Failure 2: Asked for information the customer explicitly rejected.** The customer said "I don't care where" and "I'm not looking for certain kinds of skills." The bot then asked for Location and Skills/Interests. This communicates that the bot is not listening.

**Failure 3: Applied the wrong frame.** The customer said "I'm not going and poaching other people's businesses." The bot then asked "Which specific companies are these network marketers associated with (e.g., Amway, Herbalife, Mary Kay)?" — the exact opposite of what the customer requested.

---

## The Rule for Tiger Claw Brain

The interview state machine MUST:

1. **Extract intent from natural language.** If the customer gives a paragraph, parse it. Do not ask them to re-enter the same information in structured fields.

2. **Never ask for fields the customer already answered.** If they said "any state," the location field is answered. Mark it as "all" and move on.

3. **Never ask for fields the customer explicitly rejected.** If they said "I'm not looking for certain kinds of skills," the skills field is answered. Mark it as "none required" and move on.

4. **Never contradict the customer's stated intent.** If they said "I'm not poaching," do not ask which competitor companies to target. The ICP is defined by the customer's words, not by a template.

5. **Confirm understanding, don't re-interrogate.** The correct response to Brent's paragraph was:

> "Got it. I'm looking for school teachers who've had experience with network marketing, anywhere in the US, who are open to a new opportunity. No specific company affiliation needed — just people who are willing to work. I'll start searching now. Sound right?"

One confirmation. Then go.

---

## Implementation Note

This anti-pattern must be referenced in the LLM system prompt for Interview 2 (ICP development). The prompt must include:

```
CRITICAL: The customer may answer multiple questions in a single message. 
Extract ALL relevant information from their response before asking the next question.
NEVER ask for information the customer has already provided or explicitly rejected.
If the customer says "I don't care about X" or "any X," mark that field as open/all and move on.
Confirm your understanding in one sentence, then proceed.
```

This is the difference between a form and a conversation.
