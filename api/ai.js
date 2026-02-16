const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const REQUEST_TIMEOUT_MS = 12000;

function parseAllowlist() {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function setCors(req, res) {
  const allowlist = parseAllowlist();
  const origin = (req.headers.origin || '').replace(/\/$/, '');

  if (allowlist.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return true;
  }

  if (origin && allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    return true;
  }

  return false;
}

function toGeminiContents(messages = []) {
  return messages
    .filter((item) => item && item.content)
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));
}

function readRequestBody(req) {
  if (!req || req.body == null) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function requestWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGroq({ messages, temperature, max_tokens }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY não configurada.');
  }

  const response = await requestWithTimeout(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq falhou (${response.status}): ${body}`);
  }

  const data = await response.json();
  return {
    provider: 'groq',
    choices: data.choices || [],
  };
}

async function requestGemini({ messages, temperature, max_tokens }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY não configurada.');
  }

  const response = await requestWithTimeout(
    `${GEMINI_URL}?key=${encodeURIComponent(key)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        generationConfig: {
          temperature,
          maxOutputTokens: max_tokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini falhou (${response.status}): ${body}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim() || 'Estou te ouvindo...';

  return {
    provider: 'gemini',
    choices: [{ message: { content: text } }],
  };
}

module.exports = async function handler(req, res) {
  const corsAllowed = setCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ error: 'Origem não permitida.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const body = readRequestBody(req);
  const { messages = [], temperature = 0.7, max_tokens = 300 } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages é obrigatório.' });
  }

  try {
    const data = await requestGroq({ messages, temperature, max_tokens });
    return res.status(200).json(data);
  } catch (groqError) {
    try {
      const data = await requestGemini({ messages, temperature, max_tokens });
      return res.status(200).json(data);
    } catch (geminiError) {
      return res.status(502).json({
        error: 'Falha ao consultar provedores de IA.',
        details: {
          groq: groqError.message,
          gemini: geminiError.message,
        },
      });
    }
  }
};
