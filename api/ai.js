const fetch = require('node-fetch');

const REQUEST_TIMEOUT_MS = 8000;
const RAW_VERCEL_AI_URL = process.env.VERCEL_AI_URL || 'https://ai-gateway.vercel.sh/v1/chat/completions';
const VERCEL_AI_URL = RAW_VERCEL_AI_URL.startsWith('http') ? RAW_VERCEL_AI_URL : `https://${RAW_VERCEL_AI_URL}`;
const DEFAULT_MODEL = process.env.VERCEL_MODEL || 'qwen/qwen3-32b';

function log(level, message, meta = {}) {
    const payload = {
        scope: 'api/ai',
        message,
        ...meta
    };

    if (level === 'error') {
        console.error(payload);
        return;
    }

    console.log(payload);
}

function withTimeout(url, options, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, {
        ...options,
        signal: controller.signal
    }).finally(() => clearTimeout(timeout));
}

function getVercelApiKey() {
    const key = (
        process.env.QWEEN_API_KEY
        || process.env.QWEN_API_KEY
        || process.env.VERCEL_AI_API_KEY
        || ''
    ).trim();

    if (!key || key === 'SUA_CHAVE_AQUI') return null;
    return key;
}

async function callProvider(apiKey, payload) {
    const body = JSON.stringify(payload);
    const doRequest = () => withTimeout(VERCEL_AI_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body
    });

    let response = await doRequest();
    if (response.status === 502 || response.status === 503 || response.status === 504) {
        log('warn', 'retrying provider request due to transient status', {
            status: response.status,
            endpoint: VERCEL_AI_URL
        });
        response = await doRequest();
    }

    return response;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Somente POST');

    log('info', 'request received', {
        method: req.method,
        endpoint: VERCEL_AI_URL
    });

    const apiKey = getVercelApiKey();
    if (!apiKey) {
        log('error', 'missing api key');
        return res.status(500).json({
            error: 'QWEEN_API_KEY não configurada.',
            hint: 'Adicione QWEEN_API_KEY (ou QWEN_API_KEY/VERCEL_AI_API_KEY) nas variáveis de ambiente do deploy.'
        });
    }

    const {
        messages = [],
        temperature = 0.7,
        model = DEFAULT_MODEL,
        max_tokens
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        log('warn', 'invalid messages payload');
        return res.status(400).json({ error: 'messages deve ser um array com pelo menos uma mensagem.' });
    }

    log('info', 'calling provider', {
        model,
        temperature,
        message_count: messages.length,
        has_max_tokens: typeof max_tokens === 'number'
    });

    try {
        const response = await callProvider(apiKey, {
            model,
            messages,
            temperature,
            ...(typeof max_tokens === 'number' ? { max_tokens } : {})
        });

        if (!response.ok) {
            const errorText = await response.text();
            log('error', 'provider returned non-ok response', {
                status: response.status,
                details: errorText.slice(0, 500)
            });

            if (response.status === 401 || response.status === 403) {
                return res.status(502).json({
                    error: 'Falha de autenticação no provedor de IA.',
                    hint: 'Verifique se a chave QWEEN_API_KEY está correta, ativa e sem espaços extras.',
                    provider_status: response.status
                });
            }

            if (response.status === 502 || response.status === 503 || response.status === 504) {
                return res.status(502).json({
                    error: 'Vercel AI Gateway indisponível no momento.',
                    hint: `Verifique o endpoint (${VERCEL_AI_URL}) e tente novamente em instantes.`,
                    details: errorText
                });
            }

            return res.status(response.status).json({
                error: 'Falha ao gerar resposta no Vercel AI Gateway.',
                details: errorText
            });
        }

        const data = await response.json();
        log('info', 'provider response ok', {
            status: response.status,
            choices: Array.isArray(data.choices) ? data.choices.length : 0
        });
        return res.status(200).json({
            choices: data.choices,
            provider: 'VERCEL_AI'
        });
    } catch (error) {
        const reason = error.name === 'AbortError'
            ? `timeout de ${REQUEST_TIMEOUT_MS}ms`
            : error.message;
        log('error', 'provider request failed', {
            error_name: error.name,
            reason
        });
        return res.status(500).json({ error: `Erro ao conectar com Vercel AI: ${reason}` });
    }
};
