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
    return role === 'assistant' ? 'model' : 'user';
}

function buildGeminiUrl(model, apiKey) {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}

function extractGeminiText(data) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY não configurada.' });
    }

    const modelCandidates = [
        process.env.SK_MODEL,
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash'
    ].filter(Boolean);

    for (const model of modelCandidates) {
        try {
            const url = buildGeminiUrl(model, apiKey);
            console.log(`Tentando Gemini / modelo: ${model} (timeout ${REQUEST_TIMEOUT_MS}ms)...`);

            const response = await withTimeout(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: messages.map(m => ({
                        role: toGeminiRole(m.role),
                        parts: [{ text: m.content }]
                    }))
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(
                    `Gemini (${model}) falhou com status ${response.status}. ` +
                    `Detalhe: ${errorText.slice(0, 180)}. Tentando próximo modelo...`
                );
                continue;
            }

            const data = await response.json();
            const text = extractGeminiText(data);

            if (!text) {
                console.warn(`Gemini (${model}) respondeu sem texto utilizável. Tentando próximo modelo...`);
                continue;
            }

            return res.status(200).json({
                choices: [{ message: { content: text } }],
                provider: 'GEMINI',
                model
            });
        } catch (error) {
            const reason = error.name === 'AbortError'
                ? `timeout de ${REQUEST_TIMEOUT_MS}ms`
                : error.message;
            console.error(`Erro ao conectar com Gemini (${model}): ${reason}`);
        }
    }

    return res.status(500).json({ error: 'Gemini indisponível no momento.' });
}
