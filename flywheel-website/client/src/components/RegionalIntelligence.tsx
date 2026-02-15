/**
 * Regional Lead Source Intelligence Visualization
 * Design: "Predator's Path" — Bold editorial, black/orange, oversized display type
 * Font: Bebas Neue (display) + Outfit (body)
 * Palette: #09090B black, #F97316 tiger orange, #FBBF24 amber, #27272A dark gray
 */

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Globe,
  MessageSquare,
  Phone,
  Shield,
  Smartphone,
  MapPin,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const REGIONAL_INTEL_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/8AucOjrQNQC86BpPcP6qC1-img-1_1771118441000_na1fn_cmVnaW9uYWwtaW50ZWwtaGVybw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94LzhBdWNPanJRTlFDODZCcFBjUDZxQzEtaW1nLTFfMTc3MTExODQ0MTAwMF9uYTFmbl9jbVZuYVc5dVlXd3RhVzUwWld3dGFHVnlidy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UKAjNa4W3E7uw20sXtaYJuvpR0M-NZqe5lXyXxjWhyRnOncbv5RmefXQavLU8f04nOkeMIPgs30MRai2zeY-cc0mXD2bY~0wtkjzzrQGV26o67F-RGiIu~jmesaBYpFQCIMKjcHmrntuZB-o14oaxaZNJfZCeYI12QDwp458StYprk2c-vkit9UKd~jvcqr9h8KGdWNeULCtmj1BfXlIQH9DxMq5Msgv~nPK6lVV5hFVB~99dLtfcH76Od5pRUzUbfAtbVgISLui1jBnED3orwm8kTbJtm9T8mpHCz4o9SQJLCVcS~bHmaeqOg1Sa-YAKAItHwdcWK~LqCbf9KsmNg__";

/* ─── Types ─── */

interface Platform {
  name: string;
  type: "forum" | "classifieds" | "messaging" | "job_board" | "marketplace" | "social" | "professional" | "delivery" | "fintech";
  coverage: string;
  why: string;
  lang: string; // primary language code(s)
}

/* ─── Language flag + label mapping ─── */

const langMeta: Record<string, { flag: string; label: string }> = {
  th: { flag: "🇹🇭", label: "Thai" },
  ja: { flag: "🇯🇵", label: "Japanese" },
  vi: { flag: "🇻🇳", label: "Vietnamese" },
  id: { flag: "🇮🇩", label: "Indonesian" },
  tl: { flag: "🇵🇭", label: "Filipino" },
  zh: { flag: "🇨🇳", label: "Chinese" },
  de: { flag: "🇩🇪", label: "German" },
  ru: { flag: "🇷🇺", label: "Russian" },
  fr: { flag: "🇫🇷", label: "French" },
  en: { flag: "🇬🇧", label: "English" },
  sv: { flag: "🇸🇪", label: "Swedish" },
  nl: { flag: "🇳🇱", label: "Dutch" },
  es: { flag: "🇪🇸", label: "Spanish" },
  pt: { flag: "🇧🇷", label: "Portuguese" },
  multi: { flag: "🌐", label: "Multi" },
  ar: { flag: "🇸🇦", label: "Arabic" },
  fa: { flag: "🇮🇷", label: "Farsi" },
  sw: { flag: "🇰🇪", label: "Swahili" },
};

interface RegionData {
  id: string;
  name: string;
  subtitle: string;
  countries: string;
  color: string;
  colorBg: string;
  colorBorder: string;
  platforms: Platform[];
  messaging: {
    primary: string;
    secondary: string;
    note: string;
  };
  compliance: string;
  behavior: string;
}

/* ─── Data ─── */

const regions: RegionData[] = [
  {
    id: "sea",
    name: "Southeast Asia",
    subtitle: "LINE, Pantip & Mobile-First",
    countries: "Thailand · Vietnam · Philippines · Indonesia · Malaysia",
    color: "text-orange-400",
    colorBg: "bg-orange-500/10",
    colorBorder: "border-orange-500/30",
    platforms: [
      { name: "LINE OpenChat", type: "messaging", coverage: "Thailand, Japan, Taiwan", why: "#1 messaging app in Thailand. OpenChat has thousands of business/gig groups.", lang: "th" },
      { name: "Pantip.com", type: "forum", coverage: "Thailand", why: "Thailand's largest discussion forum. Every industry has active threads.", lang: "th" },
      { name: "Wongnai", type: "classifieds", coverage: "Thailand", why: "Thailand's Yelp equivalent. Service providers have profiles with reviews.", lang: "th" },
      { name: "Jobthai / JobsDB", type: "job_board", coverage: "Thailand, SEA", why: "Largest job boards in Thailand and SEA. Gig workers post resumes here.", lang: "th" },
      { name: "Shopee / Lazada Forums", type: "marketplace", coverage: "All SEA", why: "E-commerce seller communities discuss strategies, tools, and frustrations.", lang: "multi" },
      { name: "Grab / Gojek Communities", type: "delivery", coverage: "All SEA", why: "Driver forums on Facebook and Telegram. Rideshare and delivery workers.", lang: "multi" },
      { name: "Kaskus", type: "forum", coverage: "Indonesia", why: "Indonesia's largest forum. Equivalent to Pantip for Indonesia.", lang: "id" },
      { name: "GCash / Maya", type: "fintech", coverage: "Philippines", why: "Filipino gig workers discuss payments and opportunities in GCash groups.", lang: "tl" },
      { name: "Zalo", type: "messaging", coverage: "Vietnam", why: "Vietnam's #1 messaging app. Business groups and communities are active.", lang: "vi" },
      { name: "WeChat", type: "messaging", coverage: "China, Singapore, Malaysia", why: "Dominant in Chinese diaspora communities across SEA.", lang: "zh" },
    ],
    messaging: {
      primary: "LINE (Thailand) / WhatsApp (Indonesia, Philippines)",
      secondary: "SMS",
      note: "Messaging apps ARE social media in SEA. LINE is where businesses operate in Thailand.",
    },
    compliance: "SMS outreach mandatory. Phone numbers are the primary identifier.",
    behavior: "In Southeast Asia, messaging apps ARE social media. LINE in Thailand is not just for chatting — it is where businesses operate, where groups form around industries, and where leads are found.",
  },
  {
    id: "europe",
    name: "Europe",
    subtitle: "XING, WhatsApp & GDPR",
    countries: "EU · UK · Nordics · Eastern Europe",
    color: "text-blue-400",
    colorBg: "bg-blue-500/10",
    colorBorder: "border-blue-500/30",
    platforms: [
      { name: "XING", type: "professional", coverage: "Germany, Austria, Switzerland", why: "Professional network dominant in DACH region. Equivalent to LinkedIn for German-speaking markets.", lang: "de" },
      { name: "VKontakte (VK)", type: "social", coverage: "Russia, Ukraine, Belarus", why: "Russia and Eastern Europe's largest social network. 70M+ active users.", lang: "ru" },
      { name: "Leboncoin", type: "classifieds", coverage: "France", why: "France's largest classifieds platform. Service providers and freelancers list here.", lang: "fr" },
      { name: "Gumtree", type: "classifieds", coverage: "UK, Australia", why: "UK's Craigslist equivalent. Services, gig postings, and freelancer listings.", lang: "en" },
      { name: "Kleinanzeigen", type: "classifieds", coverage: "Germany", why: "Germany's largest classifieds. Service providers and gig workers post here.", lang: "de" },
      { name: "Bolt / Wolt Communities", type: "delivery", coverage: "Baltics, Nordics, Eastern Europe", why: "European rideshare and delivery drivers. Forums and Telegram groups.", lang: "multi" },
      { name: "Deliveroo / Just Eat", type: "delivery", coverage: "UK, France, Netherlands, Spain", why: "UK and Western Europe delivery gig workers. Reddit and Facebook groups.", lang: "en" },
      { name: "Freelancer.de / Malt", type: "professional", coverage: "Germany, France, Spain", why: "European freelancer platforms. Profiles with ratings and portfolios.", lang: "de" },
      { name: "Blocket", type: "classifieds", coverage: "Sweden", why: "Sweden's largest classifieds and services marketplace.", lang: "sv" },
      { name: "Marktplaats", type: "classifieds", coverage: "Netherlands", why: "Netherlands' largest classifieds.", lang: "nl" },
    ],
    messaging: {
      primary: "WhatsApp (Western Europe)",
      secondary: "Telegram (Eastern Europe)",
      note: "In DACH, both WhatsApp and XING messaging are used for professional outreach.",
    },
    compliance: "GDPR compliance mandatory. Opt-out mechanism required in every message. Public professional profiles are acceptable.",
    behavior: "Europe is WhatsApp-dominant for messaging. Business WhatsApp is the primary outreach channel, not SMS. In Russia and Eastern Europe, Telegram is primary.",
  },
  {
    id: "americas",
    name: "Americas",
    subtitle: "SMS, Craigslist & WhatsApp",
    countries: "USA · Canada · Mexico · Brazil · Colombia · Argentina",
    color: "text-emerald-400",
    colorBg: "bg-emerald-500/10",
    colorBorder: "border-emerald-500/30",
    platforms: [
      { name: "Craigslist", type: "classifieds", coverage: "USA, Canada", why: "Still the largest classifieds platform in the US. Gigs section is active.", lang: "en" },
      { name: "Nextdoor", type: "social", coverage: "USA, Canada", why: "Neighborhood-level social network. High-intent leads for service providers.", lang: "en" },
      { name: "Yelp", type: "classifieds", coverage: "USA, Canada", why: "Service provider reviews. Providers with few reviews are new and need help.", lang: "en" },
      { name: "Thumbtack / TaskRabbit", type: "marketplace", coverage: "USA", why: "Gig service marketplaces. Profiles with ratings. Workers looking for clients.", lang: "en" },
      { name: "BiggerPockets", type: "forum", coverage: "USA", why: "Real estate investor and agent community. Forums, podcasts, networking.", lang: "en" },
      { name: "Alignable", type: "professional", coverage: "USA, Canada", why: "Small business networking platform. 7M+ members helping each other.", lang: "en" },
      { name: "MercadoLibre", type: "marketplace", coverage: "All LatAm", why: "Latin America's Amazon + eBay. Seller communities and forums.", lang: "es" },
      { name: "OLX", type: "classifieds", coverage: "Brazil, Argentina, Colombia", why: "Classifieds platform dominant in Brazil, Argentina, Colombia.", lang: "pt" },
      { name: "Rappi / iFood", type: "delivery", coverage: "Colombia, Brazil, Mexico", why: "LatAm's Uber Eats equivalents. Driver groups on WhatsApp and Telegram.", lang: "es" },
      { name: "Workana", type: "professional", coverage: "All LatAm", why: "LatAm's Upwork equivalent. Freelancer profiles with ratings.", lang: "es" },
    ],
    messaging: {
      primary: "SMS (North America) / WhatsApp (Latin America)",
      secondary: "Email (North America) / SMS (Latin America)",
      note: "Americans respond to text messages. In LatAm, WhatsApp Business groups are where deals happen.",
    },
    compliance: "CAN-SPAM compliance for email. TCPA for SMS in the US. Opt-out required.",
    behavior: "North America is SMS-first. Americans respond to text messages. Latin America is WhatsApp-first. WhatsApp Business groups are where communities form.",
  },
  {
    id: "africa",
    name: "Africa",
    subtitle: "WhatsApp, Nairaland & M-Pesa",
    countries: "Nigeria · Kenya · South Africa · Egypt · Ghana",
    color: "text-amber-400",
    colorBg: "bg-amber-500/10",
    colorBorder: "border-amber-500/30",
    platforms: [
      { name: "Nairaland", type: "forum", coverage: "Nigeria", why: "Nigeria's largest forum. 3M+ members. Every industry has active threads.", lang: "en" },
      { name: "Jiji", type: "classifieds", coverage: "Nigeria, Kenya, Ghana, Tanzania", why: "Africa's largest classifieds platform. Service providers and small businesses.", lang: "en" },
      { name: "Jumia", type: "marketplace", coverage: "Nigeria, Kenya, Egypt, Morocco", why: "Africa's Amazon. Seller communities and vendor forums.", lang: "multi" },
      { name: "WhatsApp Groups", type: "messaging", coverage: "All Africa", why: "THE communication platform for all of Africa. This is where leads live.", lang: "multi" },
      { name: "M-Pesa Communities", type: "fintech", coverage: "Kenya, Tanzania", why: "Mobile money is the backbone of the gig economy in East Africa.", lang: "sw" },
      { name: "Jobberman", type: "job_board", coverage: "Nigeria, Ghana", why: "West Africa's largest job board. Gig workers and freelancers post profiles.", lang: "en" },
      { name: "Careers24 / PNet", type: "job_board", coverage: "South Africa", why: "South Africa's largest job boards.", lang: "en" },
      { name: "Telegram Groups", type: "messaging", coverage: "Nigeria, Kenya, South Africa", why: "Growing fast, especially for tech-savvy gig workers and crypto communities.", lang: "en" },
    ],
    messaging: {
      primary: "WhatsApp",
      secondary: "Telegram",
      note: "WhatsApp-first, full stop. SMS is expensive relative to income. Data is cheap.",
    },
    compliance: "Mobile-first design mandatory. Most users access internet exclusively via mobile.",
    behavior: "Africa is WhatsApp-first, full stop. SMS is expensive relative to income. Data is cheap. WhatsApp is how everyone communicates — personal, business, everything.",
  },
  {
    id: "mena",
    name: "Middle East",
    subtitle: "Dubizzle, WhatsApp & Ramadan",
    countries: "UAE · Saudi Arabia · Qatar · Jordan · Lebanon",
    color: "text-rose-400",
    colorBg: "bg-rose-500/10",
    colorBorder: "border-rose-500/30",
    platforms: [
      { name: "Dubizzle", type: "classifieds", coverage: "UAE", why: "UAE's largest classifieds. Service providers, freelancers, and gig workers.", lang: "ar" },
      { name: "Haraj", type: "classifieds", coverage: "Saudi Arabia", why: "Saudi Arabia's largest classifieds platform. Services and gig postings.", lang: "ar" },
      { name: "Bayt.com", type: "job_board", coverage: "All MENA", why: "Middle East's largest job board. Professional profiles with experience.", lang: "ar" },
      { name: "Careem Communities", type: "delivery", coverage: "UAE, Saudi, Egypt, Pakistan", why: "Middle East's Uber equivalent. Driver groups on WhatsApp and Telegram.", lang: "ar" },
      { name: "Noon Seller Communities", type: "marketplace", coverage: "UAE, Saudi, Egypt", why: "Middle East's e-commerce platform. Seller forums and WhatsApp groups.", lang: "ar" },
      { name: "WhatsApp Groups", type: "messaging", coverage: "All MENA", why: "Primary communication platform across the Middle East.", lang: "ar" },
      { name: "Telegram Groups", type: "messaging", coverage: "Iran, UAE, Saudi", why: "Growing fast, especially in Iran where other platforms are restricted.", lang: "fa" },
      { name: "LinkedIn", type: "professional", coverage: "UAE, Saudi, Qatar", why: "Higher penetration in Gulf states. Professional outreach works well.", lang: "en" },
    ],
    messaging: {
      primary: "WhatsApp",
      secondary: "SMS (Gulf states) / Telegram (Iran)",
      note: "LinkedIn messaging works well in UAE and Saudi for professional outreach.",
    },
    compliance: "Friday is the day of rest, not Sunday. Outreach timing must respect Ramadan.",
    behavior: "WhatsApp is primary. SMS is secondary but effective in Gulf states. Cultural considerations: Friday is the day of rest, Ramadan awareness is mandatory.",
  },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  forum: { bg: "bg-violet-500/20", text: "text-violet-300" },
  classifieds: { bg: "bg-sky-500/20", text: "text-sky-300" },
  messaging: { bg: "bg-green-500/20", text: "text-green-300" },
  job_board: { bg: "bg-yellow-500/20", text: "text-yellow-300" },
  marketplace: { bg: "bg-pink-500/20", text: "text-pink-300" },
  social: { bg: "bg-indigo-500/20", text: "text-indigo-300" },
  professional: { bg: "bg-cyan-500/20", text: "text-cyan-300" },
  delivery: { bg: "bg-orange-500/20", text: "text-orange-300" },
  fintech: { bg: "bg-emerald-500/20", text: "text-emerald-300" },
};

/* ─── Reusable sub-components ─── */

function AnimateIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PlatformCard({ platform }: { platform: Platform }) {
  const colors = typeColors[platform.type] || typeColors.forum;
  const lang = langMeta[platform.lang] || langMeta.en;
  return (
    <div className="group bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h5 className="text-sm font-semibold text-white leading-tight">{platform.name}</h5>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
          {platform.type.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed mb-2">{platform.why}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
          <span className="text-[11px] text-zinc-600">{platform.coverage}</span>
        </div>
        <div className="shrink-0 flex items-center gap-1 bg-zinc-800/60 rounded-md px-1.5 py-0.5" title={`Primary language: ${lang.label}`}>
          <span className="text-xs leading-none">{lang.flag}</span>
          <span className="text-[10px] text-zinc-500 font-medium">{lang.label}</span>
        </div>
      </div>
    </div>
  );
}

function MessagingBar({ messaging }: { messaging: RegionData["messaging"] }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-orange-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Outreach Channels</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Phone className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-300 mb-0.5">Primary</div>
            <div className="text-xs text-zinc-500">{messaging.primary}</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-700/30 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4 text-zinc-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-300 mb-0.5">Secondary</div>
            <div className="text-xs text-zinc-500">{messaging.secondary}</div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-zinc-600 mt-3 italic">{messaging.note}</p>
    </div>
  );
}

function ComplianceBadge({ text }: { text: string }) {
  const isGDPR = text.toLowerCase().includes("gdpr");
  return (
    <div className={`flex items-start gap-3 rounded-lg p-4 mt-4 ${isGDPR ? "bg-red-500/5 border border-red-500/20" : "bg-zinc-900/50 border border-zinc-800"}`}>
      {isGDPR ? (
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      ) : (
        <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
      )}
      <p className={`text-xs leading-relaxed ${isGDPR ? "text-red-300/80" : "text-zinc-500"}`}>{text}</p>
    </div>
  );
}

/* ─── Three Layer Stack Visualization ─── */

function ThreeLayerStack() {
  return (
    <div className="mt-16 mb-8">
      <AnimateIn>
        <div className="max-w-3xl mx-auto">
          <h3
            className="text-3xl md:text-4xl text-white mb-8 text-center"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            How the Three Layers Stack
          </h3>
          <div className="space-y-3">
            {[
              {
                layer: "Layer 1",
                title: "Universal Sources",
                detail: "LinkedIn, Reddit, Facebook Groups, Google, Telegram, Twitter/X, YouTube",
                trigger: "Always active, all regions",
                color: "from-zinc-600 to-zinc-700",
                borderColor: "border-zinc-600/40",
              },
              {
                layer: "Layer 2",
                title: "Role-Specific Sources",
                detail: "e.g., Network Marketer → r/antiMLM, r/sidehustle, MLM forums",
                trigger: "Loaded after Interview 1 identifies the role",
                color: "from-orange-600 to-amber-600",
                borderColor: "border-orange-500/40",
              },
              {
                layer: "Layer 3",
                title: "Regional Sources",
                detail: "e.g., Thailand → LINE OpenChat, Pantip, Jobthai, Wongnai",
                trigger: "Loaded after Interview 1 identifies location",
                color: "from-amber-500 to-yellow-500",
                borderColor: "border-amber-400/40",
              },
            ].map((layer, i) => (
              <AnimateIn key={i} delay={i * 0.15}>
                <div className={`relative border ${layer.borderColor} rounded-xl overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${layer.color} opacity-[0.07]`} />
                  <div className="relative p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`shrink-0 w-20 text-center py-1.5 rounded-lg bg-gradient-to-r ${layer.color} text-black text-xs font-bold uppercase tracking-wider`}>
                      {layer.layer}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white mb-0.5">{layer.title}</div>
                      <div className="text-xs text-zinc-500">{layer.detail}</div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-600 italic">{layer.trigger}</span>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
          <AnimateIn delay={0.5}>
            <p className="text-center text-xs text-zinc-600 mt-4">
              All three layers are active simultaneously. Regional sources supplement — they do not replace — the universal and role-specific sources.
            </p>
          </AnimateIn>
        </div>
      </AnimateIn>
    </div>
  );
}

/* ─── Main Component ─── */

export default function RegionalIntelligence() {
  const [activeRegion, setActiveRegion] = useState("sea");
  const activeData = regions.find((r) => r.id === activeRegion)!;

  return (
    <section id="regional-intel" className="relative">
      {/* Hero banner with generated image */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src={REGIONAL_INTEL_IMG} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/70 to-[#09090b]" />
        <div className="container relative">
          <AnimateIn>
            <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
              Part 7
            </span>
            <h2
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Regional Lead
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                Intelligence
              </span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              The bot does not ask where to find leads — it already knows. During onboarding,
              your location activates a region-specific intelligence layer. A hair stylist in
              Bangkok hunts on LINE and Pantip. A network marketer in Nigeria hunts on WhatsApp
              and Nairaland. The bot loads the right sources automatically.
            </p>
          </AnimateIn>
        </div>
      </div>

      {/* Three Layer Stack */}
      <div className="bg-[#09090b] relative">
        <div className="container">
          <ThreeLayerStack />
        </div>
      </div>

      {/* Region Selector + Content */}
      <div className="bg-[#09090b] relative py-16 md:py-24">
        <div className="container">
          {/* Region Tabs */}
          <AnimateIn>
            <div className="flex flex-wrap gap-2 mb-12 justify-center">
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => setActiveRegion(region.id)}
                  className={`group relative px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeRegion === region.id
                      ? `${region.colorBg} ${region.colorBorder} border ${region.color}`
                      : "bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{region.name}</span>
                  </div>
                  {activeRegion === region.id && (
                    <motion.div
                      layoutId="region-indicator"
                      className={`absolute -bottom-px left-4 right-4 h-0.5 ${region.colorBg.replace("/10", "")}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </AnimateIn>

          {/* Active Region Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRegion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Region Header */}
              <div className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-3">
                  <h3
                    className={`text-4xl md:text-5xl ${activeData.color}`}
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    {activeData.name}
                  </h3>
                  <span className="text-sm text-zinc-600 pb-1">{activeData.subtitle}</span>
                </div>
                <p className="text-sm text-zinc-500">{activeData.countries}</p>
              </div>

              {/* Platform Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {activeData.platforms.map((platform, i) => (
                  <AnimateIn key={platform.name} delay={i * 0.05}>
                    <PlatformCard platform={platform} />
                  </AnimateIn>
                ))}
              </div>

              {/* Messaging + Compliance Row */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <MessagingBar messaging={activeData.messaging} />
                <div>
                  <ComplianceBadge text={activeData.compliance} />
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Regional Behavior</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{activeData.behavior}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Priority Order */}
          <AnimateIn delay={0.3}>
            <div className="mt-16 max-w-3xl mx-auto">
              <h3
                className="text-3xl md:text-4xl text-white mb-8 text-center"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Scan Priority Order
              </h3>
              <p className="text-center text-sm text-zinc-500 mb-8">
                When the bot has limited API calls or rate limits, it scans sources in this order:
              </p>
              <div className="space-y-2">
                {[
                  { rank: 1, source: "LinkedIn", note: "Always first, all regions", color: "from-orange-500 to-amber-500" },
                  { rank: 2, source: "Regional Primary Platform", note: "LINE in Thailand, Nairaland in Nigeria, XING in Germany", color: "from-orange-500/80 to-amber-500/80" },
                  { rank: 3, source: "Regional Classifieds", note: "Pantip, Craigslist, Jiji, Dubizzle", color: "from-orange-500/60 to-amber-500/60" },
                  { rank: 4, source: "Facebook Groups", note: "Public groups only", color: "from-zinc-500 to-zinc-600" },
                  { rank: 5, source: "Reddit", note: "Strongest in North America, weaker elsewhere", color: "from-zinc-500/80 to-zinc-600/80" },
                  { rank: 6, source: "Telegram Groups", note: "Growing in Africa and Eastern Europe", color: "from-zinc-600 to-zinc-700" },
                  { rank: 7, source: "Job Boards", note: "Jobthai, Bayt, Jobberman", color: "from-zinc-600/80 to-zinc-700/80" },
                  { rank: 8, source: "Google Search", note: "Catch-all for anything missed", color: "from-zinc-700 to-zinc-800" },
                ].map((item, i) => (
                  <AnimateIn key={i} delay={i * 0.06}>
                    <div className="flex items-center gap-4 group">
                      <div className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <span className="text-sm font-bold text-black">{item.rank}</span>
                      </div>
                      <div className="flex-1 min-w-0 bg-zinc-900/40 border border-zinc-800 rounded-lg px-4 py-3 group-hover:border-zinc-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-sm font-semibold text-white">{item.source}</span>
                          <span className="text-[11px] text-zinc-600">{item.note}</span>
                        </div>
                      </div>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* Auto-Detection Callout */}
          <AnimateIn delay={0.4}>
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="relative border border-orange-500/20 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5" />
                <div className="relative p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-5">
                    <Globe className="w-7 h-7 text-black" />
                  </div>
                  <h4
                    className="text-2xl md:text-3xl text-white mb-3"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    Automatic Detection
                  </h4>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-lg mx-auto">
                    During Interview 1, the customer says where they are located. The bot detects
                    the country, loads the regional source overlay, and announces which platforms
                    it will monitor. The customer is <strong className="text-orange-400">never asked</strong> which
                    platforms to use.
                  </p>
                  <div className="mt-6 bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="text-zinc-600">{"// Customer says: \"I'm in Bangkok, Thailand\""}</div>
                      <div className="text-zinc-500">{"1. country = Thailand, region = Southeast Asia"}</div>
                      <div className="text-zinc-500">{"2. Load: regional_sources[\"southeast_asia\"]"}</div>
                      <div className="text-zinc-500">{"3. Merge: universal + role_specific + regional"}</div>
                      <div className="text-zinc-500">{"4. Set: primary_outreach = \"line\""}</div>
                      <div className="text-orange-400/80">{"5. Bot: \"I'll monitor LINE OpenChat, Pantip,"}</div>
                      <div className="text-orange-400/80">{"   Wongnai, and LinkedIn for your ideal customers.\""}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
