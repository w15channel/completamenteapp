const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY não configurada no projeto da Vercel.',
      details: 'Defina OPENAI_API_KEY (recomendado). OPENAI_KEY segue aceito por compatibilidade.'
    });
  }

  const body = parseBody(req.body);
  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const prompt = typeof body.mensagem === 'string' ? body.mensagem.trim() : '';

  const messages = incomingMessages.length
    ? incomingMessages
    : prompt
      ? [{ role: 'user', content: prompt }]
      : [];

  if (!messages.length) {
    return res.status(400).json({
      error: 'Envie `messages` (array) ou `mensagem` (string) no corpo da requisição.'
    });
  }

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 280
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Erro ao consultar OpenAI.',
        details: data?.error?.message || 'Sem detalhes.'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao conectar com o modelo de linguagem.' });
  }
}
