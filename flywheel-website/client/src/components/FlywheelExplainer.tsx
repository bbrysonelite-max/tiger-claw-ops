/**
 * FlywheelExplainer — Visual deep-dive into the 5 stages of the Tiger Claw flywheel.
 * Design: "Predator's Path" — Bold editorial, black/orange, oversized display type
 */

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Eye,
  MessageCircle,
  Heart,
  Target,
  Repeat,
  ArrowRight,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  Sparkles,
  Brain,
  Send,
  Gift,
  Calendar,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const FLYWHEEL_EXPLAINER_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/vYOvQ0PT29zsOdhlVogNAC-img-1_1771120386000_na1fn_Zmx5d2hlZWwtZXhwbGFpbmVyLWhlcm8.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3ZZT3ZRMFBUMjl6c09kaGxWb2dOQUMtaW1nLTFfMTc3MTEyMDM4NjAwMF9uYTFmbl9abXg1ZDJobFpXd3RaWGh3YkdGcGJtVnlMV2hsY204LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KwV5PRUjzmv~ywxb2ybfGO-0pJ-HRyh4mTQjy6hjEanJhAXKBmkeYy3dhi3pTpUWIAQLuYSwl3MJ3cJKHBTXDi4cMzqUKAtow0V96RgaQD~MNh2x8K3ivMhflcqcyiNSQp-Y30ZRv-MIZ5NeUaomAef6GxolwWdVRDrawRYbf5W69a59vt3VElf6rDLFvuLITfO3n~kBrkrGd4wzd8Zr44Z3N0uk9ekRjLlqK9fod7P5gB72EMDWVjKk53dyrUIIyiw2piFxUp-YLhFmdofuwRYL78JktM-Q4gnRav9SGVE1ZWtPTivkZxy~pJqjZlcxHNNuvmcS5cuCRIC8G9fK7A__";

/* ─── Stage Data ─── */

interface StageDetail {
  id: number;
  name: string;
  tagline: string;
  icon: typeof Eye;
  color: string;
  gradient: string;
  borderColor: string;
  question: string;
  answer: string;
  whatBotDoes: string[];
  whatCustomerSees: string[];
  keyMetrics: { label: string; value: string; icon: typeof BarChart3 }[];
  realWorldExample: string;
  duration: string;
  feedsNext: string;
}

const stages: StageDetail[] = [
  {
    id: 1,
    name: "Discovery",
    tagline: "Finding Your People",
    icon: Eye,
    color: "text-orange-400",
    gradient: "from-orange-500 to-amber-500",
    borderColor: "border-orange-500/30",
    question: "How does a lead enter the system?",
    answer:
      "Tiger Claw scans LinkedIn, regional platforms, and online communities 24/7 — looking for people who match your Ideal Customer Profile. It watches for keywords, pain points, and buying signals. When it finds a match, that person becomes a lead.",
    whatBotDoes: [
      "Scans LinkedIn for ICP keywords and pain points",
      "Monitors regional platforms (LINE groups, Pantip, WhatsApp communities)",
      "Tracks competitor mentions and industry conversations",
      "Scores each prospect based on ICP match strength",
    ],
    whatCustomerSees: [
      "New leads appearing in your dashboard daily",
      "Each lead tagged with match score and source",
      "Weekly discovery report with trends and insights",
    ],
    keyMetrics: [
      { label: "Profiles Scanned", value: "500+/day", icon: Users },
      { label: "ICP Match Rate", value: "23%", icon: Target },
      { label: "Sources Monitored", value: "12+", icon: Eye },
    ],
    realWorldExample:
      "A hair stylist in Bangkok sets up Tiger Claw with keywords like 'need haircut', 'wedding hair', 'hair color change'. The bot finds 47 prospects on LINE and Pantip in the first week — people actively talking about needing hair services.",
    duration: "Always running",
    feedsNext: "Matched leads flow into First Contact",
  },
  {
    id: 2,
    name: "First Contact",
    tagline: "Breaking the Ice",
    icon: MessageCircle,
    color: "text-amber-400",
    gradient: "from-amber-500 to-yellow-500",
    borderColor: "border-amber-500/30",
    question: "What happens when a lead is found?",
    answer:
      "Tiger Claw doesn't spam. It makes a warm, personalized first touch — a connection request, a thoughtful comment on their content, or a direct message that references something specific about them. The goal is to start a real conversation, not pitch.",
    whatBotDoes: [
      "Sends personalized LinkedIn connection requests",
      "Comments on prospect's recent posts with genuine value",
      "Sends a non-salesy DM referencing shared interests",
      "Adapts channel based on region (LINE in Thailand, WhatsApp in Indonesia)",
    ],
    whatCustomerSees: [
      "Connection acceptance notifications",
      "Reply notifications from prospects",
      "Engagement metrics on your outreach",
    ],
    keyMetrics: [
      { label: "Connection Rate", value: "34%", icon: Users },
      { label: "Reply Rate", value: "18%", icon: MessageCircle },
      { label: "Avg. Response Time", value: "4.2 hrs", icon: Clock },
    ],
    realWorldExample:
      "The bot finds a prospect who posted about needing a rebrand. It comments: 'Great point about brand consistency — I've seen small changes in color palette make a huge difference.' No pitch. Just value. The prospect replies.",
    duration: "24–48 hours after discovery",
    feedsNext: "Engaged prospects enter the Nurturing sequence",
  },
  {
    id: 3,
    name: "Nurturing",
    tagline: "Building Trust Over Time",
    icon: Heart,
    color: "text-yellow-400",
    gradient: "from-yellow-500 to-orange-400",
    borderColor: "border-yellow-500/30",
    question: "How does Tiger Claw build trust?",
    answer:
      "This is where the psychology kicks in. Tiger Claw runs a 10-touch, 30-day nurture sequence using proven persuasion principles — reciprocity, social proof, scarcity, authority. Each touch delivers value first, building trust before ever making an ask.",
    whatBotDoes: [
      "Sends a free gift (ebook, guide, tool) on Day 1 — Reciprocity",
      "Shares client success stories — Social Proof",
      "Delivers expert content that builds authority",
      "Creates urgency with limited availability — Scarcity",
      "Alternates between Email, SMS, and DM for maximum reach",
    ],
    whatCustomerSees: [
      "Prospects opening your emails and clicking links",
      "Lead scores increasing as engagement grows",
      "Prospects replying with questions (buying signals)",
    ],
    keyMetrics: [
      { label: "Open Rate", value: "42%", icon: Eye },
      { label: "Click Rate", value: "12%", icon: TrendingUp },
      { label: "Lead Score Growth", value: "+340%", icon: BarChart3 },
    ],
    realWorldExample:
      "Day 1: Free hair care guide sent. Day 4: Friendly SMS check-in. Day 8: Myth-busting article. Day 12: Before/after gallery. By Day 18, the prospect is asking about pricing — they came to you.",
    duration: "30-day automated sequence",
    feedsNext: "Warm leads with high scores trigger Conversion",
  },
  {
    id: 4,
    name: "Conversion",
    tagline: "Closing the Deal",
    icon: Target,
    color: "text-orange-500",
    gradient: "from-orange-400 to-red-500",
    borderColor: "border-orange-400/30",
    question: "What triggers the conversion?",
    answer:
      "When a lead's engagement score crosses the threshold, Tiger Claw makes the ask. It sends a calendar booking link, a purchase page, or a signup form — timed perfectly when the prospect is warmest. No cold pitching. The prospect is ready.",
    whatBotDoes: [
      "Monitors lead score for conversion-ready threshold",
      "Sends calendar booking link at optimal timing",
      "Delivers purchase or signup link with urgency framing",
      "Follows up once if no response within 48 hours",
    ],
    whatCustomerSees: [
      "Booked calls appearing on your calendar",
      "New signups and purchases in your dashboard",
      "Conversion rate tracking in real-time",
    ],
    keyMetrics: [
      { label: "Conversion Rate", value: "8.4%", icon: Target },
      { label: "Avg. Deal Value", value: "$127", icon: TrendingUp },
      { label: "Time to Convert", value: "22 days", icon: Clock },
    ],
    realWorldExample:
      "After 3 weeks of value-first nurturing, the prospect asks 'How much for a full color treatment?' Tiger Claw immediately sends a booking link with a limited-time offer: 'Book this week and get a free deep conditioning treatment.'",
    duration: "Triggered by lead score",
    feedsNext: "New customers enter Retention & Learning",
  },
  {
    id: 5,
    name: "Retention & Learning",
    tagline: "The Wheel Accelerates",
    icon: Repeat,
    color: "text-red-400",
    gradient: "from-red-500 to-orange-500",
    borderColor: "border-red-500/30",
    question: "What happens after they buy?",
    answer:
      "This is what makes it a flywheel, not a funnel. Every customer gets an automated welcome sequence, satisfaction check-ins, and referral requests. But here's the key: Tiger Claw learns from every interaction. What messages got replies? What timing worked? That data feeds back into Discovery, making the next cycle smarter and faster.",
    whatBotDoes: [
      "Sends automated welcome and onboarding sequence",
      "Schedules satisfaction check-ins at 7, 30, and 90 days",
      "Requests referrals and testimonials from happy customers",
      "Analyzes what worked — which messages, timing, channels",
      "Feeds learnings back into Discovery to improve targeting",
    ],
    whatCustomerSees: [
      "Happy customers leaving reviews and testimonials",
      "Referral leads appearing in your pipeline",
      "Monthly performance report showing improvement over time",
    ],
    keyMetrics: [
      { label: "Retention Rate", value: "87%", icon: RefreshCw },
      { label: "Referral Rate", value: "31%", icon: Users },
      { label: "Bot Improvement", value: "+12%/mo", icon: Brain },
    ],
    realWorldExample:
      "A satisfied client gets a Day 7 check-in: 'How's the new color holding up?' They reply with a photo. Tiger Claw asks if they'd share it as a testimonial. They agree. That testimonial becomes social proof in the next nurture sequence. The wheel spins faster.",
    duration: "Ongoing — never stops",
    feedsNext: "Learnings loop back to Discovery → the wheel accelerates",
  },
];

/* ─── Subcomponents ─── */

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
  const isInView = useInView(ref, { once: true, margin: "-60px" });
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

/* ─── Flywheel Visual Diagram ─── */

function FlywheelDiagram({
  activeStage,
  onSelect,
}: {
  activeStage: number;
  onSelect: (i: number) => void;
}) {
  const positions = [
    { x: 50, y: 8 },   // Discovery — top center
    { x: 88, y: 38 },  // First Contact — right
    { x: 74, y: 82 },  // Nurturing — bottom right
    { x: 26, y: 82 },  // Conversion — bottom left
    { x: 12, y: 38 },  // Retention — left
  ];

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-square">
      {/* Outer ring glow */}
      <div className="absolute inset-4 rounded-full border border-orange-500/10" />
      <div className="absolute inset-8 rounded-full border border-orange-500/5" />

      {/* Center pulse */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <Zap className="w-8 h-8 text-black" />
        </div>
      </div>

      {/* Connecting arcs — SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {positions.map((pos, i) => {
          const next = positions[(i + 1) % 5];
          return (
            <motion.line
              key={i}
              x1={pos.x}
              y1={pos.y}
              x2={next.x}
              y2={next.y}
              stroke={activeStage === i ? "#f97316" : "#3f3f46"}
              strokeWidth={activeStage === i ? 0.8 : 0.4}
              strokeDasharray="2 2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: i * 0.15 }}
            />
          );
        })}
      </svg>

      {/* Stage nodes */}
      {stages.map((stage, i) => {
        const pos = positions[i];
        const isActive = activeStage === i;
        const Icon = stage.icon;
        return (
          <motion.button
            key={stage.id}
            onClick={() => onSelect(i)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Glow ring */}
            {isActive && (
              <motion.div
                className={`absolute inset-[-6px] rounded-full bg-gradient-to-br ${stage.gradient} opacity-30`}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <div
              className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-br ${stage.gradient} shadow-lg shadow-orange-500/30`
                  : "bg-zinc-900 border border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <Icon
                className={`w-6 h-6 md:w-7 md:h-7 ${isActive ? "text-black" : "text-zinc-500 group-hover:text-zinc-300"}`}
              />
            </div>
            {/* Label */}
            <span
              className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive ? "text-orange-400" : "text-zinc-600"
              }`}
            >
              {stage.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Stage Detail Card ─── */

function StageDetailCard({ stage }: { stage: StageDetail }) {
  const [showExample, setShowExample] = useState(false);

  return (
    <motion.div
      key={stage.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center shrink-0`}
        >
          <stage.icon className="w-7 h-7 text-black" />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Stage {stage.id} of 5
            </span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {stage.duration}
            </span>
          </div>
          <h3
            className="text-3xl md:text-4xl text-white leading-tight"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            {stage.name}
          </h3>
          <p className={`text-sm font-medium ${stage.color} mt-0.5`}>
            {stage.tagline}
          </p>
        </div>
      </div>

      {/* Question & Answer */}
      <div className={`border-l-2 ${stage.borderColor} pl-5 mb-8`}>
        <p className="text-orange-400 font-medium italic mb-2">
          "{stage.question}"
        </p>
        <p className="text-zinc-400 leading-relaxed text-[15px]">
          {stage.answer}
        </p>
      </div>

      {/* Two Column: Bot Does / Customer Sees */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* What Tiger Claw Does */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            What Tiger Claw Does
          </h4>
          <div className="space-y-2.5">
            {stage.whatBotDoes.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-start gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                </div>
                <span className="text-sm text-zinc-300 leading-snug">
                  {action}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* What Customer Sees */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
          <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            What You See
          </h4>
          <div className="space-y-2.5">
            {stage.whatCustomerSees.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-2.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-300 leading-snug">
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {stage.keyMetrics.map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center"
          >
            <metric.icon className="w-4 h-4 text-zinc-500 mx-auto mb-2" />
            <div
              className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${stage.gradient} bg-clip-text text-transparent`}
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              {metric.value}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 leading-tight">
              {metric.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real World Example — Expandable */}
      <button
        onClick={() => setShowExample(!showExample)}
        className="w-full flex items-center justify-between bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-xl px-5 py-3.5 transition-colors group"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-400 group-hover:text-zinc-300">
          <Sparkles className="w-4 h-4 text-orange-400" />
          Real-World Example
        </span>
        {showExample ? (
          <ChevronUp className="w-4 h-4 text-zinc-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        )}
      </button>
      <AnimatePresence>
        {showExample && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/40 border border-t-0 border-zinc-800 rounded-b-xl px-5 py-4">
              <p className="text-sm text-zinc-400 leading-relaxed italic">
                "{stage.realWorldExample}"
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feeds Next */}
      <div className="mt-6 flex items-center gap-3 text-zinc-600">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700" />
        <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-orange-500" />
          {stage.feedsNext}
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700" />
      </div>
    </motion.div>
  );
}

/* ─── Funnel vs Flywheel Comparison ─── */

function FunnelVsFlywheel() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Funnel — The Old Way */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-red-400/70 mb-4">
          The Old Way — Sales Funnel
        </h4>
        <div className="space-y-3 mb-6">
          {[
            { w: "100%", label: "Awareness", count: "1,000" },
            { w: "60%", label: "Interest", count: "600" },
            { w: "30%", label: "Decision", count: "300" },
            { w: "10%", label: "Purchase", count: "100" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="h-6 bg-gradient-to-r from-red-900/40 to-red-800/20 rounded"
                style={{ width: step.w }}
              />
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {step.label} ({step.count})
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-red-400/60">
          <span className="w-2 h-2 rounded-full bg-red-500/40" />
          Leads leak out at every stage. No learning. No momentum.
        </div>
      </div>

      {/* Flywheel — The Tiger Claw Way */}
      <div className="bg-zinc-900/40 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-400 mb-4">
          The Tiger Claw Way — Flywheel
        </h4>
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-orange-500/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-3 rounded-full border border-amber-500/20"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="text-2xl text-orange-400"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  +12%
                </div>
                <div className="text-[10px] text-zinc-500">per month</div>
              </div>
            </div>
            {/* Mini nodes */}
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-orange-500 to-amber-500"
                style={{
                  top: `${50 - 45 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 45 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-orange-400/80 mt-2">
          <span className="w-2 h-2 rounded-full bg-orange-500/60" />
          Every customer adds momentum. The bot gets smarter every cycle.
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export default function FlywheelExplainer() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section id="flywheel-explainer" className="relative">
      {/* Hero Banner */}
      <div className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img
            src={FLYWHEEL_EXPLAINER_IMG}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/60 to-[#09090b]" />
        <div className="container relative">
          <AnimateIn>
            <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
              Understanding the Flywheel
            </span>
            <h2
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              How the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                Flywheel Works
              </span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              A flywheel is not a funnel. A funnel loses energy at every step. A
              flywheel <em>gains</em> it. Every customer Tiger Claw converts makes
              the next conversion easier, faster, and cheaper. Here's exactly how
              each stage works.
            </p>
          </AnimateIn>
        </div>
      </div>

      {/* Funnel vs Flywheel */}
      <div className="bg-[#09090b] py-12 md:py-16">
        <div className="container">
          <AnimateIn>
            <div className="text-center mb-10">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
                Why a Flywheel?
              </span>
              <h3
                className="text-3xl md:text-4xl text-white mt-2"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Funnel vs. Flywheel
              </h3>
            </div>
          </AnimateIn>
          <AnimateIn delay={0.15}>
            <FunnelVsFlywheel />
          </AnimateIn>
        </div>
      </div>

      {/* Interactive Stage Explorer */}
      <div className="bg-[#09090b] py-16 md:py-24">
        <div className="container">
          <AnimateIn>
            <div className="text-center mb-12">
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
                Click any stage to explore
              </span>
              <h3
                className="text-3xl md:text-4xl text-white mt-2"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                The 5 Stages
              </h3>
            </div>
          </AnimateIn>

          <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-start">
            {/* Left: Interactive Diagram */}
            <AnimateIn className="lg:sticky lg:top-24">
              <FlywheelDiagram
                activeStage={activeStage}
                onSelect={setActiveStage}
              />
              {/* Mobile stage tabs */}
              <div className="flex flex-wrap gap-2 mt-8 lg:hidden">
                {stages.map((stage, i) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeStage === i
                        ? `bg-gradient-to-r ${stage.gradient} text-black`
                        : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                    }`}
                  >
                    <stage.icon className="w-3.5 h-3.5" />
                    {stage.name}
                  </button>
                ))}
              </div>
            </AnimateIn>

            {/* Right: Stage Detail */}
            <div>
              <AnimatePresence mode="wait">
                <StageDetailCard
                  key={activeStage}
                  stage={stages[activeStage]}
                />
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: One-Liner Summary */}
      <div className="bg-[#09090b] pb-16">
        <div className="container">
          <AnimateIn>
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-8 md:p-12 text-center">
              <Brain className="w-10 h-10 text-orange-400 mx-auto mb-4" />
              <h3
                className="text-2xl md:text-3xl text-white mb-3"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                The Flywheel Gets Smarter Every Cycle
              </h3>
              <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed">
                The 100th conversation is smarter than the 1st. Every reply,
                every open, every conversion teaches Tiger Claw what works for{" "}
                <em>your</em> specific audience. That's not a tool — that's a
                compounding advantage.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                {[
                  { label: "Avg. Improvement", value: "+12%/mo" },
                  { label: "After 6 Months", value: "2× faster" },
                  { label: "After 12 Months", value: "3.4× ROI" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-2xl md:text-3xl text-orange-400"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
