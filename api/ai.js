const GROQ_OPENAI_COMPAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const XAI_OPENAI_COMPAT_URL = 'https://api.x.ai/v1/chat/completions';

function providerConfig(hint) {
  const wantsGrok = String(hint || '').toLowerCase().includes('grok') || String(hint || '').toLowerCase().includes('xai');
  if ((wantsGrok && process.env.XAI_API_KEY) || (process.env.XAI_API_KEY && !process.env.GROQ_API_KEY)) {
    return {
      name: 'xAI Grok',
      url: XAI_OPENAI_COMPAT_URL,
      apiKey: process.env.XAI_API_KEY,
      model: process.env.XAI_MODEL || 'grok-2-latest'
    };
  }
  if (process.env.GROQ_API_KEY) {
    return {
      name: 'Groq',
      url: GROQ_OPENAI_COMPAT_URL,
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
    };
  }
  return {
    name: 'xAI Grok',
    url: XAI_OPENAI_COMPAT_URL,
    apiKey: process.env.XAI_API_KEY,
    model: process.env.XAI_MODEL || 'grok-2-latest'
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
      details: 'Defina XAI_API_KEY (Grok) ou GROQ_API_KEY no ambiente da Vercel.'
    });
  }

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';
  const messages = incomingMessages.length ? incomingMessages : prompt ? [{ role: 'user', content: prompt }] : [];

  if (!messages.length) return res.status(400).json({ error: 'Envie `messages` (array) ou `mensagem` (string) no corpo da requisição.' });

  try {
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
