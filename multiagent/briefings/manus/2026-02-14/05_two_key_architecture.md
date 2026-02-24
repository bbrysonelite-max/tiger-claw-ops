# Two-Key Architecture: Implementation Plan

**Date:** February 14, 2026  
**For:** Brent Bryson  
**Purpose:** Step-by-step implementation guide for the fallback + primary key system  
**Prerequisite:** The Tiger Claw brain spec (tiger_bot_brain_spec.md)

---

## 1. The Problem This Solves

On a live Zoom call, the bot's API key died. The bot went silent. Nine customers watched it happen. This architecture makes that structurally impossible by ensuring every bot always has a working LLM connection — even when the customer's key fails.

---

## 2. Architecture Overview

Every Tiger Claw maintains two LLM connections simultaneously. They are not interchangeable — each has a specific role, a specific cost profile, and specific rules for when it activates.

| Property | Fallback Key (Yours) | Primary Key (Customer's) |
|----------|---------------------|-------------------------|
| **Provider** | Google Gemini 2.0 Flash | Customer's choice |
| **Who pays** | You (Brent) | The customer |
| **Cost** | $0.10/1M input, $0.40/1M output [1] | Varies by provider |
| **Stored where** | Environment variable on the gateway server | Encrypted in customer's config.json |
| **When active** | Onboarding (states WELCOME through KEY_PROMPT), error recovery, key rotation prompts | ACTIVE state — all prospecting, nurturing, daily operations |
| **Can be removed** | Never. Hardwired. | Customer can change it anytime via /setkey |
| **Rate limits** | 15 RPM free tier, 1000 RPM paid [1] | Depends on customer's plan |

### The Switching Rule

At any given moment, exactly one key is "active" for operational LLM calls. The other is dormant. The switching logic is simple and deterministic:

```
IF customer.state IN [IDLE, WELCOME, INTERVIEW_1, INTERVIEW_2, KEY_PROMPT]:
    USE fallback_key
    
ELIF customer.state == ACTIVE:
    TRY primary_key
    ON ERROR → SWITCH TO fallback_key, SET state = ERROR_RECOVERY
    
ELIF customer.state == ERROR_RECOVERY:
    USE fallback_key (for error messages only)
    WAIT FOR /setkey → VALIDATE → SET state = ACTIVE
```

There is no ambiguity. There is no "smart routing." The state determines the key. Period.

---

## 3. File Structure

The two-key system lives in three files. Not five, not ten. Three.

```
gateway/
  src/
    keys/
      key-manager.ts      ← The brain. All key logic lives here.
      key-encryption.ts   ← AES-256 encrypt/decrypt for customer keys.
      key-validator.ts    ← Test calls to each provider's API.
```

These three files interact with the existing gateway code at `api.botcraftwrks.ai`. They do not replace anything — they add a layer between the bot's message handler and the LLM API calls.

---

## 4. File 1: key-encryption.ts

This file handles one thing: encrypting and decrypting customer API keys at rest. Customer keys must never be stored in plaintext. If the database or filesystem is compromised, the keys must be unreadable.

### How It Works

The encryption uses AES-256-GCM, which is the current industry standard for symmetric encryption [2]. It requires one secret — an encryption key — stored as an environment variable on the gateway server. This secret never leaves the server.

### The Environment Variable

Add this to the gateway's `.env` file:

```
KEY_ENCRYPTION_SECRET=<a random 64-character hex string>
```

To generate this string, run this command once on the server:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as the value. This only needs to be done once. If this value is lost, all stored customer keys become unreadable and customers will need to re-enter their keys via `/setkey`.

### The Code

```typescript
// key-encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getSecret(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error('KEY_ENCRYPTION_SECRET must be a 64-char hex string');
  }
  return Buffer.from(secret, 'hex');
}

export function encryptKey(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecret(), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:tag:ciphertext (all hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decryptKey(stored: string): string {
  const parts = stored.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted key format');
  }
  
  const [ivHex, tagHex, ciphertext] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getSecret(), iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### What This Gives You

Two functions: `encryptKey("sk-abc123...")` returns a string like `a1b2c3...:d4e5f6...:789abc...` that is safe to store in a database or JSON file. `decryptKey("a1b2c3...:d4e5f6...:789abc...")` returns the original key. Without the `KEY_ENCRYPTION_SECRET`, the stored string is meaningless.

### Test

```typescript
const encrypted = encryptKey("sk-test-key-12345");
console.log(encrypted);  // Random hex string, different every time
const decrypted = decryptKey(encrypted);
console.log(decrypted);  // "sk-test-key-12345"
console.log(decrypted === "sk-test-key-12345");  // true
```

---

## 5. File 2: key-validator.ts

This file handles one thing: testing whether an API key actually works before the bot trusts it. When a customer types `/setkey sk-abc123...`, this file makes a minimal test call to the provider's API. If the call succeeds, the key is valid. If it fails, the customer gets a specific error message.

### Provider Detection

The key prefix tells us which provider to test against. This is deterministic — no guessing.

| Key Prefix | Provider | API Endpoint for Test |
|------------|----------|----------------------|
| `sk-` (but not `sk-or-` or `sk-ant-`) | OpenAI | `https://api.openai.com/v1/chat/completions` |
| `sk-or-` | OpenRouter | `https://openrouter.ai/api/v1/chat/completions` |
| `sk-ant-` | Anthropic | `https://api.anthropic.com/v1/messages` |
| `AIza` | Google Gemini | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |

### The Code

```typescript
// key-validator.ts

export interface ValidationResult {
  valid: boolean;
  provider: string;
  model: string;
  error?: string;
  errorType?: 'invalid_key' | 'no_credits' | 'rate_limit' | 'server_error' | 'unknown';
}

export function detectProvider(key: string): { provider: string; model: string } | null {
  if (key.startsWith('sk-ant-')) {
    return { provider: 'anthropic', model: 'claude-3-haiku-20240307' };
  }
  if (key.startsWith('sk-or-')) {
    return { provider: 'openrouter', model: 'meta-llama/llama-3-8b-instruct' };
  }
  if (key.startsWith('sk-')) {
    return { provider: 'openai', model: 'gpt-4o-mini' };
  }
  if (key.startsWith('AIza')) {
    return { provider: 'gemini', model: 'gemini-2.0-flash' };
  }
  return null;
}

export async function validateKey(key: string): Promise<ValidationResult> {
  const detected = detectProvider(key);
  
  if (!detected) {
    return {
      valid: false,
      provider: 'unknown',
      model: 'unknown',
      error: "I don't recognize that key format. Keys usually start with 'sk-' (OpenAI), 'sk-or-' (OpenRouter), 'sk-ant-' (Anthropic), or 'AIza' (Google Gemini).",
      errorType: 'invalid_key'
    };
  }
  
  try {
    if (detected.provider === 'openai') {
      return await testOpenAI(key, detected);
    }
    if (detected.provider === 'openrouter') {
      return await testOpenRouter(key, detected);
    }
    if (detected.provider === 'anthropic') {
      return await testAnthropic(key, detected);
    }
    if (detected.provider === 'gemini') {
      return await testGemini(key, detected);
    }
  } catch (err: any) {
    return {
      valid: false,
      provider: detected.provider,
      model: detected.model,
      error: `Could not reach ${detected.provider}. Network error: ${err.message}`,
      errorType: 'server_error'
    };
  }
  
  return { valid: false, provider: 'unknown', model: 'unknown', error: 'Unexpected error', errorType: 'unknown' };
}

async function testOpenAI(key: string, detected: { provider: string; model: string }): Promise<ValidationResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 3
    })
  });
  
  if (response.ok) {
    return { valid: true, provider: detected.provider, model: detected.model };
  }
  
  return mapHttpError(response.status, detected, 'OpenAI', 'https://platform.openai.com/api-keys');
}

async function testOpenRouter(key: string, detected: { provider: string; model: string }): Promise<ValidationResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3-8b-instruct',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 3
    })
  });
  
  if (response.ok) {
    return { valid: true, provider: detected.provider, model: detected.model };
  }
  
  return mapHttpError(response.status, detected, 'OpenRouter', 'https://openrouter.ai/keys');
}

async function testAnthropic(key: string, detected: { provider: string; model: string }): Promise<ValidationResult> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3,
      messages: [{ role: 'user', content: 'Say OK' }]
    })
  });
  
  if (response.ok) {
    return { valid: true, provider: detected.provider, model: detected.model };
  }
  
  return mapHttpError(response.status, detected, 'Anthropic', 'https://console.anthropic.com/settings/keys');
}

async function testGemini(key: string, detected: { provider: string; model: string }): Promise<ValidationResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Say OK' }] }],
      generationConfig: { maxOutputTokens: 3 }
    })
  });
  
  if (response.ok) {
    return { valid: true, provider: detected.provider, model: detected.model };
  }
  
  return mapHttpError(response.status, detected, 'Google Gemini', 'https://aistudio.google.com/apikey');
}

function mapHttpError(
  status: number,
  detected: { provider: string; model: string },
  providerName: string,
  dashboardUrl: string
): ValidationResult {
  if (status === 401 || status === 403) {
    return {
      valid: false,
      provider: detected.provider,
      model: detected.model,
      error: `${providerName} rejected that key — it might be expired or revoked. Check your dashboard: ${dashboardUrl}`,
      errorType: 'invalid_key'
    };
  }
  if (status === 402) {
    return {
      valid: false,
      provider: detected.provider,
      model: detected.model,
      error: `Your ${providerName} account has no credits. Add funds at ${dashboardUrl}`,
      errorType: 'no_credits'
    };
  }
  if (status === 429) {
    return {
      valid: false,
      provider: detected.provider,
      model: detected.model,
      error: `${providerName} rate limit hit during validation. The key might be valid — try again in a minute.`,
      errorType: 'rate_limit'
    };
  }
  return {
    valid: false,
    provider: detected.provider,
    model: detected.model,
    error: `${providerName} returned an error (HTTP ${status}). This might be temporary. Try again in a few minutes.`,
    errorType: 'server_error'
  };
}
```

### Cost of Validation

Each validation call uses approximately 10 tokens (the "Say OK" prompt plus the response). At OpenAI's GPT-4o-mini pricing, that is $0.000001 per validation. At Gemini Flash pricing, it is $0.000001. Effectively free.

### Test

```typescript
// Valid key test
const result = await validateKey("sk-real-openai-key-here");
console.log(result);
// { valid: true, provider: 'openai', model: 'gpt-4o-mini' }

// Invalid key test
const result2 = await validateKey("sk-expired-garbage-key");
console.log(result2);
// { valid: false, provider: 'openai', model: 'gpt-4o-mini', 
//   error: 'OpenAI rejected that key...', errorType: 'invalid_key' }

// Unknown format test
const result3 = await validateKey("random-string-not-a-key");
console.log(result3);
// { valid: false, provider: 'unknown', model: 'unknown',
//   error: "I don't recognize that key format..." }
```

---

## 6. File 3: key-manager.ts

This is the brain. It ties encryption and validation together and provides the interface that the rest of the gateway uses. Every LLM call in the entire system goes through this file.

### The Code

```typescript
// key-manager.ts
import { encryptKey, decryptKey } from './key-encryption';
import { validateKey, detectProvider, ValidationResult } from './key-validator';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface KeyConfig {
  primary: {
    provider: string;
    model: string;
    key_encrypted: string | null;
    validated_at: string | null;
    last_error: string | null;
    last_error_at: string | null;
    consecutive_failures: number;
  };
  fallback: {
    provider: 'gemini';
    model: 'gemini-2.0-flash';
    status: 'active' | 'dormant';
  };
  trial: {
    started_at: string;
    expires_at: string;
    reminders_sent: number[];  // hours at which reminders were sent
    expired: boolean;
  };
}

export type CustomerState = 
  | 'IDLE' 
  | 'WELCOME' 
  | 'INTERVIEW_1' 
  | 'INTERVIEW_2' 
  | 'KEY_PROMPT' 
  | 'KEY_PENDING'
  | 'ACTIVE' 
  | 'ERROR_RECOVERY';

// States where the fallback key is used
const FALLBACK_STATES: CustomerState[] = [
  'IDLE', 'WELCOME', 'INTERVIEW_1', 'INTERVIEW_2', 
  'KEY_PROMPT', 'KEY_PENDING', 'ERROR_RECOVERY'
];

// ------------------------------------------------------------------
// Core Functions
// ------------------------------------------------------------------

/**
 * Returns the API key and provider to use for a given customer.
 * This is the ONLY function the rest of the system calls to get a key.
 */
export function getActiveKey(
  state: CustomerState, 
  keyConfig: KeyConfig
): { key: string; provider: string; model: string; source: 'fallback' | 'primary' } {
  
  // Fallback states always use the Gemini key
  if (FALLBACK_STATES.includes(state)) {
    return {
      key: getFallbackKey(),
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      source: 'fallback'
    };
  }
  
  // ACTIVE state uses the primary key
  if (state === 'ACTIVE' && keyConfig.primary.key_encrypted) {
    return {
      key: decryptKey(keyConfig.primary.key_encrypted),
      provider: keyConfig.primary.provider,
      model: keyConfig.primary.model,
      source: 'primary'
    };
  }
  
  // If ACTIVE but no primary key (shouldn't happen, but safety net)
  return {
    key: getFallbackKey(),
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    source: 'fallback'
  };
}

/**
 * Gets the fallback Gemini key from environment.
 * This key is set once on the server and never changes.
 */
function getFallbackKey(): string {
  const key = process.env.FALLBACK_GEMINI_KEY;
  if (!key) {
    throw new Error(
      'FALLBACK_GEMINI_KEY not set in environment. ' +
      'This is the hardwired Gemini key that must always be present.'
    );
  }
  return key;
}

/**
 * Handles the /setkey command. Validates, encrypts, and stores the key.
 * Returns a result the bot can send directly to the customer.
 */
export async function handleSetKey(
  rawKey: string
): Promise<{ 
  success: boolean; 
  message: string; 
  keyConfig?: Partial<KeyConfig['primary']> 
}> {
  // Clean the input
  const key = rawKey.trim();
  
  if (key.length < 10) {
    return {
      success: false,
      message: "That doesn't look like a complete API key. Keys are usually 40+ characters long. Check that you copied the full key."
    };
  }
  
  // Validate with the provider
  const result: ValidationResult = await validateKey(key);
  
  if (!result.valid) {
    return {
      success: false,
      message: result.error || 'Key validation failed.'
    };
  }
  
  // Encrypt and prepare for storage
  const encrypted = encryptKey(key);
  
  return {
    success: true,
    message: `Your ${result.provider.charAt(0).toUpperCase() + result.provider.slice(1)} key is verified and active. I'm switching to your brain now — no interruption, no downtime. You're all set.`,
    keyConfig: {
      provider: result.provider,
      model: result.model,
      key_encrypted: encrypted,
      validated_at: new Date().toISOString(),
      last_error: null,
      last_error_at: null,
      consecutive_failures: 0
    }
  };
}

/**
 * Handles an LLM call failure on the primary key.
 * Returns the error message for the customer and updated key config.
 */
export function handlePrimaryKeyError(
  httpStatus: number,
  keyConfig: KeyConfig
): {
  customerMessage: string;
  shouldRetry: boolean;
  retryAfterSeconds: number;
  newState: CustomerState;
  updatedConfig: Partial<KeyConfig['primary']>;
} {
  const provider = keyConfig.primary.provider;
  const failures = keyConfig.primary.consecutive_failures + 1;
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  
  const dashboardUrls: Record<string, string> = {
    openai: 'https://platform.openai.com/api-keys',
    openrouter: 'https://openrouter.ai/keys',
    anthropic: 'https://console.anthropic.com/settings/keys',
    gemini: 'https://aistudio.google.com/apikey'
  };
  
  const dashboardUrl = dashboardUrls[provider] || '';
  
  // Permanent errors — key is broken, need /setkey
  if (httpStatus === 401 || httpStatus === 403) {
    return {
      customerMessage: `Your AI key stopped working — it might be expired or revoked. Check your ${providerName} dashboard (${dashboardUrl}) and type /setkey with a new key. I'll be right here waiting.`,
      shouldRetry: false,
      retryAfterSeconds: 0,
      newState: 'ERROR_RECOVERY',
      updatedConfig: {
        last_error: `HTTP ${httpStatus} - Invalid/expired key`,
        last_error_at: new Date().toISOString(),
        consecutive_failures: failures
      }
    };
  }
  
  if (httpStatus === 402) {
    return {
      customerMessage: `Your ${providerName} account ran out of credits. Add more at ${dashboardUrl} and I'll pick right back up. Or type /setkey with a key from a different provider.`,
      shouldRetry: false,
      retryAfterSeconds: 0,
      newState: 'ERROR_RECOVERY',
      updatedConfig: {
        last_error: `HTTP 402 - No credits`,
        last_error_at: new Date().toISOString(),
        consecutive_failures: failures
      }
    };
  }
  
  // Temporary errors — retry with exponential backoff
  if (httpStatus === 429) {
    const retrySeconds = Math.min(60 * Math.pow(2, failures - 1), 3600); // 1m, 2m, 4m... max 1h
    return {
      customerMessage: failures === 1
        ? `Your AI key hit its usage limit for this period. This usually resets within an hour. I'll try again automatically in ${Math.round(retrySeconds / 60)} minutes.`
        : '', // Don't spam the customer on subsequent retries
      shouldRetry: true,
      retryAfterSeconds: retrySeconds,
      newState: failures >= 5 ? 'ERROR_RECOVERY' : 'ACTIVE', // Stay ACTIVE for first few retries
      updatedConfig: {
        last_error: `HTTP 429 - Rate limited (attempt ${failures})`,
        last_error_at: new Date().toISOString(),
        consecutive_failures: failures
      }
    };
  }
  
  if (httpStatus >= 500) {
    const retrySeconds = Math.min(300 * Math.pow(2, failures - 1), 3600); // 5m, 10m, 20m... max 1h
    return {
      customerMessage: failures === 1
        ? `Your AI provider (${providerName}) is having technical issues right now. This isn't on your end. I'll keep trying every ${Math.round(retrySeconds / 60)} minutes and let you know when it's back.`
        : '',
      shouldRetry: true,
      retryAfterSeconds: retrySeconds,
      newState: failures >= 3 ? 'ERROR_RECOVERY' : 'ACTIVE',
      updatedConfig: {
        last_error: `HTTP ${httpStatus} - Server error (attempt ${failures})`,
        last_error_at: new Date().toISOString(),
        consecutive_failures: failures
      }
    };
  }
  
  // Unknown error
  return {
    customerMessage: `Something unexpected happened with your AI connection (error ${httpStatus}). I'll try again in 5 minutes. If this keeps happening, type /setkey with a fresh key.`,
    shouldRetry: true,
    retryAfterSeconds: 300,
    newState: 'ERROR_RECOVERY',
    updatedConfig: {
      last_error: `HTTP ${httpStatus} - Unknown error`,
      last_error_at: new Date().toISOString(),
      consecutive_failures: failures
    }
  };
}

/**
 * Creates the initial KeyConfig for a new customer.
 * Called once at bot provisioning time.
 */
export function createInitialKeyConfig(): KeyConfig {
  const now = new Date();
  const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
  
  return {
    primary: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      key_encrypted: null,  // No customer key yet — using fallback
      validated_at: null,
      last_error: null,
      last_error_at: null,
      consecutive_failures: 0
    },
    fallback: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      status: 'active'  // Active during onboarding
    },
    trial: {
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      reminders_sent: [],
      expired: false
    }
  };
}

/**
 * Checks if a trial reminder should be sent.
 * Called periodically (e.g., every hour) by a cron job.
 * Returns the reminder message if one is due, or null.
 */
export function checkTrialReminder(keyConfig: KeyConfig): {
  shouldSend: boolean;
  message: string;
  hour: number;
} | null {
  // If customer already has their own key, no reminders needed
  if (keyConfig.primary.key_encrypted && keyConfig.primary.provider !== 'gemini') {
    return null;
  }
  
  const now = new Date();
  const started = new Date(keyConfig.trial.started_at);
  const hoursElapsed = (now.getTime() - started.getTime()) / (1000 * 60 * 60);
  const alreadySent = keyConfig.trial.reminders_sent;
  
  // 48-hour reminder
  if (hoursElapsed >= 48 && !alreadySent.includes(48)) {
    return {
      shouldSend: true,
      hour: 48,
      message: "Hey — just a heads up. Your free trial brain has 24 hours left. Want me to help you set up your own key? It takes about 2 minutes. Just say 'yes' or type /setkey followed by your key when you're ready."
    };
  }
  
  // 64-hour reminder
  if (hoursElapsed >= 64 && !alreadySent.includes(64)) {
    return {
      shouldSend: true,
      hour: 64,
      message: "8 hours left on your starter brain. After that, I'll need your own key to keep prospecting and nurturing for you. It takes 2 minutes — want to do it now? Just type /setkey followed by your API key."
    };
  }
  
  // 72-hour expiry
  if (hoursElapsed >= 72 && !alreadySent.includes(72)) {
    return {
      shouldSend: true,
      hour: 72,
      message: "Your starter brain trial has ended. I need your own API key to continue working for you. Type /setkey YOUR_KEY and I'll be back in action instantly. I'll be right here waiting."
    };
  }
  
  return null;
}

/**
 * Checks if the trial has expired and the customer hasn't rotated.
 * Returns true if the bot should enter KEY_PENDING state.
 */
export function isTrialExpired(keyConfig: KeyConfig): boolean {
  if (keyConfig.primary.key_encrypted && keyConfig.primary.provider !== 'gemini') {
    return false; // Customer has their own key
  }
  
  const now = new Date();
  const expires = new Date(keyConfig.trial.expires_at);
  return now > expires;
}
```

---

## 7. How It Integrates with the Gateway

The gateway at `api.botcraftwrks.ai` currently receives Telegram messages and routes them to bot handlers. The two-key system integrates at the point where the handler needs to make an LLM call. Here is the integration pattern:

### Before (Current — No Key Management)

```typescript
// Current: hardcoded API call, single key, no error handling
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
  body: JSON.stringify({ model: 'gpt-4o', messages: [...] })
});
```

### After (With Two-Key Architecture)

```typescript
import { getActiveKey, handlePrimaryKeyError } from './keys/key-manager';

// Get the right key for this customer's current state
const { key, provider, model, source } = getActiveKey(customer.state, customer.keyConfig);

// Build the request for the detected provider
const response = await callLLM(provider, model, key, messages);

// If it failed and we were using the primary key, handle the error
if (!response.ok && source === 'primary') {
  const error = handlePrimaryKeyError(response.status, customer.keyConfig);
  
  // Update customer state
  customer.state = error.newState;
  Object.assign(customer.keyConfig.primary, error.updatedConfig);
  await saveCustomer(customer);
  
  // Tell the customer what happened (if there's a message)
  if (error.customerMessage) {
    await sendTelegramMessage(customer.chat_id, error.customerMessage);
  }
  
  // Schedule retry if appropriate
  if (error.shouldRetry) {
    scheduleRetry(customer.id, error.retryAfterSeconds);
  }
  
  // Fall back to Gemini for this specific call
  const fallback = getActiveKey('ERROR_RECOVERY', customer.keyConfig);
  // Use fallback.key for error-related responses only
}
```

### The callLLM Helper

Since different providers have different API formats, a thin wrapper normalizes them:

```typescript
async function callLLM(
  provider: string, 
  model: string, 
  key: string, 
  messages: Array<{ role: string; content: string }>
): Promise<{ ok: boolean; status: number; text: string }> {
  
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        generationConfig: { maxOutputTokens: 1024 }
      })
    });
    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      text: res.ok ? data.candidates?.[0]?.content?.parts?.[0]?.text || '' : ''
    };
  }
  
  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content
      })
    });
    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      text: res.ok ? data.content?.[0]?.text || '' : ''
    };
  }
  
  // OpenAI-compatible (OpenAI, OpenRouter)
  const baseUrl = provider === 'openrouter' 
    ? 'https://openrouter.ai/api/v1' 
    : 'https://api.openai.com/v1';
    
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: 1024 })
  });
  const data = await res.json();
  return {
    ok: res.ok,
    status: res.status,
    text: res.ok ? data.choices?.[0]?.message?.content || '' : ''
  };
}
```

---

## 8. The /setkey Command Handler

This is the Telegram command handler that the customer interacts with. It goes in the gateway's message router.

```typescript
// In the message handler, when message starts with /setkey
async function handleSetKeyCommand(customer: Customer, messageText: string) {
  const parts = messageText.split(/\s+/);
  
  if (parts.length < 2) {
    await sendTelegramMessage(customer.chat_id, 
      "To set your key, type:\n\n/setkey YOUR_API_KEY_HERE\n\nPaste your full API key after /setkey with a space between them."
    );
    return;
  }
  
  const rawKey = parts[1];
  
  // Show "validating..." feedback
  await sendTelegramMessage(customer.chat_id, "Checking your key...");
  
  const result = await handleSetKey(rawKey);
  
  if (result.success && result.keyConfig) {
    // Update customer config
    Object.assign(customer.keyConfig.primary, result.keyConfig);
    customer.keyConfig.fallback.status = 'dormant';
    customer.state = 'ACTIVE';
    await saveCustomer(customer);
    
    await sendTelegramMessage(customer.chat_id, result.message);
  } else {
    await sendTelegramMessage(customer.chat_id, result.message);
  }
}
```

---

## 9. The Timer Cron Job

A simple cron job runs every hour, checks all customers in trial, and sends reminders when due.

```typescript
// trial-timer.ts — run via cron every hour
import { checkTrialReminder, isTrialExpired } from './keys/key-manager';

async function runTrialChecks() {
  const customers = await getAllCustomersInTrial();
  
  for (const customer of customers) {
    // Check for reminders
    const reminder = checkTrialReminder(customer.keyConfig);
    if (reminder?.shouldSend) {
      await sendTelegramMessage(customer.chat_id, reminder.message);
      customer.keyConfig.trial.reminders_sent.push(reminder.hour);
      await saveCustomer(customer);
    }
    
    // Check for expiry
    if (isTrialExpired(customer.keyConfig) && customer.state === 'ACTIVE') {
      customer.state = 'KEY_PENDING';
      customer.keyConfig.trial.expired = true;
      await saveCustomer(customer);
      // The 72-hour message is sent by checkTrialReminder above
    }
  }
}
```

Schedule this with a simple cron entry on the gateway server:

```bash
# Run trial checks every hour at minute 0
0 * * * * cd /path/to/gateway && node --loader ts-node/esm trial-timer.ts
```

---

## 10. Environment Variables

Two new environment variables must be added to the gateway server's `.env` file. These are the only two secrets the system needs.

| Variable | Value | How to Generate |
|----------|-------|-----------------|
| `FALLBACK_GEMINI_KEY` | Your Google Gemini API key | Go to https://aistudio.google.com/apikey, click "Create API Key," copy it |
| `KEY_ENCRYPTION_SECRET` | 64-character hex string | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Add them to the `.env` file on the gateway server:

```
FALLBACK_GEMINI_KEY=AIzaSyC...your-gemini-key-here
KEY_ENCRYPTION_SECRET=a1b2c3d4e5f6...64-hex-characters
```

---

## 11. Customer Data Schema

Each customer's `config.json` gains a `keyConfig` field. For the 9 existing customers, this needs to be backfilled with the initial config.

### Migration Script for Existing 9 Customers

```typescript
// migrate-existing-customers.ts
import { createInitialKeyConfig } from './keys/key-manager';

async function migrateExistingCustomers() {
  const customers = await getAllCustomers();
  
  for (const customer of customers) {
    if (!customer.keyConfig) {
      customer.keyConfig = createInitialKeyConfig();
      customer.state = 'IDLE';  // Reset to IDLE so they can re-onboard
      await saveCustomer(customer);
      console.log(`Migrated ${customer.id}: state=IDLE, trial starts now`);
    }
  }
}
```

This script sets all 9 existing customers to `IDLE` state with a fresh 72-hour trial. When they tap `/start` again, they will go through the full onboarding interview. Their previous (non-functional) interaction is wiped clean.

---

## 12. Implementation Sequence

This is the build order. Do not skip steps. Each step has a test.

| Step | What to Build | Files Touched | Test | Time |
|------|--------------|---------------|------|------|
| 1 | Generate `KEY_ENCRYPTION_SECRET`, get Gemini API key | `.env` | Verify both values are set | 10 min |
| 2 | Create `key-encryption.ts` | `gateway/src/keys/key-encryption.ts` | Encrypt a test string, decrypt it, verify match | 30 min |
| 3 | Create `key-validator.ts` | `gateway/src/keys/key-validator.ts` | Validate your own Gemini key (should pass), validate "garbage" (should fail with clear message) | 1 hour |
| 4 | Create `key-manager.ts` | `gateway/src/keys/key-manager.ts` | Call `getActiveKey('IDLE', config)` — should return fallback. Call `getActiveKey('ACTIVE', config)` — should return primary. | 1 hour |
| 5 | Integrate `getActiveKey` into message handler | Gateway message handler | Send a message to Tiger_Brent_bot. Verify it uses the fallback key. | 1 hour |
| 6 | Add `/setkey` command handler | Gateway message handler | Type `/setkey` with your Gemini key on Tiger_Brent_bot. Verify it validates, encrypts, stores, and confirms. | 1 hour |
| 7 | Add error recovery wrapper | Gateway LLM call wrapper | Set a deliberately bad key. Send a message. Verify the bot catches the error, switches to fallback, and sends a clear message. | 1 hour |
| 8 | Add trial timer cron | `trial-timer.ts`, crontab | Set trial expiry to 5 minutes from now. Verify reminders fire and bot pauses at expiry. | 1 hour |
| 9 | Run migration for 9 customers | `migrate-existing-customers.ts` | Verify all 9 customers have `keyConfig` and `state=IDLE`. | 30 min |

**Total estimated time: 8 hours of focused development.**

---

## 13. Cost Model

This table shows your monthly cost exposure at different customer counts, assuming worst case (all customers use the full 72-hour trial and trigger one error recovery per month).

| Customers | Onboarding Cost | Monthly Error Recovery | Total Monthly Cost |
|-----------|----------------|----------------------|-------------------|
| 9 (current) | $0.018 | $0.009 | $0.03 |
| 50 | $0.10 | $0.05 | $0.15 |
| 100 | $0.20 | $0.10 | $0.30 |
| 500 | $1.00 | $0.50 | $1.50 |
| 1,000 | $2.00 | $1.00 | $3.00 |

At 1,000 customers, your total fallback key cost is $3.00 per month. The Gemini free tier (15 RPM) can handle up to approximately 200 concurrent onboardings before you need the paid tier. At the paid tier ($0.10/1M tokens), the math above applies.

---

## 14. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Customer key leaked from database | AES-256-GCM encryption at rest. Without `KEY_ENCRYPTION_SECRET`, stored keys are unreadable. |
| `KEY_ENCRYPTION_SECRET` leaked | Rotate the secret, re-encrypt all customer keys. Customers do not need to re-enter keys — the migration script handles it. |
| Fallback key leaked | Revoke it at Google AI Studio, generate a new one, update `.env`. All bots switch to the new key on next restart. No customer impact. |
| Customer sends key in Telegram chat | Telegram messages are encrypted in transit. The key is encrypted before storage. The raw key is never logged. |
| Brute force on `/setkey` | Rate limit the `/setkey` command to 3 attempts per hour per customer. After 3 failures, require a 1-hour cooldown. |

---

## 15. What Comes After This

Once the two-key architecture is deployed and tested, the next builds are:

1. **The conversation engine** (Interview 1 and 2) — uses `getActiveKey` to get the fallback Gemini key for all onboarding conversations.
2. **The prospecting engine** — uses `getActiveKey` to get the customer's primary key for daily operations.
3. **The nurture campaign engine** — same key routing.

All of them call `getActiveKey`. All of them are protected by the error recovery wrapper. The two-key architecture is the foundation that everything else builds on.

---

## References

[1]: [Google Gemini API Pricing](https://ai.google.dev/pricing) — Gemini 2.0 Flash: $0.10/1M input tokens, $0.40/1M output tokens  
[2]: [NIST SP 800-38D: Recommendation for GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final) — AES-GCM authenticated encryption standard
