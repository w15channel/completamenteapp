import { InferenceClient } from "@huggingface/inference";

const VERCEL_LANGUAGE_URL =
  process.env.VERCEL_LANGUAGE_API_URL || "https://api.v0.dev/v1/chat/completions";

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

async function handleLanguage(req, res, messages, temperature, maxTokens) {
  const apiKey = process.env.VERCEL_LANGUAGE_API_KEY || process.env.VERCEL_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Chave da API de linguagem da Vercel não encontrada." });
  }

  const systemPrompt = buildLanguageSystemPrompt(messages);
  const normalizedMessages = normalizeMessages(messages);
  const finalMessages = [{ role: "system", content: systemPrompt }, ...normalizedMessages];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(VERCEL_LANGUAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.VERCEL_LANGUAGE_MODEL || "openai/gpt-4o-mini",
        messages: finalMessages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Falha na API de linguagem da Vercel.",
        details: data
      });
    }

    return res.status(200).json(data);
  } finally {
    clearTimeout(timeout);
  }
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
