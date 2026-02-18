import { InferenceClient } from "@huggingface/inference";

const VERCEL_LANGUAGE_URL =
  process.env.VERCEL_LANGUAGE_API_URL || "https://api.v0.dev/v1/chat/completions";

const HUGGINGFACE_CHAT_URL =
  process.env.HF_CHAT_URL || "https://router.huggingface.co/v1/chat/completions";

const GROQ_CHAT_URL = process.env.GROQ_CHAT_URL || "https://api.groq.com/openai/v1/chat/completions";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const MESSAGE_SEQUENCE = [
  "mensagem direta",
  "mensagem com pergunta",
  "reforço da resposta",
  "outro reforço da resposta",
  "mensagem com reforço e pergunta",
  "mensagem de reforço da resposta",
  "mensagem de preocupação",
  "dinâmica de avaliação do tom da necessidade do sujeito"
];

function setCors(req, res) {
  const allowlist = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
    : [];
  const origin = req.headers.origin;

  if (allowlist.length === 0 || allowlist.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && allowlist.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getSequenceStep(messages = []) {
  const assistantReplies = messages.filter((msg) => msg.role === "assistant").length;
  return MESSAGE_SEQUENCE[assistantReplies % MESSAGE_SEQUENCE.length];
}

function buildLanguageSystemPrompt(messages = []) {
  const sequenceStep = getSequenceStep(messages);

  return [
    "Você responde em português brasileiro para apoio emocional.",
    "Use frases curtas, com no máximo 200 caracteres.",
    "Conecte a mensagem a problemas pessoais reais do usuário.",
    "Mantenha tom informal, pessoal e direto.",
    "Use segunda pessoa do singular (você).",
    "Escreva no modo infinitivo pessoal e conjugado quando possível.",
    "Siga estritamente a sequência de estilo abaixo e avance um passo por resposta.",
    `Passo atual obrigatório: ${sequenceStep}.`,
    `Sequência completa (cíclica): ${MESSAGE_SEQUENCE.join(" -> ")}.`,
    "Se fizer pergunta, manter objetiva e acolhedora.",
    "Evitar listas, emojis e explicações longas."
  ].join(" ");
}

function normalizeMessages(messages = []) {
  return messages
    .filter((msg) => msg?.role && typeof msg?.content === "string")
    .map((msg) => ({ role: msg.role, content: msg.content }));
}

function createTimeoutController(ms = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout)
  };
}

function normalizeProviderResponse(providerName, raw) {
  if (!raw?.choices?.[0]?.message?.content) {
    throw new Error(`${providerName}: resposta inválida.`);
  }

  return {
    id: raw.id || `${providerName}-${Date.now()}`,
    object: "chat.completion",
    created: raw.created || Math.floor(Date.now() / 1000),
    model: raw.model || providerName,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: raw.choices[0].message.content
        },
        finish_reason: raw.choices[0].finish_reason || "stop"
      }
    ],
    provider: providerName,
    usage: raw.usage || undefined
  };
}

async function requestOpenAICompatible({ providerName, url, apiKey, model, messages, temperature, maxTokens }) {
  const timeout = createTimeoutController();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: timeout.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`${providerName}: HTTP ${response.status} ${JSON.stringify(data)}`);
    }

    return normalizeProviderResponse(providerName, data);
  } finally {
    timeout.clear();
  }
}

async function requestGemini({ apiKey, messages, temperature, maxTokens }) {
  const timeout = createTimeoutController();
  const promptText = messages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        }),
        signal: timeout.signal
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(`gemini: HTTP ${response.status} ${JSON.stringify(data)}`);
    }

    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

    return normalizeProviderResponse("gemini", {
      model: GEMINI_MODEL,
      choices: [
        {
          message: {
            content: content || "Desculpe, não consegui concluir agora."
          }
        }
      ]
    });
  } finally {
    timeout.clear();
  }
}

async function handleLanguage(req, res, messages, temperature, maxTokens) {
  const systemPrompt = buildLanguageSystemPrompt(messages);
  const normalizedMessages = normalizeMessages(messages);
  const finalMessages = [{ role: "system", content: systemPrompt }, ...normalizedMessages];

  const attempts = [
    {
      enabled: Boolean(process.env.SK_MODEL),
      name: "sk_model",
      run: () =>
        requestOpenAICompatible({
          providerName: "sk_model",
          url: VERCEL_LANGUAGE_URL,
          apiKey: process.env.SK_MODEL,
          model: process.env.VERCEL_LANGUAGE_MODEL || "openai/gpt-4o-mini",
          messages: finalMessages,
          temperature,
          maxTokens
        })
    },
    {
      enabled: Boolean(process.env.HF_TOKEN),
      name: "huggingface",
      run: () =>
        requestOpenAICompatible({
          providerName: "huggingface",
          url: HUGGINGFACE_CHAT_URL,
          apiKey: process.env.HF_TOKEN,
          model: process.env.HF_CHAT_MODEL || "HuggingFaceH4/zephyr-7b-beta",
          messages: finalMessages,
          temperature,
          maxTokens
        })
    },
    {
      enabled: Boolean(process.env.GROQ_API_KEY),
      name: "groq",
      run: () =>
        requestOpenAICompatible({
          providerName: "groq",
          url: GROQ_CHAT_URL,
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
          messages: finalMessages,
          temperature,
          maxTokens
        })
    },
    {
      enabled: Boolean(process.env.GEMINI_API_KEY),
      name: "gemini",
      run: () =>
        requestGemini({
          apiKey: process.env.GEMINI_API_KEY,
          messages: finalMessages,
          temperature,
          maxTokens
        })
    }
  ].filter((attempt) => attempt.enabled);

  if (attempts.length === 0) {
    return res.status(500).json({
      error:
        "Nenhuma chave de IA configurada. Defina ao menos uma: SK_MODEL, HF_TOKEN, GROQ_API_KEY ou GEMINI_API_KEY."
    });
  }

  const errors = [];

  for (const attempt of attempts) {
    try {
      const data = await attempt.run();
      return res.status(200).json(data);
    } catch (error) {
      console.error(`Falha no provedor ${attempt.name}:`, error);
      errors.push({ provider: attempt.name, message: error.message });
    }
  }

  return res.status(503).json({
    error: "Todos os provedores de IA falharam.",
    details: errors
  });
}

async function handleImage(req, res, prompt) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    return res.status(500).json({ error: "HF_TOKEN não encontrado." });
  }

  const client = new InferenceClient(hfToken);
  const imageBlob = await client.textToImage({
    provider: "fal-ai",
    model: "Qwen/Qwen-Image-2512",
    inputs: prompt,
    parameters: { num_inference_steps: 5 }
  });

  const arrayBuffer = await imageBlob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return res.status(200).json({
    image_base64: base64,
    mime_type: imageBlob.type || "image/png"
  });
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Apenas requisições POST são permitidas." });
  }

  const {
    task = "chat",
    prompt = "",
    messages = [],
    temperature = 0.7,
    max_tokens: maxTokens = 220
  } = req.body || {};

  try {
    if (task === "image") {
      const finalPrompt = (prompt || "Astronaut riding a horse").trim();
      return await handleImage(req, res, finalPrompt);
    }

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "O array de mensagens está vazio ou ausente." });
    }

    return await handleLanguage(req, res, messages, temperature, maxTokens);
  } catch (error) {
    console.error("Erro interno /api/ai:", error);
    return res.status(500).json({ error: "Erro interno no serviço de IA." });
  }
}
