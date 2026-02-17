/**
 * ═══════════════════════════════════════════════════════════════
 *  LAUNCH PAGE — Tiger Bot Activation Landing Page
 *  Design: Dark cinematic, saber-tooth skull hero, minimal copy
 *  Purpose: ONE job — get the visitor to click a button
 *  Two CTAs: "Start Free Trial" (72h) and "Get Tiger Bot" (paid)
 *  Both link to Stripe Checkout — no backend needed
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Check,
  Star,
  Users,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

/* ── Stripe Checkout URLs (replace with real ones) ── */
const STRIPE_PAID_URL = "https://buy.stripe.com/YOUR_PAID_LINK";
const STRIPE_TRIAL_URL = "https://buy.stripe.com/YOUR_TRIAL_LINK";

/* ── Image URLs ── */
const HERO_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/F0bhlWPE2P6avSMZ0yk6kO-img-1_1771305350000_na1fn_bGF1bmNoLWhlcm8tdGlnZXI.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L0YwYmhsV1BFMlA2YXZTTVoweWs2a08taW1nLTFfMTc3MTMwNTM1MDAwMF9uYTFmbl9iR0YxYm1Ob0xXaGxjbTh0ZEdsblpYSS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=j~kkDyWXH1247QOdPAudWtfBt7EE7SUYdluQmk6rETZRbN~H-y8YInG4kheujh9iY8UCD2PDyGWzA-win2lNW0UPpKw2vxnLbYO2v4E46n3kqeba2w9ctaQjJefWxucv-1JHQtKao9RoSDhrKODauZTl7eoxXbketUBvWo43FEpwRY2icH8p4fURnbnK~Kx6FrRNjgVwsKdHPu0MV3DjU2QDF7OzEOt6etv2uO3v0QbZQmN5du4RtfUj4-w-f-INo32CfbZzCCow6bgliXOmQaEJKkbOKBFE0O5VoY-InlNszqSGNI67Ja0Wc32LBIboy2v3LugzFIHHAcUcZCtZyQ__";

const BG_PATTERN =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/F0bhlWPE2P6avSMZ0yk6kO-img-2_1771305347000_na1fn_bGF1bmNoLWJnLXBhdHRlcm4.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L0YwYmhsV1BFMlA2YXZTTVoweWs2a08taW1nLTJfMTc3MTMwNTM0NzAwMF9uYTFmbl9iR0YxYm1Ob0xXSm5MWEJoZEhSbGNtNC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=pMih8opiwZbW62XUBUPa5BLqTGn6PxPqhX7DfZ8O~nKAmYsNc~qunGE3o4QKlL2BOZXgfP~U6S2Blkg1WPj0reNmKtEHHOQjrGltQwrFbKeI6d9jPT26xiqRamvyc3krWIfYxxNA3SQFycqxrl8BDIKPe7QIpUfim~wQCmVuHimjUy3tQbTQy-~hjNrdpdHtqLiWo7TvRT~PpABrckNz6-tulVDkx1uj7fA4s1015c8ToWIEtx8~Rq8SE~f0HAt344X6FybD6VSqskNRZUpgPZ2ycSLu5E-0tb3Loc9-R7KFr57S3qygq7lxGj85Tx2AqhiZmeW9O-e3n-c8Ush0AQ__";

/* ── Animated counter hook ── */
function useCounter(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

/* ── Intersection observer hook ── */
function useInView(threshold: number = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Floating particles (CSS-only feel via JS) ── */
function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full opacity-40"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `oklch(0.75 0.18 55)`,
            animation: `float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-40px) translateX(20px); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}

/* ── Pulsing glow ring around CTA ── */
function GlowRing({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-1 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "linear-gradient(135deg, oklch(0.75 0.18 55), oklch(0.60 0.22 30), oklch(0.75 0.18 55))",
          filter: "blur(8px)",
          animation: "pulseGlow 2s ease-in-out infinite",
        }}
      />
      {children}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  MAIN LAUNCH PAGE                                             */
/* ══════════════════════════════════════════════════════════════ */
export default function Launch() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const statsRef = useInView(0.3);
  const leadsCount = useCounter(2847, 2500, statsRef.inView);
  const customersCount = useCounter(142, 2000, statsRef.inView);
  const conversionCount = useCounter(34, 1800, statsRef.inView);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHeroLoaded(true);
    img.src = HERO_IMG;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ HERO — Full viewport, skull + two CTAs ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          <img
            src={BG_PATTERN}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>
        <Particles />

        {/* Content */}
        <div className="relative z-10 container max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-20">

          {/* Left — Copy + CTAs */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[oklch(0.75_0.18_55/0.3)] bg-[oklch(0.75_0.18_55/0.08)]">
              <Zap className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
              <span className="text-sm font-medium text-[oklch(0.85_0.14_70)]">
                AI-Powered Prospecting Agent
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.9] tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <span className="text-foreground">UNLEASH</span>
              <br />
              <span className="text-foreground">YOUR</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55), oklch(0.60 0.22 30))",
                }}
              >
                TIGER BOT
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              An AI agent that finds, contacts, and nurtures your ideal customers
              <span className="text-[oklch(0.75_0.18_55)] font-semibold"> 24/7</span> — 
              while you focus on what you do best.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* Primary — Free Trial */}
              <GlowRing>
                <a href={STRIPE_TRIAL_URL} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="lg"
                    className="relative z-10 h-14 px-8 text-lg font-bold rounded-xl bg-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.80_0.20_55)] text-black transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </GlowRing>

              {/* Secondary — Paid */}
              <a href={STRIPE_PAID_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold rounded-xl border-2 border-[oklch(0.75_0.18_55/0.5)] text-[oklch(0.85_0.14_70)] hover:bg-[oklch(0.75_0.18_55/0.1)] hover:border-[oklch(0.75_0.18_55)] transition-all duration-300 w-full sm:w-auto"
                >
                  Get Tiger Bot — $49/mo
                </Button>
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
                72-hour free trial
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
                Cancel anytime
              </span>
            </div>
          </div>

          {/* Right — Hero image */}
          <div className="flex-1 relative">
            <div
              className={`transition-all duration-1000 ${
                heroLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <img
                src={HERO_IMG}
                alt="Tiger Bot — Saber-toothed AI Agent"
                className="w-full max-w-lg mx-auto drop-shadow-2xl"
                style={{
                  filter: "drop-shadow(0 0 60px oklch(0.75 0.18 55 / 0.3))",
                }}
              />
            </div>
            {/* Glow behind image */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, oklch(0.75 0.18 55 / 0.15), transparent 70%)",
                filter: "blur(40px)",
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">How it works</span>
          <ChevronDown className="w-5 h-5 text-[oklch(0.75_0.18_55)]" />
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 steps, dead simple ═══ */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.06_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <p
              className="text-sm font-bold tracking-[0.3em] uppercase mb-4"
              style={{ color: "oklch(0.75 0.18 55)" }}
            >
              Zero Setup Required
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              THREE STEPS. THAT'S IT.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Click the Button",
                desc: "Choose your plan. Stripe handles the rest. Takes 30 seconds.",
                icon: Zap,
              },
              {
                step: "02",
                title: "Chat with Your Bot",
                desc: "Your Tiger Bot messages you on Telegram. Answer 2 quick interviews. Takes 5 minutes.",
                icon: Users,
              },
              {
                step: "03",
                title: "Bot Goes Hunting",
                desc: "Tiger Bot starts finding and contacting your ideal customers. 24/7. Automatically.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div
                key={i}
                className="relative group"
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-[oklch(0.75_0.18_55/0.5)] to-transparent z-0" />
                )}
                <div className="relative bg-[oklch(0.10_0.005_250)] border border-[oklch(0.25_0.005_250)] rounded-2xl p-8 hover:border-[oklch(0.75_0.18_55/0.5)] transition-all duration-500 hover:-translate-y-1 h-full">
                  {/* Step number */}
                  <div
                    className="text-6xl font-bold mb-4 opacity-10"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", color: "oklch(0.75 0.18 55)" }}
                  >
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.75_0.18_55/0.1)] border border-[oklch(0.75_0.18_55/0.3)] flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-[oklch(0.75_0.18_55)]" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF — Stats ═══ */}
      <section ref={statsRef.ref} className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.08_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: leadsCount, suffix: "+", label: "Leads Generated" },
              { value: customersCount, suffix: "", label: "Active Tiger Bots" },
              { value: conversionCount, suffix: "%", label: "Avg. Conversion Rate" },
            ].map((stat, i) => (
              <div key={i} className="space-y-2">
                <div
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    color: "oklch(0.75 0.18 55)",
                  }}
                >
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET — Feature bullets ═══ */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.06_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              WHAT YOUR TIGER BOT DOES
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              "Scans 40+ platforms for your ideal customer profile",
              "Sends personalized outreach via the right channel",
              "Runs a 10-touch nurture sequence using proven psychology",
              "Learns from every conversation to get smarter over time",
              "Works across 5 regions with localized platform intelligence",
              "Operates 24/7 — no breaks, no sick days, no excuses",
              "Handles objections with Cialdini-based persuasion frameworks",
              "Reports back to you with qualified leads ready to close",
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-xl bg-[oklch(0.10_0.005_250/0.5)] border border-[oklch(0.25_0.005_250/0.5)] hover:border-[oklch(0.75_0.18_55/0.3)] transition-colors duration-300"
              >
                <div className="mt-0.5 w-6 h-6 rounded-full bg-[oklch(0.75_0.18_55/0.15)] flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[oklch(0.75_0.18_55)]" />
                </div>
                <p className="text-foreground/90">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING — Two cards side by side ═══ */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.08_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              CHOOSE YOUR PLAN
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Both plans include the full Tiger Bot. No feature gates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Trial */}
            <div className="relative rounded-2xl border border-[oklch(0.25_0.005_250)] bg-[oklch(0.10_0.005_250)] p-8 hover:border-[oklch(0.75_0.18_55/0.5)] transition-all duration-500">
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase text-[oklch(0.75_0.18_55)]">
                    Free Trial
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className="text-5xl font-bold"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      $0
                    </span>
                    <span className="text-muted-foreground">for 72 hours</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {[
                    "Full Tiger Bot — no limits",
                    "All 40+ platform sources",
                    "10-touch nurture sequence",
                    "72 hours of live prospecting",
                    "No credit card required",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-[oklch(0.75_0.18_55)] flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <a href={STRIPE_TRIAL_URL} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base font-semibold rounded-xl border-2 border-[oklch(0.75_0.18_55/0.5)] text-[oklch(0.85_0.14_70)] hover:bg-[oklch(0.75_0.18_55/0.1)] hover:border-[oklch(0.75_0.18_55)] transition-all duration-300"
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Paid — Recommended */}
            <div className="relative rounded-2xl border-2 border-[oklch(0.75_0.18_55)] bg-[oklch(0.12_0.008_55/0.3)] p-8 hover:shadow-[0_0_40px_oklch(0.75_0.18_55/0.15)] transition-all duration-500">
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[oklch(0.75_0.18_55)] text-black text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                <Star className="w-3 h-3" />
                Recommended
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase text-[oklch(0.75_0.18_55)]">
                    Tiger Bot Pro
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className="text-5xl font-bold"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      $49
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {[
                    "Everything in Free Trial",
                    "Unlimited prospecting — forever",
                    "Priority regional intelligence",
                    "Advanced nurture campaigns",
                    "Dedicated support channel",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-[oklch(0.75_0.18_55)] flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <GlowRing>
                  <a href={STRIPE_PAID_URL} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="relative z-10 w-full h-12 text-base font-bold rounded-xl bg-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.80_0.20_55)] text-black transition-all duration-300">
                      Get Tiger Bot Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </GlowRing>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA — Last chance ═══ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={BG_PATTERN} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
        </div>
        <Particles />
        <div className="relative z-10 container max-w-3xl mx-auto px-4 text-center space-y-8">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            YOUR NEXT CUSTOMER IS
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55), oklch(0.60 0.22 30))",
              }}
            >
              WAITING TO BE FOUND
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Every minute without Tiger Bot is a minute your competitors are reaching
            your ideal customers first.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowRing>
              <a href={STRIPE_TRIAL_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="relative z-10 h-14 px-10 text-lg font-bold rounded-xl bg-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.80_0.20_55)] text-black transition-all duration-300 hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free — 72 Hours
                </Button>
              </a>
            </GlowRing>
            <a href={STRIPE_PAID_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-10 text-lg font-semibold rounded-xl border-2 border-[oklch(0.75_0.18_55/0.5)] text-[oklch(0.85_0.14_70)] hover:bg-[oklch(0.75_0.18_55/0.1)] transition-all duration-300"
              >
                Go Pro — $49/mo
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER — Minimal ═══ */}
      <footer className="relative py-8 border-t border-[oklch(0.15_0.005_250)]">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                color: "oklch(0.75 0.18 55)",
              }}
            >
              TIGER BOT
            </span>
            <span>by The Goods AI</span>
          </div>
          <div className="flex gap-6">
            <a
              href="https://thegoods.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[oklch(0.75_0.18_55)] transition-colors"
            >
              Learn More
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
