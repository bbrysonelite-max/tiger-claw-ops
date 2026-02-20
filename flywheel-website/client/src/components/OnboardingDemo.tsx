/**
 * OnboardingDemo — Interactive walkthrough of the full Tiger Claw customer journey
 * Design: "Predator's Path" dark theme, orange accents
 * 5 stages: Purchase → Bot Provisioned → Email Arrives → Telegram Chat → Bot Goes Live
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Zap,
  Mail,
  MessageSquare,
  Rocket,
  ChevronRight,
  ChevronLeft,
  Play,
  Check,
  Clock,
  ArrowRight,
  Send,
  User,
  Target,
  Bot,
  Sparkles,
} from "lucide-react";

const DEMO_PHONE_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/nxoGUky6aIe2gVtoyvkwpo-img-1_1771130372000_na1fn_ZGVtby10ZWxlZ3JhbS1tb2NrdXA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L254b0dVa3k2YUllMmdWdG95dmt3cG8taW1nLTFfMTc3MTEzMDM3MjAwMF9uYTFmbl9aR1Z0YnkxMFpXeGxaM0poYlMxdGIyTnJkWEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=gQ3V2R5HAA-axuSWJEUMTnit5kXOb00TEkvmbGSCw55OQnvddFuOPSYHQlCtrUQhL9knSEtbVwCjuRRqmb2SaA5WZAhWBa0DPuoUBYPq7CcgjgLbneIiKu2zAAqtgh7qRGGnPKyNxlUg~R~BM3Z6ifHs8s805R82NRPsVR0gQPNDPsdL0Ngoh~p9F3HhThn4JsWxTYqZ-6PmhgorUaA3qkaphislVrk3lUKNV69OO3~Ku8cX~L8O0wueQfZrwGKYzT-X4ndX6MprC1310Yq0LzPMnfHBddAv3l-bgjFJL-XXHWfGikQLnh3Tp0GyLkL~x-BMMVTHxs5AJ89sx~4~Rg__";

/* ─── Stage Data ─── */

interface DemoStage {
  id: number;
  icon: typeof ShoppingCart;
  title: string;
  subtitle: string;
  duration: string;
  color: string;
  bgGlow: string;
}

const STAGES: DemoStage[] = [
  {
    id: 0,
    icon: ShoppingCart,
    title: "Purchase on Stan Store",
    subtitle: "Customer clicks Buy",
    duration: "T+0s",
    color: "text-purple-400",
    bgGlow: "rgba(168,85,247,0.15)",
  },
  {
    id: 1,
    icon: Zap,
    title: "Bot Auto-Provisioned",
    subtitle: "Webhook fires, bot created",
    duration: "T+15s",
    color: "text-amber-400",
    bgGlow: "rgba(251,191,36,0.15)",
  },
  {
    id: 2,
    icon: Mail,
    title: "Welcome Email Sent",
    subtitle: "One-tap Telegram link delivered",
    duration: "T+30s",
    color: "text-blue-400",
    bgGlow: "rgba(96,165,250,0.15)",
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "Telegram Conversation",
    subtitle: "Bot interviews the customer",
    duration: "T+5min",
    color: "text-cyan-400",
    bgGlow: "rgba(34,211,238,0.15)",
  },
  {
    id: 4,
    icon: Rocket,
    title: "Bot Goes Live",
    subtitle: "Hunting leads automatically",
    duration: "T+5min",
    color: "text-orange-400",
    bgGlow: "rgba(249,115,22,0.2)",
  },
];

/* ─── Chat Simulation Data ─── */

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  delay: number; // ms before this message appears
}

const INTERVIEW_1_MESSAGES: ChatMessage[] = [
  { sender: "bot", text: "Welcome! I'm your Tiger Claw. Let's get you set up in under 5 minutes.", delay: 0 },
  { sender: "bot", text: "First, what's your name and what do you do?", delay: 800 },
  { sender: "user", text: "I'm Sarah, I sell health supplements in Bangkok", delay: 2000 },
  { sender: "bot", text: "Great to meet you, Sarah! What company or brand are you with?", delay: 3000 },
  { sender: "user", text: "NutraLife Thailand", delay: 4200 },
  { sender: "bot", text: "Perfect. What's the main way you reach customers — LINE, WhatsApp, or something else?", delay: 5200 },
  { sender: "user", text: "Mostly LINE and Facebook", delay: 6500 },
  { sender: "bot", text: "Got it. Interview 1 complete! Now let's talk about your ideal customer...", delay: 7500 },
];

const INTERVIEW_2_MESSAGES: ChatMessage[] = [
  { sender: "bot", text: "Who is your perfect customer? Describe them like you're telling a friend.", delay: 0 },
  { sender: "user", text: "Women 25-45, health conscious, middle income, in Bangkok or Chiang Mai", delay: 1500 },
  { sender: "bot", text: "What problem do they have that your product solves?", delay: 2800 },
  { sender: "user", text: "They want to lose weight but don't have time for the gym", delay: 4000 },
  { sender: "bot", text: "Where do these people hang out online?", delay: 5200 },
  { sender: "user", text: "Facebook groups, LINE groups, Instagram health pages", delay: 6500 },
  { sender: "bot", text: "That's everything I need. Your Tiger Claw is now configured and going live!", delay: 7800 },
];

/* ─── Stage Content Renderers ─── */

function PurchaseStage() {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-full max-w-md mx-auto">
        {/* Stan Store mockup */}
        <div className="rounded-2xl border border-purple-500/20 bg-zinc-900/80 overflow-hidden">
          <div className="bg-purple-600/20 px-6 py-3 border-b border-purple-500/20 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-zinc-500 font-mono">stan.store/tigerclaw</span>
          </div>
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">🐯</div>
            <h4
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Tiger Claw — AI Prospecting Agent
            </h4>
            <p className="text-zinc-400 text-sm mb-6">
              Your personal AI employee that finds, contacts, and nurtures leads 24/7
            </p>
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl font-bold text-white">$149</span>
              <span className="text-lg text-zinc-500 line-through">$247</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-semibold">
                SAVE $98
              </span>
            </div>
            <motion.button
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-500 ${
                clicked
                  ? "bg-green-500 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
              onClick={() => setClicked(true)}
              whileTap={{ scale: 0.97 }}
            >
              {clicked ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> Payment Successful!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Buy Now
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
      <p className="text-zinc-500 text-sm text-center max-w-sm">
        Customer completes purchase. Stan Store fires a webhook to our server instantly.
      </p>
    </div>
  );
}

function ProvisioningStage() {
  const [progress, setProgress] = useState(0);
  const steps = [
    "Webhook received...",
    "Creating Telegram bot via BotFather...",
    "Configuring bot brain...",
    "Injecting API key...",
    "Setting webhook endpoint...",
    "Bot provisioned!",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p < steps.length - 1 ? p + 1 : p));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-amber-500/20 bg-zinc-900/80 p-6 font-mono text-sm">
          <div className="flex items-center gap-2 mb-4 text-amber-400 text-xs">
            <Zap className="w-4 h-4" />
            <span>provision-bots.cjs</span>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: i <= progress ? 1 : 0.2,
                  x: i <= progress ? 0 : -10,
                }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                {i < progress ? (
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : i === progress ? (
                  <motion.div
                    className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0" />
                )}
                <span
                  className={
                    i < progress
                      ? "text-green-400"
                      : i === progress
                        ? "text-amber-300"
                        : "text-zinc-600"
                  }
                >
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
          {progress >= steps.length - 1 && (
            <motion.div
              className="mt-4 pt-4 border-t border-zinc-800 text-green-400 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-4 h-4" />
              @Claw_Sarah is ready — 15 seconds total
            </motion.div>
          )}
        </div>
      </div>
      <p className="text-zinc-500 text-sm text-center max-w-sm">
        Zero human involvement. The server handles everything automatically.
      </p>
    </div>
  );
}

function EmailStage() {
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md mx-auto">
        {!opened ? (
          <motion.div
            className="rounded-2xl border border-blue-500/20 bg-zinc-900/80 overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors"
            onClick={() => setOpened(true)}
            whileHover={{ scale: 1.01 }}
          >
            {/* Inbox mockup */}
            <div className="bg-zinc-800/50 px-5 py-3 border-b border-zinc-700/50 flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-zinc-300 font-medium">Inbox</span>
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">1 new</span>
            </div>
            <div className="p-5 flex items-start gap-4 bg-blue-500/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-lg flex-shrink-0">
                🐯
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">Tiger Claw</span>
                  <span className="text-xs text-zinc-500">just now</span>
                </div>
                <p className="font-semibold text-blue-300 text-sm">
                  Sarah, your Tiger Claw is ready — open Telegram to start
                </p>
                <p className="text-zinc-500 text-xs mt-1 truncate">
                  One tap opens Telegram. Your bot handles everything from there...
                </p>
              </div>
            </div>
            <div className="px-5 py-3 text-center">
              <span className="text-xs text-blue-400 font-medium">Click to open email</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl border border-blue-500/20 bg-zinc-900/80 overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 px-6 py-4 border-b border-zinc-700/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm">
                  🐯
                </div>
                <span className="font-bold text-white text-sm">Tiger Claw</span>
              </div>
              <p className="text-zinc-300 text-sm font-medium">
                Sarah, your Tiger Claw is ready — open Telegram to start
              </p>
            </div>
            <div className="p-6 text-center">
              <p className="text-xs text-orange-400 tracking-widest uppercase font-semibold mb-2">
                Welcome — You're In
              </p>
              <h4 className="text-xl font-bold text-white mb-1">Sarah's</h4>
              <h4 className="text-xl font-bold text-orange-400 mb-4">Tiger Claw is Ready</h4>
              <p className="text-zinc-400 text-sm mb-6">
                One tap opens Telegram. Your bot handles everything from there.
              </p>
              <div className="bg-[#0088cc] text-white font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2 text-sm">
                <Send className="w-4 h-4" />
                OPEN YOUR TIGER CLAW IN TELEGRAM
              </div>
              <div className="flex justify-center gap-4 mt-6">
                {[
                  { icon: "💬", label: "Bot says hello", time: "Instant" },
                  { icon: "👤", label: "Quick chat", time: "~2 min" },
                  { icon: "🎯", label: "Describe customer", time: "~3 min" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-3 py-2 text-center"
                  >
                    <div className="text-lg mb-1">{s.icon}</div>
                    <p className="text-[10px] text-zinc-300 font-medium">{s.label}</p>
                    <p className="text-[9px] text-zinc-500">{s.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <p className="text-zinc-500 text-sm text-center max-w-sm">
        {opened
          ? "The email has one job: get the customer to tap the Telegram button."
          : "Welcome email arrives within 30 seconds of purchase. Click to preview."}
      </p>
    </div>
  );
}

function TelegramStage() {
  const [phase, setPhase] = useState<"interview1" | "interview2">("interview1");
  const [visibleCount, setVisibleCount] = useState(1);
  const chatRef = useRef<HTMLDivElement>(null);

  const messages = phase === "interview1" ? INTERVIEW_1_MESSAGES : INTERVIEW_2_MESSAGES;

  useEffect(() => {
    setVisibleCount(1);
    const timers: NodeJS.Timeout[] = [];
    messages.forEach((msg, i) => {
      if (i > 0) {
        timers.push(
          setTimeout(() => {
            setVisibleCount((c) => c + 1);
          }, msg.delay)
        );
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Phase toggle */}
      <div className="flex gap-2">
        {(["interview1", "interview2"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              phase === p
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "bg-zinc-800/50 text-zinc-500 border border-zinc-700/30 hover:text-zinc-300"
            }`}
          >
            {p === "interview1" ? "Interview 1: Who Are You?" : "Interview 2: Your Customer"}
          </button>
        ))}
      </div>

      {/* Telegram chat mockup */}
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-cyan-500/20 bg-zinc-900/80 overflow-hidden">
          {/* Telegram header */}
          <div className="bg-[#1c2733] px-4 py-3 flex items-center gap-3 border-b border-zinc-700/30">
            <ChevronLeft className="w-5 h-5 text-[#0088cc]" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-sm">
              🐯
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Tiger Claw</p>
              <p className="text-[10px] text-green-400">online</p>
            </div>
          </div>

          {/* Chat messages */}
          <div
            ref={chatRef}
            className="p-4 space-y-3 h-80 overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            <AnimatePresence>
              {messages.slice(0, visibleCount).map((msg, i) => (
                <motion.div
                  key={`${phase}-${i}`}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "user"
                        ? "bg-[#2b5278] text-white rounded-br-md"
                        : "bg-[#182533] text-zinc-200 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {visibleCount < messages.length && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-[#182533] px-4 py-3 rounded-2xl rounded-bl-md flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-2 h-2 rounded-full bg-zinc-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: d * 0.2,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input bar */}
          <div className="bg-[#1c2733] px-4 py-3 border-t border-zinc-700/30 flex items-center gap-3">
            <div className="flex-1 bg-[#242f3d] rounded-full px-4 py-2 text-sm text-zinc-500">
              Message
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
      <p className="text-zinc-500 text-sm text-center max-w-sm">
        {phase === "interview1"
          ? "Interview 1 learns who the customer is — name, business, preferred channels."
          : "Interview 2 builds the ideal customer profile — demographics, pain points, hangouts."}
      </p>
    </div>
  );
}

function LiveStage() {
  const [leads, setLeads] = useState(0);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setLeads((l) => {
        if (l >= 12) {
          setScanning(false);
          return l;
        }
        return l + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const leadNames = [
    { name: "Somchai K.", platform: "LINE", score: 92 },
    { name: "Nattaya P.", platform: "Facebook", score: 88 },
    { name: "Wipaporn S.", platform: "LINE", score: 85 },
    { name: "Ariya T.", platform: "Instagram", score: 83 },
    { name: "Pimchanok R.", platform: "Facebook", score: 81 },
    { name: "Kanokwan M.", platform: "LINE", score: 79 },
    { name: "Thanaporn J.", platform: "Facebook", score: 77 },
    { name: "Siriporn W.", platform: "LINE", score: 75 },
    { name: "Nanthida C.", platform: "Facebook", score: 73 },
    { name: "Rattana L.", platform: "LINE", score: 71 },
    { name: "Waraporn D.", platform: "Instagram", score: 69 },
    { name: "Jirawan B.", platform: "Facebook", score: 67 },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl border border-orange-500/20 bg-zinc-900/80 overflow-hidden">
          {/* Dashboard header */}
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-5 py-4 border-b border-orange-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-bold text-white">@Claw_Sarah</span>
            </div>
            <div className="flex items-center gap-2">
              {scanning ? (
                <>
                  <motion.div
                    className="w-2 h-2 rounded-full bg-green-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-green-400 font-medium">Scanning...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Active</span>
                </>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-px bg-zinc-800/50">
            {[
              { label: "Leads Found", value: leads, color: "text-orange-400" },
              { label: "Contacted", value: Math.max(0, leads - 3), color: "text-blue-400" },
              { label: "Responded", value: Math.max(0, leads - 7), color: "text-green-400" },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900/80 px-4 py-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Lead feed */}
          <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
            {leadNames.slice(0, leads).map((lead, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 bg-zinc-800/40 rounded-lg px-3 py-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium">{lead.name}</p>
                  <p className="text-[10px] text-zinc-500">{lead.platform}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      lead.score >= 85
                        ? "bg-green-500/20 text-green-400"
                        : lead.score >= 75
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {lead.score}%
                  </div>
                  <Target className="w-3 h-3 text-orange-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-zinc-500 text-sm text-center max-w-sm">
        Bot is live and hunting. Finding leads matching Sarah's ideal customer profile across LINE and Facebook.
      </p>
    </div>
  );
}

/* ─── Main Component ─── */

export default function OnboardingDemo() {
  const [activeStage, setActiveStage] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Auto-advance through stages
  useEffect(() => {
    if (!autoPlay) return;
    const durations = [5000, 8000, 6000, 12000, 8000];
    const timer = setTimeout(() => {
      if (activeStage < STAGES.length - 1) {
        setActiveStage((s) => s + 1);
      } else {
        setAutoPlay(false);
      }
    }, durations[activeStage]);
    return () => clearTimeout(timer);
  }, [activeStage, autoPlay]);

  const stage = STAGES[activeStage];
  const StageIcon = stage.icon;

  const stageRenderers = [
    <PurchaseStage key="purchase" />,
    <ProvisioningStage key="provision" />,
    <EmailStage key="email" />,
    <TelegramStage key="telegram" />,
    <LiveStage key="live" />,
  ];

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative py-32 overflow-hidden"
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${stage.bgGlow} 0%, transparent 70%)`,
        }}
      />

      <div className="container relative max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
            See It In Action
          </p>
          <h2
            className="text-5xl md:text-6xl font-bold text-white leading-none mb-4"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            The Full Onboarding
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Experience
            </span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            From purchase to a live bot hunting leads — under 5 minutes, zero technical skill required.
          </p>
        </div>

        {/* Timeline navigation */}
        <div className="relative mb-12">
          {/* Progress line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-zinc-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-orange-500"
              animate={{ width: `${(activeStage / (STAGES.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex justify-between relative">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === activeStage;
              const isPast = i < activeStage;

              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveStage(i);
                    setAutoPlay(false);
                  }}
                  className="flex flex-col items-center gap-2 group relative z-10"
                >
                  <motion.div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isActive
                        ? `border-current ${s.color} bg-zinc-900 shadow-lg`
                        : isPast
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-600"
                    }`}
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                  >
                    {isPast ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <div className="text-center">
                    <p
                      className={`text-[10px] font-bold transition-colors ${
                        isActive ? s.color : isPast ? "text-green-400" : "text-zinc-600"
                      }`}
                    >
                      {s.duration}
                    </p>
                    <p
                      className={`text-[10px] font-medium transition-colors hidden md:block ${
                        isActive ? "text-white" : isPast ? "text-zinc-400" : "text-zinc-600"
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <button
            onClick={() => {
              setActiveStage(Math.max(0, activeStage - 1));
              setAutoPlay(false);
            }}
            disabled={activeStage === 0}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (autoPlay) {
                setAutoPlay(false);
              } else {
                setActiveStage(0);
                setAutoPlay(true);
              }
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all text-sm font-semibold"
          >
            {autoPlay ? (
              <>
                <div className="w-3 h-3 border-2 border-orange-400 rounded-sm" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Auto-Play Demo
              </>
            )}
          </button>

          <button
            onClick={() => {
              setActiveStage(Math.min(STAGES.length - 1, activeStage + 1));
              setAutoPlay(false);
            }}
            disabled={activeStage === STAGES.length - 1}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stage title */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${stage.color}`}
                style={{
                  background: `linear-gradient(135deg, ${stage.bgGlow}, transparent)`,
                }}
              >
                <StageIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={`text-lg font-bold text-white`}>{stage.title}</p>
                <p className="text-xs text-zinc-500">{stage.subtitle}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Stage content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {stageRenderers[activeStage]}
          </motion.div>
        </AnimatePresence>

        {/* Bottom summary */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 bg-zinc-800/40 border border-zinc-700/30 rounded-2xl px-8 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                0
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Technical Steps</p>
            </div>
            <div className="w-px h-8 bg-zinc-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                &lt;5min
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Total Time</p>
            </div>
            <div className="w-px h-8 bg-zinc-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
                100%
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Automated</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
