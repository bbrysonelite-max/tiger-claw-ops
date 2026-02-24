/**
 * Tiger Claw Scout - Multi-Channel Router
 * Handles SMS, Web Chat alongside Telegram
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendSMS, parseIncomingSMS, generateTwiMLResponse, formatForSMS } from './sms-channel.js';
import { getOrCreateSession, addMessage, generateWidgetScript } from './web-channel.js';

export function createChannelRouter(prisma: PrismaClient, generateAI: (prompt: string, context?: string) => Promise<string>) {
  const router = Router();

  // --- SMS WEBHOOK (Twilio) ---
  router.post('/sms/webhook', async (req, res) => {
    try {
      const incoming = parseIncomingSMS(req.body);
      console.log(`[channel-router] SMS from ${incoming.From}: ${incoming.Body}`);

      // Find tenant by phone number (stored in interview_data or a separate field)
      // For now, use a default tenant or lookup by phone
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { interview_data: { path: ['interview1', 'phone'], equals: incoming.From } },
            // Add more lookup options as needed
          ]
        }
      });

      if (!tenant) {
        // New user - could auto-provision or return a generic response
        const response = generateTwiMLResponse("Welcome! Reply START to begin.");
        res.type('text/xml').send(response);
        return;
      }

      // Generate response using AI
      const aiResponse = await generateAI(
        `SMS from customer: "${incoming.Body}". Respond briefly (under 300 chars for SMS).`,
        `Customer: ${tenant.name}`
      );

      const smsResponse = formatForSMS(aiResponse, 300);
      const response = generateTwiMLResponse(smsResponse);
      res.type('text/xml').send(response);

    } catch (error) {
      console.error('[channel-router] SMS webhook error:', error);
      res.type('text/xml').send(generateTwiMLResponse("Sorry, I'm having trouble. Try again soon."));
    }
  });

  // --- SMS SEND (outbound) ---
  router.post('/sms/send', async (req, res) => {
    try {
      const { to, message, tenantId } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: 'to and message required' });
        return;
      }

      const result = await sendSMS(to, formatForSMS(message));
      res.json(result);

    } catch (error: any) {
      console.error('[channel-router] SMS send error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- WEB CHAT ---
  router.post('/chat/web', async (req, res) => {
    try {
      const { tenantId, sessionId, message } = req.body;

      if (!tenantId || !message) {
        res.status(400).json({ error: 'tenantId and message required' });
        return;
      }

      // Get or create session
      const session = getOrCreateSession(sessionId, tenantId);
      addMessage(session.sessionId, 'user', message);

      // Get tenant context
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, interview_data: true }
      });

      // Generate AI response
      const aiResponse = await generateAI(
        `Web chat message: "${message}"`,
        tenant ? `Business: ${(tenant.interview_data as any)?.interview1?.business_type || 'unknown'}` : undefined
      );

      addMessage(session.sessionId, 'bot', aiResponse);

      res.json({
        sessionId: session.sessionId,
        response: aiResponse
      });

    } catch (error: any) {
      console.error('[channel-router] Web chat error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- WEB WIDGET SCRIPT ---
  router.get('/widget/:tenantId', async (req, res) => {
    const { tenantId } = req.params;
    const apiUrl = process.env.API_URL || 'https://api.botcraftwrks.ai';

    const script = generateWidgetScript(tenantId, apiUrl);
    res.type('application/javascript').send(script);
  });

  // --- CHANNEL STATUS ---
  router.get('/channels/status', (req, res) => {
    res.json({
      telegram: { enabled: true, status: 'active' },
      sms: {
        enabled: !!process.env.TWILIO_ACCOUNT_SID,
        phone: process.env.TWILIO_PHONE_NUMBER || 'not configured'
      },
      web: { enabled: true, status: 'active' },
      email: {
        enabled: !!process.env.BREVO_API_KEY,
        status: process.env.BREVO_API_KEY ? 'ready' : 'not configured'
      },
      line: { enabled: false, status: 'coming soon' }
    });
  });

  return router;
}
