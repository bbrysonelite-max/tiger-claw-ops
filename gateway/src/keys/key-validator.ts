// key-validator.ts
// Test calls to each LLM provider's API to verify a key works before trusting it.
// Cost per validation: ~$0.000001 (10 tokens).

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
