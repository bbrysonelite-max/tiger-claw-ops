# Lead Source Intelligence Map

**Author:** Manus AI  
**Date:** February 14, 2026  
**Classification:** Hardwired Bot Knowledge — Do Not Ask the Customer

---

## Purpose

This document defines where Tiger Bot looks for leads. This knowledge is **pre-loaded into every bot at deployment**. The customer is never asked "where should I look?" The bot already knows. The customer's only job during onboarding is to say what kind of person they want. The bot figures out where to find them.

This map is the starting point. The Hive Learning system updates it continuously as bots discover what works. When one bot finds that fitness coaches respond best to Reddit DMs on Tuesday mornings, every bot learns that.

---

## Design Constraints

Per project requirements, the following rules apply to all lead source activity:

1. **LinkedIn is always included.** It is the highest-productivity platform for professional outreach.
2. **Instagram is excluded** unless the customer explicitly requests it.
3. **SEO is never used** as a lead generation strategy. It is considered obsolete in the AI era.
4. **SMS outreach is mandatory** in every nurture sequence. Phone numbers must be collected for all viable prospects.
5. **Social media surfing** (logging in, commenting, engaging) requires a digital wallet and is a Phase 2 capability. Phase 1 is observation and scraping only.

---

## The Universal Lead Sources

These sources apply to **every gig economy role**. They are always active regardless of the customer's specific business.

| Source | What Tiger Bot Does There | Data Extracted |
|--------|--------------------------|----------------|
| **LinkedIn** | Search by job title, industry, keywords. Monitor posts with relevant hashtags. Identify people in transition (job changes, "open to opportunities"). | Name, title, company, location, contact info, recent activity |
| **Reddit** | Monitor subreddits relevant to the customer's industry. Identify users expressing frustration, asking for advice, or discussing side income. | Username, post history, sentiment, expressed pain points |
| **Facebook Groups** (public) | Scrape public group membership lists and post activity. Identify active participants discussing relevant topics. | Name, group membership, post content, engagement level |
| **Google Search** | Search for blogs, forum posts, and profiles matching the ICP. Identify people who have written about their gig economy experience. | Name, website, content topics, contact info if public |
| **Telegram Groups** | Monitor public Telegram groups related to the customer's industry. Identify active participants. | Username, message history, group membership |
| **Twitter/X** | Monitor hashtags and keyword searches. Identify people discussing relevant topics or expressing interest in opportunities. | Handle, bio, tweet content, follower count |
| **YouTube** | Search for small creators making content about the customer's industry. These are people already invested in the space. | Channel name, subscriber count, content topics, contact info |
| **Job Boards** (Indeed, ZipRecruiter) | Search for people listing relevant experience or seeking flexible/gig work. | Name, experience, location, skills |
| **Craigslist Gigs Section** | Monitor the gigs and services sections for people offering or seeking relevant work. | Post content, contact method, location |
| **Meetup.com** | Find local groups related to the customer's industry. Identify organizers and active members. | Name, group membership, event attendance |

---

## Role-Specific Lead Sources

Each gig economy role has additional sources where their specific leads concentrate. These are loaded based on what the customer says during Interview 1 (who are you) and Interview 2 (who's your ideal customer).

### Network Marketers

The customer sells through a network marketing company and is looking for recruits or product customers.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| Reddit | r/antiMLM, r/networkmarketing, r/mlm, r/sidehustle | People who quit MLM (frustrated but experienced), people asking about side income |
| Facebook Groups | "Network Marketing Tips," "MLM Success Stories," "Side Hustle Nation" | Active posters, people sharing wins/losses, people asking questions |
| LinkedIn | Search: "Independent Distributor," "Brand Ambassador," "Network Marketing" | People with MLM experience in their profile, people in career transitions |
| YouTube | Small channels reviewing MLM companies, "my MLM experience" videos | Creators with 100–10,000 subscribers who are already invested in the space |
| Telegram | Network marketing community groups, crypto/income opportunity groups | Active participants discussing income opportunities |
| Twitter/X | #networkmarketing, #mlm, #sidehustle, #passiveincome | People sharing their journey, asking questions, expressing frustration |

### Hair Stylists / Beauty Professionals

The customer runs a salon, is a freelance stylist, or sells beauty products and needs more clients.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Hair Stylist," "Cosmetologist," "Beauty Professional," "Salon Owner" | Stylists looking to grow their client base, salon owners hiring |
| Facebook Groups | "Hair Stylists Unite," "Behind the Chair," local beauty groups | Stylists sharing work, asking for advice, discussing client acquisition |
| Reddit | r/hairstylist, r/cosmetology, r/beauty, r/smallbusiness | Stylists discussing business challenges, client retention, pricing |
| Yelp | Search for stylists/salons with few reviews or new listings | New businesses that need marketing help |
| Google Maps | Search for salons in target areas, check review counts | Low-review businesses that need visibility |
| Instagram (only if customer requests) | #hairstylist, #behindthechair, #salonlife | Stylists with small followings trying to grow |

### Rideshare Drivers

The customer drives for Uber/Lyft/Grab and wants to maximize income or transition to a better opportunity.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| Reddit | r/uberdrivers, r/lyftdrivers, r/rideshare, r/gigeconomy | Drivers complaining about pay, asking about alternatives, discussing side income |
| Facebook Groups | "Uber/Lyft Drivers," "Rideshare Profits," "Gig Economy Workers" | Active drivers sharing tips, expressing frustration, asking about other opportunities |
| LinkedIn | Search: "Rideshare Driver," "Independent Contractor," "Gig Worker" | People listing rideshare as current role, people in transition |
| YouTube | Channels about rideshare tips, "how much I made this week" videos | Small creators documenting their gig economy experience |
| Craigslist | Gigs section, transportation services | People offering driving services or looking for flexible work |
| Driver Forums | UberPeople.net, RideshareGuy.com forums | Active forum participants discussing the business |

### Real Estate Agents

The customer is a real estate agent looking for buyer/seller leads or recruiting other agents.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Real Estate Agent," "Realtor," "Real Estate Broker," "Licensed Agent" | New agents (less than 2 years), agents in transition, agents posting about market conditions |
| Reddit | r/realestate, r/realtor, r/realestateinvesting | Agents asking for advice, discussing lead generation, expressing frustration |
| Facebook Groups | "Real Estate Agents," "New Realtors," "Real Estate Leads" | Agents sharing deals, asking questions, discussing marketing |
| Zillow/Realtor.com | Agent profiles with few listings or reviews | New agents who need help building their business |
| YouTube | Small real estate channels, "day in the life of a realtor" | Agents creating content but struggling to grow |
| Meetup.com | Real estate investor groups, agent networking events | Active participants in local real estate communities |
| BiggerPockets | Forums, member profiles | Real estate professionals discussing deals and strategies |

### Online Tutors / Educators

The customer tutors online or creates educational content and needs more students.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Tutor," "Online Teacher," "Education Consultant," "Instructor" | Educators looking for side income, teachers in career transition |
| Reddit | r/tutoring, r/onlinetutor, r/teachers, r/sidehustle | Teachers discussing supplemental income, tutors asking about platforms |
| Facebook Groups | "Online Tutoring," "Teachers Making Extra Money," "EdTech" | Educators sharing experiences, asking about platforms, discussing pricing |
| Wyzant/Tutor.com | Tutor profiles with few reviews | New tutors who need help building their client base |
| YouTube | Small education channels, "how I make money tutoring" | Educators creating content but struggling to monetize |
| Teacher Forums | TeacherPayTeachers community, education subreddits | Teachers already creating supplemental income |

### Food Delivery Drivers

The customer delivers for DoorDash/UberEats/GrubHub and wants to maximize income or find better opportunities.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| Reddit | r/doordash, r/ubereats, r/grubhub, r/couriersofreddit | Drivers discussing pay, strategies, frustrations, alternative income |
| Facebook Groups | "DoorDash Drivers," "Food Delivery Tips," "Gig Workers Unite" | Active drivers sharing tips, expressing frustration |
| LinkedIn | Search: "Delivery Driver," "Independent Contractor," "Gig Economy" | People listing delivery as current role |
| YouTube | Channels about delivery driver tips, earnings reports | Small creators documenting their experience |
| Craigslist | Gigs section, delivery services | People offering or seeking delivery work |

### Photographers / Videographers

The customer is a freelance photographer or videographer looking for more clients.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Photographer," "Videographer," "Visual Content Creator" | Freelancers looking for clients, people in career transition |
| Reddit | r/photography, r/videography, r/freelance, r/smallbusiness | Photographers discussing client acquisition, pricing, marketing |
| Facebook Groups | "Freelance Photographers," "Wedding Photography," "Video Production" | Photographers sharing work, asking for advice |
| Google Maps | Search for photography studios with few reviews | New businesses that need marketing help |
| Thumbtack/Bark | Photographer profiles with few reviews | New freelancers who need help building their client base |
| YouTube | Small photography/video channels | Creators with skills but small audiences |

### Handyman / Contractors

The customer does home repair, renovation, or maintenance and needs more jobs.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Handyman," "General Contractor," "Home Repair," "Maintenance" | Contractors looking for work, people starting their own business |
| Reddit | r/handyman, r/homeimprovement, r/contractor, r/smallbusiness | Contractors discussing business challenges, marketing, pricing |
| Facebook Groups | "Handyman Business," "Contractors Network," "Home Repair Pros" | Contractors sharing work, asking for advice |
| Yelp | Search for handymen/contractors with few reviews | New businesses that need visibility |
| Google Maps | Search for contractors in target areas | Low-review businesses |
| Thumbtack/Angi | Contractor profiles with few reviews | New contractors building their client base |
| Nextdoor | Local service recommendations and requests | Active community members offering services |

### Fitness Coaches / Personal Trainers

The customer is a personal trainer or fitness coach looking for more clients.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Personal Trainer," "Fitness Coach," "Health Coach," "Wellness" | Trainers looking to grow, people transitioning into fitness |
| Reddit | r/personaltraining, r/fitness, r/fitnessindustry, r/entrepreneur | Trainers discussing client acquisition, online coaching, business growth |
| Facebook Groups | "Personal Trainers," "Online Fitness Coaching," "Fitness Business" | Trainers sharing wins, asking about marketing, discussing pricing |
| YouTube | Small fitness channels, "how I built my PT business" | Trainers creating content but struggling to grow |
| Google Maps | Search for personal trainers/gyms with few reviews | New trainers who need visibility |
| Meetup.com | Fitness groups, running clubs, wellness communities | Active fitness community members |

### Freelance Writers / Content Creators

The customer writes content, copywriting, or creates digital content for clients.

| Source | Specific Location | What to Look For |
|--------|-------------------|-----------------|
| LinkedIn | Search: "Freelance Writer," "Content Creator," "Copywriter," "Content Strategist" | Writers looking for clients, people transitioning to freelance |
| Reddit | r/freelancewriters, r/copywriting, r/contentcreation, r/freelance | Writers discussing rates, client acquisition, platform strategies |
| Facebook Groups | "Freelance Writers," "Content Marketing," "Copywriters" | Writers sharing work, asking for advice |
| Twitter/X | #freelancewriting, #copywriting, #contentcreation | Writers sharing their journey, looking for work |
| Upwork/Fiverr | Writer profiles with few reviews or new accounts | New freelancers building their reputation |
| Medium | Writers with small followings publishing relevant content | Content creators who need help monetizing |

---

## Hive Learning Integration

This map is the **seed data**. The Hive Learning system improves it continuously through three mechanisms:

**Discovery Logging.** Every time a Tiger Bot finds a lead, it logs: where it found them, what keywords matched, what time of day, and whether the lead responded to outreach. This data feeds back into the source map.

**Effectiveness Scoring.** Each source gets a score based on conversion rate. If Reddit r/uberdrivers produces leads that convert at 8% but Facebook groups only convert at 2%, the bot prioritizes Reddit. These scores are shared across all bots serving the same role.

**New Source Detection.** When a bot discovers a new forum, group, or community that produces leads, it reports the discovery to the Hive. If three or more bots confirm the source produces viable leads, it gets added to the hardwired map for all future deployments.

The map below shows how the feedback loop works:

```
Bot discovers lead on Reddit r/sidehustle
    ↓
Lead responds to outreach (positive signal)
    ↓
Bot logs: source=reddit, subreddit=sidehustle, role=network_marketer, 
          keyword="looking for opportunity", time=Tuesday 9am, outcome=responded
    ↓
Hive aggregates: r/sidehustle effectiveness for network_marketers = 7.2/10
    ↓
All network_marketer bots now prioritize r/sidehustle higher
    ↓
New bot deployed for network_marketer → r/sidehustle is pre-loaded as top source
```

---

## What the Bot Says Instead of Asking

When a customer completes Interview 2 (ICP), the bot does NOT ask "where should I look for leads?" Instead, it says:

> "Based on your profile, I already know where to find your ideal customers. I'll be monitoring LinkedIn, Reddit communities like r/[relevant], Facebook groups for [industry], and [2-3 other specific sources]. I'll start scanning now and deliver your first prospect list within 24 hours. If you know of any specific groups or communities I should also watch, just send me the link anytime."

The customer can add sources. They are never required to provide them. The bot already knows.

---

## Anti-Pattern Reference

See `09_ANTI_PATTERN_rigid_interview.md` and `charts/anti_pattern_rigid_interview.png` for the documented failure where the bot asked the customer to specify lead sources instead of knowing them.

See `charts/anti_pattern_no_initiative.png` (Screenshot 2) for the documented failure where the bot said "Send me a URL to analyze" instead of knowing where to go. The bot should never ask the customer where to look. It should already be looking.
