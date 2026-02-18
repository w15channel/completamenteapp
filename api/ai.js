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

function toGeminiRole(role) {
    if (role === 'assistant') return 'model';
    return 'user';
}

function extractTextByProvider(providerName, data) {
    if (providerName === 'GEMINI') {
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    return data?.choices?.[0]?.message?.content || '';
}

function getModelCandidates() {
    const skCandidates = (process.env.SK_MODEL || '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    return {
        GROQ: [...new Set([...skCandidates, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'])],
        GEMINI: ['gemini-1.5-flash-latest', 'gemini-1.5-flash'],
        HUGGINGFACE: [...new Set([...skCandidates, 'meta-llama/Llama-3.1-8B-Instruct'])]
    };
}

function getProviders() {
    const models = getModelCandidates();

    return [
        {
            name: 'GROQ',
            key: process.env.GROQ_API_KEY,
            models: models.GROQ,
            request: ({ model, messages, temperature }) => ({
                url: 'https://api.groq.com/openai/v1/chat/completions',
                options: {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ model, messages, temperature })
                }
            })
        },
        {
            name: 'GEMINI',
            key: process.env.GEMINI_API_KEY,
            models: models.GEMINI,
            request: ({ model, messages }) => ({
                url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                options: {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages.map(m => ({
                            role: toGeminiRole(m.role),
                            parts: [{ text: m.content }]
                        }))
                    })
                }
            })
        },
        {
            name: 'HUGGINGFACE',
            key: process.env.HF_TOKEN,
            models: models.HUGGINGFACE,
            request: ({ model, messages, temperature }) => ({
                url: 'https://router.huggingface.co/v1/chat/completions',
                options: {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${process.env.HF_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature
                    })
                }
            })
        }
    ];
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    const { messages, temperature = 0.7 } = req.body;

    const providers = getProviders();

    for (const provider of providers) {
        if (!provider.key) continue;

        for (const model of provider.models) {
            try {
                console.log(`Tentando provedor: ${provider.name} / modelo: ${model} (timeout ${REQUEST_TIMEOUT_MS}ms)...`);

                const { url, options } = provider.request({
                    model,
                    messages,
                    temperature
                });

                const response = await withTimeout(url, options);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.warn(
                        `${provider.name} (${model}) falhou com status ${response.status}. ` +
                        `Detalhe: ${errorText.slice(0, 180)}. Tentando próximo...`
                    );
                    continue;
                }

                const data = await response.json();
                const text = extractTextByProvider(provider.name, data);

                if (!text) {
                    console.warn(`${provider.name} (${model}) respondeu sem texto utilizável. Tentando próximo...`);
                    continue;
                }

                return res.status(200).json({
                    choices: [{ message: { content: text } }],
                    provider: provider.name,
                    model
                });
            } catch (error) {
                const reason = error.name === 'AbortError'
                    ? `timeout de ${REQUEST_TIMEOUT_MS}ms`
                    : error.message;
                console.error(`Erro ao conectar com ${provider.name} (${model}): ${reason}`);
            }
        }
    }

    return res.status(500).json({ error: 'Nenhum provedor de IA disponível no momento.' });
}
