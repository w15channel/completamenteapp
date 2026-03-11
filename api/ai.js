const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_OPENAI_COMPAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const QWEN_OPENAI_COMPAT_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function providerCandidates(hint) {
  const normalizedHint = String(hint || '').toLowerCase();
  const wantsGemini = normalizedHint.includes('gemini') || normalizedHint.includes('google');
  const wantsOpenAI = normalizedHint.includes('openai') || normalizedHint.includes('gpt');
  const wantsQwen = normalizedHint.includes('qwen') || normalizedHint.includes('qween');
  const wantsGroq = normalizedHint.includes('groq');

  const configured = [
    {
      id: 'openai',
      enabled: Boolean(process.env.OPENAI_API_KEY),
      config: {
        name: 'OpenAI',
        url: OPENAI_API_URL,
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        type: 'openai-compatible'
      }
    },
    {
      id: 'gemini',
      enabled: Boolean(process.env.GEMINI_API_KEY),
      config: {
        name: 'Google Gemini',
        url: GEMINI_API_URL,
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        type: 'gemini'
      }
    },
    {
      id: 'qwen',
      enabled: Boolean(process.env.QWEEN_API_KEY || process.env.QWEN_API_KEY),
      config: {
        name: 'Qwen',
        url: QWEN_OPENAI_COMPAT_URL,
        apiKey: process.env.QWEEN_API_KEY || process.env.QWEN_API_KEY,
        model: process.env.QWEEN_MODEL || process.env.QWEN_MODEL || 'qwen-plus',
        type: 'openai-compatible'
      }
    },
    {
      id: 'groq',
      enabled: Boolean(process.env.GROQ_API_KEY),
      config: {
        name: 'Groq',
        url: GROQ_OPENAI_COMPAT_URL,
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        type: 'openai-compatible'
      }
    }
  ];

  const preferredOrder = wantsOpenAI
    ? ['openai', 'gemini', 'qwen', 'groq']
    : wantsGemini
      ? ['gemini', 'openai', 'qwen', 'groq']
      : wantsQwen
        ? ['qwen', 'openai', 'gemini', 'groq']
        : wantsGroq
          ? ['groq', 'openai', 'gemini', 'qwen']
          : ['openai', 'gemini', 'qwen', 'groq'];

  const enabledByOrder = preferredOrder
    .map((id) => configured.find((entry) => entry.id === id))
    .filter((entry) => entry?.enabled)
    .map((entry) => entry.config);

  if (enabledByOrder.length) return enabledByOrder;

  return [
    {
      name: 'Google Gemini',
      url: GEMINI_API_URL,
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      type: 'gemini'
    }
  ];
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
  const providers = providerCandidates(body.provider_hint);
  if (!providers.some((provider) => provider.apiKey)) {
    return res.status(500).json({
      error: 'Chave da IA não configurada.',
      details: 'Defina OPENAI_API_KEY, GEMINI_API_KEY, QWEEN_API_KEY (ou QWEN_API_KEY) ou GROQ_API_KEY no ambiente da Vercel.'
    });
  }

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
  const messages = incomingMessages.length ? incomingMessages : prompt ? [{ role: 'user', content: prompt }] : [];

  if (!messages.length) return res.status(400).json({ error: 'Envie `messages` (array) ou `mensagem` (string) no corpo da requisição.' });

  const providerErrors = [];

  for (const provider of providers) {
    if (!provider.apiKey) continue;
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
          providerErrors.push(`${provider.name}: ${data?.error?.message || `HTTP ${response.status}`}`);
          continue;
        }
        const normalized = fromGeminiToOpenAI(data);
        normalized.provider = provider.name;
        return res.status(200).json(normalized);
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
        providerErrors.push(`${provider.name}: ${data?.error?.message || `HTTP ${response.status}`}`);
        continue;
      }
      data.provider = provider.name;
      return res.status(200).json(data);
    } catch (error) {
      providerErrors.push(`${provider.name}: erro de conexão`);
    }
  }

  return res.status(502).json({ error: 'Falha ao conectar com a inteligência artificial.', details: providerErrors.join(' | ') || 'Sem detalhes.' });
}
