# Tiger Bot Scout — Enhanced Bot Specification

## Overview

Upgrade from basic command bot to **proactive AI recruiting assistant** with:
1. Script library (uploadable, categorized, multi-language)
2. Proactive follow-ups and reminders
3. Prospecting suggestions (where to find prospects)
4. Multi-language support (Thai, English, Spanish) with **conceptual translation**
5. Max Steingart methodology integration

---

## NEW FEATURES

### 1. SCRIPT LIBRARY SYSTEM

Instead of only AI-generated scripts, users can access a **curated library** of proven scripts.

**Script Categories (Max Steingart methodology):**
| Category | Purpose | Example |
|----------|---------|---------|
| `opening` | Start conversations naturally | "Hey! I noticed we're both in the same group..." |
| `qualifying` | Determine if they're a fit | "What do you do for work? How's that going?" |
| `transition` | Move to business intro | "I might have something that could help..." |
| `objection` | Handle common pushback | "I don't have time" → Response |
| `follow_up` | Re-engage cold prospects | "Hey! Just checking in..." |
| `closing` | Ask for the commitment | "Ready to get started?" |

**Database Schema:**
```sql
CREATE TABLE script_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,          -- opening, qualifying, transition, etc.
    name TEXT NOT NULL,              -- "Curiosity Opener"
    content_en TEXT NOT NULL,        -- English version
    content_th TEXT,                 -- Thai version (conceptual, not literal)
    content_es TEXT,                 -- Spanish version
    source TEXT,                     -- "Max Steingart", "Hive Learning", "Custom"
    context TEXT,                    -- "Facebook group", "LinkedIn", "Cold DM"
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scripts_category ON script_library(category);
CREATE INDEX idx_scripts_source ON script_library(source);
```

**New Commands:**
| Command | What It Does |
|---------|-------------|
| `/scripts` | Browse script library by category |
| `/scripts opening` | Show all opening scripts |
| `/scripts thai` | Show scripts in Thai |
| `/use <script_name>` | Get full script with language options |

**Example Flow:**
```
User: /scripts opening

Bot: 📚 *Opening Scripts*

1. *Curiosity Opener* (Max Steingart)
   "Hey! I noticed we're in the same group. What made you join?"
   ✅ 47 successful uses

2. *Compliment Opener* (Max Steingart)
   "Love your posts! You seem like someone who's going places."
   ✅ 32 successful uses

3. *Mutual Interest* (Hive Learning)
   "Saw your comment about [topic]. I've been thinking the same thing!"
   ✅ 28 successful uses

Type /use <name> for full script with Thai/Spanish versions
```

---

### 2. MULTI-LANGUAGE SUPPORT (Conceptual Translation)

**NOT literal translation. Conceptual/cultural adaptation.**

**Example — Opening Script:**

| Language | Script |
|----------|--------|
| **English** | "Hey! I noticed we're in the same group. What brought you here?" |
| **Thai** | "สวัสดีค่ะ! เห็นว่าอยู่กลุ่มเดียวกัน สนใจเรื่องอะไรเป็นพิเศษคะ?" |
| **Spanish** | "¡Hola! Vi que estamos en el mismo grupo. ¿Qué te trajo aquí?" |

**Key Translation Principles:**
1. **Tone** — Thai is more polite/indirect, Spanish is warmer/direct
2. **Politeness particles** — Thai uses ครับ/ค่ะ, Spanish uses usted/tú
3. **Cultural context** — Thai avoids direct sales talk, Spanish embraces relationships
4. **Length** — Thai can be more concise, Spanish more expressive

**Bot Language Commands:**
| Command | What It Does |
|---------|-------------|
| `/lang th` | Set default language to Thai |
| `/lang es` | Set default language to Spanish |
| `/lang en` | Set default language to English |
| `/translate <text>` | Translate any text conceptually |

**Auto-Detect:**
When generating scripts, bot detects prospect's language from their signal/notes and generates in appropriate language.

---

### 3. PROACTIVE FEATURES

**A. Follow-Up Reminders**

Bot tracks when you got a script and reminds you to follow up.

```
[48 hours after script generated]

Bot: 🐯 *Follow-Up Reminder*

You generated a script for *Somchai K.* 2 days ago.

Status: No feedback yet

Options:
[📝 New Script] [⏰ Remind Tomorrow] [✅ Mark Contacted] [❌ Skip]
```

**B. Pipeline Health Alerts**

```
[Weekly, or when pipeline gets stale]

Bot: 🐯 *Pipeline Health Check*

⚠️ You have 12 prospects with no activity in 7+ days:
- Somchai K. (contacted 10 days ago)
- Nattaya P. (contacted 8 days ago)
- ... 10 more

Suggested action: Send follow-up messages

[📋 Show All] [📝 Get Follow-Up Scripts] [🗑️ Archive Old]
```

**C. "No Prospects Today" Suggestions**

When daily report has 0 new prospects:

```
Bot: 🐯 *Daily Report — February 6, 2026*

No new prospects found in the last 24 hours.

*But here's where to look today:*

🔍 *Facebook Groups* (Thai market)
- "รายได้เสริม ทำที่บ้าน" (Side income work from home)
- "แม่บ้านหารายได้" (Housewives earning money)
- "ธุรกิจเครือข่าย ประเทศไทย" (Network marketing Thailand)

🔍 *LINE OpenChat*
- "หารายได้เสริม 2026"
- "สุขภาพดี ชีวิตดี"

🔍 *LinkedIn* (English market)
- Search: "looking for opportunities" + Thailand
- Search: "health and wellness" + Bangkok

💡 *Pro Tip:* Look for posts containing:
- "tired of my job"
- "need extra income"
- "anyone doing wellness business?"

Type /script <name> when you find someone!
```

**D. Daily "Suggested Action"**

Every morning report ends with ONE clear action:

```
---
🎯 *Today's Suggested Action:*
Follow up with Somchai K. — contacted 3 days ago, no response yet.
Use: /followup Somchai
```

---

### 4. MAX STEINGART METHODOLOGY INTEGRATION

**The 4-Step Formula (built into bot flow):**

```
STEP 1: CONNECT
- Find prospects in groups/feeds
- Send friend request or follow
- Bot helps: /prospects suggest where to look

STEP 2: QUALIFY
- Start conversation with opening script
- Ask qualifying questions
- Bot helps: /scripts qualifying

STEP 3: INVITE
- Transition to business opportunity
- Share info/video/call
- Bot helps: /scripts transition

STEP 4: CLOSE/FOLLOW-UP
- Handle objections
- Follow up consistently
- Bot helps: /objection, /followup
```

**Pre-Loaded Scripts from Max Steingart Methodology:**

```sql
-- Opening Scripts
INSERT INTO script_library (category, name, content_en, content_th, source, context) VALUES
('opening', 'Curiosity Opener',
 'Hey! I noticed we''re in the same group. What got you interested in [topic]?',
 'สวัสดีค่ะ! เห็นว่าเราอยู่กลุ่มเดียวกัน สนใจเรื่อง [topic] ด้วยเหรอคะ?',
 'Max Steingart', 'Facebook Group'),

('opening', 'Compliment Opener',
 'Hey! I''ve been seeing your posts and love your energy. How long have you been into [interest]?',
 'สวัสดีค่ะ! ติดตามโพสต์มาสักพัก ชอบความคิดเห็นของคุณมากค่ะ ทำเรื่อง [interest] มานานแค่ไหนแล้วคะ?',
 'Max Steingart', 'Facebook/LinkedIn'),

('opening', 'Value-First Opener',
 'Hey! Saw your question about [topic]. I actually have some experience with that — happy to share if you''d like!',
 'สวัสดีค่ะ! เห็นคำถามเรื่อง [topic] พอดีมีประสบการณ์เรื่องนี้ ถ้าสนใจแชร์ได้นะคะ!',
 'Max Steingart', 'Any');

-- Qualifying Scripts
INSERT INTO script_library (category, name, content_en, content_th, source, context) VALUES
('qualifying', 'The Job Question',
 'So what do you do for work? How''s that going for you?',
 'ตอนนี้ทำงานอะไรอยู่คะ? เป็นยังไงบ้าง?',
 'Max Steingart', 'After opening'),

('qualifying', 'The Dream Question',
 'If you could do anything and money wasn''t an issue, what would you be doing?',
 'ถ้าไม่ต้องกังวลเรื่องเงิน อยากทำอะไรมากที่สุดคะ?',
 'Max Steingart', 'Deep qualifying'),

('qualifying', 'The Open Question',
 'Are you open to looking at other ways to make money, or are you totally happy with what you''re doing?',
 'เปิดรับโอกาสใหม่ๆ ในการหารายได้เสริมไหมคะ หรือตอนนี้โอเคกับงานที่ทำอยู่?',
 'Max Steingart', 'Key qualifying question');

-- Transition Scripts
INSERT INTO script_library (category, name, content_en, content_th, source, context) VALUES
('transition', 'The Soft Intro',
 'You know, based on what you just told me, I might have something that could help. Would you be open to taking a look?',
 'จากที่คุยกันมา คิดว่ามีอะไรที่น่าจะช่วยคุณได้นะคะ สนใจดูข้อมูลไหมคะ?',
 'Max Steingart', 'After qualifying'),

('transition', 'The No-Pressure Intro',
 'I''m not sure if it would be a fit for you, but I work with a company in the wellness space. Would you be open to hearing about it?',
 'ไม่แน่ใจว่าจะตรงกับที่มองหาไหม แต่ทำธุรกิจด้านสุขภาพอยู่ค่ะ สนใจฟังข้อมูลไหมคะ?',
 'Max Steingart', 'Soft transition'),

('transition', 'The Time Freedom',
 'I help people create extra income without giving up their day job. It''s changed things for me — happy to share more if you''re curious.',
 'ช่วยคนสร้างรายได้เสริมโดยไม่ต้องลาออกจากงานประจำค่ะ เปลี่ยนชีวิตมากเลย ถ้าอยากรู้เพิ่มบอกได้นะคะ',
 'Max Steingart', 'Income focus');

-- Objection Scripts
INSERT INTO script_library (category, name, content_en, content_th, source, context) VALUES
('objection', 'No Time',
 'I totally get it — I felt the same way. What if I told you it only takes 30 minutes a day to get started? Would that be doable?',
 'เข้าใจเลยค่ะ ตอนแรกก็คิดแบบนั้น แต่ถ้าบอกว่าใช้เวลาแค่วันละ 30 นาที ลองได้ไหมคะ?',
 'Max Steingart', 'Time objection'),

('objection', 'No Money',
 'I hear you. The good news is, most people make back their starter cost within the first week. Would it help if I showed you how?',
 'เข้าใจค่ะ ข่าวดีคือคนส่วนใหญ่คืนทุนได้ภายในสัปดาห์แรก ถ้าอธิบายวิธีให้ฟัง สนใจไหมคะ?',
 'Max Steingart', 'Money objection'),

('objection', 'Is This MLM',
 'Great question! Yes, it''s network marketing. The difference is how we do it — no pushy tactics, just sharing products we love. Most of my sales come from social media, not chasing friends.',
 'คำถามดีค่ะ! ใช่ค่ะ เป็นธุรกิจเครือข่าย แต่วิธีทำต่างจากที่เคยเห็น ไม่มีการไล่ล่าเพื่อน ส่วนใหญ่หาลูกค้าจากโซเชียลค่ะ',
 'Max Steingart', 'MLM objection'),

('objection', 'I Need To Think',
 'Of course! What specifically do you want to think about? Maybe I can help clarify.',
 'ได้เลยค่ะ! มีอะไรที่อยากให้อธิบายเพิ่มไหมคะ? อาจช่วยให้ตัดสินใจง่ายขึ้น',
 'Max Steingart', 'Stalling objection');

-- Follow-Up Scripts
INSERT INTO script_library (category, name, content_en, content_th, source, context) VALUES
('follow_up', 'The Check-In',
 'Hey! Just checking in. Did you get a chance to look at that info I sent?',
 'สวัสดีค่ะ! แวะมาทักทาย ได้ดูข้อมูลที่ส่งไปแล้วยังคะ?',
 'Max Steingart', 'After sending info'),

('follow_up', 'The Value Add',
 'Hey! Thought of you when I saw this article about [topic]. Hope you''re doing well!',
 'สวัสดีค่ะ! เห็นบทความนี้แล้วนึกถึงเลย [topic] หวังว่าสบายดีนะคะ!',
 'Max Steingart', 'Soft follow-up'),

('follow_up', 'The Direct Ask',
 'Hey! I know you said you''d think about it. Any questions I can answer to help you decide?',
 'สวัสดีค่ะ! รู้ว่าบอกจะคิดดู มีคำถามอะไรที่ช่วยตอบได้ไหมคะ?',
 'Max Steingart', 'After waiting');
```

---

### 5. NEW COMMAND SUMMARY

| Command | Description |
|---------|-------------|
| `/scripts` | Browse script library |
| `/scripts <category>` | Filter by category (opening, qualifying, etc.) |
| `/scripts <language>` | Filter by language (th, es, en) |
| `/use <script_name>` | Get full script with all language versions |
| `/lang <code>` | Set your default language |
| `/translate <text>` | Conceptually translate any text |
| `/followup <name>` | Get follow-up script for a prospect |
| `/suggest` | Where to find prospects today |
| `/pipeline health` | Check for stale prospects |
| `/remind <name> <days>` | Set follow-up reminder |

---

### 6. PROACTIVE MESSAGE SCHEDULE

| When | What Bot Sends |
|------|----------------|
| 7 AM daily | Daily prospect report + suggested action |
| 48h after script | Follow-up reminder |
| Weekly (Monday) | Pipeline health check |
| If 0 prospects today | Suggestions where to look |
| After conversion | Celebration + "Who else can you help?" prompt |

---

## IMPLEMENTATION PRIORITY

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Script library database + `/scripts` command | Medium |
| 2 | Pre-load Max Steingart scripts (EN + TH) | Low |
| 3 | Follow-up reminders (48h after script) | Medium |
| 4 | `/suggest` — prospecting suggestions | Low |
| 5 | Spanish translations | Medium |
| 6 | Pipeline health alerts | Low |
| 7 | Auto language detection | Medium |

---

## SOURCES

- [Max Steingart Official Site](https://maxsteingart.com/) — Social Networking Scripts Book
- [Social Network Boot Camp](https://maxsteingart.clickfunnels.com/boot-camp-october2022) — 4-Step Formula Training
- [Max Steingart LinkedIn](https://www.linkedin.com/in/maxsteingart/) — Background

---

## SPANISH BOT NOTES

When ready for Spanish market:

1. **Same bot, different language setting** — OR create separate `@TigerBotScout_es`
2. **Cultural adaptation**:
   - More relationship-focused messaging
   - "Usted" vs "Tú" (formal vs informal)
   - Latin America vs Spain Spanish variations
3. **Prospect sources**:
   - Facebook Groups (huge in LatAm)
   - WhatsApp (more common than Telegram)
   - Instagram DMs

Consider: Spanish market may need WhatsApp bot, not just Telegram.
