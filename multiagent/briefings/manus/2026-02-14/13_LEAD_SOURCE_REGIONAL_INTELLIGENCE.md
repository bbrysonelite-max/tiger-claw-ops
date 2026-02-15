# Lead Source Intelligence: Regional Map

**Status:** APPROVED — Hardwire into every Tiger Bot at deployment  
**Date:** 2026-02-14  
**Author:** Manus AI  
**For:** Claude Code, Birdie, Agent Zero  
**Depends on:** `10_LEAD_SOURCE_INTELLIGENCE.md` (universal + role-specific sources)

---

## Purpose

Document `10_LEAD_SOURCE_INTELLIGENCE.md` defines universal and role-specific lead sources. This document adds the **regional layer**. The bot must know that a hair stylist in Bangkok hunts on LINE and Pantip, not Yelp and Craigslist. A network marketer in Nigeria hunts on WhatsApp groups and Nairaland, not Reddit.

**The rule:** During onboarding Interview 1, the customer tells us where they are located. The bot loads the regional source overlay automatically. The customer is never asked which platforms to use.

---

## How the Three Layers Stack

```
Layer 1: Universal Sources (always active, all regions)
    LinkedIn, Reddit, Facebook Groups, Google, Telegram, Twitter/X, YouTube

Layer 2: Role-Specific Sources (loaded after Interview 1 identifies the role)
    e.g., Network Marketer → r/antiMLM, r/sidehustle, MLM forums

Layer 3: Regional Sources (loaded after Interview 1 identifies location)
    e.g., Thailand → LINE OpenChat, Pantip, Jobthai, Wongnai
```

All three layers are active simultaneously. Regional sources supplement — they do not replace — the universal and role-specific sources.

---

## Region: Southeast Asia (Thailand, Vietnam, Philippines, Indonesia, Malaysia)

### Primary Platforms

| Platform | Why | Coverage |
|----------|-----|----------|
| **LINE** (OpenChat groups) | #1 messaging app in Thailand. OpenChat has thousands of business/gig groups. Business accounts are standard. | Thailand, Japan, Taiwan |
| **Pantip.com** | Thailand's largest discussion forum. Every industry has active threads. People ask for recommendations, complain, and share experiences. Equivalent to Reddit for Thailand. | Thailand |
| **Wongnai** | Thailand's Yelp equivalent. Service providers (stylists, restaurants, photographers) have profiles with reviews. | Thailand |
| **Jobthai / JobsDB** | Largest job boards in Thailand and SEA. Gig workers post resumes and search for flexible work. | Thailand, SEA |
| **Shopee / Lazada seller forums** | E-commerce sellers are gig economy participants. Seller communities discuss strategies, tools, and frustrations. | All SEA |
| **Grab / Gojek driver communities** | Driver forums on Facebook and Telegram. Rideshare and delivery workers share tips and vent frustrations. | All SEA |
| **Kaskus** | Indonesia's largest forum. Equivalent to Pantip for Indonesia. | Indonesia |
| **GCash / Maya communities** | Filipino gig workers discuss payments and opportunities in GCash-related groups. | Philippines |
| **Zalo** | Vietnam's #1 messaging app. Business groups and communities are active. | Vietnam |
| **WeChat** | Dominant in China and Chinese diaspora communities across SEA. Business groups, mini-programs. | China, Singapore, Malaysia |

### Regional Messaging Behavior

In Southeast Asia, **messaging apps ARE social media**. LINE in Thailand is not just for chatting — it is where businesses operate, where groups form around industries, and where leads are found. The bot must prioritize LINE OpenChat groups over Facebook Groups when the customer is in Thailand.

**SMS outreach remains mandatory** in SEA. Phone numbers are the primary identifier. WhatsApp is secondary to LINE in Thailand but primary in Indonesia and Philippines.

---

## Region: Europe (EU, UK, Nordics, Eastern Europe)

### Primary Platforms

| Platform | Why | Coverage |
|----------|-----|----------|
| **XING** | Professional network dominant in Germany, Austria, Switzerland (DACH region). Equivalent to LinkedIn for German-speaking markets. Many professionals use XING instead of or alongside LinkedIn. | Germany, Austria, Switzerland |
| **VKontakte (VK)** | Russia and Eastern Europe's largest social network. 70M+ active users. Groups, communities, and business pages. | Russia, Ukraine, Belarus, Kazakhstan |
| **Leboncoin** | France's largest classifieds platform. Service providers, freelancers, and gig workers list here. | France |
| **Gumtree** | UK's Craigslist equivalent. Services, gig postings, and freelancer listings. | UK, Australia |
| **Kleinanzeigen (formerly eBay Kleinanzeigen)** | Germany's largest classifieds. Service providers and gig workers post here. | Germany |
| **Bolt / Wolt driver communities** | European rideshare and delivery drivers. Forums and Telegram groups. | Baltics, Nordics, Eastern Europe |
| **Deliveroo / Just Eat rider forums** | UK and Western Europe delivery gig workers. Reddit and Facebook groups. | UK, France, Netherlands, Spain |
| **Freelancer.de / Malt** | European freelancer platforms. Profiles with ratings and portfolios. | Germany, France, Spain |
| **Blocket** | Sweden's largest classifieds and services marketplace. | Sweden |
| **Marktplaats** | Netherlands' largest classifieds. | Netherlands |

### Regional Messaging Behavior

Europe is **WhatsApp-dominant** for messaging. Business WhatsApp is the primary outreach channel, not SMS. In Russia and Eastern Europe, Telegram is primary. In DACH, both WhatsApp and XING messaging are used for professional outreach.

**GDPR compliance is mandatory.** The bot must not scrape personal data from EU residents without a lawful basis. Public professional profiles (LinkedIn, XING) and public forum posts are acceptable. Private data requires consent. The bot's outreach must include an opt-out mechanism in every message.

---

## Region: Americas (USA, Canada, Latin America)

### Primary Platforms — North America

| Platform | Why | Coverage |
|----------|-----|----------|
| **Craigslist** | Still the largest classifieds platform in the US. Gigs section is active. Service providers list here. | USA, Canada |
| **Nextdoor** | Neighborhood-level social network. Service providers (handyman, tutor, stylist) get recommended by neighbors. High-intent leads. | USA, Canada |
| **Yelp** | Service provider reviews. Stylists, contractors, photographers with few reviews are new and need help. | USA, Canada |
| **Thumbtack / TaskRabbit** | Gig service marketplaces. Profiles with ratings. Workers looking for more clients. | USA |
| **Reddit** (region-specific subs) | r/uberdrivers, r/doordash, r/realtors, r/freelance — all US-heavy. | USA primarily |
| **BiggerPockets** | Real estate investor and agent community. Forums, podcasts, networking. | USA |
| **Alignable** | Small business networking platform. 7M+ members. Business owners helping each other. | USA, Canada |

### Primary Platforms — Latin America

| Platform | Why | Coverage |
|----------|-----|----------|
| **MercadoLibre** | Latin America's Amazon + eBay. Seller communities and forums. E-commerce gig workers. | All LatAm |
| **OLX** | Classifieds platform dominant in Brazil, Argentina, Colombia. Service providers and gig workers list here. | Brazil, Argentina, Colombia |
| **Rappi / iFood driver communities** | LatAm's Uber Eats equivalents. Driver groups on WhatsApp and Telegram. | Colombia, Brazil, Mexico |
| **Computrabajo** | Largest job board in Latin America. Gig workers search for flexible opportunities. | All LatAm |
| **Workana** | LatAm's Upwork equivalent. Freelancer profiles with ratings. | All LatAm |
| **WhatsApp Business groups** | WhatsApp is THE communication platform in LatAm. Business groups are where deals happen. | All LatAm |
| **Foro de Coches / Taringa** | Spanish-language forums with active gig economy discussions. | Spain, Argentina |

### Regional Messaging Behavior

North America: **SMS is primary.** Americans respond to text messages. Email is secondary. LinkedIn InMail for professional outreach.

Latin America: **WhatsApp is primary.** SMS is secondary. WhatsApp Business groups are where communities form. The bot must prioritize WhatsApp outreach over email in all LatAm markets.

---

## Region: Africa (Nigeria, Kenya, South Africa, Egypt, Ghana)

### Primary Platforms

| Platform | Why | Coverage |
|----------|-----|----------|
| **Nairaland** | Nigeria's largest forum. 3M+ members. Every industry has active threads. Equivalent to Reddit for Nigeria. | Nigeria |
| **Jiji** | Africa's largest classifieds platform. Service providers, gig workers, and small businesses list here. | Nigeria, Kenya, Ghana, Tanzania |
| **Jumia** | Africa's Amazon. Seller communities and vendor forums. E-commerce gig workers. | Nigeria, Kenya, Egypt, Morocco |
| **WhatsApp groups** | THE communication platform for all of Africa. Business groups, industry groups, and community groups. This is where leads live. | All Africa |
| **Safaricom / M-Pesa communities** | Mobile money is the backbone of the gig economy in East Africa. Communities form around M-Pesa business groups. | Kenya, Tanzania |
| **Jobberman** | West Africa's largest job board. Gig workers and freelancers post profiles. | Nigeria, Ghana |
| **Careers24 / PNet** | South Africa's largest job boards. | South Africa |
| **Telegram groups** | Growing fast in Africa, especially for tech-savvy gig workers and crypto/fintech communities. | Nigeria, Kenya, South Africa |

### Regional Messaging Behavior

Africa is **WhatsApp-first, full stop.** SMS is expensive relative to income. Data is cheap. WhatsApp is how everyone communicates — personal, business, everything. The bot must use WhatsApp as the primary outreach channel. Telegram is secondary and growing. Email is tertiary and only for formal/professional contexts.

**Mobile-first design is mandatory.** Most African users access the internet exclusively via mobile. Any content, links, or resources the bot shares must be mobile-optimized.

---

## Region: Middle East (UAE, Saudi Arabia, Qatar, Jordan, Lebanon)

### Primary Platforms

| Platform | Why | Coverage |
|----------|-----|----------|
| **Dubizzle** | UAE's largest classifieds. Service providers, freelancers, and gig workers list here. | UAE |
| **Haraj** | Saudi Arabia's largest classifieds platform. Services, vehicles, and gig postings. | Saudi Arabia |
| **Bayt.com** | Middle East's largest job board. Professional profiles with experience and skills. | All MENA |
| **Careem driver communities** | Middle East's Uber equivalent (now owned by Uber). Driver groups on WhatsApp and Telegram. | UAE, Saudi, Egypt, Pakistan |
| **Noon seller communities** | Middle East's e-commerce platform. Seller forums and WhatsApp groups. | UAE, Saudi, Egypt |
| **WhatsApp groups** | Primary communication platform across the Middle East. Business groups are active. | All MENA |
| **Telegram groups** | Growing fast, especially in Iran and among tech communities. | Iran, UAE, Saudi |
| **LinkedIn** | Higher penetration in Gulf states than most developing regions. Professional outreach works well here. | UAE, Saudi, Qatar |

### Regional Messaging Behavior

Middle East: **WhatsApp is primary.** SMS is secondary but still effective in Gulf states where phone plans are generous. LinkedIn messaging works well in UAE and Saudi for professional outreach. Telegram is growing, especially in Iran where other platforms are restricted.

**Cultural considerations:** Friday is the day of rest, not Sunday. Outreach timing must respect Ramadan (reduced business hours, no outreach during fasting hours). The bot must be aware of Islamic calendar events.

---

## Implementation Instructions for Claude Code and Birdie

### Data Structure

The regional map should be stored as a JSON configuration file loaded at bot initialization:

```typescript
interface RegionalSourceMap {
  region: string;
  countries: string[];
  platforms: {
    name: string;
    type: 'forum' | 'classifieds' | 'messaging' | 'job_board' | 'marketplace' | 'social' | 'professional';
    url: string;
    priority: number; // 1-10, higher = scan first
    scraping_method: 'public_api' | 'web_scrape' | 'manual_monitor';
    notes: string;
  }[];
  messaging: {
    primary: string;    // e.g., "whatsapp" or "line" or "sms"
    secondary: string;
    outreach_format: string; // e.g., "whatsapp_business" or "sms"
  };
  compliance: {
    gdpr: boolean;
    data_retention_days: number;
    opt_out_required: boolean;
    special_rules: string;
  };
}
```

### Loading Logic

```
1. Interview 1 → customer says "I'm in Bangkok, Thailand"
2. Bot detects: country = Thailand, region = Southeast Asia
3. Bot loads: regional_sources["southeast_asia"]
4. Bot merges with: universal_sources + role_specific_sources[customer_role]
5. Bot sets: primary_outreach = "line" (not SMS, not email)
6. Bot announces: "I'll be monitoring LINE OpenChat groups, Pantip forums, 
   Wongnai reviews, and LinkedIn for your ideal customers."
```

### Priority Order

When the bot has limited API calls or rate limits, scan sources in this order:

1. **LinkedIn** (always first, all regions)
2. **Regional primary platform** (LINE in Thailand, Nairaland in Nigeria, XING in Germany)
3. **Regional classifieds** (Pantip, Craigslist, Jiji, Dubizzle)
4. **Facebook Groups** (public only)
5. **Reddit** (strongest in North America, weaker elsewhere)
6. **Telegram groups**
7. **Job boards** (Jobthai, Bayt, Jobberman)
8. **Google search** (catch-all for anything missed)

### Test Cases

The implementation passes when:

1. A customer in Thailand gets LINE OpenChat and Pantip as top sources — NOT Craigslist or Yelp
2. A customer in Nigeria gets Nairaland and WhatsApp groups as top sources — NOT Reddit or Nextdoor
3. A customer in Germany gets XING alongside LinkedIn — NOT just LinkedIn alone
4. A customer in Brazil gets WhatsApp as primary outreach — NOT SMS
5. A customer in the USA gets SMS as primary outreach — NOT WhatsApp
6. A customer in the EU gets GDPR compliance flags set to true
7. The bot never asks the customer which platforms to use
8. The bot announces which regional sources it is monitoring after Interview 1

### Hive Learning Regional Updates

When a bot in a new region discovers a source that works, the discovery event must include the region tag:

```json
{
  "event": "source_discovery",
  "source": "pantip.com/forum/freelance",
  "region": "southeast_asia",
  "country": "TH",
  "role": "freelance_writer",
  "leads_found": 12,
  "conversion_rate": 0.08,
  "timestamp": "2026-02-14T10:00:00Z"
}
```

When three or more bots in the same region confirm a source, it gets added to the regional map for all future deployments in that region.

---

## Summary Table: Primary Outreach Channel by Region

| Region | Primary Outreach | Secondary | Notes |
|--------|-----------------|-----------|-------|
| **Thailand** | LINE | SMS | WhatsApp is secondary |
| **Indonesia** | WhatsApp | SMS | LINE is minimal |
| **Philippines** | WhatsApp | SMS | GCash communities |
| **Vietnam** | Zalo | SMS | WhatsApp is secondary |
| **China** | WeChat | — | All other platforms blocked |
| **Japan** | LINE | Email | SMS is uncommon |
| **Germany/Austria/Switzerland** | WhatsApp | XING message | GDPR applies |
| **UK** | WhatsApp | SMS | GDPR applies |
| **France** | WhatsApp | SMS | GDPR applies |
| **Russia/Eastern Europe** | Telegram | VK message | WhatsApp is secondary |
| **Nordics** | WhatsApp | SMS | GDPR applies |
| **USA/Canada** | SMS | Email | LinkedIn InMail for professional |
| **Mexico** | WhatsApp | SMS | — |
| **Brazil** | WhatsApp | SMS | — |
| **Colombia/Argentina** | WhatsApp | SMS | — |
| **Nigeria** | WhatsApp | SMS | Data is cheap, SMS is expensive |
| **Kenya/East Africa** | WhatsApp | SMS | M-Pesa communities |
| **South Africa** | WhatsApp | SMS | — |
| **UAE/Qatar** | WhatsApp | SMS | LinkedIn strong in Gulf |
| **Saudi Arabia** | WhatsApp | SMS | Respect Ramadan timing |
| **Egypt** | WhatsApp | SMS | — |

---

**Bottom line:** The bot must know where it is hunting before it starts hunting. Geography determines platforms, messaging channels, compliance rules, and cultural timing. This map is loaded automatically. The customer never configures it. The Hive makes it smarter over time.
