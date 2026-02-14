// call-llm.ts
// Thin wrapper that normalizes LLM API calls across providers.
// All providers return the same { ok, status, text } shape.

export async function callLLM(
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
