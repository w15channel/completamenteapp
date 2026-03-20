const GROQ_OPENAI_COMPAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const XAI_OPENAI_COMPAT_URL = 'https://api.x.ai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const HUGGINGFACE_API_URL = 'https://router.huggingface.co/v1/chat/completions';

function providerConfig(hint) {
  const normalizedHint = String(hint || '').toLowerCase();
  const wantsGemini = normalizedHint.includes('gemini');
  const wantsGrok = normalizedHint.includes('grok') || normalizedHint.includes('xai');
  const wantsHuggingFace = normalizedHint.includes('huggingface') || normalizedHint.includes('hf');

  // PRIORIDADE 1: Hugging Face - Padrão para todas as funcionalidades de IA
  if (wantsHuggingFace || process.env.HUGGFACE_KEY) {
    return {
      name: 'Hugging Face',
      url: HUGGINGFACE_API_URL,
      apiKey: process.env.HUGGFACE_KEY,
      model: process.env.HF_MODEL || 'NousResearch/Hermes-3-Llama-3.1-8B:fastest',
      type: 'openai-compatible'
    };
  }

  // PRIORIDADE 2: Grok (xAI) - Backup
  if (wantsGrok || process.env.XAI_API_KEY) {
    return {
      name: 'xAI Grok',
      url: XAI_OPENAI_COMPAT_URL,
      apiKey: process.env.XAI_API_KEY,
      model: process.env.XAI_MODEL || 'grok-2-latest',
      type: 'openai-compatible'
    };
  }

  // PRIORIDADE 3: Groq - Backup rápido
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'Groq',
      url: GROQ_OPENAI_COMPAT_URL,
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      type: 'openai-compatible'
    };
  }

  // PRIORIDADE 4: Gemini - Fallback final
  if (wantsGemini || process.env.GEMINI_API_KEY) {
    return {
      name: 'Google Gemini',
      url: GEMINI_API_URL,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      type: 'gemini'
    };
  }

  // Fallback final para Gemini
  return {
    name: 'Google Gemini',
    url: GEMINI_API_URL,
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    type: 'gemini'
  };
}


function toGeminiContents(messages) {
  const normalized = Array.isArray(messages) ? messages : [];
  return normalized.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));
}

function fromGeminiToOpenAI(data) {
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') || '';
  return {
    id: data?.responseId || `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: data?.modelVersion || 'gemini',
    choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
    provider: 'gemini'
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido. Use POST.' });

  const body = req.body || {};
  const provider = providerConfig(body.provider_hint);
  if (!provider.apiKey) {
    return res.status(500).json({
      error: 'Chave da IA não configurada.',
      details: 'Defina GEMINI_API_KEY (preferencial), XAI_API_KEY (Grok) ou GROQ_API_KEY no ambiente da Vercel.'
    });
  }

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
  const messages = incomingMessages.length ? incomingMessages : prompt ? [{ role: 'user', content: prompt }] : [];

  if (!messages.length) return res.status(400).json({ error: 'Envie `messages` (array) ou `mensagem` (string) no corpo da requisição.' });

  try {
    if (provider.type === 'gemini') {
      const response = await fetch(`${provider.url}/${provider.model}:generateContent?key=${provider.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: toGeminiContents(messages),
          generationConfig: {
            temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
            maxOutputTokens: typeof body.max_tokens === 'number' ? body.max_tokens : 700
          }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: `Erro ao consultar ${provider.name}.`,
          details: data?.error?.message || 'Sem detalhes.'
        });
      }
      return res.status(200).json(fromGeminiToOpenAI(data));
    }

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 280
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: `Erro ao consultar ${provider.name}.`,
        details: data?.error?.message || 'Sem detalhes.'
      });
    }
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao conectar com a inteligência artificial.' });
  }
}
