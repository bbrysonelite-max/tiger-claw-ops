/**
 * Tiger Bot Onboarding & Flywheel System
 * Design: "Predator's Path" — Bold editorial, black/orange, oversized display type
 * Font: Bebas Neue (display) + Outfit (body)
 * Palette: #09090B black, #F97316 tiger orange, #FBBF24 amber, #27272A dark gray
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import RegionalIntelligence from "@/components/RegionalIntelligence";
import FlywheelExplainer from "@/components/FlywheelExplainer";
import ProvisioningPipeline from "@/components/ProvisioningPipeline";
import WebhookSetupGuide from "@/components/WebhookSetupGuide";
import {
  Search,
  MessageSquare,
  Heart,
  Target,
  Users,
  ArrowDown,
  Zap,
  Phone,
  Mail,
  Globe,
  User,
  Briefcase,
  MapPin,
  HelpCircle,
  Star,
  Send,
  ChevronRight,
  Eye,
  MessageCircle,
  TrendingUp,
  Repeat,
  Shield,
  Gift,
  CheckCircle,
  Award,
  ThumbsUp,
  Clock,
  AlertTriangle,
  DollarSign,
  Layers,
  Brain,
  BarChart3,
  Key,
  KeyRound,
  RefreshCw,
  Timer,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Rocket,
  Crown,
  Handshake,
  Megaphone,
  ArrowUpRight,
  Sparkles,
  ChevronLeft,
  ImageIcon,
} from "lucide-react";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/qbHV4Oe3AntWVAGTBrO72o-img-1_1771100788000_na1fn_dGlnZXItaGVybw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3FiSFY0T2UzQW50V1ZBR1RCck83Mm8taW1nLTFfMTc3MTEwMDc4ODAwMF9uYTFmbl9kR2xuWlhJdGFHVnlidy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KJk40ql9TUEYwjdN8kg4zu5mpL807BujqgnVNDzNPEdVGfL1ruASM-4WXN4hZBaL9yPTO1Z7afhydBy0w0le82bOTNukSioJm~tW~dP9TiPbI~qI6cMWemlTMXFzoucoAkTRhNyPA5mdflPy5VSPHvJtg3OTCsWLobTc9rwHMhBWV~ZpMk63kjoEtzRa2KhfpEB4ae1lPUJoFVXKvJONDVU1PDg6kzcQfc~yktf-hlxjXUkfRRYcpE~DLWD1zGRDoj8Ex-Iub0K~qouFqyYfof78Z83fvyw6A9GqZLUlEmzq3mu5Bgmfe6Z12wv4Cy-BGCvMcUpjg1UFg47IupfkEw__";

const FLYWHEEL_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/qbHV4Oe3AntWVAGTBrO72o-img-2_1771100783000_na1fn_Zmx5d2hlZWwtYmc.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3FiSFY0T2UzQW50V1ZBR1RCck83Mm8taW1nLTJfMTc3MTEwMDc4MzAwMF9uYTFmbl9abXg1ZDJobFpXd3RZbWMucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=joeZ0wYjQ9VOMVLrCLbfXoBTCc5i1PlFtPTDpRO0SDESUVOks-sUInSb21tKpERytzZ4WR1X4hgN0tlXL~dTAgmBKdqqUn1MVpkNsDSwO4yZAdrjk8mg~oIcjfcqhSwElZe2xVlBsaAJBNbmkXoA1J9qIJzu6Dsqfd58ytvH8mDqPz6TrzrSYWXc7XwXu2djKmKo8dqDm18YA4cXxF~oIPRgYgypzPVeFjlCRr~rSKT0mglM5CELrKydszYD2~G58UjW1DOWpqSFS19bGB7S2bCDwyu5nKK7jt0VypcEJGUQL9gJnHb08C33gT3QAqw~HIzjr5y4TPfyVLWfLP9M7A__";

const ONBOARDING_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/qbHV4Oe3AntWVAGTBrO72o-img-3_1771100785000_na1fn_b25ib2FyZGluZy1zZWN0aW9u.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3FiSFY0T2UzQW50V1ZBR1RCck83Mm8taW1nLTNfMTc3MTEwMDc4NTAwMF9uYTFmbl9iMjVpYjJGeVpHbHVaeTF6WldOMGFXOXUucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=rufFQQfRNkYP6QrLc1ruVkACxYzcJNNzW0IgpsIdUW2ENXWlNYhSW40JrFsFiWCUTGAcuEHOM~cKa1QpWitB3r1wzd2ar5GDdct9r4KDULd5rYdcuKR1OygqyjA78-TL~S9-4hjd0iN0WpkOzhBDQpU87rTwXJ6GspHoixQqi106pU~1AaEg~IZJMbAuM9BeqrsC826wEOYI0kqTmwuYGhQsfOPx8GUsvOCWG8eosTRP13Ic-ckCiz~JJlG4X2l3D~KaS8NcvNXBZXEGWKtOQmbAsTI7-~Do3EOSCqqpeft4qTJ1jNXD7rnWRnW0nNX~Ww3etEahUPmSDagQZsZIGw__";

const LEADGEN_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/qbHV4Oe3AntWVAGTBrO72o-img-4_1771100787000_na1fn_bGVhZC1nZW4tc2VjdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3FiSFY0T2UzQW50V1ZBR1RCck83Mm8taW1nLTRfMTc3MTEwMDc4NzAwMF9uYTFmbl9iR1ZoWkMxblpXNHRjMlZqZEdsdmJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=gcgyMdfV01I22h0QBbOGr18MpOlcLTurCRb~95vsklblK4O2UBrco~esbPGLBl8Eku7jaz7cE8WTwTb6WtVlxrMbio9IJjgJEXOzv6t3z0FABx4xVe41b0Ua1Jpx0eMI6jNyEEgEEmIK2tVAEYn9iO4mJUh1BZmUTouxMRVTRr7apNy6dP6SsUbpK66wzOl3eVr-SZXuoiDSZPoXX6SuudzaxBxIC1nSXOUkVGxoj2kPteyadsCO2U1XUsOb3n-jBvsIgJJTQSiKal6~~qLcvF6~Wp42EOlSRF3rj63w7nNlkwB1Rj4TKGmBoU7J8sJTcVdOJkknZkQVzWJQTijIkg__";

const WALKTHROUGH_OPENAI = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/yPwKyPwJ06JwEF7IKCJcg5-img-1_1771105529000_na1fn_d2Fsa3Rocm91Z2gtb3BlbmFp.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3lQd0t5UHdKMDZKd0VGN0lLQ0pjZzUtaW1nLTFfMTc3MTEwNTUyOTAwMF9uYTFmbl9kMkZzYTNSb2NtOTFaMmd0YjNCbGJtRnAucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ARBvfgtznt49bwNWXo9Lps5ZS485ucT00C1toNcJ2F5uOPCcO0ZYS~p2NYuIOh0fDqJvxiIDEwIko~Zcr-7wgKCW2l9sI0sSsKg3SGqzq7PobWXiChdrsvNniGKkVYgBU1ZR4~A-zVNT6JjIyrv~fwSRuVrxhMNwl5M8cYokm2uxeJsmyQHAXJnHDJumD8eir2WoJWTdzwcxHGiHUkIw4nDECrgGu1LkenI-opkGg0fAh9r2wU84WEDm8hh3RWGno~EuonsgMixkNj6rq0Nh4JWtlAELN7eZy33oOF1sNsnFGcIETFPRMdEOSnKfbejt9RXCpe1BFl9lNH2FBrksUQ__";

const WALKTHROUGH_OPENROUTER = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/yPwKyPwJ06JwEF7IKCJcg5-img-2_1771105533000_na1fn_d2Fsa3Rocm91Z2gtb3BlbnJvdXRlcg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3lQd0t5UHdKMDZKd0VGN0lLQ0pjZzUtaW1nLTJfMTc3MTEwNTUzMzAwMF9uYTFmbl9kMkZzYTNSb2NtOTFaMmd0YjNCbGJuSnZkWFJsY2cucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=bjIiNIBLMFcESHXjxRlilTPR1flDBhqr6nMSwDN~HXg~dZ-7TygLGJ09Fb4YN-h7HnP3cD8hv8VUT3ckO-ThEoDKeOInNTVetxEKDZ9xTkUbOriVNcAno5v0x4M1x5dzWVkd8jKWPiSzSryVkIEotVGBaIjbxDm0IgK-qB3ZzTXBuL3kWLiLYy0jJAe5vkxgxLAw-LQ9XkcxLnGFrT3pitrkkQCNLYArGDiIs7gSXuipcxVfGaEj1ViCTJ5bWnrGycyBTWiY~KVeHNEulhDtnYcarLbQ9C8W908N~ICnpu8QExr9mxARgoiRzU~BDuTR9~7cZJFHmEyZf8iCwqIi1g__";

const WALKTHROUGH_QWEN = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/yPwKyPwJ06JwEF7IKCJcg5-img-3_1771105546000_na1fn_d2Fsa3Rocm91Z2gtcXdlbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3lQd0t5UHdKMDZKd0VGN0lLQ0pjZzUtaW1nLTNfMTc3MTEwNTU0NjAwMF9uYTFmbl9kMkZzYTNSb2NtOTFaMmd0Y1hkbGJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=rf9u-qGP3vQDzTcQ06T3zUAWG1YqvwVjx7q5wgwpG0p-zqHvm7w0hL6jnynlAFDEKisX2q15tFYcDUpprEK0Iuhab3wjVR4vMxi6zwqveEcsYEqhEwNDxEEkug1NezQY8Ggh7d~~63GmXXeu1k3cv0cmNY670muKc7WeTSuvwFYNLfqRZo3ipS7HMBalewZ~K1PlRsh1OYeYNNZDsf3WepNHWpBpBdAAYRpF93C6IPjQsjybpeQHE1HHEfmiyfmdoFsFavtPbzJc-2X1forYeS5i7kCDtCrYEo5myoOcj0oST0Xnv92MZAxaA28rfnCv9Pa-PX6E3~pTduMGmAGl~Q__";

const WALKTHROUGH_GEMINI = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/yPwKyPwJ06JwEF7IKCJcg5-img-4_1771105534000_na1fn_d2Fsa3Rocm91Z2gtZ2VtaW5p.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3lQd0t5UHdKMDZKd0VGN0lLQ0pjZzUtaW1nLTRfMTc3MTEwNTUzNDAwMF9uYTFmbl9kMkZzYTNSb2NtOTFaMmd0WjJWdGFXNXAucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=n7laV2IGfVpdMC07mDELbtS~42sG~d~f8S3KM2fuINBpGAa~Vv0gZOdvgAqH07vJkcIO~Lk5rNJHvhoNQOCLdeTPYfGOp7wseTaWjrnJoTwu5FFzlUbvp~Q5rjuYH-8UCowBRfvIecqEAZSMIWWxkcOhGbyeamqHps95TnamSRNjImBuX5XR72LUlSzr12NvZPh9A55AbN1UI5hHp2F2JOUHfkKsX4jH5a4hqPc2P0W0cHd2Z1gkwpgnKVJhHrqP0bJTm5CLQojDDUcUFo4i6ZXtDC97zPXeyBaOtUdGniql0ejaoFpyxdrWKOW9kccNrDU-KC5cNcTg5eu5mOrZKA__";

const WALKTHROUGH_IMAGES: Record<string, string> = {
  openai: WALKTHROUGH_OPENAI,
  openrouter: WALKTHROUGH_OPENROUTER,
  qwen: WALKTHROUGH_QWEN,
  gemini: WALKTHROUGH_GEMINI,
};

const WALKTHROUGH_LABELS: Record<string, string> = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  qwen: "Qwen",
  gemini: "Google Gemini",
};

const NURTURE_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/40OJM5Q1RkKCsRlzXV7m9D/sandbox/qbHV4Oe3AntWVAGTBrO72o-img-5_1771100773000_na1fn_bnVydHVyZS1zZWN0aW9u.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNDBPSk01UTFSa0tDc1JselhWN205RC9zYW5kYm94L3FiSFY0T2UzQW50V1ZBR1RCck83Mm8taW1nLTVfMTc3MTEwMDc3MzAwMF9uYTFmbl9iblZ5ZEhWeVpTMXpaV04wYVc5dS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ge7ukLywpoDFTtl8usj~N1aL1qwydXnhJomzGWu~psSTwhWUi7vlejP3gBKuq-rFwLfwfd3COYyVfUoGmrgTifFZLBF~iT5ICvpuF4MkmHM~h0dahd~vp446tgWyny0i3Mzmk2SpNE6GlBBfQpJOH-BoIiA1sSDfXG9lrLkG8CRImZBKXfPdWtWt6HkGlUBDFfSsDkvS7PU4b95R0xnds5R4anvAYt3cMvWooR4myS2aCnDnAO00hK0NSpnnFtHg9uCU2jGt~mMrVJQiRFbvLoZ9Ir8qtacCb9-UjbdVXZ4AvlLXVi8do9UUbfN6OlffZcIffcHeLrZrgj1qCH09Xw__";

/* ─── Reusable Components ─── */

function SectionLabel({ text }: { text: string }) {
  return (
    <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-orange-400 mb-4">
      {text}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight text-white"
      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
    >
      {children}
    </h2>
  );
}

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

function DiagonalDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div
      className={`w-full h-20 md:h-32 ${flip ? "rotate-180" : ""}`}
      style={{ marginTop: "-1px", marginBottom: "-1px" }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <path
          d="M0,0 L1440,120 L1440,120 L0,120 Z"
          fill="#09090b"
        />
      </svg>
    </div>
  );
}

/* ─── Onboarding Progress Tracker ─── */

const API_PROVIDER_DASHBOARDS = [
  { id: "openai", name: "OpenAI", url: "https://platform.openai.com/api-keys", color: "#10A37F", desc: "GPT-4o / GPT-4o-mini" },
  { id: "openrouter", name: "OpenRouter", url: "https://openrouter.ai/keys", color: "#6366F1", desc: "Claude, Llama, Mistral" },
  { id: "qwen", name: "Qwen", url: "https://dashscope.console.aliyun.com/apiKey", color: "#FF6A00", desc: "Qwen-Max / Qwen-Plus" },
  { id: "gemini", name: "Google Gemini", url: "https://aistudio.google.com/apikey", color: "#4285F4", desc: "Gemini 2.0 Flash" },
];

const ONBOARDING_STEPS = [
  { step: 1, label: "Get Your API Key", icon: Key, href: "#key-rotation", time: "5 min", desc: "Choose a provider and paste your key", actionType: "api-key" as const },
  { step: 2, label: "Interview 1: Who Are You?", icon: User, href: "#onboarding", time: "3 min", desc: "Tell your bot about yourself", actionType: "interview-1" as const },
  { step: 3, label: "Interview 2: Your Ideal Customer", icon: Target, href: "#onboarding", time: "3 min", desc: "Describe who you want to reach", actionType: "interview-2" as const },
];

const STORAGE_KEY = "tiger-bot-onboarding-progress";

function useOnboardingProgress() {
  const [completed, setCompleted] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved) as number[]) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  const toggle = useCallback((step: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setCompleted(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { completed, toggle, reset };
}

function OnboardingProgress() {
  const { completed, toggle, reset } = useOnboardingProgress();
  const pct = Math.round((completed.size / ONBOARDING_STEPS.length) * 100);
  const allDone = completed.size === ONBOARDING_STEPS.length;
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (allDone) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  return (
    <motion.div
      className="mt-10 max-w-3xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
    >
      {/* Progress bar header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-500">
            Setup Progress
          </span>
          <span
            className={`text-xs font-bold tracking-wider ${
              allDone ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            {pct}%
          </span>
        </div>
        {completed.size > 0 && (
          <button
            onClick={reset}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-5">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            allDone
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : "bg-gradient-to-r from-orange-500 to-amber-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Glow pulse on the leading edge */}
        {pct > 0 && pct < 100 && (
          <motion.div
            className="absolute inset-y-0 w-8 rounded-full bg-orange-400/40 blur-sm"
            animate={{ left: `${pct - 2}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ONBOARDING_STEPS.map((s) => {
          const done = completed.has(s.step);
          const isCurrent =
            !done &&
            s.step ===
              Math.min(
                ...ONBOARDING_STEPS.filter((x) => !completed.has(x.step)).map(
                  (x) => x.step
                )
              );
          const isExpanded = expandedStep === s.step;

          return (
            <div key={s.step} className="relative">
              {/* Card — click to expand action panel */}
              <button
                onClick={() => setExpandedStep(isExpanded ? null : s.step)}
                className={`group relative w-full flex items-center gap-4 rounded-xl px-5 py-4 transition-all duration-300 border text-left ${
                  done
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : isCurrent
                    ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                    : "bg-white/5 border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5"
                }`}
              >
                {/* Step number / checkmark */}
                <div
                  className={`relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    done
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-gradient-to-br from-orange-500 to-amber-500 text-black"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  {done ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    s.step
                  )}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-lg animate-ping bg-orange-500/20" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-sm leading-tight transition-colors ${
                      done
                        ? "text-emerald-300 line-through decoration-emerald-500/40"
                        : "text-white"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {done ? "Completed" : isCurrent ? `Up next · ${s.time}` : s.time}
                  </p>
                </div>

                <ChevronRight
                  className={`w-4 h-4 ml-auto flex-shrink-0 transition-all duration-300 ${
                    done
                      ? "text-emerald-500/50"
                      : "text-zinc-600 group-hover:text-orange-400"
                  } ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>

              {/* Mark complete checkbox */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle(s.step);
                }}
                className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
                  done
                    ? "bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600"
                    : "bg-zinc-900 border-zinc-700 text-zinc-600 hover:border-orange-500 hover:text-orange-400"
                }`}
                title={done ? "Mark as incomplete" : "Mark as complete"}
              >
                {done ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </button>

              {/* Expanded action panel */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm p-4">
                    {s.actionType === "api-key" && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-3">Open your provider's dashboard to get your API key:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {API_PROVIDER_DASHBOARDS.map((p) => (
                            <a
                              key={p.id}
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 hover:border-orange-500/40 hover:bg-zinc-800 transition-all duration-200 group/link"
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <div className="min-w-0">
                                <p className="text-white text-xs font-semibold truncate group-hover/link:text-orange-300 transition-colors">{p.name}</p>
                                <p className="text-zinc-600 text-[10px] truncate">{p.desc}</p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-zinc-600 ml-auto flex-shrink-0 group-hover/link:text-orange-400 transition-colors" />
                            </a>
                          ))}
                        </div>
                        <a
                          href="#key-rotation"
                          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
                          onClick={() => setExpandedStep(null)}
                        >
                          <span>Need help? See the full walkthrough</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {s.actionType === "interview-1" && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-3">Tell your bot about yourself — name, mission, voice, and style.</p>
                        <div className="space-y-2">
                          <a
                            href="#onboarding"
                            className="flex items-center gap-2.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 hover:border-orange-500/40 hover:bg-zinc-800 transition-all duration-200 group/link"
                            onClick={() => setExpandedStep(null)}
                          >
                            <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold group-hover/link:text-orange-300 transition-colors">View Interview 1 Questions</p>
                              <p className="text-zinc-600 text-[10px]">See all 10 fields the bot will ask</p>
                            </div>
                            <ChevronRight className="w-3 h-3 text-zinc-600 ml-auto flex-shrink-0 group-hover/link:text-orange-400 transition-colors" />
                          </a>
                          <div
                            className="flex items-center gap-2.5 rounded-lg border border-dashed border-zinc-700/50 bg-zinc-800/30 px-3 py-2.5 opacity-60"
                          >
                            <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-zinc-400 text-xs font-semibold">Start in Telegram</p>
                              <p className="text-zinc-600 text-[10px]">Bot link will appear in your welcome email</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {s.actionType === "interview-2" && (
                      <div>
                        <p className="text-xs text-zinc-400 mb-3">Describe your ideal customer — who they are, where they hang out, what they need.</p>
                        <div className="space-y-2">
                          <a
                            href="#onboarding"
                            className="flex items-center gap-2.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-2.5 hover:border-orange-500/40 hover:bg-zinc-800 transition-all duration-200 group/link"
                            onClick={() => {
                              setExpandedStep(null);
                              setTimeout(() => {
                                const el = document.querySelector('[data-section="interview-2"]');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }, 100);
                            }}
                          >
                            <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                              <Target className="w-3.5 h-3.5 text-orange-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-xs font-semibold group-hover/link:text-orange-300 transition-colors">View Interview 2 Questions</p>
                              <p className="text-zinc-600 text-[10px]">See all ICP targeting fields</p>
                            </div>
                            <ChevronRight className="w-3 h-3 text-zinc-600 ml-auto flex-shrink-0 group-hover/link:text-orange-400 transition-colors" />
                          </a>
                          <div
                            className="flex items-center gap-2.5 rounded-lg border border-dashed border-zinc-700/50 bg-zinc-800/30 px-3 py-2.5 opacity-60"
                          >
                            <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-zinc-400 text-xs font-semibold">Start in Telegram</p>
                              <p className="text-zinc-600 text-[10px]">Completes automatically after Interview 1</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion celebration */}
      {allDone && (
        <motion.div
          className="mt-5 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-5 py-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-emerald-300 font-semibold text-sm">Setup Complete!</p>
            <p className="text-emerald-400/60 text-xs">Your Tiger Bot is now hunting leads 24/7.</p>
          </div>
        </motion.div>
      )}

      {/* Confetti burst */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${50 + (Math.random() - 0.5) * 20}%`,
                top: "40%",
                backgroundColor: [
                  "#F97316",
                  "#FBBF24",
                  "#10B981",
                  "#3B82F6",
                  "#EC4899",
                  "#8B5CF6",
                ][i % 6],
              }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: Math.random() * -400 - 100,
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 1.5 + Math.random(),
                ease: "easeOut",
                delay: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Flywheel Stage Data ─── */

const flywheelStages = [
  {
    id: 1,
    name: "Discovery",
    icon: Eye,
    color: "from-orange-500 to-amber-500",
    question: "How does a lead enter the system?",
    actions: [
      "Social listening on LinkedIn for ICP keywords",
      "Automated content publishing to attract inbound interest",
      "Profile browsing in target groups and communities",
    ],
    metrics: ["Profile Views", "Content Impressions", "Keywords Found"],
  },
  {
    id: 2,
    name: "First Contact",
    icon: MessageCircle,
    color: "from-amber-500 to-yellow-500",
    question: "What happens next?",
    actions: [
      "Personalized LinkedIn connection requests",
      "Non-salesy comment on prospect's content",
      "Direct message referencing shared interest",
    ],
    metrics: ["Connection Rate", "Reply Rate", "Engagement Rate"],
  },
  {
    id: 3,
    name: "Nurturing",
    icon: Heart,
    color: "from-yellow-500 to-orange-400",
    question: "How does nurturing work?",
    actions: [
      "Automated email + SMS drip sequences with value",
      "Share relevant articles, tools, and resources",
      "AI-powered answers to prospect questions",
    ],
    metrics: ["Open Rate", "Lead Score", "Value Touches"],
  },
  {
    id: 4,
    name: "Conversion",
    icon: Target,
    color: "from-orange-400 to-red-500",
    question: "What triggers conversion?",
    actions: [
      "Direct ask to take the defined success action",
      "Calendar booking link delivery",
      "Purchase or signup link with urgency",
    ],
    metrics: ["Conversion Rate", "Booked Calls", "Signups"],
  },
  {
    id: 5,
    name: "Retention",
    icon: Repeat,
    color: "from-red-500 to-orange-500",
    question: "What happens after they become a customer?",
    actions: [
      "Automated welcome and onboarding sequence",
      "Scheduled satisfaction check-ins",
      "Referral and testimonial requests",
    ],
    metrics: ["Churn Rate", "Lifetime Value", "Referrals"],
  },
];

/* ─── Interview Data ─── */

const customerInterviewFields = [
  { icon: User, label: "Full Name", field: "customer_name", purpose: "Personalization" },
  { icon: Users, label: "Family Name", field: "customer_family_name", purpose: "Formal records" },
  { icon: Phone, label: "Phone Number", field: "customer_phone", purpose: "SMS alerts" },
  { icon: Mail, label: "Email Address", field: "customer_email", purpose: "Notifications" },
  { icon: Briefcase, label: "Business Description", field: "business_description", purpose: "Core context" },
  { icon: Star, label: "Mission / Goal", field: "business_mission", purpose: "Bot objective" },
  { icon: TrendingUp, label: "Experience Level", field: "customer_experience", purpose: "Strategy complexity" },
  { icon: MessageSquare, label: "Brand Voice", field: "brand_voice", purpose: "Outreach tone" },
];

const icpInterviewFields = [
  { icon: Users, label: "Demographics", field: "icp_demographics", purpose: "Targeting" },
  { icon: MapPin, label: "Location", field: "icp_location", purpose: "Geographic targeting" },
  { icon: Briefcase, label: "Profession / Industry", field: "icp_profession", purpose: "LinkedIn targeting" },
  { icon: HelpCircle, label: "Pain Points", field: "icp_pain_points", purpose: "Messaging foundation" },
  { icon: Star, label: "Goals & Aspirations", field: "icp_goals", purpose: "Solution framing" },
  { icon: Globe, label: "Online Hangouts", field: "icp_online_hangouts", purpose: "Where to listen" },
  { icon: Target, label: "Success Action", field: "icp_conversion_action", purpose: "Defines success" },
];

/* ─── Nurture Campaign Data ─── */

const nurtureCampaigns = [
  {
    title: "Hair Stylist",
    subtitle: "Targeting: Busy Professionals",
    steps: [
      { channel: "Email", day: "Day 1", message: "5 Ways to Keep Your Hair Healthy Between Appointments — a free care guide.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 4", message: "Just sent you a few hair care tips. Hope they help! Here to answer any questions.", principle: "Liking" },
      { channel: "Email", day: "Day 8", message: "The Biggest Hair Myth We All Fall For — myth-busting that builds authority.", principle: "Authority" },
      { channel: "Email", day: "Day 12", message: "Before-and-after gallery of clients with similar hair type or goals.", principle: "Social Proof" },
      { channel: "SMS", day: "Day 14", message: "Quick question — have you tried the tip about heat protection? Most clients see results in a week.", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "Your hair deserves better than drugstore products. Here's what the pros actually use.", principle: "Authority" },
      { channel: "SMS", day: "Day 22", message: "Have a special event coming up? I have a couple of last-minute openings this week.", principle: "Scarcity" },
      { channel: "Email", day: "Day 26", message: "Don't let another month go by with damaged ends. Book your trim before it gets worse.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 30", message: "New client special: Full color + cut at our introductory rate. Was $180, now $120.", principle: "Anchoring" },
      { channel: "SMS", day: "Day 32", message: "Only 3 spots left for this month's new client special. Want me to save one for you?", principle: "Scarcity" },
    ],
  },
  {
    title: "Network Marketer",
    subtitle: "Targeting: Side Hustle Seekers",
    steps: [
      { channel: "Email", day: "Day 1", message: "Is the 9-to-5 draining you? Free guide: 5 Income Streams You Can Start This Week.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "That feeling of being drained by the 9-to-5 is all too common. I found a different way.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "How Sarah went from $0 to $3,200/month in 90 days — her full story.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "What if you could earn from your phone? A short case study endorsed by industry leaders.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Did you get a chance to read Sarah's story? What part resonated with you?", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "Invitation to a no-pressure, 15-minute webinar explaining the opportunity.", principle: "Commitment" },
      { channel: "Email", day: "Day 22", message: "People who wait miss out. Your competitors are already building their teams.", principle: "Loss Aversion" },
      { channel: "SMS", day: "Day 25", message: "We're opening 5 new partner spots this month. Want me to hold one for you?", principle: "Scarcity" },
      { channel: "Email", day: "Day 28", message: "Compare: Stay at your job ($X/yr, no growth) vs. build a side income ($X potential, flexible).", principle: "Anchoring" },
      { channel: "SMS", day: "Day 30", message: "Last call — enrollment closes Friday. Do you have 10 minutes to chat?", principle: "Scarcity" },
    ],
  },
  {
    title: "Freelance Designer",
    subtitle: "Targeting: Small Business Owners",
    steps: [
      { channel: "Email", day: "Day 1", message: "3 Design Mistakes That Are Costing You Customers — a free visual guide.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Sent you a quick design guide. Let me know if any of those mistakes look familiar!", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "How [Client Name] Doubled Their Conversions With a Simple Rebrand — full case study.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "The design principles Fortune 500 companies use (that small businesses ignore).", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Quick thought — have you looked at your homepage on mobile lately? Most haven't.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 18", message: "Free 15-minute brand audit — I'll review your site and send you 3 quick wins.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 20", message: "Did you see the free brand audit offer? Spots fill up fast — grab yours here.", principle: "Scarcity" },
      { channel: "Email", day: "Day 24", message: "Your competitor just rebranded. Here's what they did right (and what you can do better).", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 28", message: "Full rebrand package: Was $2,500, introductory rate $1,500 for this month only.", principle: "Anchoring" },
      { channel: "SMS", day: "Day 30", message: "2 design slots left for March. Want to lock one in before they're gone?", principle: "Scarcity" },
    ],
  },
  {
    title: "Personal Trainer",
    subtitle: "Targeting: Desk Workers",
    steps: [
      { channel: "Email", day: "Day 1", message: "The 5-Minute Desk Stretch That Fixes Your Posture — a free video guide.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 4", message: "Hope the desk stretches are helping! Here's a bonus: a 7-day mobility challenge.", principle: "Commitment" },
      { channel: "Email", day: "Day 8", message: "Why 80% of New Year's Resolutions Fail (And What Actually Works) — backed by research.", principle: "Authority" },
      { channel: "Email", day: "Day 12", message: "Client transformation story with before/after photos and their journey.", principle: "Social Proof" },
      { channel: "SMS", day: "Day 15", message: "How's the mobility challenge going? Most people feel a difference by day 5.", principle: "Commitment" },
      { channel: "Email", day: "Day 19", message: "Your body is losing muscle mass every year after 30. Here's how to reverse it.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 23", message: "Meet the team — we're real people who love helping desk workers feel strong again.", principle: "Liking" },
      { channel: "SMS", day: "Day 26", message: "Ready to start your own transformation? I have 2 spots open this month.", principle: "Scarcity" },
      { channel: "Email", day: "Day 29", message: "Compare: Gym membership ($50/mo, no guidance) vs. personal training ($150/mo, real results).", principle: "Decoy Effect" },
      { channel: "SMS", day: "Day 31", message: "Last 2 spots for my spring transformation program. Starts Monday — you in?", principle: "Scarcity" },
    ],
  },
  {
    title: "Rideshare Driver",
    subtitle: "Targeting: Commuters & Travelers",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free guide: 7 Airport Hacks That Save You $50+ Per Trip — no strings attached.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hey! Hope the airport tips were useful. I drive that route daily — happy to help anytime.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "Why 4,000+ riders in your city rated us 4.9 stars — real reviews, real stories.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Featured in [Local Publication]: The safest, most reliable ride service in town.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Have a trip coming up? Book ahead and skip the surge pricing. I'll lock in your rate.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 18", message: "Meet your driver — a quick intro video so you know who's picking you up.", principle: "Liking" },
      { channel: "Email", day: "Day 22", message: "Compare: Random rideshare ($35 avg, unknown driver) vs. book with me ($30, guaranteed 4.9★).", principle: "Anchoring" },
      { channel: "SMS", day: "Day 25", message: "Holiday weekend coming up — my schedule fills fast. Want to pre-book your ride?", principle: "Scarcity" },
      { channel: "Email", day: "Day 28", message: "Refer a friend and you both get $10 off your next ride. Sharing is winning.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 30", message: "Only 3 pre-book slots left for this weekend. Grab yours before they're gone.", principle: "Scarcity" },
    ],
  },
  {
    title: "Real Estate Agent",
    subtitle: "Targeting: First-Time Home Buyers",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free First-Time Buyer's Checklist: 12 Things Your Bank Won't Tell You.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hope the buyer's checklist was helpful! Any questions about the process? I'm here.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "How the Johnsons found their dream home $40K under budget — their full story.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Market update: Prices in your area are up 8% this year. Here's what that means for you.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Quick question — are you pre-approved yet? That's the #1 thing that speeds up the process.", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "Every month you wait, you could be paying $200+ more. Here's the math.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 22", message: "Just listed: 3 properties in your target area that won't last long.", principle: "Scarcity" },
      { channel: "SMS", day: "Day 25", message: "One of those listings already has 2 offers. Want to see it before it's gone?", principle: "Scarcity" },
      { channel: "Email", day: "Day 28", message: "Compare: Renting ($1,800/mo, building nothing) vs. Buying ($1,900/mo, building equity).", principle: "Anchoring" },
      { channel: "SMS", day: "Day 30", message: "I have 2 open house slots this Saturday. Want me to save you a time?", principle: "Scarcity" },
    ],
  },
  {
    title: "Online Tutor",
    subtitle: "Targeting: Parents of Struggling Students",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free PDF: 5 Study Techniques That Actually Work (Backed by Cognitive Science).", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hi! Hope the study guide is helping. I tutor students just like yours — happy to chat.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "How Mia went from a C- to an A in 6 weeks — her mom tells the story.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Certified educator with 8 years of experience and 200+ students helped.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Has your child tried the Pomodoro technique from the guide? Most students love it.", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "Every semester your child falls behind makes the next one harder. Let's fix it now.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 22", message: "Free 30-minute diagnostic session — I'll identify exactly where the gaps are.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 25", message: "I only take 8 students per term to keep quality high. 2 spots left.", principle: "Scarcity" },
      { channel: "Email", day: "Day 28", message: "Compare: Group tutoring ($30/hr, generic) vs. 1-on-1 with me ($60/hr, personalized plan).", principle: "Decoy Effect" },
      { channel: "SMS", day: "Day 30", message: "Term starts next week. Last chance to grab a spot before I'm fully booked.", principle: "Scarcity" },
    ],
  },
  {
    title: "Food Delivery",
    subtitle: "Targeting: Busy Families & Office Workers",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free meal plan: 5 Quick Dinners Under 20 Minutes (with grocery list included).", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hope the meal plan is saving you time! I deliver fresh meals daily — want to try one?", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "Over 500 families in your area trust us for weekly meals — see their reviews.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Chef-prepared, nutritionist-approved: How we design every meal for taste AND health.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Quick poll — what's your biggest dinner struggle: time, ideas, or energy? Reply 1, 2, or 3.", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "You're spending $45+/night on takeout. Our meals are $12 each. Do the math.", principle: "Anchoring" },
      { channel: "Email", day: "Day 22", message: "Don't let another week of unhealthy takeout pile up. Your family deserves better.", principle: "Loss Aversion" },
      { channel: "SMS", day: "Day 25", message: "This week's menu is our best yet. First order is 50% off — want to try it?", principle: "Anchoring" },
      { channel: "Email", day: "Day 28", message: "Compare: Cooking (2 hrs/day) vs. Takeout ($$$) vs. Our service ($12/meal, 0 effort).", principle: "Decoy Effect" },
      { channel: "SMS", day: "Day 30", message: "Only 10 delivery slots left for this week. Lock yours in now.", principle: "Scarcity" },
    ],
  },
  {
    title: "Photographer",
    subtitle: "Targeting: Engaged Couples & New Parents",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free guide: 10 Tips for Looking Natural in Photos (even if you hate being photographed).", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hope the photo tips help! I specialize in making people feel comfortable in front of the camera.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "The Martinez Wedding: A love story told in 50 photos — full gallery inside.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Published in [Magazine Name] and trusted by 300+ couples. Here's my approach.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Have you set a date yet? The best venues book photographers 6-12 months out.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 18", message: "Your baby's first year goes fast. These are the moments you'll want to remember forever.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 22", message: "Meet me — a quick behind-the-scenes video of how I work on shoot day.", principle: "Liking" },
      { channel: "SMS", day: "Day 25", message: "I only book 4 weddings per month to give each couple my full attention. 1 spot left for June.", principle: "Scarcity" },
      { channel: "Email", day: "Day 28", message: "Compare: iPhone photos (free, regret later) vs. Pro session ($500, treasure forever).", principle: "Anchoring" },
      { channel: "SMS", day: "Day 30", message: "June is almost full. Want to grab a free 15-min consultation before I close bookings?", principle: "Scarcity" },
    ],
  },
  {
    title: "Handyman / Contractor",
    subtitle: "Targeting: Homeowners",
    steps: [
      { channel: "Email", day: "Day 1", message: "Free checklist: 8 Home Maintenance Tasks That Prevent Expensive Repairs.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 3", message: "Hope the maintenance checklist helps! I've been fixing homes in your area for 12 years.", principle: "Liking" },
      { channel: "Email", day: "Day 7", message: "How we saved the Petersons $4,000 by catching a leak early — their testimonial.", principle: "Social Proof" },
      { channel: "Email", day: "Day 11", message: "Licensed, insured, and A+ rated on BBB. Here's why credentials matter for your home.", principle: "Authority" },
      { channel: "SMS", day: "Day 14", message: "Quick question — is there a project you've been putting off? Most homeowners have at least one.", principle: "Commitment" },
      { channel: "Email", day: "Day 18", message: "That small crack in your wall? It gets 10x more expensive to fix every year you wait.", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 22", message: "Free home inspection — I'll walk through and flag anything that needs attention.", principle: "Reciprocity" },
      { channel: "SMS", day: "Day 25", message: "Storm season is coming. Want me to check your roof and gutters before it hits?", principle: "Loss Aversion" },
      { channel: "Email", day: "Day 28", message: "Compare: DIY (risk + time + trips to hardware store) vs. Pro job (done right, guaranteed).", principle: "Decoy Effect" },
      { channel: "SMS", day: "Day 30", message: "My March schedule is filling up. Want to lock in a date for your project?", principle: "Scarcity" },
    ],
  },
];

/* ─── Sales Follow-Up Statistics ─── */

const salesStats = [
  { pct: 48, label: "of sales people never follow up with a prospect", color: "bg-zinc-700" },
  { pct: 25, label: "of sales people make a second contact & stop", color: "bg-zinc-600" },
  { pct: 12, label: "of sales people only make three contacts & stop", color: "bg-zinc-500" },
  { pct: 10, label: "of sales people make more than three contacts", color: "bg-orange-500/40" },
];

const conversionStats = [
  { pct: 2, label: "of sales are made on the 1st contact", contacts: 1 },
  { pct: 3, label: "of sales are made on the 2nd contact", contacts: 2 },
  { pct: 5, label: "of sales are made on the 3rd contact", contacts: 3 },
  { pct: 10, label: "of sales are made on the 4th contact", contacts: 4 },
  { pct: 80, label: "of sales are made on the 5th to 12th contact", contacts: 12 },
];

/* ─── 10 Psychological Principles ─── */

const psychPrinciples = [
  {
    id: 1,
    name: "Reciprocity",
    icon: Gift,
    description: "People tend to return a favor. Offering something of value can prompt a response or action in return.",
    botApplication: "Tiger Bot opens with a free gift — an ebook, guide, or tool — before ever making an ask. The prospect feels compelled to reciprocate.",
    example: '"Download our free ebook, and get a month\'s trial of our premium service."',
  },
  {
    id: 2,
    name: "Commitment & Consistency",
    icon: CheckCircle,
    description: "If people commit to an idea or goal, they are more likely to honor that commitment.",
    botApplication: "Tiger Bot invites micro-commitments early — a 30-day challenge, a free audit, a quick quiz. Once they say yes to something small, they follow through on bigger asks.",
    example: '"Sign up for 30-day challenge, and stick to your fitness goals."',
  },
  {
    id: 3,
    name: "Social Proof",
    icon: Users,
    description: "People will follow the actions of the majority, especially in uncertain situations.",
    botApplication: "Tiger Bot weaves testimonials, case studies, and \"join thousands\" language into every nurture sequence. Numbers build trust.",
    example: '"Join thousands of satisfied customers and try our top-rated product today."',
  },
  {
    id: 4,
    name: "Authority",
    icon: Award,
    description: "People will follow credible and knowledgeable experts.",
    botApplication: "Tiger Bot positions the owner as the expert by sharing industry insights, myth-busting content, and credentials in every touchpoint.",
    example: '"Our investment strategies are endorsed by leading financial advisors."',
  },
  {
    id: 5,
    name: "Liking",
    icon: ThumbsUp,
    description: "People are more likely to be persuaded by people they like.",
    botApplication: "Tiger Bot uses the owner's authentic brand voice, shares personal stories, and builds rapport before any sales pitch.",
    example: '"Meet our friendly team, dedicated to helping you reach your fitness goals."',
  },
  {
    id: 6,
    name: "Scarcity",
    icon: Clock,
    description: "Opportunities seem more valuable when they are less available.",
    botApplication: "Tiger Bot creates urgency with limited spots, time-sensitive offers, and exclusive access windows in conversion-stage messages.",
    example: '"Only a few items left in stock. Buy now before they\'re gone!"',
  },
  {
    id: 7,
    name: "Loss Aversion",
    icon: AlertTriangle,
    description: "People are more likely to take action to avoid a loss than to achieve a gain.",
    botApplication: "Tiger Bot frames inaction as the risk — \"Don't miss out,\" \"Your competitors are already doing this\" — to trigger action.",
    example: '"Don\'t miss out on savings. Book your early bird discount now!"',
  },
  {
    id: 8,
    name: "Anchoring",
    icon: DollarSign,
    description: "People often rely heavily on the first piece of information they receive when making decisions.",
    botApplication: "Tiger Bot presents the highest-value option first, making the actual offer feel like a bargain by comparison.",
    example: '"Originally priced at $500, now available for $250."',
  },
  {
    id: 9,
    name: "The Decoy Effect",
    icon: Layers,
    description: "People change their preference between two options when presented with a third option.",
    botApplication: "Tiger Bot presents Bronze/Silver/Gold tiers where Silver is the obvious best value — the decoy makes the target tier irresistible.",
    example: '"Offering three subscription levels (Basic, Pro, and Premium), where the Pro seems like the most cost-effective choice."',
  },
  {
    id: 10,
    name: "Baader-Meinhof Phenomenon",
    icon: Brain,
    description: "After noticing something for the first time, there is a tendency to notice it more often.",
    botApplication: "Tiger Bot maintains persistent multi-channel presence — email, SMS, social comments — so the prospect keeps \"seeing\" the brand everywhere.",
    example: '"After seeing an ad for a product, the product seems to appear everywhere online."',
  },
];

/* ─── Counter Animation ─── */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

/* ─── FAQ Item Component ─── */

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-orange-400 shrink-0" />
          <span className="text-sm font-semibold text-white">{question}</span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 pl-13">
          <p className="text-sm text-zinc-400 leading-relaxed">{answer}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Home() {
  const [activeStage, setActiveStage] = useState(0);
  const [activeCampaign, setActiveCampaign] = useState(0);
  const [activePrinciple, setActivePrinciple] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string>("openai");
  const [walkthroughProvider, setWalkthroughProvider] = useState<string>("openai");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const heroRef = useRef(null);

  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    setTimeout(() => {
      const aftercareEl = document.getElementById("aftercare");
      if (aftercareEl) {
        aftercareEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 600);
  };
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-x-hidden">
      {/* ═══════ NAVIGATION ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span
              className="text-2xl tracking-wider text-white"
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              Tiger Bot
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#onboarding" className="hover:text-orange-400 transition-colors">
              Onboarding
            </a>
            <a href="#key-rotation" className="hover:text-orange-400 transition-colors">
              API Key
            </a>
            <a href="#flywheel" className="hover:text-orange-400 transition-colors">
              Flywheel
            </a>
            <a href="#leadgen" className="hover:text-orange-400 transition-colors">
              Lead Gen
            </a>
            <a href="#nurture" className="hover:text-orange-400 transition-colors">
              Nurture
            </a>
            <a href="#why-follow-up" className="hover:text-orange-400 transition-colors">
              Why It Works
            </a>
            <a href="#aftercare" className="hover:text-orange-400 transition-colors">
              Aftercare
            </a>
            <a href="#regional-intel" className="hover:text-orange-400 transition-colors">
              Regions
            </a>
            <a href="#provisioning" className="hover:text-orange-400 transition-colors">
              Pipeline
            </a>
            <a href="#webhook-setup" className="hover:text-orange-400 transition-colors">
              Webhooks
            </a>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-end overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY }}
        >
          <img
            src={HERO_IMG}
            alt="Tiger Bot"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 to-transparent" />
        </motion.div>

        <motion.div
          className="relative container pb-16 md:pb-24 pt-32"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <SectionLabel text="Welcome — You're In" />
          </motion.div>
          <motion.h1
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] tracking-tight max-w-5xl"
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Start Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
              Tiger Bot
            </span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg md:text-xl text-zinc-400 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Your bot is provisioned and ready. Complete these 3 steps to get it
            hunting leads for you 24/7.
          </motion.p>

          {/* ── 3-Step Quick Start with Progress Tracking ── */}
          <OnboardingProgress />

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <a
              href="#onboarding"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
            >
              <Rocket className="w-5 h-5" />
              <span className="tracking-wider" style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.25rem' }}>
                Begin Setup
              </span>
              <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="https://stan.store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-6 py-4 rounded-xl transition-all duration-300 hover:border-orange-500/40 hover:text-orange-400"
            >
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Don't have one yet? Buy a Tiger Bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="bg-[#09090b] border-y border-white/5">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 5, suffix: "", label: "Flywheel Stages" },
              { value: 2, suffix: "", label: "Onboarding Interviews" },
              { value: 15, suffix: "+", label: "Data Points Captured" },
              { value: 100, suffix: "%", label: "Automated" },
            ].map((stat, i) => (
              <AnimateIn key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div
                    className="text-4xl md:text-5xl text-orange-400"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-2 text-sm text-zinc-500 font-medium uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ONBOARDING SECTION ═══════ */}
      <section id="onboarding" className="relative">
        {/* Orange accent block */}
        <div className="bg-orange-500 py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src={ONBOARDING_IMG} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="container relative">
            <AnimateIn>
              <SectionLabel text="Part 1" />
              <SectionHeading>
                <span className="text-black">The Onboarding</span>
                <br />
                <span className="text-black/60">System</span>
              </SectionHeading>
              <p className="mt-6 text-lg text-black/70 max-w-2xl leading-relaxed">
                Before the Tiger Bot can hunt, it needs to know its owner and its prey.
                Two automated interviews build the intelligence briefing that powers
                every action the bot takes.
              </p>
            </AnimateIn>
          </div>
        </div>

        <DiagonalDivider />

        {/* Interview 1: Customer Profile */}
        <div className="bg-[#09090b] py-20 md:py-28">
          <div className="container">
            <AnimateIn>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-sm">01</span>
                </div>
                <SectionLabel text="Interview One" />
              </div>
              <h3
                className="text-4xl md:text-5xl lg:text-6xl text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Who Are You?
              </h3>
              <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed">
                The bot's first question. It needs to understand the person behind the business —
                their name, their mission, their voice. This interview creates the customer
                profile that personalizes every interaction.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-2 gap-4">
              {customerInterviewFields.map((field, i) => (
                <AnimateIn key={field.field} delay={i * 0.05}>
                  <div className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-5 hover:border-orange-500/30 hover:bg-zinc-900 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                        <field.icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">{field.label}</h4>
                          <span className="text-xs text-zinc-600 font-mono">{field.field}</span>
                        </div>
                        <p className="text-sm text-zinc-500">{field.purpose}</p>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Bot Quote */}
            <AnimateIn delay={0.3}>
              <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-6 rounded-r-lg">
                <p className="text-zinc-300 italic leading-relaxed">
                  "Hello, I am your new Tiger Bot. To be the most effective partner for your
                  business, I need to understand who you are and what you do. Please answer the
                  following questions so I can get to work for you."
                </p>
                <span className="text-xs text-orange-400 mt-3 block font-semibold tracking-wider uppercase">
                  — Tiger Bot, Interview 1
                </span>
              </div>
            </AnimateIn>
          </div>
        </div>

        {/* Interview 2: ICP */}
        <div data-section="interview-2" className="bg-zinc-950 py-20 md:py-28">
          <div className="container">
            <AnimateIn>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-sm">02</span>
                </div>
                <SectionLabel text="Interview Two" />
              </div>
              <h3
                className="text-4xl md:text-5xl lg:text-6xl text-white mb-4"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Who Is Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Ideal Customer?
                </span>
              </h3>
              <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed">
                Now the bot knows its owner. Next, it needs to know the target. This interview
                builds the Ideal Customer Profile — the targeting parameters, pain points, and
                the single action that defines success.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {icpInterviewFields.map((field, i) => (
                <AnimateIn key={field.field} delay={i * 0.05}>
                  <div className="group bg-[#09090b] border border-zinc-800 rounded-lg p-5 hover:border-orange-500/30 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                        <field.icon className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{field.label}</h4>
                        <p className="text-sm text-zinc-500">{field.purpose}</p>
                        <span className="text-xs text-zinc-700 font-mono mt-2 block">
                          {field.field}
                        </span>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Bot Quote */}
            <AnimateIn delay={0.3}>
              <div className="mt-12 bg-gradient-to-r from-orange-500/10 to-transparent border-l-4 border-orange-500 p-6 rounded-r-lg">
                <p className="text-zinc-300 italic leading-relaxed">
                  "Thank you. Now, let's define our mission. To find the right people for your
                  business, I need to know exactly who we are looking for. Please describe your
                  ideal customer or prospect."
                </p>
                <span className="text-xs text-orange-400 mt-3 block font-semibold tracking-wider uppercase">
                  — Tiger Bot, Interview 2
                </span>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ═══════ API KEY ROTATION ═══════ */}
      <section id="key-rotation" className="relative">
        <div className="bg-zinc-950 py-20 md:py-28">
          <div className="container">
            <AnimateIn>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-orange-400" />
                </div>
                <SectionLabel text="Critical Step" />
              </div>
              <SectionHeading>
                API Key
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Rotation
                </span>
              </SectionHeading>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                Your Tiger Bot is powered by an AI brain that costs money to run. During
                onboarding, we provide our key for a 72-hour free trial. After that, the
                customer must rotate to their own key. One button. Done.
              </p>
            </AnimateIn>

            {/* Timeline: 72-Hour Flow */}
            <div className="mt-16 grid lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Unlock,
                  phase: "Hour 0",
                  title: "Onboarding Begins",
                  description: "Customer signs up. Tiger Bot is activated using our provisioned API key. The bot immediately begins Interview 1 and Interview 2. Full functionality from minute one.",
                  status: "active",
                  detail: "Our key — our cost exposure",
                },
                {
                  icon: Timer,
                  phase: "Hour 1–71",
                  title: "72-Hour Free Trial",
                  description: "The bot runs on our dime. Customer completes onboarding, ICP is built, the flywheel starts spinning. Automated reminders at 24h, 48h, and 64h prompt key rotation.",
                  status: "warning",
                  detail: "Countdown active — 3 reminders sent",
                },
                {
                  icon: RefreshCw,
                  phase: "Hour 72",
                  title: "Key Rotation Required",
                  description: "Our key expires. Customer clicks one button, pastes their own API key, and the bot continues without interruption. If no key is provided, the bot pauses until one is entered.",
                  status: "rotate",
                  detail: "One click — zero downtime",
                },
              ].map((step, i) => (
                <AnimateIn key={i} delay={i * 0.15}>
                  <div
                    className={`relative rounded-2xl p-8 border transition-all h-full ${
                      step.status === "active"
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : step.status === "warning"
                        ? "bg-amber-500/5 border-amber-500/30"
                        : "bg-orange-500/5 border-orange-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          step.status === "active"
                            ? "bg-emerald-500/20"
                            : step.status === "warning"
                            ? "bg-amber-500/20"
                            : "bg-orange-500/20"
                        }`}
                      >
                        <step.icon
                          className={`w-6 h-6 ${
                            step.status === "active"
                              ? "text-emerald-400"
                              : step.status === "warning"
                              ? "text-amber-400"
                              : "text-orange-400"
                          }`}
                        />
                      </div>
                      <div>
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            step.status === "active"
                              ? "text-emerald-400"
                              : step.status === "warning"
                              ? "text-amber-400"
                              : "text-orange-400"
                          }`}
                        >
                          {step.phase}
                        </span>
                      </div>
                    </div>
                    <h4
                      className="text-2xl text-white mb-3"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {step.title}
                    </h4>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="bg-black/30 rounded-lg px-4 py-2 inline-flex items-center gap-2">
                      <Key className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">{step.detail}</span>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* ── API Key FAQ (Collapsible) ── */}
            <AnimateIn delay={0.2}>
              <div className="mt-16 mb-12">
                <h4
                  className="text-3xl md:text-4xl text-white mb-6"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Wait — What Is an
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                    {" "}API Key?
                  </span>
                </h4>
                <p className="text-zinc-500 text-sm mb-6 max-w-2xl">
                  If you have never heard of an API key, you are not alone. Here is everything
                  you need to know, explained simply.
                </p>
                <div className="space-y-3">
                  {[
                    {
                      q: "What is an API key?",
                      a: "Think of it like a password that lets your Tiger Bot talk to an AI brain (like ChatGPT). Without it, the bot cannot think. With it, the bot comes alive. You get one from the AI company, paste it in, and you are done.",
                    },
                    {
                      q: "Why do I need my own key?",
                      a: "For the first 72 hours, Tiger Bot runs on our key — that is your free trial. After that, you need your own so the AI costs go to your account, not ours. It is like getting your own Netflix login instead of borrowing someone else's.",
                    },
                    {
                      q: "How much does it cost?",
                      a: "Most people spend between $1–$10 per month. The AI charges tiny fractions of a cent per message. A typical Tiger Bot sends a few hundred messages a month, so the cost is very low. Some providers even have a free tier.",
                    },
                    {
                      q: "Is it hard to get one?",
                      a: "No. You go to a website, sign in (most people already have a Google or OpenAI account), click 'Create API Key', and copy the text it gives you. That is it. We show you exactly which button to click below.",
                    },
                    {
                      q: "Is it safe to share my API key with Tiger Bot?",
                      a: "Your key is stored securely in your bot's private configuration file. It is never shared with other users, never visible on any dashboard, and never leaves your bot's environment. You can revoke it at any time from the provider's website.",
                    },
                    {
                      q: "What if I mess it up?",
                      a: "Nothing breaks permanently. If you paste the wrong key, the bot just pauses until you fix it. You can always go back to the provider's website, delete the old key, create a new one, and paste it in. No data is lost.",
                    },
                  ].map((faq, i) => (
                    <FaqItem key={i} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </div>
            </AnimateIn>

            {/* ── Visual Walkthrough Carousel ── */}
            <AnimateIn delay={0.22}>
              <div className="mt-12 mb-12">
                <h4
                  className="text-3xl md:text-4xl text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  See It In
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                    {" "}Action
                  </span>
                </h4>
                <p className="text-zinc-500 text-sm mb-6 max-w-2xl">
                  Visual step-by-step guides showing exactly where to click. Pick a provider to see the walkthrough.
                </p>

                {/* Provider Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Object.keys(WALKTHROUGH_IMAGES).map((key) => (
                    <button
                      key={key}
                      onClick={() => setWalkthroughProvider(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        walkthroughProvider === key
                          ? "bg-orange-500 text-black"
                          : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-white"
                      }`}
                    >
                      {WALKTHROUGH_LABELS[key]}
                    </button>
                  ))}
                </div>

                {/* Walkthrough Image */}
                <motion.div
                  key={walkthroughProvider}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/30"
                >
                  <img
                    src={WALKTHROUGH_IMAGES[walkthroughProvider]}
                    alt={`How to get your ${WALKTHROUGH_LABELS[walkthroughProvider]} API key in 4 steps`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">
                          {WALKTHROUGH_LABELS[walkthroughProvider]} — 4 Steps to Your API Key
                        </p>
                        <p className="text-zinc-400 text-xs">
                          Follow the numbered steps above. Total time: about 2 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick summary steps */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { step: "1", label: "Sign Up / Sign In", desc: "Create a free account or log in" },
                    { step: "2", label: "Find API Keys", desc: "Navigate to the keys section" },
                    { step: "3", label: "Create & Copy", desc: "Click create, then copy your key" },
                    { step: "4", label: "Paste in Tiger Bot", desc: "One click and you are live" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm flex items-center justify-center mx-auto mb-2">
                        {s.step}
                      </div>
                      <p className="text-white text-sm font-semibold mb-1">{s.label}</p>
                      <p className="text-zinc-500 text-xs">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>

            {/* ── LLM Provider Selector ── */}
            <AnimateIn delay={0.25}>
              <div className="mt-16">
                <h4
                  className="text-3xl md:text-4xl text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Step 1: Choose Your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                    {" "}AI Brain
                  </span>
                </h4>
                <p className="text-zinc-500 text-sm mb-8 max-w-xl">
                  Pick the LLM that powers your Tiger Bot. Each provider has different strengths.
                  Click one to see the details and get your key.
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {([
                    {
                      id: "openai",
                      name: "OpenAI",
                      model: "GPT-4o / GPT-4o-mini",
                      keyPrefix: "sk-",
                      keyExample: "sk-proj-abc123...",
                      dashboardUrl: "https://platform.openai.com/api-keys",
                      color: "emerald",
                      pros: [
                        "Most popular — huge community & support",
                        "Excellent at conversation & sales copy",
                        "Most users already have an account",
                      ],
                      cons: [
                        "Higher cost per token than alternatives",
                        "Rate limits on free tier",
                      ],
                      costNote: "~$2.50 / 1M input tokens (GPT-4o-mini)",
                      envVar: "OPENAI_API_KEY",
                    },
                    {
                      id: "openrouter",
                      name: "OpenRouter",
                      model: "Any model (Claude, Llama, Mistral, etc.)",
                      keyPrefix: "sk-or-",
                      keyExample: "sk-or-v1-abc123...",
                      dashboardUrl: "https://openrouter.ai/keys",
                      color: "purple",
                      pros: [
                        "Access 100+ models through one key",
                        "Switch models without changing keys",
                        "Often cheaper than going direct",
                      ],
                      cons: [
                        "Extra routing layer adds small latency",
                        "Requires creating a new account",
                      ],
                      costNote: "Varies by model — pay per use",
                      envVar: "OPENROUTER_API_KEY",
                    },
                    {
                      id: "qwen",
                      name: "Qwen (Alibaba)",
                      model: "Qwen-Max / Qwen-Plus",
                      keyPrefix: "sk-",
                      keyExample: "sk-abc123def456...",
                      dashboardUrl: "https://dashscope.console.aliyun.com/apiKey",
                      color: "sky",
                      pros: [
                        "Excellent multilingual (Thai, Chinese, English)",
                        "Very competitive pricing",
                        "Strong reasoning capabilities",
                      ],
                      cons: [
                        "Smaller English-speaking community",
                        "Dashboard is in Chinese (use translate)",
                      ],
                      costNote: "~$0.80 / 1M input tokens (Qwen-Plus)",
                      envVar: "QWEN_API_KEY",
                    },
                    {
                      id: "gemini",
                      name: "Google Gemini",
                      model: "Gemini 2.0 Flash / Gemini 1.5 Pro",
                      keyPrefix: "AIza",
                      keyExample: "AIzaSyA1b2c3d4e5...",
                      dashboardUrl: "https://aistudio.google.com/apikey",
                      color: "rose",
                      pros: [
                        "Most users already have a Google account",
                        "Generous free tier (60 requests/min)",
                        "Excellent at long-context tasks",
                      ],
                      cons: [
                        "Key format differs from OpenAI-style",
                        "Newer API — some libraries still catching up",
                      ],
                      costNote: "Free tier available — $0.075 / 1M input tokens (Flash)",
                      envVar: "GEMINI_API_KEY",
                    },
                  ] as const).map((provider) => {
                    const isSelected = selectedProvider === provider.id;
                    const colorMap = {
                      emerald: {
                        border: isSelected ? "border-emerald-500" : "border-zinc-800",
                        bg: isSelected ? "bg-emerald-500/10" : "bg-zinc-900/50",
                        dot: "bg-emerald-500",
                        text: "text-emerald-400",
                        ring: "ring-emerald-500/30",
                      },
                      purple: {
                        border: isSelected ? "border-purple-500" : "border-zinc-800",
                        bg: isSelected ? "bg-purple-500/10" : "bg-zinc-900/50",
                        dot: "bg-purple-500",
                        text: "text-purple-400",
                        ring: "ring-purple-500/30",
                      },
                      sky: {
                        border: isSelected ? "border-sky-500" : "border-zinc-800",
                        bg: isSelected ? "bg-sky-500/10" : "bg-zinc-900/50",
                        dot: "bg-sky-500",
                        text: "text-sky-400",
                        ring: "ring-sky-500/30",
                      },
                      rose: {
                        border: isSelected ? "border-rose-500" : "border-zinc-800",
                        bg: isSelected ? "bg-rose-500/10" : "bg-zinc-900/50",
                        dot: "bg-rose-500",
                        text: "text-rose-400",
                        ring: "ring-rose-500/30",
                      },
                    };
                    const c = colorMap[provider.color];
                    return (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`relative text-left rounded-2xl p-6 border-2 transition-all duration-300 ${c.border} ${c.bg} ${
                          isSelected ? `ring-4 ${c.ring}` : "hover:border-zinc-600"
                        }`}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className={`w-6 h-6 rounded-full ${c.dot} flex items-center justify-center`}>
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        <h5
                          className="text-2xl text-white mb-1"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          {provider.name}
                        </h5>
                        <p className={`text-xs ${c.text} font-semibold mb-4`}>
                          {provider.model}
                        </p>

                        {/* Pros */}
                        <div className="space-y-2 mb-4">
                          {provider.pros.map((pro, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-xs text-zinc-300">{pro}</span>
                            </div>
                          ))}
                        </div>

                        {/* Cons */}
                        <div className="space-y-2 mb-4">
                          {provider.cons.map((con, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-xs text-zinc-400">{con}</span>
                            </div>
                          ))}
                        </div>

                        {/* Cost */}
                        <div className="bg-black/30 rounded-lg px-3 py-2 mb-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-zinc-500" />
                            <span className="text-xs text-zinc-400">{provider.costNote}</span>
                          </div>
                        </div>

                        {/* Key format */}
                        <div className="bg-black/30 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Key className="w-3 h-3 text-zinc-500" />
                            <span className="text-xs text-zinc-500 font-mono">{provider.keyExample}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Get Your Key CTA */}
                <AnimateIn delay={0.1}>
                  <motion.div
                    key={selectedProvider}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h5 className="text-white font-semibold mb-1">
                          Get your {({ openai: "OpenAI", openrouter: "OpenRouter", qwen: "Qwen", gemini: "Google Gemini" } as Record<string, string>)[selectedProvider]} API key
                        </h5>
                        <p className="text-zinc-500 text-sm">
                          {({ openai: "Sign in to your OpenAI account, go to API Keys, and create a new key. Copy it.",
                            openrouter: "Create a free OpenRouter account, go to Keys, and generate a new API key. Copy it.",
                            qwen: "Sign in to Alibaba Cloud DashScope, navigate to API Keys, and create one. Copy it.",
                            gemini: "Go to Google AI Studio, click 'Get API Key', and create one. You just need a Google account. Copy it."
                          } as Record<string, string>)[selectedProvider]}
                        </p>
                      </div>
                      <a
                        href={
                          ({ openai: "https://platform.openai.com/api-keys",
                            openrouter: "https://openrouter.ai/keys",
                            qwen: "https://dashscope.console.aliyun.com/apiKey",
                            gemini: "https://aistudio.google.com/apikey"
                          } as Record<string, string>)[selectedProvider]
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Dashboard
                      </a>
                    </div>
                  </motion.div>
                </AnimateIn>
              </div>
            </AnimateIn>

            {/* ── Step 2: One-Click Rotation Script (dynamic) ── */}
            <AnimateIn delay={0.3}>
              <div className="mt-12">
                <h4
                  className="text-3xl md:text-4xl text-white mb-2"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Step 2: Paste &
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                    {" "}Rotate
                  </span>
                </h4>
                <p className="text-zinc-500 text-sm mb-6 max-w-xl">
                  One command. Your key goes in, the bot restarts, and you're live on your own account.
                </p>
              </div>
              <motion.div
                key={selectedProvider + "-script"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden"
              >
                <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-zinc-500 ml-3 font-mono">rotate-key.sh</span>
                  </div>
                  <button
                    onClick={() => {
                      const envVar = { openai: "OPENAI_API_KEY", openrouter: "OPENROUTER_API_KEY", qwen: "QWEN_API_KEY", gemini: "GEMINI_API_KEY" }[selectedProvider] || "API_KEY";
                      const prefix = { openai: "sk-", openrouter: "sk-or-", qwen: "sk-", gemini: "AIza" }[selectedProvider] || "sk-";
                      const providerName = { openai: "OpenAI", openrouter: "OpenRouter", qwen: "Qwen", gemini: "Google Gemini" }[selectedProvider] || selectedProvider;
                      navigator.clipboard.writeText(
                        `#!/bin/bash\n# Tiger Bot API Key Rotation Script\n# Provider: ${providerName}\n# Usage: ./rotate-key.sh YOUR_NEW_API_KEY\n\nNEW_KEY="$1"\n\nif [ -z "$NEW_KEY" ]; then\n  echo "Usage: ./rotate-key.sh YOUR_API_KEY"\n  exit 1\nfi\n\n# Validate key format\nif [[ ! "$NEW_KEY" =~ ^${prefix} ]]; then\n  echo "Error: Key must start with ${prefix}"\n  exit 1\nfi\n\n# Set provider\nsed -i "s/^LLM_PROVIDER=.*/LLM_PROVIDER=${selectedProvider}/" .env\n\n# Update API key\nsed -i "s/^${envVar}=.*/${envVar}=$NEW_KEY/" .env\n\n# Restart the bot\ndocker compose restart tiger-bot\n\necho "Key rotated successfully."\necho "Provider: ${providerName}"\necho "Tiger Bot is now running on YOUR key."`
                      );
                    }}
                    className="flex items-center gap-2 text-xs text-zinc-500 hover:text-orange-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                  <div className="text-zinc-600">#!/bin/bash</div>
                  <div className="text-zinc-600">
                    # Tiger Bot API Key Rotation Script
                  </div>
                  <div className="text-zinc-600">
                    # Provider:{" "}
                    <span className={({ openai: "text-emerald-400", openrouter: "text-purple-400", qwen: "text-sky-400", gemini: "text-rose-400" } as Record<string, string>)[selectedProvider]}>
                      {({ openai: "OpenAI", openrouter: "OpenRouter", qwen: "Qwen", gemini: "Google Gemini" } as Record<string, string>)[selectedProvider]}
                    </span>
                  </div>
                  <div className="text-zinc-600"># Usage: ./rotate-key.sh YOUR_NEW_API_KEY</div>
                  <div className="mt-3">
                    <span className="text-amber-400">NEW_KEY</span>
                    <span className="text-zinc-500">=</span>
                    <span className="text-emerald-400">"$1"</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-purple-400">if</span>
                    <span className="text-zinc-400"> [ -z </span>
                    <span className="text-emerald-400">"$NEW_KEY"</span>
                    <span className="text-zinc-400"> ]; </span>
                    <span className="text-purple-400">then</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-zinc-400">echo </span>
                    <span className="text-emerald-400">"Usage: ./rotate-key.sh YOUR_API_KEY"</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">exit</span>
                    <span className="text-orange-400"> 1</span>
                  </div>
                  <div>
                    <span className="text-purple-400">fi</span>
                  </div>
                  <div className="mt-3 text-zinc-600"># Validate key format</div>
                  <div>
                    <span className="text-purple-400">if</span>
                    <span className="text-zinc-400"> [[ ! </span>
                    <span className="text-emerald-400">"$NEW_KEY"</span>
                    <span className="text-zinc-400">
                      {" "}=~ ^{({ openai: "sk-", openrouter: "sk-or-", qwen: "sk-", gemini: "AIza" } as Record<string, string>)[selectedProvider]} ]];{" "}
                    </span>
                    <span className="text-purple-400">then</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-zinc-400">echo </span>
                    <span className="text-emerald-400">
                      "Error: Key must start with {({ openai: "sk-", openrouter: "sk-or-", qwen: "sk-", gemini: "AIza" } as Record<string, string>)[selectedProvider]}"
                    </span>
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">exit</span>
                    <span className="text-orange-400"> 1</span>
                  </div>
                  <div>
                    <span className="text-purple-400">fi</span>
                  </div>
                  <div className="mt-3 text-zinc-600"># Set provider</div>
                  <div>
                    <span className="text-zinc-400">sed -i </span>
                    <span className="text-emerald-400">
                      "s/^LLM_PROVIDER=.*/LLM_PROVIDER=
                      <span className={({ openai: "text-emerald-300", openrouter: "text-purple-300", qwen: "text-sky-300", gemini: "text-rose-300" } as Record<string, string>)[selectedProvider]}>
                        {selectedProvider}
                      </span>
                      /"
                    </span>
                    <span className="text-zinc-400"> .env</span>
                  </div>
                  <div className="mt-3 text-zinc-600"># Update API key</div>
                  <div>
                    <span className="text-zinc-400">sed -i </span>
                    <span className="text-emerald-400">
                      "s/^
                      {({ openai: "OPENAI_API_KEY", openrouter: "OPENROUTER_API_KEY", qwen: "QWEN_API_KEY", gemini: "GEMINI_API_KEY" } as Record<string, string>)[selectedProvider]}
                      =.*/{({ openai: "OPENAI_API_KEY", openrouter: "OPENROUTER_API_KEY", qwen: "QWEN_API_KEY", gemini: "GEMINI_API_KEY" } as Record<string, string>)[selectedProvider]}
                      =$NEW_KEY/"
                    </span>
                    <span className="text-zinc-400"> .env</span>
                  </div>
                  <div className="mt-3 text-zinc-600"># Restart the bot</div>
                  <div>
                    <span className="text-zinc-400">docker compose restart </span>
                    <span className="text-orange-400">tiger-bot</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-zinc-400">echo </span>
                    <span className="text-emerald-400">"Key rotated successfully."</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">echo </span>
                    <span className="text-emerald-400">
                      "Provider: {({ openai: "OpenAI", openrouter: "OpenRouter", qwen: "Qwen", gemini: "Google Gemini" } as Record<string, string>)[selectedProvider]}"
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">echo </span>
                    <span className="text-emerald-400">"Tiger Bot is now running on YOUR key."</span>
                  </div>
                </div>
              </motion.div>
            </AnimateIn>

            {/* Security Architecture */}
            <AnimateIn delay={0.4}>
              <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: Lock,
                    title: "Key Isolation",
                    detail: "Each customer's key is stored in their own encrypted .env file. No shared key storage.",
                  },
                  {
                    icon: Timer,
                    title: "Auto-Expiry",
                    detail: "Our provisioned key auto-expires at 72 hours. No manual revocation needed.",
                  },
                  {
                    icon: RefreshCw,
                    title: "Zero Downtime",
                    detail: "Hot-swap rotation. The bot restarts in under 5 seconds with the new key.",
                  },
                  {
                    icon: Shield,
                    title: "Validation",
                    detail: "Key format is validated before rotation. Invalid keys are rejected instantly.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-orange-400 mb-3" />
                    <h5 className="text-sm font-semibold text-white mb-1">{item.title}</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>

            {/* Reminder Schedule */}
            <AnimateIn delay={0.5}>
              <div className="mt-12 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-8">
                <h4
                  className="text-2xl text-white mb-6"
                  style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                >
                  Automated Reminder Schedule
                </h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      time: "24 Hours",
                      channel: "Email",
                      message: "Your Tiger Bot is running great! Reminder: you have 48 hours left on the free trial. Here's how to add your own API key.",
                      icon: Mail,
                    },
                    {
                      time: "48 Hours",
                      channel: "Email + SMS",
                      message: "24 hours left. Your bot has already generated [X] leads. Don't let it go dark — rotate your key now.",
                      icon: Phone,
                    },
                    {
                      time: "64 Hours",
                      channel: "SMS (Urgent)",
                      message: "8 hours left on your free trial. One click to keep your Tiger Bot running. Tap here to rotate your key now.",
                      icon: AlertTriangle,
                    },
                  ].map((reminder, i) => (
                    <div
                      key={i}
                      className="bg-black/30 rounded-xl p-5 border border-zinc-800/50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <reminder.icon className={`w-4 h-4 ${
                          i === 2 ? "text-red-400" : i === 1 ? "text-amber-400" : "text-zinc-400"
                        }`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          i === 2 ? "text-red-400" : i === 1 ? "text-amber-400" : "text-zinc-400"
                        }`}>
                          {reminder.time} — {reminder.channel}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">
                        {reminder.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>

            {/* What Happens If They Don't Rotate */}
            <AnimateIn delay={0.6}>
              <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-white font-semibold mb-1">What happens if they don't rotate?</h5>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      At hour 72, our provisioned key auto-expires. The bot enters a
                      <span className="text-amber-400 font-semibold"> paused state</span> — it
                      does not delete any data, lose any leads, or break any sequences. It simply
                      waits. The moment the customer enters their own key, the bot resumes
                      exactly where it left off. No data loss. No re-onboarding.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* ── Onboarding Complete Button ── */}
            <AnimateIn delay={0.7}>
              <div className="mt-16 text-center">
                {!onboardingComplete ? (
                  <div>
                    <p className="text-zinc-500 text-sm mb-4">
                      Once you have chosen your provider and rotated your key, you are ready.
                    </p>
                    <button
                      onClick={handleOnboardingComplete}
                      className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-lg px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                    >
                      <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                      <span
                        className="tracking-wider"
                        style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.25rem' }}
                      >
                        Onboarding Complete — See What Happens Next
                      </span>
                      <ArrowDown className="w-5 h-5 animate-bounce" />
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8"
                  >
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4
                        className="text-3xl text-emerald-400"
                        style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                      >
                        Onboarding Complete
                      </h4>
                    </div>
                    <p className="text-zinc-400 text-sm">
                      Your Tiger Bot is configured and running. Scrolling you to the Aftercare &amp; Retention system...
                    </p>
                  </motion.div>
                )}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ═══════ FLYWHEEL SECTION ═══════ */}
      <section id="flywheel" className="relative">
        {/* Flywheel Hero */}
        <div className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <img src={FLYWHEEL_IMG} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-transparent to-[#09090b]" />
          <div className="container relative">
            <AnimateIn>
              <SectionLabel text="Part 2" />
              <SectionHeading>
                The Gig Economy
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Flywheel
                </span>
              </SectionHeading>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                Unlike a funnel that ends at the sale, the flywheel uses the momentum of
                every converted customer to fuel further growth. The customer is at the center.
                Each stage feeds the next. The wheel never stops.
              </p>
            </AnimateIn>
          </div>
        </div>

        {/* Interactive Flywheel Stages */}
        <div className="bg-[#09090b] py-16 md:py-24">
          <div className="container">
            {/* Stage Tabs */}
            <AnimateIn>
              <div className="flex flex-wrap gap-2 mb-12">
                {flywheelStages.map((stage, i) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(i)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      activeStage === i
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/20"
                        : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    <stage.icon className="w-4 h-4" />
                    <span>{stage.name}</span>
                    {activeStage === i && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </AnimateIn>

            {/* Active Stage Detail */}
            <motion.div
              key={activeStage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Left: Info */}
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${flywheelStages[activeStage].color} flex items-center justify-center`}>
                    {(() => {
                      const Icon = flywheelStages[activeStage].icon;
                      return <Icon className="w-8 h-8 text-black" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Stage {flywheelStages[activeStage].id} of 5
                    </span>
                    <h3
                      className="text-4xl md:text-5xl text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {flywheelStages[activeStage].name}
                    </h3>
                  </div>
                </div>

                <p className="text-lg text-orange-400 font-medium mb-6 italic">
                  "{flywheelStages[activeStage].question}"
                </p>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-3">
                    Tiger Bot Actions
                  </h4>
                  {flywheelStages[activeStage].actions.map((action, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-orange-400" />
                      </div>
                      <span className="text-zinc-300">{action}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="flex flex-col justify-center">
                <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-6">
                  Key Metrics
                </h4>
                <div className="space-y-4">
                  {flywheelStages[activeStage].metrics.map((metric, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold">{metric}</span>
                        <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${flywheelStages[activeStage].color} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${60 + i * 15}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Flow Arrow */}
                <div className="mt-8 flex items-center gap-3 text-zinc-600">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-zinc-700" />
                  <span className="text-xs font-mono uppercase tracking-wider">
                    {activeStage < 4
                      ? `Next → ${flywheelStages[activeStage + 1].name}`
                      : "Loops back → Discovery"}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-zinc-700" />
                </div>
              </div>
            </motion.div>

            {/* Stage Progress Dots */}
            <div className="flex items-center justify-center gap-3 mt-16">
              {flywheelStages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStage(i)}
                  className={`transition-all duration-300 rounded-full ${
                    activeStage === i
                      ? "w-10 h-3 bg-orange-500"
                      : "w-3 h-3 bg-zinc-700 hover:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FLYWHEEL EXPLAINER (DEEP DIVE) ═══════ */}
      <FlywheelExplainer />

      {/* ═══════ LEAD GENERATION SECTION ═══════ */}
      <section id="leadgen" className="relative">
        <div className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <img src={LEADGEN_IMG} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/80 to-[#09090b]/40" />
          <div className="container relative">
            <AnimateIn>
              <SectionLabel text="Part 3" />
              <SectionHeading>
                Lead Generation
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Engine
                </span>
              </SectionHeading>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                The engine that powers the flywheel. Automated social listening,
                intelligent engagement, and direct outreach — running 24/7 while you
                focus on what you do best.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-3 gap-6 mt-16">
              {[
                {
                  icon: Search,
                  title: "Social Listening",
                  description:
                    "Continuously scans LinkedIn for keywords from your ICP — pain points, goals, competitor names. When a keyword is found, the person is flagged as a potential lead.",
                },
                {
                  icon: MessageSquare,
                  title: "Intelligent Engagement",
                  description:
                    "Navigates to your ICP's online watering holes. Views profiles, likes relevant posts, and makes intelligent, value-adding comments to generate inbound interest.",
                },
                {
                  icon: Send,
                  title: "Direct Outreach",
                  description:
                    "Automated SMS and email outreach with a non-salesy gift — an ebook, guide, or tool. A personal touch that dramatically increases close rates.",
                },
              ].map((item, i) => (
                <AnimateIn key={i} delay={i * 0.1}>
                  <div className="bg-[#09090b]/80 backdrop-blur border border-zinc-800 rounded-xl p-8 hover:border-orange-500/30 transition-all duration-300 h-full">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-6">
                      <item.icon className="w-7 h-7 text-black" />
                    </div>
                    <h4
                      className="text-2xl text-white mb-3"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-zinc-400 leading-relaxed text-sm">
                      {item.description}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Required Tooling */}
            <AnimateIn delay={0.3}>
              <div className="mt-16 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Globe, label: "Web Scraper / Browser Automation", detail: "OpenClaw infrastructure" },
                  { icon: Shield, label: "Digital Wallet", detail: "Platform interactions" },
                  { icon: Users, label: "CRM Integration", detail: "Prospect data management" },
                ].map((tool, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4"
                  >
                    <tool.icon className="w-5 h-5 text-orange-400 shrink-0" />
                    <div>
                      <div className="text-sm font-semibold text-white">{tool.label}</div>
                      <div className="text-xs text-zinc-500">{tool.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ═══════ NURTURE CAMPAIGNS SECTION ═══════ */}
      <section id="nurture" className="relative">
        <div className="bg-orange-500 py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src={NURTURE_IMG} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="container relative">
            <AnimateIn>
              <SectionLabel text="Part 4" />
              <SectionHeading>
                <span className="text-black">Nurture</span>
                <br />
                <span className="text-black/60">Campaigns</span>
              </SectionHeading>
              <p className="mt-4 text-lg text-black/70 max-w-2xl leading-relaxed">
                Template sequences the Tiger Bot customizes using the owner's brand voice
                and the prospect's pain points. Every gig economy worker gets a campaign
                tailored to their world.
              </p>
            </AnimateIn>
          </div>
        </div>

        <DiagonalDivider />

        <div className="bg-[#09090b] py-16 md:py-24">
          <div className="container">
            {/* Campaign Tabs */}
            <AnimateIn>
              <div className="flex flex-wrap gap-2 mb-10">
                {nurtureCampaigns.map((campaign, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCampaign(i)}
                    className={`px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      activeCampaign === i
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-lg shadow-orange-500/20"
                        : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    {campaign.title}
                  </button>
                ))}
              </div>
            </AnimateIn>

            {/* Active Campaign */}
            <motion.div
              key={activeCampaign}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <h3
                      className="text-3xl md:text-4xl text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {nurtureCampaigns[activeCampaign].title}
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      {nurtureCampaigns[activeCampaign].subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
                      {nurtureCampaigns[activeCampaign].steps.length} touches over 30 days
                    </span>
                    <span className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
                      {new Set(nurtureCampaigns[activeCampaign].steps.map(s => s.principle)).size} principles used
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" />

                <div className="space-y-4">
                  {nurtureCampaigns[activeCampaign].steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 md:gap-6"
                    >
                      {/* Timeline dot */}
                      <div className="hidden md:flex w-12 shrink-0 items-center justify-center relative z-10">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            step.channel === "SMS"
                              ? "bg-amber-400"
                              : "bg-orange-500"
                          }`}
                        />
                      </div>

                      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              step.channel === "SMS"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            }`}
                          >
                            {step.channel === "SMS" ? (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> SMS
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-zinc-600 font-mono">
                            {step.day}
                          </span>
                          {step.principle && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 ml-auto">
                              {step.principle}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">
                          {step.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ SALES STATISTICS — WHY FOLLOW-UP MATTERS ═══════ */}
      <section id="why-follow-up" className="relative">
        <div className="bg-zinc-950 py-20 md:py-28">
          <div className="container">
            <AnimateIn>
              <SectionLabel text="The Data" />
              <SectionHeading>
                Why Most
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Salespeople Fail
                </span>
              </SectionHeading>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                The numbers don't lie. Most people quit before the sale ever happens.
                Tiger Bot never quits. It follows up relentlessly through contacts 5
                through 12 — where 80% of all sales are made.
              </p>
            </AnimateIn>

            <div className="grid lg:grid-cols-2 gap-12 mt-16">
              {/* Left: The Problem */}
              <AnimateIn>
                <div>
                  <h3
                    className="text-2xl md:text-3xl text-white mb-8"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    The Problem: Salespeople Quit Too Early
                  </h3>
                  <div className="space-y-4">
                    {salesStats.map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                      >
                        <div className="flex items-center gap-4 mb-2">
                          <span
                            className="text-3xl md:text-4xl font-bold text-zinc-400"
                            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                          >
                            {stat.pct}%
                          </span>
                          <span className="text-sm text-zinc-500 leading-tight">
                            {stat.label}
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${stat.color}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${stat.pct}%` }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                    <div className="mt-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                      <p className="text-zinc-500 text-sm">
                        <span className="text-orange-400 font-semibold">Translation:</span>{" "}
                        95% of salespeople give up before reaching the zone where 80% of
                        sales actually happen.
                      </p>
                    </div>
                  </div>
                </div>
              </AnimateIn>

              {/* Right: Where Sales Actually Happen */}
              <AnimateIn delay={0.2}>
                <div>
                  <h3
                    className="text-2xl md:text-3xl text-white mb-8"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    Where Sales Actually Happen
                  </h3>
                  <div className="space-y-4">
                    {conversionStats.map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border transition-all ${
                          stat.pct === 80
                            ? "bg-orange-500/10 border-orange-500/30"
                            : "bg-zinc-900/50 border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span
                              className={`text-3xl md:text-4xl font-bold ${
                                stat.pct === 80 ? "text-orange-400" : "text-zinc-500"
                              }`}
                              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                            >
                              {stat.pct}%
                            </span>
                            <span className={`text-sm leading-tight ${
                              stat.pct === 80 ? "text-orange-300" : "text-zinc-500"
                            }`}>
                              {stat.label}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(stat.contacts, 5) }).map((_, j) => (
                              <div
                                key={j}
                                className={`w-2 h-6 rounded-full ${
                                  stat.pct === 80 ? "bg-orange-500" : "bg-zinc-700"
                                }`}
                              />
                            ))}
                            {stat.contacts > 5 && (
                              <span className="text-xs text-orange-400 self-center ml-1">+{stat.contacts - 5}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* Tiger Bot Advantage Callout */}
            <AnimateIn delay={0.3}>
              <div className="mt-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3
                      className="text-3xl md:text-4xl text-black mb-2"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      Tiger Bot Never Quits at Contact #2
                    </h3>
                    <p className="text-black/70 leading-relaxed">
                      While 48% of salespeople never follow up at all, Tiger Bot executes
                      a minimum 12-touch nurture sequence across email, SMS, and social
                      media. It operates in the zone where 80% of sales are made —
                      automatically, relentlessly, and without human fatigue.
                    </p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ═══════ 10 PSYCHOLOGICAL PRINCIPLES ═══════ */}
      <section id="principles" className="relative">
        <div className="bg-[#09090b] py-20 md:py-28">
          <div className="container">
            <AnimateIn>
              <SectionLabel text="The Science" />
              <SectionHeading>
                10 Principles of
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  Persuasion
                </span>
              </SectionHeading>
              <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
                Every nurture sequence Tiger Bot sends is engineered around these
                proven psychological principles. This is not random outreach — it is
                a science-backed system designed to influence and convert.
              </p>
            </AnimateIn>

            {/* Principle Grid Selector */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {psychPrinciples.map((p, i) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePrinciple(i)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all duration-300 ${
                      activePrinciple === i
                        ? "bg-gradient-to-b from-orange-500/20 to-orange-500/5 border border-orange-500/40 shadow-lg shadow-orange-500/10"
                        : "bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      activePrinciple === i ? "text-orange-400" : "text-zinc-600"
                    }`} />
                    <span className={`text-xs font-semibold leading-tight ${
                      activePrinciple === i ? "text-orange-300" : "text-zinc-500"
                    }`}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Principle Detail */}
            <motion.div
              key={activePrinciple}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 grid md:grid-cols-2 gap-6"
            >
              {/* Left: The Principle */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    {(() => {
                      const Icon = psychPrinciples[activePrinciple].icon;
                      return <Icon className="w-6 h-6 text-orange-400" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-xs text-zinc-600 font-mono">
                      Principle {psychPrinciples[activePrinciple].id}/10
                    </span>
                    <h3
                      className="text-2xl md:text-3xl text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {psychPrinciples[activePrinciple].name}
                    </h3>
                  </div>
                </div>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  {psychPrinciples[activePrinciple].description}
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider block mb-2">
                    Example
                  </span>
                  <p className="text-zinc-300 text-sm italic">
                    {psychPrinciples[activePrinciple].example}
                  </p>
                </div>
              </div>

              {/* Right: How Tiger Bot Uses It */}
              <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <h4
                    className="text-xl text-white"
                    style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                  >
                    How Tiger Bot Applies This
                  </h4>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {psychPrinciples[activePrinciple].botApplication}
                </p>
                <div className="mt-6 flex items-center gap-2 text-orange-400 text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  <span>Built into every nurture sequence automatically</span>
                </div>
              </div>
            </motion.div>

            {/* Principle Navigation Dots */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {psychPrinciples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePrinciple(i)}
                  className={`transition-all duration-300 rounded-full ${
                    activePrinciple === i
                      ? "w-8 h-3 bg-orange-500"
                      : "w-3 h-3 bg-zinc-700 hover:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ AFTERCARE & RETENTION ═══════ */}
      <section id="aftercare" className="relative py-24 md:py-32 bg-[#09090b]">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/30 via-transparent to-transparent" />
        <div className="container relative">
          {/* Section Header */}
          <AnimateIn>
            <SectionLabel text="Part 6" />
            <SectionHeading>
              Aftercare &
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                Retention
              </span>
            </SectionHeading>
            <p className="mt-6 text-lg text-zinc-400 max-w-2xl leading-relaxed">
              The sale is not the finish line — it is the starting line. Tiger Bot's aftercare
              system turns every converted customer into a referral engine, a repeat buyer,
              and a brand advocate. This is where the flywheel accelerates.
            </p>
          </AnimateIn>

          {/* The 3 Pillars */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Retention Campaigns",
                subtitle: "Keep them engaged",
                color: "from-rose-500 to-pink-500",
                description: "Automated check-ins, satisfaction surveys, and value-add content that keeps your brand top of mind. The bot never forgets a customer.",
                steps: [
                  { timing: "Day 1", action: "Welcome & onboarding confirmation", channel: "Email + SMS" },
                  { timing: "Day 3", action: "'How's it going?' check-in with helpful tips", channel: "SMS" },
                  { timing: "Day 7", action: "Satisfaction survey (NPS score)", channel: "Email" },
                  { timing: "Day 14", action: "Exclusive insider content or early access", channel: "Email" },
                  { timing: "Day 30", action: "Monthly value report — what they've gained", channel: "Email" },
                  { timing: "Day 60", action: "Personal milestone celebration", channel: "SMS" },
                  { timing: "Day 90", action: "Quarterly review & optimization suggestions", channel: "Email + Call" },
                ],
              },
              {
                icon: Megaphone,
                title: "Referral Campaigns",
                subtitle: "Turn customers into recruiters",
                color: "from-orange-500 to-amber-500",
                description: "Every happy customer knows 5-10 people who need the same solution. Tiger Bot activates that network with incentivized, automated referral sequences.",
                steps: [
                  { timing: "Day 7", action: "Soft ask: 'Know anyone who could use this?'", channel: "SMS" },
                  { timing: "Day 14", action: "Referral link with tracking + incentive offer", channel: "Email" },
                  { timing: "Day 21", action: "Social proof: 'X people joined through referrals'", channel: "Email" },
                  { timing: "Day 30", action: "Referral leaderboard update + bonus tier", channel: "Email" },
                  { timing: "Day 45", action: "'Your friend [Name] just signed up!' notification", channel: "SMS" },
                  { timing: "Day 60", action: "Double referral bonus weekend event", channel: "Email + SMS" },
                  { timing: "Ongoing", action: "Automated thank-you for every successful referral", channel: "SMS" },
                ],
              },
              {
                icon: Rocket,
                title: "Upsell Sequences",
                subtitle: "Grow their investment",
                color: "from-violet-500 to-purple-500",
                description: "Intelligent upsell timing based on usage patterns, satisfaction scores, and engagement signals. Never pushy — always positioned as the next logical step.",
                steps: [
                  { timing: "Day 14", action: "Feature teaser: 'Did you know you can also...'", channel: "Email" },
                  { timing: "Day 21", action: "Case study: customer who upgraded and results", channel: "Email" },
                  { timing: "Day 30", action: "Limited-time upgrade offer (Anchoring)", channel: "Email + SMS" },
                  { timing: "Day 45", action: "Usage report showing what they're missing", channel: "Email" },
                  { timing: "Day 60", action: "Exclusive upgrade path — loyalty pricing", channel: "Email" },
                  { timing: "Day 75", action: "Peer comparison: 'Most users at your level upgrade'", channel: "Email" },
                  { timing: "Day 90", action: "Annual plan offer with significant savings", channel: "Email + Call" },
                ],
              },
            ].map((pillar, idx) => (
              <AnimateIn key={pillar.title} delay={idx * 0.15}>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden h-full flex flex-col">
                  {/* Pillar Header */}
                  <div className={`bg-gradient-to-r ${pillar.color} p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                      <pillar.icon className="w-6 h-6 text-white" />
                      <span className="text-xs font-bold text-white/70 uppercase tracking-widest">
                        {pillar.subtitle}
                      </span>
                    </div>
                    <h4
                      className="text-3xl text-white"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      {pillar.title}
                    </h4>
                  </div>

                  {/* Description */}
                  <div className="p-6 border-b border-zinc-800">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Timeline Steps */}
                  <div className="p-6 flex-1">
                    <div className="space-y-4">
                      {pillar.steps.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          {/* Timeline dot & line */}
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${pillar.color} shrink-0 mt-1.5`} />
                            {i < pillar.steps.length - 1 && (
                              <div className="w-px flex-1 bg-zinc-800 mt-1" />
                            )}
                          </div>
                          {/* Content */}
                          <div className="pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-orange-400">
                                {step.timing}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">
                                {step.channel}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-300">{step.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Flywheel Completion Callout */}
          <AnimateIn delay={0.5}>
            <div className="mt-20 relative">
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-orange-500/10 border border-orange-500/20 rounded-2xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h4
                      className="text-4xl md:text-5xl text-white mb-4"
                      style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                    >
                      The Wheel
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                        {" "}Never Stops
                      </span>
                    </h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Every retained customer feeds the flywheel. Their referrals become new
                      leads. Their upgrades fund better tools. Their success stories become
                      social proof for the next prospect. This is not a pipeline — it is a
                      perpetual motion machine.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Repeat, label: "Avg. Retention", value: "87%", sub: "after 90 days" },
                      { icon: Users, label: "Referral Rate", value: "3.2x", sub: "per customer" },
                      { icon: ArrowUpRight, label: "Upsell Conv.", value: "34%", sub: "by day 60" },
                      { icon: Sparkles, label: "LTV Increase", value: "+240%", sub: "vs. one-time" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-black/30 rounded-xl p-4 border border-zinc-800"
                      >
                        <stat.icon className="w-5 h-5 text-orange-400 mb-2" />
                        <div
                          className="text-2xl text-white"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          {stat.value}
                        </div>
                        <div className="text-xs text-zinc-500">{stat.label}</div>
                        <div className="text-[10px] text-zinc-600">{stat.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AnimateIn>

          {/* Bronze / Silver / Gold Tier Preview */}
          <AnimateIn delay={0.6}>
            <div className="mt-20">
              <h4
                className="text-3xl md:text-4xl text-white mb-2 text-center"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Aftercare by
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">
                  {" "}Tier
                </span>
              </h4>
              <p className="text-zinc-500 text-sm text-center mb-10 max-w-lg mx-auto">
                Higher tiers get more aggressive aftercare. Every tier gets the basics.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    tier: "Bronze",
                    color: "from-amber-700 to-amber-900",
                    borderColor: "border-amber-700/30",
                    icon: Award,
                    features: [
                      "Automated welcome sequence",
                      "7-day check-in SMS",
                      "Monthly satisfaction survey",
                      "Basic referral link",
                      "Quarterly review email",
                    ],
                    missing: [
                      "Upsell sequences",
                      "Referral leaderboard",
                      "Loyalty pricing",
                    ],
                  },
                  {
                    tier: "Silver",
                    color: "from-zinc-400 to-zinc-500",
                    borderColor: "border-zinc-400/30",
                    icon: Crown,
                    popular: true,
                    features: [
                      "Everything in Bronze",
                      "Full referral campaign (7 touches)",
                      "Referral leaderboard + bonuses",
                      "Upsell sequence (5 touches)",
                      "Usage reports & peer comparison",
                      "Milestone celebrations",
                    ],
                    missing: [
                      "Annual plan offers",
                      "Dedicated review calls",
                    ],
                  },
                  {
                    tier: "Gold",
                    color: "from-amber-400 to-yellow-500",
                    borderColor: "border-amber-400/30",
                    icon: Sparkles,
                    features: [
                      "Everything in Silver",
                      "Full upsell sequence (7 touches)",
                      "Annual plan offers with loyalty pricing",
                      "Quarterly review calls (scheduled)",
                      "Double referral bonus events",
                      "VIP early access to new features",
                      "Priority support escalation",
                    ],
                    missing: [],
                  },
                ].map((plan, idx) => (
                  <AnimateIn key={plan.tier} delay={0.1 * idx}>
                    <div
                      className={`relative bg-zinc-900/50 border rounded-2xl overflow-hidden h-full flex flex-col ${
                        plan.popular ? "border-orange-500/50 ring-2 ring-orange-500/20" : plan.borderColor
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-center py-1">
                          <span className="text-xs font-bold text-black uppercase tracking-widest">
                            Most Popular
                          </span>
                        </div>
                      )}
                      <div className={`p-6 ${plan.popular ? "pt-10" : ""}`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                          <plan.icon className="w-5 h-5 text-white" />
                        </div>
                        <h5
                          className="text-3xl text-white mb-4"
                          style={{ fontFamily: '"Bebas Neue", sans-serif' }}
                        >
                          {plan.tier}
                        </h5>
                        <div className="space-y-3">
                          {plan.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-sm text-zinc-300">{f}</span>
                            </div>
                          ))}
                          {plan.missing.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 opacity-40">
                              <Lock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                              <span className="text-sm text-zinc-600 line-through">{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AnimateIn>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ═══════ REGIONAL LEAD SOURCE INTELLIGENCE ═══════ */}
      <RegionalIntelligence />

      {/* ═══════ PROVISIONING PIPELINE ═══════ */}
      <ProvisioningPipeline />

      {/* ═══════ WEBHOOK SETUP GUIDE ═══════ */}
      <WebhookSetupGuide />

      {/* ═══════ CTA — GET YOUR TIGER BOT ═══════ */}
      <section className="relative py-32 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-orange-950/20 to-[#09090b]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/15 rounded-full blur-[80px]" />

        <div className="container relative z-10">
          <AnimateIn>
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-8">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-semibold tracking-wider uppercase text-orange-400">
                  Ready to Hunt
                </span>
              </div>

              <h2
                className="text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-none"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Get Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600">
                  Tiger Bot
                </span>
              </h2>

              <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto mb-4" style={{ fontFamily: '"Outfit", sans-serif' }}>
                Your bot is ready. Complete the 3 setup steps above and it starts hunting leads for you immediately.
              </p>

              <p className="text-zinc-600 text-sm mb-10">
                API Key → Interview 1 → Interview 2 → Done
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#key-rotation"
                  className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-lg px-10 py-5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"
                >
                  <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
                  <span
                    className="tracking-wider"
                    style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.25rem' }}
                  >
                    Start Setup Now
                  </span>
                  <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="https://stan.store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-8 py-5 rounded-xl transition-all duration-300 hover:border-orange-500/40 hover:text-orange-400"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Buy a Tiger Bot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 mt-14">
                {[
                  { icon: Shield, label: "Secure & Private" },
                  { icon: Globe, label: "Works Worldwide" },
                  { icon: Clock, label: "24/7 Autonomous" },
                  { icon: Users, label: "Built for Gig Workers" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-500">
                    <item.icon className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-zinc-800 bg-[#09090b]">
        <div className="container py-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span
                className="text-2xl tracking-wider text-white"
                style={{ fontFamily: '"Bebas Neue", sans-serif' }}
              >
                Tiger Bot
              </span>
            </div>
            <p className="text-sm text-zinc-600">
              Built on OpenClaw Infrastructure. Designed for the gig economy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
