const fetch = require('node-fetch');

const REQUEST_TIMEOUT_MS = 5000;

function withTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => clearTimeout(timeout));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    const { messages, temperature = 0.7 } = req.body;
    const defaultModel = process.env.SK_MODEL || 'llama-3.3-70b-versatile';

    const providers = [
        {
            name: 'GROQ',
            kind: 'openai_compatible',
            url: 'https://api.groq.com/openai/v1/chat/completions',
            key: process.env.GROQ_API_KEY,
            model: defaultModel
        },
        {
            name: 'GEMINI',
            kind: 'gemini',
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            key: process.env.GEMINI_API_KEY,
            model: 'gemini-1.5-flash'
        },
        {
            name: 'HUGGINGFACE',
            kind: 'openai_compatible',
            url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
            key: process.env.HF_TOKEN,
            model: defaultModel
        }
    ];

    for (const provider of providers) {
        if (!provider.key) continue;

        try {
            console.log(`Tentando provedor: ${provider.name} (timeout ${REQUEST_TIMEOUT_MS}ms)...`);

            const options = provider.kind === 'gemini'
                ? {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages.map(m => ({
                            role: toGeminiRole(m.role),
                            parts: [{ text: m.content }]
                        }))
                    })
                }
                : {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${provider.key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: provider.model,
                        messages,
                        temperature
                    })
                };

            const response = await withTimeout(provider.url, options);

            if (!response.ok) {
                console.warn(`${provider.name} falhou com status ${response.status}. Tentando próximo...`);
                continue;
            }

            const data = await response.json();
            const text = provider.kind === 'gemini'
                ? data?.candidates?.[0]?.content?.parts?.[0]?.text
                : data?.choices?.[0]?.message?.content;

            if (!text) {
                console.warn(`${provider.name} respondeu sem texto utilizável. Tentando próximo...`);
                continue;
            }

            return res.status(200).json({
                choices: [{ message: { content: text } }],
                provider: provider.name
            });
        } catch (error) {
            const reason = error.name === 'AbortError'
                ? `timeout de ${REQUEST_TIMEOUT_MS}ms`
                : error.message;
            console.error(`Erro ao conectar com ${provider.name}: ${reason}`);
        }
    }

    return res.status(500).json({ error: 'Nenhum provedor de IA disponível no momento.' });
}
