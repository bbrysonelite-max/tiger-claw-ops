// key-manager.ts
// The brain. All key logic lives here. Every LLM call in the system goes through getActiveKey().
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
    const retrySeconds = Math.min(60 * Math.pow(2, failures - 1), 3600);
    return {
      customerMessage: failures === 1
        ? `Your AI key hit its usage limit for this period. This usually resets within an hour. I'll try again automatically in ${Math.round(retrySeconds / 60)} minutes.`
        : '',
      shouldRetry: true,
      retryAfterSeconds: retrySeconds,
      newState: failures >= 5 ? 'ERROR_RECOVERY' : 'ACTIVE',
      updatedConfig: {
        last_error: `HTTP 429 - Rate limited (attempt ${failures})`,
        last_error_at: new Date().toISOString(),
        consecutive_failures: failures
      }
    };
  }
  
  if (httpStatus >= 500) {
    const retrySeconds = Math.min(300 * Math.pow(2, failures - 1), 3600);
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
  const expires = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  return {
    primary: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      key_encrypted: null,
      validated_at: null,
      last_error: null,
      last_error_at: null,
      consecutive_failures: 0
    },
    fallback: {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      status: 'active'
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
 * Called periodically (every hour) by a cron job.
 */
export function checkTrialReminder(keyConfig: KeyConfig): {
  shouldSend: boolean;
  message: string;
  hour: number;
} | null {
  if (keyConfig.primary.key_encrypted && keyConfig.primary.provider !== 'gemini') {
    return null;
  }
  
  const now = new Date();
  const started = new Date(keyConfig.trial.started_at);
  const hoursElapsed = (now.getTime() - started.getTime()) / (1000 * 60 * 60);
  const alreadySent = keyConfig.trial.reminders_sent;
  
  if (hoursElapsed >= 48 && !alreadySent.includes(48)) {
    return {
      shouldSend: true,
      hour: 48,
      message: "Hey — just a heads up. Your free trial brain has 24 hours left. Want me to help you set up your own key? It takes about 2 minutes. Just say 'yes' or type /setkey followed by your key when you're ready."
    };
  }
  
  if (hoursElapsed >= 64 && !alreadySent.includes(64)) {
    return {
      shouldSend: true,
      hour: 64,
      message: "8 hours left on your starter brain. After that, I'll need your own key to keep prospecting and nurturing for you. It takes 2 minutes — want to do it now? Just type /setkey followed by your API key."
    };
  }
  
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
 */
export function isTrialExpired(keyConfig: KeyConfig): boolean {
  if (keyConfig.primary.key_encrypted && keyConfig.primary.provider !== 'gemini') {
    return false;
  }
  
  const now = new Date();
  const expires = new Date(keyConfig.trial.expires_at);
  return now > expires;
}
