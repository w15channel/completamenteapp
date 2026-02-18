import { InferenceClient } from "@huggingface/inference";

// --- CONFIGURAÇÕES DE AMBIENTE ---
const VERCEL_LANGUAGE_URL = process.env.VERCEL_LANGUAGE_API_URL || "https://api.v0.dev/v1/chat/completions";
const HUGGINGFACE_CHAT_URL = process.env.HF_CHAT_URL || "https://router.huggingface.co/v1/chat/completions";
const GROQ_CHAT_URL = process.env.GROQ_CHAT_URL || "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// Sequência de tom de voz para a dinâmica terapêutica
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

// --- AUXILIARES ---

function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
    "Siga estritamente a sequência de estilo e avance um passo por resposta.",
    `Passo atual obrigatório: ${sequenceStep}.`,
    "Se fizer pergunta, manter objetiva e acolhedora.",
    "Evitar listas, emojis exagerados e explicações longas."
  ].join(" ");
}

function normalizeMessages(messages = []) {
  return messages
    .filter((msg) => msg?.role && typeof msg?.content === "string")
    .map((msg) => ({ role: msg.role, content: msg.content }));
}

// --- PROVEDORES DE IA ---

async function requestOpenAICompatible({ providerName, url, apiKey, model, messages, temperature, maxTokens }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
      signal: controller.signal
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`${providerName} Error: ${data.error?.message || response.statusText}`);
    
    return {
      content: data.choices[0].message.content,
      provider: providerName
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGemini({ apiKey, messages, temperature, maxTokens }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  // Converte histórico para o formato do Gemini
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Gemini Error: ${data.error?.message || 'Unknown'}`);

  return {
    content: data.candidates[0].content.parts[0].text,
    provider: "gemini"
  };
}

// --- HANDLERS PRINCIPAIS ---

async function handleLanguage(req, res, messages, temperature, maxTokens) {
  const systemPrompt = buildLanguageSystemPrompt(messages);
  const normalized = normalizeMessages(messages);
  const finalMessages = [{ role: "system", content: systemPrompt }, ...normalized];

  // Ordem de tentativa: Groq (Rápido) -> Gemini (Inteligente) -> HuggingFace (Backup)
  const attempts = [
    {
      enabled: !!process.env.GROQ_API_KEY,
      run: () => requestOpenAICompatible({
        providerName: "groq",
        url: GROQ_CHAT_URL,
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: finalMessages,
        temperature, maxTokens
      })
    },
    {
      enabled: !!process.env.GEMINI_API_KEY,
      run: () => requestGemini({
        apiKey: process.env.GEMINI_API_KEY,
        messages: finalMessages,
        temperature, maxTokens
      })
    }
  ].filter(a => a.enabled);

  for (const attempt of attempts) {
    try {
      const result = await attempt.run();
      return res.status(200).json({
        choices: [{ message: { content: result.content } }],
        provider: result.provider
      });
    } catch (e) {
      console.error("Tentativa de provedor falhou:", e.message);
      continue;
    }
  }

  return res.status(503).json({ error: "Todos os serviços de IA estão indisponíveis no momento." });
}

async function handleImage(req, res, prompt) {
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) return res.status(500).json({ error: "Configuração de imagem ausente." });

  try {
    const client = new InferenceClient(hfToken);
    const imageBlob = await client.textToImage({
      model: "black-forest-labs/FLUX.1-schnell", // Modelo mais moderno e rápido
      inputs: prompt,
      parameters: { num_inference_steps: 4 }
    });

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    return res.status(200).json({
      image_base64: buffer.toString("base64"),
      mime_type: "image/webp"
    });
  } catch (e) {
    return res.status(500).json({ error: "Erro ao gerar imagem: " + e.message });
  }
}

// --- SERVERLESS EXPORT ---

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { task = "chat", messages, prompt, temperature = 0.7, max_tokens = 400 } = req.body;

  try {
    if (task === "image") {
      return await handleImage(req, res, prompt);
    }
    return await handleLanguage(req, res, messages, temperature, max_tokens);
  } catch (error) {
    console.error("Erro Geral:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}
