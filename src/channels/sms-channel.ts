/**
 * Tiger Claw Scout - SMS Channel via Twilio
 * For customers who don't have Telegram
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set');
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

/**
 * Send SMS message to a phone number
 */
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const result = await getClient().messages.create({
      body: message,
      from: twilioPhone,
      to: to
    });

    console.log(`[sms-channel] Sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error(`[sms-channel] Failed to send to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Handle incoming SMS webhook from Twilio
 */
export interface IncomingSMS {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
}

export function parseIncomingSMS(body: any): IncomingSMS {
  return {
    From: body.From,
    To: body.To,
    Body: body.Body,
    MessageSid: body.MessageSid
  };
}

/**
 * Generate TwiML response for SMS
 */
export function generateTwiMLResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format message for SMS (shorter than Telegram)
 * SMS has 160 char limit for single message, 1600 for concatenated
 */
export function formatForSMS(message: string, maxLength: number = 1500): string {
  // Remove markdown formatting
  let sms = message
    .replace(/\*\*/g, '')  // Bold
    .replace(/\*/g, '')     // Italic
    .replace(/`/g, '')      // Code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Links -> just text
    .replace(/#{1,6}\s/g, '')  // Headers
    .trim();

  if (sms.length > maxLength) {
    sms = sms.substring(0, maxLength - 3) + '...';
  }

  return sms;
}
