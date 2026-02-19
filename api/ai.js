const fetch = require('node-fetch');

const REQUEST_TIMEOUT_MS = 5000;
const GROQ_URL = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.SK_MODEL || 'llama-3.3-70b-versatile';

function withTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => clearTimeout(timeout));
}

function getGroqApiKey() {
    const key = (process.env.GROQ_API_KEY || process.env.GROQ_KEY || '').trim();
    if (!key || key === 'SUA_CHAVE_AQUI') return null;
    return key;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    const apiKey = getGroqApiKey();
    if (!apiKey) {
        return res.status(500).json({
            error: 'GROQ_API_KEY não configurada.',
            hint: 'Adicione GROQ_API_KEY (ou GROQ_KEY) nas variáveis de ambiente do deploy.'
        });
    }

    const {
        messages = [],
        temperature = 0.7,
        model = DEFAULT_MODEL,
        max_tokens
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages deve ser um array com pelo menos uma mensagem.' });
    }

    try {
        const response = await withTimeout(GROQ_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                ...(typeof max_tokens === 'number' ? { max_tokens } : {})
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            if (response.status === 401 || response.status === 403) {
                return res.status(502).json({
                    error: 'Falha de autenticação no provedor de IA.',
                    hint: 'Verifique se a chave GROQ_API_KEY está correta, ativa e sem espaços extras.',
                    provider_status: response.status
                });
            }

            return res.status(response.status).json({
                error: 'Falha ao gerar resposta com Groq.',
                details: errorText
            });
        }

        const data = await response.json();
        return res.status(200).json({
            choices: data.choices,
            provider: 'GROQ'
        });
    } catch (error) {
        const reason = error.name === 'AbortError'
            ? `timeout de ${REQUEST_TIMEOUT_MS}ms`
            : error.message;
        return res.status(500).json({ error: `Erro ao conectar com GROQ: ${reason}` });
    }
}
