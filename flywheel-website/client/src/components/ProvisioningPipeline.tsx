/**
 * Provisioning Pipeline Diagram
 * Design: "Predator's Path" — Bold editorial, black/orange
 * Shows the automated pipeline for both paid (Stripe) and trial (Stan Store) customers
 * converging into a single bot provisioning engine
 */

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  CreditCard,
  Gift,
  Webhook,
  Server,
  Bot,
  Mail,
  ArrowRight,
  CheckCircle,
  Zap,
  ShieldCheck,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";

/* ─── AnimateIn ─── */
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

/* ─── Pipeline Step Component ─── */
function PipelineStep({
  icon: Icon,
  label,
  sublabel,
  color = "orange",
  active = false,
  delay = 0,
  pulse = false,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  color?: "orange" | "amber" | "emerald" | "blue" | "purple";
  active?: boolean;
  delay?: number;
  pulse?: boolean;
}) {
  const colorMap = {
    orange: {
      bg: "bg-orange-500/15",
      border: "border-orange-500/30",
      text: "text-orange-400",
      glow: "shadow-orange-500/20",
      activeBg: "bg-orange-500/25",
      activeBorder: "border-orange-500/60",
    },
    amber: {
      bg: "bg-amber-500/15",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      activeBg: "bg-amber-500/25",
      activeBorder: "border-amber-500/60",
    },
    emerald: {
      bg: "bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      activeBg: "bg-emerald-500/25",
      activeBorder: "border-emerald-500/60",
    },
    blue: {
      bg: "bg-blue-500/15",
      border: "border-blue-500/30",
      text: "text-blue-400",
      glow: "shadow-blue-500/20",
      activeBg: "bg-blue-500/25",
      activeBorder: "border-blue-500/60",
    },
    purple: {
      bg: "bg-purple-500/15",
      border: "border-purple-500/30",
      text: "text-purple-400",
      glow: "shadow-purple-500/20",
      activeBg: "bg-purple-500/25",
      activeBorder: "border-purple-500/60",
    },
  };

  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border ${
          active ? c.activeBg : c.bg
        } ${active ? c.activeBorder : c.border} flex items-center justify-center shadow-lg ${c.glow} transition-all duration-300`}
      >
        {pulse && (
          <div className="absolute inset-0 rounded-2xl border border-orange-500/40 animate-ping opacity-30" />
        )}
        <Icon className={`w-7 h-7 md:w-8 md:h-8 ${c.text}`} />
      </div>
      <span
        className="text-xs md:text-sm font-semibold text-white text-center leading-tight max-w-[100px]"
        style={{ fontFamily: '"Outfit", sans-serif' }}
      >
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] md:text-xs text-zinc-500 text-center max-w-[100px]">
          {sublabel}
        </span>
      )}
    </motion.div>
  );
}

/* ─── Arrow Connector ─── */
function ArrowConnector({ delay = 0, vertical = false }: { delay?: number; vertical?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: vertical ? 0 : -10, y: vertical ? -10 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`flex items-center justify-center ${vertical ? "py-1" : "px-1 md:px-2"}`}
    >
      <div
        className={`flex items-center justify-center ${
          vertical ? "flex-col" : ""
        }`}
      >
        <div
          className={`${
            vertical ? "w-px h-6 md:h-8" : "h-px w-6 md:w-10"
          } bg-gradient-to-r from-orange-500/60 to-amber-500/60`}
        />
        <ArrowRight
          className={`w-3 h-3 text-orange-400 ${vertical ? "rotate-90 -mt-1" : "-ml-1"}`}
        />
      </div>
    </motion.div>
  );
}

/* ─── Merge Point ─── */
function MergePoint({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, type: "spring", stiffness: 200 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Zap className="w-6 h-6 md:w-7 md:h-7 text-black" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 animate-ping opacity-20" />
      </div>
      <span
        className="text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-orange-400"
        style={{ fontFamily: '"Outfit", sans-serif' }}
      >
        API Endpoint
      </span>
    </motion.div>
  );
}

/* ─── Timeline Event ─── */
function TimelineEvent({
  time,
  event,
  detail,
  icon: Icon,
  color = "orange",
}: {
  time: string;
  event: string;
  detail: string;
  icon: React.ElementType;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  const cls = colorClasses[color] || colorClasses.orange;
  const [textColor, bgColor, borderColor] = cls.split(" ");

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-lg ${bgColor} border ${borderColor} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <Icon className={`w-4 h-4 ${textColor}`} />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {time}
          </span>
        </div>
        <p className="text-sm font-semibold text-white">{event}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ProvisioningPipeline() {
  const [activePath, setActivePath] = useState<"paid" | "trial">("paid");
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="provisioning"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-zinc-950 to-[#09090b]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <AnimateIn>
          <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
            Zero Manual Steps
          </span>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h2
            className="text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-tight text-white mb-4"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Automated{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Provisioning
            </span>
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <p
            className="text-lg text-zinc-400 max-w-2xl mb-16"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Whether someone pays through Stripe or signs up for a free trial through Stan Store,
            the pipeline is identical. No manual provisioning. No human bottleneck.
            Purchase → Bot live → Welcome email. Fully automated.
          </p>
        </AnimateIn>

        {/* Path Selector */}
        <AnimateIn delay={0.2}>
          <div className="flex gap-3 mb-12">
            <button
              onClick={() => setActivePath("paid")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 ${
                activePath === "paid"
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-lg shadow-orange-500/10"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Paid Customer (Stripe)
            </button>
            <button
              onClick={() => setActivePath("trial")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 ${
                activePath === "trial"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Gift className="w-4 h-4" />
              Trial Customer (Stan Store)
            </button>
          </div>
        </AnimateIn>

        {/* ═══════ PIPELINE DIAGRAM ═══════ */}
        <AnimateIn delay={0.25}>
          <div className="relative bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-10 mb-12 overflow-hidden">
            {/* Background glow */}
            <div
              className={`absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[120px] transition-colors duration-700 ${
                activePath === "paid" ? "bg-orange-500/8" : "bg-amber-500/8"
              }`}
            />

            {/* Pipeline label */}
            <div className="flex items-center gap-2 mb-8">
              <div
                className={`w-2 h-2 rounded-full ${
                  activePath === "paid" ? "bg-orange-500" : "bg-amber-500"
                } animate-pulse`}
              />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                {activePath === "paid" ? "Paid Pipeline" : "Trial Pipeline"} — Live
              </span>
            </div>

            {/* Desktop Pipeline (horizontal) */}
            <div className="hidden md:flex items-center justify-between">
              {activePath === "paid" ? (
                <>
                  <PipelineStep
                    icon={CreditCard}
                    label="Purchase"
                    sublabel="Stan Store / Direct"
                    color="orange"
                    active
                    delay={0}
                  />
                  <ArrowConnector delay={0.1} />
                  <PipelineStep
                    icon={Webhook}
                    label="Stripe Webhook"
                    sublabel="payment_intent.succeeded"
                    color="purple"
                    delay={0.15}
                  />
                  <ArrowConnector delay={0.2} />
                  <PipelineStep
                    icon={Server}
                    label="Job Queue"
                    sublabel="provision-bots.cjs"
                    color="blue"
                    delay={0.25}
                  />
                  <ArrowConnector delay={0.3} />
                  <PipelineStep
                    icon={Bot}
                    label="Bot Provisioned"
                    sublabel="@Tiger_{name}_bot"
                    color="emerald"
                    delay={0.35}
                    pulse
                  />
                  <ArrowConnector delay={0.4} />
                  <PipelineStep
                    icon={Mail}
                    label="Welcome Email"
                    sublabel="Credentials + Guide"
                    color="amber"
                    delay={0.45}
                  />
                </>
              ) : (
                <>
                  <PipelineStep
                    icon={Gift}
                    label="Free Signup"
                    sublabel="Stan Store Product"
                    color="amber"
                    active
                    delay={0}
                  />
                  <ArrowConnector delay={0.1} />
                  <PipelineStep
                    icon={Webhook}
                    label="Stan Webhook"
                    sublabel="{name, email}"
                    color="purple"
                    delay={0.15}
                  />
                  <ArrowConnector delay={0.2} />
                  <PipelineStep
                    icon={Server}
                    label="API Endpoint"
                    sublabel="provision-bots.cjs"
                    color="blue"
                    delay={0.25}
                  />
                  <ArrowConnector delay={0.3} />
                  <PipelineStep
                    icon={Bot}
                    label="Bot Provisioned"
                    sublabel="@Tiger_{name}_bot"
                    color="emerald"
                    delay={0.35}
                    pulse
                  />
                  <ArrowConnector delay={0.4} />
                  <PipelineStep
                    icon={Mail}
                    label="Welcome Email"
                    sublabel="Trial access + Guide"
                    color="amber"
                    delay={0.45}
                  />
                </>
              )}
            </div>

            {/* Mobile Pipeline (vertical) */}
            <div className="flex md:hidden flex-col items-center gap-1">
              {activePath === "paid" ? (
                <>
                  <PipelineStep
                    icon={CreditCard}
                    label="Purchase"
                    sublabel="Stan Store / Direct"
                    color="orange"
                    active
                    delay={0}
                  />
                  <ArrowConnector delay={0.1} vertical />
                  <PipelineStep
                    icon={Webhook}
                    label="Stripe Webhook"
                    sublabel="payment_intent.succeeded"
                    color="purple"
                    delay={0.15}
                  />
                  <ArrowConnector delay={0.2} vertical />
                  <PipelineStep
                    icon={Server}
                    label="Job Queue"
                    sublabel="provision-bots.cjs"
                    color="blue"
                    delay={0.25}
                  />
                  <ArrowConnector delay={0.3} vertical />
                  <PipelineStep
                    icon={Bot}
                    label="Bot Provisioned"
                    sublabel="@Tiger_{name}_bot"
                    color="emerald"
                    delay={0.35}
                    pulse
                  />
                  <ArrowConnector delay={0.4} vertical />
                  <PipelineStep
                    icon={Mail}
                    label="Welcome Email"
                    sublabel="Credentials + Guide"
                    color="amber"
                    delay={0.45}
                  />
                </>
              ) : (
                <>
                  <PipelineStep
                    icon={Gift}
                    label="Free Signup"
                    sublabel="Stan Store Product"
                    color="amber"
                    active
                    delay={0}
                  />
                  <ArrowConnector delay={0.1} vertical />
                  <PipelineStep
                    icon={Webhook}
                    label="Stan Webhook"
                    sublabel="{name, email}"
                    color="purple"
                    delay={0.15}
                  />
                  <ArrowConnector delay={0.2} vertical />
                  <PipelineStep
                    icon={Server}
                    label="API Endpoint"
                    sublabel="provision-bots.cjs"
                    color="blue"
                    delay={0.25}
                  />
                  <ArrowConnector delay={0.3} vertical />
                  <PipelineStep
                    icon={Bot}
                    label="Bot Provisioned"
                    sublabel="@Tiger_{name}_bot"
                    color="emerald"
                    delay={0.35}
                    pulse
                  />
                  <ArrowConnector delay={0.4} vertical />
                  <PipelineStep
                    icon={Mail}
                    label="Welcome Email"
                    sublabel="Trial access + Guide"
                    color="amber"
                    delay={0.45}
                  />
                </>
              )}
            </div>
          </div>
        </AnimateIn>

        {/* ═══════ CONVERGENCE DIAGRAM ═══════ */}
        <AnimateIn delay={0.3}>
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-10 mb-12">
            <h3
              className="text-2xl md:text-3xl text-white mb-2"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Both Paths, One Engine
            </h3>
            <p className="text-sm text-zinc-500 mb-8" style={{ fontFamily: '"Outfit", sans-serif' }}>
              Paid and trial customers converge at the same provisioning endpoint. Same script. Same quality. Same speed.
            </p>

            {/* Convergence visual */}
            <div className="flex flex-col items-center">
              {/* Two entry points */}
              <div className="flex items-start justify-center gap-8 md:gap-16 mb-4">
                {/* Paid path */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-400 tracking-wider uppercase">
                    Stripe
                  </span>
                  <div className="w-px h-8 md:h-12 bg-gradient-to-b from-orange-500/60 to-orange-500/20" />
                </div>

                {/* Trial path */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Gift className="w-6 h-6 md:w-7 md:h-7 text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-amber-400 tracking-wider uppercase">
                    Stan Store
                  </span>
                  <div className="w-px h-8 md:h-12 bg-gradient-to-b from-amber-500/60 to-amber-500/20" />
                </div>
              </div>

              {/* Converging lines */}
              <div className="relative w-full max-w-xs h-8 mb-2">
                <svg
                  viewBox="0 0 200 30"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 60 0 L 100 28"
                    stroke="rgba(249,115,22,0.4)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 140 0 L 100 28"
                    stroke="rgba(251,191,36,0.4)"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>

              {/* Merge point */}
              <MergePoint delay={0.2} />

              {/* Output line */}
              <div className="w-px h-8 md:h-12 bg-gradient-to-b from-orange-500/40 to-emerald-500/40 my-2" />

              {/* Output steps */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                    <Server className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-zinc-400">
                    provision-bots.cjs
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-zinc-400">
                    Bot Live
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-zinc-400">
                    Welcome Email
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* ═══════ TIMELINE COMPARISON ═══════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Paid Timeline */}
          <AnimateIn delay={0.1}>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h4
                    className="text-lg text-white"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    Paid Customer Timeline
                  </h4>
                  <p className="text-xs text-zinc-500">Stripe → Bot Live</p>
                </div>
              </div>

              <div className="space-y-4 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/30 via-blue-500/30 to-emerald-500/30" />

                <TimelineEvent
                  time="T+0s"
                  event="Customer completes purchase"
                  detail="Payment processed on Stan Store or direct Stripe checkout"
                  icon={CreditCard}
                  color="orange"
                />
                <TimelineEvent
                  time="T+2s"
                  event="Stripe webhook fires"
                  detail="payment_intent.succeeded → your server endpoint"
                  icon={Webhook}
                  color="purple"
                />
                <TimelineEvent
                  time="T+5s"
                  event="Job queue picks up provisioning"
                  detail="provision-bots.cjs creates Telegram bot via BotFather API"
                  icon={Server}
                  color="blue"
                />
                <TimelineEvent
                  time="T+30s"
                  event="Bot is live on Telegram"
                  detail="@Tiger_{name}_bot active with brain, memory, and ICP loaded"
                  icon={Bot}
                  color="emerald"
                />
                <TimelineEvent
                  time="T+45s"
                  event="Welcome email sent"
                  detail="Bot credentials, quick-start guide, and dashboard link"
                  icon={Mail}
                  color="amber"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">Total time:</span>
                <span className="text-sm text-orange-400 font-mono">&lt; 60 seconds</span>
              </div>
            </div>
          </AnimateIn>

          {/* Trial Timeline */}
          <AnimateIn delay={0.2}>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4
                    className="text-lg text-white"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    Trial Customer Timeline
                  </h4>
                  <p className="text-xs text-zinc-500">Stan Store Free → Bot Live</p>
                </div>
              </div>

              <div className="space-y-4 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-amber-500/30 via-blue-500/30 to-emerald-500/30" />

                <TimelineEvent
                  time="T+0s"
                  event="Customer claims free trial"
                  detail="Stan Store free product → captures name + email"
                  icon={Gift}
                  color="amber"
                />
                <TimelineEvent
                  time="T+2s"
                  event="Stan Store webhook fires"
                  detail="{name, email} → your API provisioning endpoint"
                  icon={Webhook}
                  color="purple"
                />
                <TimelineEvent
                  time="T+5s"
                  event="Same provisioning script runs"
                  detail="provision-bots.cjs — identical to paid path"
                  icon={Server}
                  color="blue"
                />
                <TimelineEvent
                  time="T+30s"
                  event="Trial bot is live on Telegram"
                  detail="@Tiger_{name}_bot active with trial limits configured"
                  icon={Bot}
                  color="emerald"
                />
                <TimelineEvent
                  time="T+45s"
                  event="Welcome email sent"
                  detail="Trial access details, upgrade path, and getting started guide"
                  icon={Mail}
                  color="amber"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">Total time:</span>
                <span className="text-sm text-amber-400 font-mono">&lt; 60 seconds</span>
              </div>
            </div>
          </AnimateIn>
        </div>

        {/* ═══════ KEY PRINCIPLES ═══════ */}
        <AnimateIn delay={0.35}>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white mb-1">Zero Manual Steps</h5>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  No human touches the pipeline. Purchase to bot-live is fully automated, 24/7.
                </p>
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white mb-1">Same Quality, Both Paths</h5>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Trial and paid bots run the same provisioning script. No second-class experience.
                </p>
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white mb-1">Instant Gratification</h5>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Under 60 seconds from signup to a working bot. No waiting, no onboarding calls.
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
