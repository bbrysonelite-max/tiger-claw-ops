# The Tiger Claw Onboarding & Flywheel System

## Introduction

This document outlines the comprehensive system for onboarding new Tiger Claw customers and implementing a powerful, automated client acquisition flywheel. The system is designed specifically for the unique needs of **gig economy workers**, including network marketers, freelancers, and service providers. It integrates a detailed onboarding process to personalize the bot's mission with a multi-stage flywheel that moves prospects from strangers to loyal customers and advocates. This system is built on the principles of automation, value delivery, and continuous improvement, ensuring the Tiger Claw is a productive and indispensable asset for its owner.

---

## Part 1: The Onboarding System

The onboarding process is a critical first step that briefs the Tiger Claw on its owner and its mission. It consists of two distinct automated interviews designed to capture the necessary information for personalized and effective operation.

### Section 1.1: The Customer Profile Interview

This initial interview establishes the identity and context of the Tiger Claw owner. The bot will ask the following questions to build a comprehensive profile.

> **Bot Persona:** "Hello, I am your new Tiger Claw. To be the most effective partner for your business, I need to understand who you are and what you do. Please answer the following questions so I can get to work for you."

| Category | Question | Data Field | Purpose |
| :--- | :--- | :--- | :--- |
| **Identity** | What is your full name? | `customer_name` | Personalization of communication. |
| **Identity** | What is your family name? | `customer_family_name` | Formal communication and record-keeping. |
| **Contact** | What is your primary business telephone number? | `customer_phone` | Essential for SMS alerts and two-way communication. |
| **Contact** | What is your primary business email address? | `customer_email` | For notifications, reports, and system communication. |
| **Business** | Please describe your business. What do you sell or what service do you provide? | `business_description` | Core context for all bot activities. |
| **Mission** | What is your primary mission or goal for your business right now? (e.g., get 10 new clients, build a team of 5 people) | `business_mission` | Defines the bot's primary objective. |
| **Experience** | How much experience do you have in your industry? (e.g., beginner, intermediate, expert) | `customer_experience` | Helps tailor the complexity of strategies and reports. |
| **Brand Voice** | How would you describe your brand's personality? (e.g., friendly and casual, professional and expert, funny and witty) | `brand_voice` | Sets the tone for all automated outreach and content. |

### Section 1.2: The Ideal Customer Profile (ICP) Interview

After understanding its owner, the bot must understand who it needs to find. This interview develops the Ideal Customer Profile (ICP), which defines the bot's targeting parameters and success metrics.

> **Bot Persona:** "Thank you. Now, let's define our mission. To find the right people for your business, I need to know exactly who we are looking for. Please describe your ideal customer or prospect."

| Category | Question | Data Field | Purpose |
| :--- | :--- | :--- | :--- |
| **Demographics** | What is the typical age range and gender of your ideal customer? | `icp_demographics` | Basic targeting and content personalization. |
| **Location** | Where does your ideal customer live? (City, State, Country) | `icp_location` | Geographic targeting for lead generation. |
| **Profession** | What is their job title or profession? What industry are they in? | `icp_profession` | Critical for platforms like LinkedIn. |
| **Pain Points** | What are the biggest challenges or problems your ideal customer faces that your product/service solves? | `icp_pain_points` | The foundation of all value-based messaging. |
| **Goals** | What are your ideal customer's goals and aspirations? What do they want to achieve? | `icp_goals` | To frame your offering as a solution that helps them win. |
| **Watering Holes** | Where do they spend their time online? (e.g., LinkedIn groups, specific forums, blogs, news sites) | `icp_online_hangouts` | Defines where the bot will go to listen and engage. |
| **Success Metric** | What is the single most important action you want a prospect to take? (e.g., book a call, purchase a product, sign up for a webinar) | `icp_conversion_action` | **Defines success for the bot.** This is the primary conversion event. |

---

## Part 2: The Gig Economy Flywheel

The flywheel is a model for growth that leverages happy customers to drive referrals and repeat sales. Unlike a funnel, which ends when a purchase is made, the flywheel uses the momentum of a converted customer to fuel further growth. The customer is at the center of this model.

Here are the stages of the Tiger Claw flywheel, adapted for a gig economy worker.

| Stage | Goal | Tiger Claw Actions | Key Metrics |
| :--- | :--- | :--- | :--- |
| **1. Discovery** | Attract strangers and make them aware of the user's solution. | - **Social Listening:** Monitor keywords from the ICP pain points on LinkedIn and other specified "watering holes".<br>- **Content Publishing:** Automatically post valuable content related to ICP goals and pain points.<br>- **Targeted Surfing:** Browse relevant LinkedIn groups and profiles based on the ICP. | - Profile Views<br>- Content Impressions<br>- Keyword Mentions Found |
| **2. First Contact** | Engage prospects with personalized outreach to initiate a conversation. | - **Automated Connection Request:** Send personalized LinkedIn connection requests.<br>- **Initial Comment/DM:** Post a relevant, non-salesy comment on a prospect's post or send a direct message referencing a shared interest or a piece of their content. | - Connection Acceptance Rate<br>- Reply Rate to First Message<br>- Engagement Rate on Comments |
| **3. Nurturing** | Build trust and demonstrate value by providing solutions and insights over time. | - **Drip Campaigns:** Execute automated email and SMS sequences offering value (e.g., free guides, tips, case studies) related to ICP pain points.<br>- **Value-Added Follow-up:** Send links to relevant articles or tools based on the prospect's profile and activity.<br>- **Answer Questions:** Use AI to answer basic questions asked by the prospect. | - Open Rate / Click-Through Rate<br>- Lead Score (based on engagement)<br>- Number of Value Touches |
| **4. Conversion** | Motivate the nurtured prospect to take the primary success action. | - **Direct Ask:** Send a message that clearly and politely asks the prospect to take the `icp_conversion_action` (e.g., "Would you be open to a brief call next week to discuss how we can solve [ICP Pain Point]?").<br>- **Booking Link:** Provide a direct link to a calendar for booking.<br>- **Purchase Link:** Provide a direct link to a sales page. | - **Conversion Rate (%)**<br>- Number of Booked Calls<br>- Number of Purchases/Signups |
| **5. Retention** | Turn new customers into happy, long-term clients and advocates. | - **Onboarding Sequence:** Trigger a welcome email/SMS sequence for new customers.<br>- **Check-in Messages:** Schedule automated follow-ups to ensure customer satisfaction.<br>- **Referral Request:** After a positive interaction or milestone, automatically ask for a referral or testimonial. | - Customer Churn Rate<br>- Customer Lifetime Value (LTV)<br>- Number of Referrals Generated |

---

## Part 3: Lead Generation & Nurture Campaigns

This section details the engine that powers the flywheel and provides suggested campaign sequences.

### Section 3.1: The Lead Generation Engine

The Tiger Claw will proactively generate leads through a combination of automated activities. This requires a specific set of tools and a clear strategy.

*   **Social Media Listening:** The bot will continuously scan for keywords defined in the ICP (pain points, goals, competitor names) on approved platforms, primarily **LinkedIn**. When a keyword is found, the person who posted it is flagged as a potential lead.
*   **Social Media Surfing & Engagement:** The bot will navigate to the online "watering holes" defined in the ICP. It will perform actions like:
    *   Viewing profiles of people who match the ICP criteria.
    *   Liking relevant posts.
    *   Making intelligent, value-adding comments on posts to generate inbound interest. This must be aggressive but compliant with platform rules and Thai law.
*   **Required Tooling:** To execute these tasks, the system will need to integrate:
    *   **A Web Scraper/Browser Automation Tool:** To navigate and interact with social media sites (as provided by the OpenClaw infrastructure).
    *   **A Digital Wallet:** To handle any potential platform-specific costs or future advertising capabilities.
    *   **CRM Integration:** To store and manage prospect data.

### Section 3.2: Suggested Nurture Campaign Sequences

Below are two example nurture sequences. These are templates that the Tiger Claw will customize using the owner's `brand_voice` and the prospect's `icp_pain_points`.

#### Example 1: For a Hair Stylist (Targeting: Busy Professionals)

*   **Touch 1 (Email):** Subject: "5 Ways to Keep Your Hair Healthy Between Appointments". A short guide with actionable tips.
*   **Touch 2 (SMS, 3 days later):** "Hi [Prospect Name], it's [Stylist Name]. Just sent you a few hair care tips. Hope they help! Here to answer any questions you have."
*   **Touch 3 (Email, 1 week later):** Subject: "The Biggest Hair Myth We All Fall For". A myth-busting email that builds authority.
*   **Touch 4 (Email, 2 weeks later):** A gallery of before-and-after photos of clients with a similar hair type or goal.
*   **Touch 5 (SMS, 1 day later):** "Have a special event coming up? I have a couple of last-minute openings this week. Let me know if you'd like to book one."

#### Example 2: For a Network Marketer (Targeting: People Seeking a Side Hustle)

*   **Touch 1 (Email):** Subject: "Is the 9-to-5 draining you?". An empathetic email that shares a short, relatable story about the challenges of traditional work.
*   **Touch 2 (SMS, 2 days later):** "Hi [Prospect Name], [Marketer Name] here. That feeling of being drained by the 9-to-5 is all too common. I found a different way. Happy to share more if you're curious."
*   **Touch 3 (Email, 5 days later):** Subject: "What if you could earn from your phone?". A short case study or testimonial from a team member.
*   **Touch 4 (Email, 1 week later):** An invitation to a no-pressure, 15-minute webinar or a link to a pre-recorded video explaining the opportunity.
*   **Touch 5 (SMS, 1 day after webinar/video view):** "Hey [Prospect Name], hope you found the info session useful. Do you have 10 minutes tomorrow to chat about whether this could be a fit for you?"

---

## Conclusion

This integrated system of onboarding and a growth flywheel provides a clear, automated path from prospect discovery to customer retention. By first deeply understanding the user and their ideal customer, the Tiger Claw can then execute a highly personalized and effective strategy. This design is robust, adaptable, and squarely focused on delivering the one thing gig economy workers need most: a consistent, predictable stream of new customers.

