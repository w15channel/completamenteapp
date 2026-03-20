export default async function handler(req, res) {
  // 1. Segurança: Aceita apenas requisições POST vindas do seu frontend (app.js)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // 2. Chave Segura: Puxa a chave do Grok (xAI) armazenada nas variáveis da Vercel
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    console.error("Chave XAI_API_KEY (Grok) não encontrada nas configurações da Vercel.");
    return res.status(500).json({ error: 'Chave de API Grok não configurada no servidor.' });
  }

  try {
    // 3. Comunicação: Envia a requisição para o Grok (xAI) escondendo a chave do usuário
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || 'grok-2-latest', // Modelo Grok mais recente
        messages: req.body.messages,
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Falha na resposta do Grok (xAI):', errorData);
      throw new Error(`Erro da API Grok: ${response.status}`);
    }

    // 4. Retorno: Devolve a resposta mastigada para o seu app.js renderizar no chat
    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro crítico no servidor (api/chat.js):', error);
    return res.status(500).json({ error: 'Erro interno ao processar a resposta do Grok.' });
  }
}
