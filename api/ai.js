const GEMINI_OPENAI_COMPAT_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

export default async function handler(req, res) {
  // 1. Configuração de CORS para permitir que o frontend converse com a API
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Se quiser mais segurança depois, troque '*' pelo domínio do seu app
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde imediatamente a requisições de pré-voo (preflight) do navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Bloqueia métodos incorretos
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 3. Validação da Chave de API
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY não configurada no projeto da Vercel.',
      details: 'Defina GEMINI_API_KEY no painel para habilitar o chat.'
    });
  }

  // 4. Captura e validação da mensagem do usuário
  const body = req.body || {};
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

  // 5. Chamada para o modelo Gemini
  try {
    const response = await fetch(GEMINI_OPENAI_COMPAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.8,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 280
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Erro ao consultar Gemini.',
        details: data?.error?.message || 'Sem detalhes.'
      });
    }

    // Retorna a resposta completa compatível com OpenAI
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao conectar com a inteligência artificial.' });
  }
}
