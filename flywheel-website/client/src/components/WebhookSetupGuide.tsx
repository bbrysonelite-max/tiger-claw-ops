/**
 * Webhook Setup Guide
 * Design: "Predator's Path" — Bold editorial, black/orange
 * Shows exact URLs, event types, and step-by-step configuration
 * for both Stripe and Stan Store webhooks
 */

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Gift,
  Webhook,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  FileCode,
  Eye,
  EyeOff,
  Globe,
  Lock,
  RefreshCw,
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
  Info,
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

/* ─── Copy Button ─── */
function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all duration-200 group"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 group-hover:text-orange-400 transition-colors" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
}

/* ─── Code Block ─── */
function CodeBlock({
  code,
  language = "bash",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800/60 bg-[#0c0c0e]">
      {filename && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/40">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-mono text-zinc-500">{filename}</span>
          </div>
          <CopyButton text={code} />
        </div>
      )}
      <div className="relative">
        {!filename && (
          <div className="absolute top-2 right-2">
            <CopyButton text={code} />
          </div>
        )}
        <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-zinc-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

/* ─── Step Component ─── */
function SetupStep({
  number,
  title,
  children,
  color = "orange",
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  color?: "orange" | "amber" | "emerald" | "blue";
}) {
  const colorMap = {
    orange: {
      numBg: "bg-orange-500/15",
      numBorder: "border-orange-500/30",
      numText: "text-orange-400",
      line: "from-orange-500/30 to-transparent",
    },
    amber: {
      numBg: "bg-amber-500/15",
      numBorder: "border-amber-500/30",
      numText: "text-amber-400",
      line: "from-amber-500/30 to-transparent",
    },
    emerald: {
      numBg: "bg-emerald-500/15",
      numBorder: "border-emerald-500/30",
      numText: "text-emerald-400",
      line: "from-emerald-500/30 to-transparent",
    },
    blue: {
      numBg: "bg-blue-500/15",
      numBorder: "border-blue-500/30",
      numText: "text-blue-400",
      line: "from-blue-500/30 to-transparent",
    },
  };

  const c = colorMap[color];

  return (
    <div className="flex gap-4 relative">
      {/* Step number + line */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-9 h-9 rounded-lg ${c.numBg} border ${c.numBorder} flex items-center justify-center`}
        >
          <span className={`text-sm font-bold ${c.numText}`}>{number}</span>
        </div>
        <div className={`w-px flex-1 mt-2 bg-gradient-to-b ${c.line}`} />
      </div>

      {/* Content */}
      <div className="pb-8 flex-1 min-w-0">
        <h5
          className="text-base font-semibold text-white mb-3"
          style={{ fontFamily: '"Outfit", sans-serif' }}
        >
          {title}
        </h5>
        {children}
      </div>
    </div>
  );
}

/* ─── Event Type Badge ─── */
function EventBadge({
  event,
  description,
  required = false,
}: {
  event: string;
  description: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
      <div className="mt-0.5">
        {required ? (
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        ) : (
          <Info className="w-4 h-4 text-zinc-500" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
            {event}
          </code>
          {required && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

/* ─── Expandable Section ─── */
function ExpandableSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  color = "orange",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  color?: "orange" | "amber" | "blue" | "emerald";
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const colorMap = {
    orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };
  const [textColor] = colorMap[color].split(" ");

  return (
    <div className="border border-zinc-800/60 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors"
      >
        <div
          className={`w-8 h-8 rounded-lg ${colorMap[color]} border flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
        <span
          className="text-sm font-semibold text-white flex-1 text-left"
          style={{ fontFamily: '"Outfit", sans-serif' }}
        >
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 py-4 border-t border-zinc-800/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─── */
export default function WebhookSetupGuide() {
  const [activeGuide, setActiveGuide] = useState<"stripe" | "stan">("stripe");
  const [showSecret, setShowSecret] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const YOUR_DOMAIN = "https://your-server.com";

  return (
    <section
      id="webhook-setup"
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#0a0a0f] to-[#09090b]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />

      {/* Subtle circuit pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(249,115,22,0.4) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(249,115,22,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <AnimateIn>
          <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
            Configuration Guide
          </span>
        </AnimateIn>
        <AnimateIn delay={0.1}>
          <h2
            className="text-5xl sm:text-6xl md:text-7xl leading-[0.9] tracking-tight text-white mb-4"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            Webhook{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
              Setup
            </span>
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.15}>
          <p
            className="text-lg text-zinc-400 max-w-2xl mb-16"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            Exact URLs, event types, and step-by-step configuration for connecting
            Stripe and Stan Store to your Tiger Claw provisioning engine. Copy, paste, done.
          </p>
        </AnimateIn>

        {/* Guide Selector */}
        <AnimateIn delay={0.2}>
          <div className="flex gap-3 mb-12">
            <button
              onClick={() => setActiveGuide("stripe")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 ${
                activeGuide === "stripe"
                  ? "bg-orange-500/15 border-orange-500/40 text-orange-400 shadow-lg shadow-orange-500/10"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Stripe Webhook
            </button>
            <button
              onClick={() => setActiveGuide("stan")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-300 ${
                activeGuide === "stan"
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10"
                  : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              <Gift className="w-4 h-4" />
              Stan Store Webhook
            </button>
          </div>
        </AnimateIn>

        <AnimatePresence mode="wait">
          {activeGuide === "stripe" ? (
            <motion.div
              key="stripe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* ═══════ STRIPE GUIDE ═══════ */}
              <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                {/* Left: Step-by-step */}
                <div className="space-y-0">
                  <AnimateIn delay={0.1}>
                    <SetupStep number={1} title="Open Stripe Webhook Dashboard" color="orange">
                      <p className="text-sm text-zinc-400 mb-3">
                        Go to your Stripe Dashboard and navigate to the Webhooks section.
                      </p>
                      <CodeBlock
                        code="https://dashboard.stripe.com/webhooks"
                        language="text"
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        Click <strong className="text-zinc-300">"Add endpoint"</strong> in the top right corner.
                      </p>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.15}>
                    <SetupStep number={2} title="Enter Your Webhook Endpoint URL" color="orange">
                      <p className="text-sm text-zinc-400 mb-3">
                        Paste this exact URL into the "Endpoint URL" field:
                      </p>
                      <CodeBlock
                        code={`${YOUR_DOMAIN}/api/webhooks/stripe`}
                        language="text"
                      />
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/15">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-zinc-400">
                          Replace <code className="text-orange-400 bg-orange-500/10 px-1 rounded">your-server.com</code> with
                          your actual server domain. If running locally, use a tunnel like ngrok.
                        </p>
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.2}>
                    <SetupStep number={3} title="Select Events to Listen For" color="orange">
                      <p className="text-sm text-zinc-400 mb-3">
                        Click <strong className="text-zinc-300">"Select events"</strong> and enable these specific event types:
                      </p>
                      <div className="space-y-2">
                        <EventBadge
                          event="payment_intent.succeeded"
                          description="Fires when a payment completes. This is the primary trigger for bot provisioning."
                          required
                        />
                        <EventBadge
                          event="checkout.session.completed"
                          description="Fires when a Stripe Checkout session finishes. Captures customer email and metadata."
                          required
                        />
                        <EventBadge
                          event="customer.subscription.created"
                          description="Fires when a new subscription is created. Used for recurring billing plans."
                        />
                        <EventBadge
                          event="customer.subscription.deleted"
                          description="Fires when a subscription is cancelled. Triggers bot deactivation workflow."
                        />
                        <EventBadge
                          event="invoice.payment_failed"
                          description="Fires when a payment attempt fails. Triggers grace period and retry notifications."
                        />
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.25}>
                    <SetupStep number={4} title="Copy Your Webhook Signing Secret" color="orange">
                      <p className="text-sm text-zinc-400 mb-3">
                        After creating the endpoint, Stripe shows a signing secret. Copy it and add it to your <code className="text-orange-400 bg-orange-500/10 px-1 rounded">.env</code> file:
                      </p>
                      <CodeBlock
                        code={`# .env file — add this line
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
                        filename=".env"
                      />
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-zinc-400">
                          This secret verifies that webhook payloads actually come from Stripe, not an attacker.
                          <strong className="text-zinc-300"> Never commit this to git.</strong>
                        </p>
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.3}>
                    <SetupStep number={5} title="Verify the Webhook is Working" color="emerald">
                      <p className="text-sm text-zinc-400 mb-3">
                        In Stripe Dashboard, click <strong className="text-zinc-300">"Send test webhook"</strong> and select <code className="text-orange-400 bg-orange-500/10 px-1 rounded">payment_intent.succeeded</code>. You should see:
                      </p>
                      <CodeBlock
                        code={`# Expected server log output:
[WEBHOOK] Stripe event received: payment_intent.succeeded
[WEBHOOK] Signature verified ✓
[PROVISION] Starting bot provisioning for: customer@email.com
[PROVISION] Bot @Claw_customer created ✓
[EMAIL] Welcome email sent to customer@email.com ✓`}
                        filename="server.log"
                      />
                    </SetupStep>
                  </AnimateIn>
                </div>

                {/* Right: Quick Reference Sidebar */}
                <div className="space-y-4">
                  <AnimateIn delay={0.2}>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 sticky top-24">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-orange-400" />
                        <h4
                          className="text-base text-white"
                          style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: "0.05em" }}
                        >
                          Stripe Quick Reference
                        </h4>
                      </div>

                      {/* Endpoint URL */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Endpoint URL
                        </label>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                          <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <code className="text-xs text-zinc-300 font-mono truncate flex-1">
                            /api/webhooks/stripe
                          </code>
                          <CopyButton text={`${YOUR_DOMAIN}/api/webhooks/stripe`} />
                        </div>
                      </div>

                      {/* Method */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          HTTP Method
                        </label>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xs font-bold font-mono text-emerald-400">POST</span>
                        </div>
                      </div>

                      {/* API Version */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          API Version
                        </label>
                        <code className="text-xs text-zinc-400 font-mono">2024-12-18.acacia</code>
                      </div>

                      {/* Required Events */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Required Events
                        </label>
                        <div className="space-y-1.5">
                          <code className="block text-xs text-orange-400 font-mono bg-orange-500/5 px-2 py-1 rounded">
                            payment_intent.succeeded
                          </code>
                          <code className="block text-xs text-orange-400 font-mono bg-orange-500/5 px-2 py-1 rounded">
                            checkout.session.completed
                          </code>
                        </div>
                      </div>

                      {/* Optional Events */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Optional Events
                        </label>
                        <div className="space-y-1.5">
                          <code className="block text-xs text-zinc-500 font-mono bg-zinc-800/30 px-2 py-1 rounded">
                            customer.subscription.created
                          </code>
                          <code className="block text-xs text-zinc-500 font-mono bg-zinc-800/30 px-2 py-1 rounded">
                            customer.subscription.deleted
                          </code>
                          <code className="block text-xs text-zinc-500 font-mono bg-zinc-800/30 px-2 py-1 rounded">
                            invoice.payment_failed
                          </code>
                        </div>
                      </div>

                      {/* Env Vars */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Required ENV Variables
                        </label>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <code className="text-xs text-zinc-400 font-mono">STRIPE_SECRET_KEY</code>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <code className="text-xs text-zinc-400 font-mono">STRIPE_WEBHOOK_SECRET</code>
                          </div>
                        </div>
                      </div>

                      {/* Link */}
                      <a
                        href="https://dashboard.stripe.com/webhooks"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm font-semibold text-orange-400 hover:bg-orange-500/20 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Stripe Dashboard
                      </a>
                    </div>
                  </AnimateIn>
                </div>
              </div>

              {/* Stripe Handler Code */}
              <AnimateIn delay={0.35}>
                <div className="mt-8">
                  <ExpandableSection
                    title="Stripe Webhook Handler Code (Node.js)"
                    icon={Terminal}
                    color="orange"
                  >
                    <CodeBlock
                      filename="server/webhooks/stripe.ts"
                      code={`import Stripe from 'stripe';
import express from 'express';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const stripeWebhook = express.Router();

// IMPORTANT: Use raw body for signature verification
stripeWebhook.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return res.status(400).send(\`Webhook Error: \${err.message}\`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const email = paymentIntent.receipt_email
          || paymentIntent.metadata?.email;

        console.log('[PROVISION] Starting for:', email);

        // Trigger bot provisioning
        await provisionBot({
          email,
          name: paymentIntent.metadata?.name || 'Customer',
          plan: 'paid',
          stripeCustomerId: paymentIntent.customer as string,
        });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[WEBHOOK] Checkout completed:', session.id);
        // Handle checkout-specific logic
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[WEBHOOK] Subscription cancelled:', subscription.id);
        // Trigger bot deactivation
        await deactivateBot(subscription.metadata?.botId);
        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  }
);`}
                    />
                  </ExpandableSection>
                </div>
              </AnimateIn>

              {/* Stripe Payload Example */}
              <AnimateIn delay={0.4}>
                <div className="mt-4">
                  <ExpandableSection
                    title="Example Stripe Webhook Payload"
                    icon={FileCode}
                    color="blue"
                  >
                    <CodeBlock
                      filename="payment_intent.succeeded.json"
                      language="json"
                      code={`{
  "id": "evt_1RBxyz123456789",
  "object": "event",
  "api_version": "2024-12-18.acacia",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3RBxyz123456789",
      "object": "payment_intent",
      "amount": 4900,
      "currency": "usd",
      "status": "succeeded",
      "receipt_email": "pat@contatta.com",
      "metadata": {
        "name": "Pat",
        "email": "pat@contatta.com",
        "plan": "tiger-claw-pro"
      },
      "customer": "cus_RBxyz123456789"
    }
  },
  "livemode": true,
  "created": 1739548800
}`}
                    />
                  </ExpandableSection>
                </div>
              </AnimateIn>
            </motion.div>
          ) : (
            <motion.div
              key="stan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* ═══════ STAN STORE GUIDE ═══════ */}
              <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                {/* Left: Step-by-step */}
                <div className="space-y-0">
                  <AnimateIn delay={0.1}>
                    <SetupStep number={1} title="Create a Free Product in Stan Store" color="amber">
                      <p className="text-sm text-zinc-400 mb-3">
                        Go to your Stan Store dashboard and create a new digital product with a $0 price. This is your trial entry point.
                      </p>
                      <CodeBlock
                        code="https://app.stan.store/dashboard/products"
                        language="text"
                      />
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <ChevronRight className="w-3 h-3 text-amber-400" />
                          Product name: <strong className="text-zinc-300">"Try Tiger Claw Free"</strong>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <ChevronRight className="w-3 h-3 text-amber-400" />
                          Price: <strong className="text-zinc-300">$0 (Free)</strong>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <ChevronRight className="w-3 h-3 text-amber-400" />
                          Collect: <strong className="text-zinc-300">Name + Email (required)</strong>
                        </div>
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.15}>
                    <SetupStep number={2} title="Navigate to Integrations → Webhooks" color="amber">
                      <p className="text-sm text-zinc-400 mb-3">
                        In your Stan Store dashboard, go to <strong className="text-zinc-300">Settings → Integrations</strong> and find the Webhooks section.
                      </p>
                      <CodeBlock
                        code="https://app.stan.store/dashboard/settings/integrations"
                        language="text"
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        Click <strong className="text-zinc-300">"Add Webhook"</strong> to create a new webhook endpoint.
                      </p>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.2}>
                    <SetupStep number={3} title="Enter Your Webhook Endpoint URL" color="amber">
                      <p className="text-sm text-zinc-400 mb-3">
                        Paste this exact URL into the webhook URL field:
                      </p>
                      <CodeBlock
                        code={`${YOUR_DOMAIN}/api/webhooks/stan-store`}
                        language="text"
                      />
                      <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-zinc-400">
                          Replace <code className="text-amber-400 bg-amber-500/10 px-1 rounded">your-server.com</code> with
                          your actual server domain. The endpoint must be publicly accessible (HTTPS required).
                        </p>
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.25}>
                    <SetupStep number={4} title="Select the Event Trigger" color="amber">
                      <p className="text-sm text-zinc-400 mb-3">
                        Select the event that triggers the webhook:
                      </p>
                      <div className="space-y-2">
                        <EventBadge
                          event="order.completed"
                          description="Fires when a customer completes a free or paid order. This captures name + email for bot provisioning."
                          required
                        />
                        <EventBadge
                          event="order.refunded"
                          description="Fires when an order is refunded. Triggers trial/bot deactivation."
                        />
                      </div>
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.3}>
                    <SetupStep number={5} title="Add a Webhook Secret (Optional but Recommended)" color="amber">
                      <p className="text-sm text-zinc-400 mb-3">
                        If Stan Store supports a signing secret, add it to your <code className="text-amber-400 bg-amber-500/10 px-1 rounded">.env</code> file:
                      </p>
                      <CodeBlock
                        code={`# .env file — add this line
STAN_STORE_WEBHOOK_SECRET=your_stan_store_secret_here`}
                        filename=".env"
                      />
                    </SetupStep>
                  </AnimateIn>

                  <AnimateIn delay={0.35}>
                    <SetupStep number={6} title="Test with a Free Product Checkout" color="emerald">
                      <p className="text-sm text-zinc-400 mb-3">
                        Open your Stan Store product page in an incognito window and complete a free checkout. You should see:
                      </p>
                      <CodeBlock
                        code={`# Expected server log output:
[WEBHOOK] Stan Store event received: order.completed
[WEBHOOK] Product: "Try Tiger Claw Free" (price: $0)
[WEBHOOK] Customer: pat@contatta.com (name: Pat)
[PROVISION] Starting trial bot provisioning for: pat@contatta.com
[PROVISION] Bot @Claw_Pat created ✓
[EMAIL] Trial welcome email sent to pat@contatta.com ✓`}
                        filename="server.log"
                      />
                    </SetupStep>
                  </AnimateIn>
                </div>

                {/* Right: Quick Reference Sidebar */}
                <div className="space-y-4">
                  <AnimateIn delay={0.2}>
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 sticky top-24">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <h4
                          className="text-base text-white"
                          style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: "0.05em" }}
                        >
                          Stan Store Quick Reference
                        </h4>
                      </div>

                      {/* Endpoint URL */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Endpoint URL
                        </label>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                          <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <code className="text-xs text-zinc-300 font-mono truncate flex-1">
                            /api/webhooks/stan-store
                          </code>
                          <CopyButton text={`${YOUR_DOMAIN}/api/webhooks/stan-store`} />
                        </div>
                      </div>

                      {/* Method */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          HTTP Method
                        </label>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xs font-bold font-mono text-emerald-400">POST</span>
                        </div>
                      </div>

                      {/* Content Type */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Content Type
                        </label>
                        <code className="text-xs text-zinc-400 font-mono">application/json</code>
                      </div>

                      {/* Required Events */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Required Events
                        </label>
                        <div className="space-y-1.5">
                          <code className="block text-xs text-amber-400 font-mono bg-amber-500/5 px-2 py-1 rounded">
                            order.completed
                          </code>
                        </div>
                      </div>

                      {/* Optional Events */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Optional Events
                        </label>
                        <div className="space-y-1.5">
                          <code className="block text-xs text-zinc-500 font-mono bg-zinc-800/30 px-2 py-1 rounded">
                            order.refunded
                          </code>
                        </div>
                      </div>

                      {/* Payload Fields */}
                      <div className="mb-4">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          Key Payload Fields
                        </label>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <code className="text-xs text-zinc-400 font-mono">customer.email</code>
                            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Required</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <code className="text-xs text-zinc-400 font-mono">customer.name</code>
                            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Required</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <code className="text-xs text-zinc-400 font-mono">product.id</code>
                            <span className="text-[10px] text-zinc-500 uppercase font-semibold">Optional</span>
                          </div>
                        </div>
                      </div>

                      {/* Env Vars */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 block">
                          ENV Variables
                        </label>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0c0c0e] border border-zinc-800/40">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <code className="text-xs text-zinc-400 font-mono">STAN_STORE_WEBHOOK_SECRET</code>
                          </div>
                        </div>
                      </div>

                      {/* Link */}
                      <a
                        href="https://app.stan.store/dashboard/settings/integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Stan Store Dashboard
                      </a>
                    </div>
                  </AnimateIn>
                </div>
              </div>

              {/* Stan Store Handler Code */}
              <AnimateIn delay={0.4}>
                <div className="mt-8">
                  <ExpandableSection
                    title="Stan Store Webhook Handler Code (Node.js)"
                    icon={Terminal}
                    color="amber"
                  >
                    <CodeBlock
                      filename="server/webhooks/stan-store.ts"
                      code={`import express from 'express';
import crypto from 'crypto';

export const stanStoreWebhook = express.Router();

// Verify Stan Store webhook signature (if available)
function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.STAN_STORE_WEBHOOK_SECRET;
  if (!secret) return true; // Skip if no secret configured

  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

stanStoreWebhook.post(
  '/api/webhooks/stan-store',
  express.json(),
  async (req, res) => {
    const signature = req.headers['x-stan-signature'] as string;

    // Verify signature if secret is configured
    if (process.env.STAN_STORE_WEBHOOK_SECRET) {
      if (!verifySignature(JSON.stringify(req.body), signature)) {
        console.error('[WEBHOOK] Stan Store signature verification failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const { event, data } = req.body;

    switch (event) {
      case 'order.completed': {
        const { customer, product } = data;
        const email = customer.email;
        const name = customer.name || email.split('@')[0];

        console.log('[PROVISION] Starting trial for:', email);

        // Check if this is a free product (trial) or paid
        const isTrial = product.price === 0;

        await provisionBot({
          email,
          name,
          plan: isTrial ? 'trial' : 'paid',
          source: 'stan-store',
          productId: product.id,
        });
        break;
      }

      case 'order.refunded': {
        const { customer } = data;
        console.log('[WEBHOOK] Order refunded for:', customer.email);
        await deactivateBot(customer.email);
        break;
      }

      default:
        console.log('[WEBHOOK] Unhandled Stan Store event:', event);
    }

    res.json({ received: true });
  }
);`}
                    />
                  </ExpandableSection>
                </div>
              </AnimateIn>

              {/* Stan Store Payload Example */}
              <AnimateIn delay={0.45}>
                <div className="mt-4">
                  <ExpandableSection
                    title="Example Stan Store Webhook Payload"
                    icon={FileCode}
                    color="blue"
                  >
                    <CodeBlock
                      filename="order.completed.json"
                      language="json"
                      code={`{
  "event": "order.completed",
  "data": {
    "order_id": "ord_abc123xyz",
    "created_at": "2026-02-14T20:36:00Z",
    "customer": {
      "name": "Pat",
      "email": "pat@contatta.com",
      "phone": null
    },
    "product": {
      "id": "prod_tiger_trial",
      "name": "Try Tiger Claw Free",
      "price": 0,
      "currency": "USD"
    },
    "payment": {
      "status": "completed",
      "amount": 0,
      "method": "free"
    }
  }
}`}
                    />
                  </ExpandableSection>
                </div>
              </AnimateIn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════ TESTING CHECKLIST ═══════ */}
        <AnimateIn delay={0.5}>
          <div className="mt-12 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4
                  className="text-xl text-white"
                  style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: "0.05em" }}
                >
                  Pre-Launch Verification Checklist
                </h4>
                <p className="text-xs text-zinc-500">Complete all checks before going live</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Stripe Checks */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-2">
                  Stripe Checks
                </h5>
                {[
                  "Webhook endpoint URL is correct and HTTPS",
                  "payment_intent.succeeded event is selected",
                  "checkout.session.completed event is selected",
                  "Signing secret is in .env file",
                  "Test webhook returns 200 OK",
                  "Bot provisioning triggers on test payment",
                  "Welcome email sends after provisioning",
                ].map((check, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/40"
                  >
                    <div className="w-4 h-4 rounded border border-zinc-700 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-sm bg-zinc-800" />
                    </div>
                    <span className="text-xs text-zinc-400">{check}</span>
                  </div>
                ))}
              </div>

              {/* Stan Store Checks */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  Stan Store Checks
                </h5>
                {[
                  "Free product created with name + email fields",
                  "Webhook URL is correct and HTTPS",
                  "order.completed event is selected",
                  "Webhook secret is in .env file (if available)",
                  "Test checkout triggers webhook",
                  "Trial bot provisions with correct limits",
                  "Trial welcome email includes upgrade path",
                ].map((check, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/40"
                  >
                    <div className="w-4 h-4 rounded border border-zinc-700 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-sm bg-zinc-800" />
                    </div>
                    <span className="text-xs text-zinc-400">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* ═══════ RETRY & ERROR HANDLING ═══════ */}
        <AnimateIn delay={0.55}>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <h5 className="text-sm font-semibold text-white">Auto-Retry</h5>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-2">
                Both Stripe and Stan Store retry failed webhooks automatically:
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Stripe retries:</span>
                  <span className="text-zinc-300 font-mono">3 attempts over 72h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Stan Store retries:</span>
                  <span className="text-zinc-300 font-mono">5 attempts over 24h</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h5 className="text-sm font-semibold text-white">Failure Alerts</h5>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                If provisioning fails, the system sends an alert to your admin Telegram channel with the customer email, error details, and a manual retry command:
              </p>
              <code className="block text-[10px] text-amber-400 font-mono mt-2 bg-amber-500/5 px-2 py-1 rounded">
                /retry pat@contatta.com
              </code>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h5 className="text-sm font-semibold text-white">Idempotency</h5>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Every webhook handler checks for duplicate events using the event ID. If the same event fires twice (retries), the bot won't be provisioned twice. Safe by design.
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
