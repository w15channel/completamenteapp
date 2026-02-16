// URLs das APIs
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Configuração de CORS (Permite que o GitHub acesse a Vercel)
function setCors(req, res) {
  const allowlist = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [];
  const origin = req.headers.origin;

  if (allowlist.length === 0 || allowlist.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowlist.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Formata mensagens do formato padrão (OpenAI/Groq) para o formato do Gemini
function formatForGemini(messages) {
  return messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

export default async function handler(req, res) {
  // Lida com a requisição de segurança inicial dos navegadores (CORS Preflight)
  setCors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Apenas requisições POST são permitidas.' });
  }

  const { messages = [], temperature = 0.7, max_tokens = 800 } = req.body || {};

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: 'O array de mensagens está vazio ou ausente.' });
  }

  // TENTATIVA 1: GROQ (Llama 3)
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error("Chave da Groq não encontrada na Vercel.");

    // Configurando um limite de tempo (timeout) de 10 segundos
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (groqResponse.ok) {
      const data = await groqResponse.json();
      return res.status(200).json(data); // Devolve o formato padrão
    } else {
      throw new Error(`Groq retornou erro: ${groqResponse.status}`);
    }

  } catch (groqError) {
    console.warn("Falha na Groq, acionando fallback para Gemini...", groqError.message);

    // TENTATIVA 2: GEMINI (Fallback)
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) throw new Error("Chave do Gemini não encontrada na Vercel.");

      const geminiResponse = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formatForGemini(messages),
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: max_tokens,
          }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini retornou erro: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      
      // O Gemini devolve a resposta num formato diferente. Precisamos "traduzir" para o formato que seu site já entende.
      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui formular uma resposta.";
      
      return res.status(200).json({
        choices: [{ message: { content: text } }]
      });

    } catch (geminiError) {
      console.error("Ambas as APIs falharam.", geminiError.message);
      return res.status(500).json({ error: "Os servidores de IA estão indisponíveis no momento." });
    }
  }
}
