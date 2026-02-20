/**
 * ═══════════════════════════════════════════════════════════════
 *  PROMOTIONAL LANDING PAGE — start.tigerclaw.io
 *  Design: Dark cinematic, psychology-driven sales page
 *  Psychology: Pain → Dream → Bridge → Proof → Benefits → Price → CTA
 *  Price: $149/mo (anchored against $247), 72h free trial
 *  Guarantee: 14-day money-back, no questions asked
 *  Target: YouTube traffic, mobile-first, gig economy workers
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
  Brain,
  Globe,
  MessageSquare,
  Target,
  Repeat,
  BadgeCheck,
  Timer,
  X,
} from "lucide-react";

/* ── Stripe Checkout URLs (replace with real ones) ── */
const STRIPE_PAID_URL = "https://buy.stripe.com/YOUR_PAID_LINK";
const STRIPE_TRIAL_URL = "https://buy.stripe.com/YOUR_TRIAL_LINK";

/* ── Image URLs ── */
const HERO_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/jRlZOJwdD4glmzXG8GxyFG-img-1_1771351248000_na1fn_cHJvbW8taGVyby10aWdlcg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L2pSbFpPSndkRDRnbG16WEc4R3h5RkctaW1nLTFfMTc3MTM1MTI0ODAwMF9uYTFmbl9jSEp2Ylc4dGFHVnlieTEwYVdkbGNnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=HD~31Ec53Us6K0kYUFmVMxTfqmxZW1QRTU9ZWFLzkUnAFM1atwFR9xMpv4X2eJObW0IFb8rv2yfESPTutPpt0aNU20Nq47kCgz-Rp18VSHsoqbvx6jG~GI1~b60ncWfnSvCPLzuuLLSZEQX-hM1fMHZSd-xD5Kzm3GHO2BUjXD-LKM9jmb3vF5guev2R86-9sx466NvOoiXjIpHyZ7gB82X5upHQSyyXzEeNQU6oOBHr1Qji2Um2Ea5sZwmhcvAZyD~SLC4rvAuu9IYcmxRwmnvmuH6pRZBEcSW~V2dPEi8D3De-s7-NXwgRRLKoZNMMYE5-r0fTB0CybS1DOhRKlw__";

const SOCIAL_BG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/jRlZOJwdD4glmzXG8GxyFG-img-2_1771351256000_na1fn_cHJvbW8tc29jaWFsLXByb29mLWJn.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L2pSbFpPSndkRDRnbG16WEc4R3h5RkctaW1nLTJfMTc3MTM1MTI1NjAwMF9uYTFmbl9jSEp2Ylc4dGMyOWphV0ZzTFhCeWIyOW1MV0puLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=pi5fO7nQz6ddVMtvgAuAS90lh7Fq~J~f-rrmUdYcy-bGUDePQVJZQZr3FI3Ja7xofQCL9oZx6p0IFCvmSj3hTLauAzWdNPKxMJgYLtA~lZ~CrL-6g6HXlfKlHxeFzNyGpt0vyNu1UNkTpXBhOqx8j~32RHShzkHw2KWEYAk67WDXZLwfzFnJYfPV3MyKfhye2t7LreLkM7wHHwa~pzQuZRsQywym2w1I81RFQfmzo8DdelnCZMoVmfoz2NtlYWF0i57SPV8dKRV1ZfjPTOvqsIWmyGUk4bMtsgFgGDRrW2IKGqWtm2ssXlIrKssE46nkZ~ogrCxSCarXzs1dSOIqDA__";

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

/* ── Floating particles ── */
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
      <div
        className="absolute -inset-1 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500"
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

/* ── Typewriter text effect ── */
function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
              clearInterval(interval);
              setDone(true);
            }
          }, 40);
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [text]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {!done && <span className="animate-pulse">|</span>}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/*  PROMOTIONAL LANDING PAGE                                      */
/* ══════════════════════════════════════════════════════════════ */
export default function Launch() {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const statsRef = useInView(0.3);
  const hoursCount = useCounter(4, 2000, statsRef.inView);
  const leadsCount = useCounter(23, 2500, statsRef.inView);
  const replyCount = useCounter(87, 1800, statsRef.inView);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHeroLoaded(true);
    img.src = HERO_IMG;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══ SECTION 1: PAIN — Above the fold ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.08_0.02_30)] via-black to-black" />
        </div>
        <Particles />

        <div className="relative z-10 container max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-20">
          {/* Left — Pain copy */}
          <div className="flex-1 text-center lg:text-left space-y-8">
            {/* Pain headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[0.95] tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              <span className="text-foreground/90">TIRED OF CHASING</span>
              <br />
              <span className="text-foreground/90">LEADS THAT GO</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, oklch(0.65 0.25 25), oklch(0.55 0.25 15))",
                }}
              >
                NOWHERE?
              </span>
            </h1>

            {/* Pain agitation */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              You spend hours scrolling, messaging, following up — and most people
              <span className="text-foreground font-semibold"> never reply</span>.
              Meanwhile, your competitors are closing deals you didn't even know existed.
            </p>

            {/* Pain bullets */}
            <div className="space-y-3 max-w-lg mx-auto lg:mx-0">
              {[
                "4+ hours a day wasted on manual prospecting",
                "Great leads slip through the cracks and never come back",
                "You forget to follow up and lose deals you should have won",
                "Your pipeline is empty and you don't know who to talk to next",
              ].map((pain, i) => (
                <div key={i} className="flex items-center gap-3">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-foreground/70 text-sm sm:text-base">{pain}</span>
                </div>
              ))}
            </div>

            {/* Transition to dream */}
            <div className="pt-4">
              <p className="text-xl sm:text-2xl font-semibold text-[oklch(0.75_0.18_55)]">
                What if that all stopped — today?
              </p>
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
                alt="Tiger Claw — AI Prospecting Agent"
                className="w-full max-w-xl mx-auto"
                style={{
                  filter: "drop-shadow(0 0 80px oklch(0.75 0.18 55 / 0.25))",
                }}
              />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, oklch(0.75 0.18 55 / 0.12), transparent 70%)",
                filter: "blur(60px)",
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-[oklch(0.75_0.18_55)]" />
        </div>
      </section>

      {/* ═══ SECTION 2: DREAM STATE ═══ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.06_0.01_55)] to-black" />
        <div className="relative z-10 container max-w-4xl mx-auto px-4 text-center space-y-10">
          <p
            className="text-sm font-bold tracking-[0.3em] uppercase"
            style={{ color: "oklch(0.75 0.18 55)" }}
          >
            Imagine This
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            YOU WAKE UP EVERY MORNING TO
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55))",
              }}
            >
              NEW QUALIFIED PROSPECTS
            </span>
            <br />
            WHO ACTUALLY WANT TO TALK
          </h2>

          <div className="grid sm:grid-cols-3 gap-8 pt-8">
            {[
              {
                icon: Clock,
                title: "Your Mornings",
                before: "Scrolling LinkedIn for 2 hours",
                after: "Coffee + review 3 warm leads",
              },
              {
                icon: MessageSquare,
                title: "Your Follow-ups",
                before: "Forgetting who you talked to",
                after: "Bot nurtures every single one",
              },
              {
                icon: Target,
                title: "Your Pipeline",
                before: "Empty and stressful",
                after: "Always full, always growing",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[oklch(0.08_0.005_250)] border border-[oklch(0.20_0.005_250)] rounded-2xl p-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[oklch(0.75_0.18_55/0.1)] border border-[oklch(0.75_0.18_55/0.3)] flex items-center justify-center mx-auto">
                  <item.icon className="w-6 h-6 text-[oklch(0.75_0.18_55)]" />
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-red-400/80">
                    <X className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="line-through opacity-70">{item.before}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{item.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: THE BRIDGE — Meet Tiger Claw ═══ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.07_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-5xl mx-auto px-4">
          <div className="text-center space-y-6 mb-16">
            <p
              className="text-sm font-bold tracking-[0.3em] uppercase"
              style={{ color: "oklch(0.75 0.18 55)" }}
            >
              The Solution
            </p>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              MEET{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55), oklch(0.60 0.22 30))",
                }}
              >
                TIGER CLAW
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              An AI agent that finds, contacts, and follows up with your ideal customers
              <span className="text-[oklch(0.75_0.18_55)] font-semibold"> 24 hours a day, 7 days a week</span> —
              while you sleep, eat, and live your life.
            </p>
          </div>

          {/* How it works — 3 dead-simple steps */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Click the Button",
                desc: "Choose your plan below. Takes 30 seconds. Your bot starts provisioning instantly.",
                icon: Zap,
              },
              {
                step: "02",
                title: "Quick Chat on Telegram",
                desc: "Your Tiger Claw messages you. It asks 2 simple questions: Who are you? Who's your ideal customer?",
                icon: MessageSquare,
              },
              {
                step: "03",
                title: "Bot Goes Hunting",
                desc: "Tiger Claw starts scanning 40+ platforms, finding prospects, and reaching out. You get leads delivered.",
                icon: Target,
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-[oklch(0.75_0.18_55/0.5)] to-transparent z-0" />
                )}
                <div className="relative bg-[oklch(0.10_0.005_250)] border border-[oklch(0.25_0.005_250)] rounded-2xl p-8 hover:border-[oklch(0.75_0.18_55/0.5)] transition-all duration-500 hover:-translate-y-1 h-full">
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

      {/* ═══ SECTION 4: SOCIAL PROOF — Pat Sullivan ═══ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={SOCIAL_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </div>
        <div className="relative z-10 container max-w-4xl mx-auto px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[oklch(0.75_0.18_55/0.3)] bg-[oklch(0.75_0.18_55/0.08)]">
            <BadgeCheck className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
            <span className="text-sm font-medium text-[oklch(0.85_0.14_70)]">Endorsed by the Godfather of CRM</span>
          </div>

          <blockquote className="space-y-6">
            <div className="text-6xl text-[oklch(0.75_0.18_55/0.3)] leading-none">"</div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed text-foreground/90 -mt-8">
              Tiger Claw represents the future of relationship management. What took teams of people
              and months of effort can now happen automatically, intelligently, and at scale.
            </p>
            <footer className="space-y-2">
              <p className="text-lg font-bold text-[oklch(0.75_0.18_55)]">Pat Sullivan</p>
              <p className="text-sm text-muted-foreground">
                Creator of ACT! — the world's first contact management software
                <br />
                <span className="text-foreground/60">The man who invented the CRM industry</span>
              </p>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ═══ SECTION 5: BENEFITS — What it does for YOU ═══ */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.06_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-5xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <p
              className="text-sm font-bold tracking-[0.3em] uppercase"
              style={{ color: "oklch(0.75 0.18 55)" }}
            >
              What Tiger Claw Does For You
            </p>
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              NEVER WORRY ABOUT WHO TO
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55))",
                }}
              >
                TALK TO AGAIN
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Target,
                title: "Find prospects while you sleep",
                desc: "Tiger Claw scans LinkedIn, forums, and 40+ platforms around the clock. You wake up to warm leads.",
              },
              {
                icon: Brain,
                title: "Never forget a great prospect",
                desc: "Pervasive memory means every conversation, every detail, every follow-up is tracked and acted on.",
              },
              {
                icon: Repeat,
                title: "Stay in constant contact",
                desc: "Automated nurture sequences keep your entire circle of influence warm — without you lifting a finger.",
              },
              {
                icon: Timer,
                title: "Replace 4 hours of daily work",
                desc: "One Tiger Claw does what used to take half your day. Manual prospecting is over.",
              },
              {
                icon: Globe,
                title: "Works wherever your people are",
                desc: "LINE in Thailand, WhatsApp in Europe, LinkedIn globally — Tiger Claw speaks the language of your market.",
              },
              {
                icon: TrendingUp,
                title: "Gets smarter every single day",
                desc: "Every conversation teaches it. Every reply refines it. Month 3 is dramatically better than month 1.",
              },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-5 p-6 rounded-2xl bg-[oklch(0.08_0.005_250)] border border-[oklch(0.20_0.005_250)] hover:border-[oklch(0.75_0.18_55/0.4)] transition-all duration-500 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[oklch(0.75_0.18_55/0.1)] border border-[oklch(0.75_0.18_55/0.2)] flex items-center justify-center flex-shrink-0 group-hover:bg-[oklch(0.75_0.18_55/0.15)] transition-colors">
                  <benefit.icon className="w-5 h-5 text-[oklch(0.75_0.18_55)]" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: STATS — Real numbers ═══ */}
      <section ref={statsRef.ref} className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.08_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: hoursCount, suffix: " hrs", label: "Saved Per Day" },
              { value: leadsCount, suffix: "+", label: "Avg. Leads Per Month" },
              { value: replyCount, suffix: "%", label: "Higher Reply Rate vs Manual" },
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

      {/* ═══ SECTION 7: PRICING — $149 with $247 anchor ═══ */}
      <section className="relative py-24 sm:py-32" id="pricing">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[oklch(0.07_0.005_250)] to-black" />
        <div className="relative z-10 container max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
              <Timer className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400 tracking-wide uppercase">
                Beta Pricing — Limited Time
              </span>
            </div>
            <h2
              className="text-4xl sm:text-5xl font-bold"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              CHOOSE YOUR PLAN
            </h2>
            <p className="text-muted-foreground text-lg">
              Both plans include the full Tiger Claw. No feature gates. No gotchas.
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
                  <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
                </div>

                <ul className="space-y-3">
                  {[
                    "Full Tiger Claw — zero limits",
                    "All 40+ platform sources active",
                    "10-touch nurture sequence",
                    "72 hours of live prospecting",
                    "Keep every lead it finds",
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
                Most Popular
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm font-bold tracking-widest uppercase text-[oklch(0.75_0.18_55)]">
                    Tiger Claw Pro
                  </p>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span
                      className="text-5xl font-bold"
                      style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    >
                      $149
                    </span>
                    <span className="text-muted-foreground">/month</span>
                    <span className="text-lg text-muted-foreground/50 line-through">$247</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    Beta pricing — save $98/mo
                  </p>
                </div>

                <ul className="space-y-3">
                  {[
                    "Everything in Free Trial — forever",
                    "Unlimited 24/7 prospecting",
                    "Priority regional intelligence",
                    "Advanced nurture campaigns",
                    "14-day money-back guarantee",
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
                      Get Tiger Claw Pro — $149/mo
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </GlowRing>
              </div>
            </div>
          </div>

          {/* Guarantee */}
          <div className="mt-12 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-[oklch(0.08_0.005_250)] border border-[oklch(0.20_0.005_250)]">
              <Shield className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div className="text-left">
                <p className="font-bold text-sm">14-Day Money-Back Guarantee</p>
                <p className="text-xs text-muted-foreground">
                  If Tiger Claw doesn't find you qualified prospects within 14 days,
                  we'll refund every penny. No questions asked. No hoops. Just email us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8: URGENCY + FINAL CTA ═══ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src={SOCIAL_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
        </div>
        <Particles />
        <div className="relative z-10 container max-w-3xl mx-auto px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10">
            <Timer className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-red-400">Beta pricing won't last</span>
          </div>

          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            EVERY MINUTE WITHOUT
            <br />
            TIGER CLAW IS A MINUTE
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.85 0.14 70), oklch(0.75 0.18 55), oklch(0.60 0.22 30))",
              }}
            >
              YOUR COMPETITORS WIN
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            The price goes to <span className="text-foreground font-semibold line-through">$247/mo</span> when
            we exit beta. Lock in <span className="text-[oklch(0.75_0.18_55)] font-bold">$149/mo</span> now
            and keep it forever.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <GlowRing>
              <a href={STRIPE_TRIAL_URL} target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="relative z-10 h-16 px-10 text-lg font-bold rounded-xl bg-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.80_0.20_55)] text-black transition-all duration-300 hover:scale-105"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Try Free for 72 Hours
                </Button>
              </a>
            </GlowRing>
            <a href={STRIPE_PAID_URL} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="h-16 px-10 text-lg font-semibold rounded-xl border-2 border-[oklch(0.75_0.18_55/0.5)] text-[oklch(0.85_0.14_70)] hover:bg-[oklch(0.75_0.18_55/0.1)] transition-all duration-300"
              >
                Go Pro — $149/mo
              </Button>
            </a>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            <Shield className="w-4 h-4 inline mr-1 text-emerald-400" />
            14-day money-back guarantee &bull; Cancel anytime &bull; No contracts
          </p>
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
              TIGER CLAW
            </span>
            <span>by The Goods AI</span>
          </div>
          <div className="flex gap-6">
            <a
              href="https://tigerclaw.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[oklch(0.75_0.18_55)] transition-colors"
            >
              Learn More
            </a>
            <a
              href="#pricing"
              className="hover:text-[oklch(0.75_0.18_55)] transition-colors"
            >
              Pricing
            </a>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
