const fetch = require('node-fetch');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    const { messages } = req.body;

    // Lista de prioridade dos modelos (Fallback)
    const providers = [
        {
            name: 'GROQ',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            key: process.env.GROQ_API_KEY,
            model: 'llama-3.3-70b-versatile'
        },
        {
            name: 'GEMINI',
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            key: process.env.GEMINI_API_KEY,
            model: 'gemini-1.5-flash'
        },
        {
            name: 'HUGGINGFACE',
            url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            key: process.env.HF_TOKEN,
            model: 'mistral-7b'
        }
    ];

    // Tenta cada provedor em ordem
    for (const provider of providers) {
        if (!provider.key) continue; // Pula se a chave não estiver configurada

        try {
            console.log(`Tentando provedor: ${provider.name}...`);
            
            let response;
            if (provider.name === 'GEMINI') {
                // O Gemini tem um formato de JSON diferente
                response = await fetch(provider.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages.map(m => ({
                            role: m.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: m.content }]
                        }))
                    })
                });
            } else {
                // Formato padrão (Groq / OpenAI / HF)
                response = await fetch(provider.url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${provider.key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages: messages,
                        temperature: 0.7
                    })
                });
            }

            if (response.ok) {
                const data = await response.json();
                let text = "";

                // Extrai o texto dependendo do provedor
                if (provider.name === 'GEMINI') {
                    text = data.candidates[0].content.parts[0].text;
                } else {
                    text = data.choices[0].message.content;
                }

                // Se conseguimos a resposta, enviamos de volta ao site
                return res.status(200).json({
                    choices: [{ message: { content: text } }],
                    provider: provider.name // Para sabermos qual respondeu
                });

            } else {
                console.warn(`${provider.name} falhou com status ${response.status}. Tentando próximo...`);
            }
        } catch (error) {
            console.error(`Erro ao conectar com ${provider.name}:`, error.message);
        }
    }

    // Se todos falharem
    return res.status(500).json({ error: 'Nenhum provedor de IA disponível no momento.' });
}
