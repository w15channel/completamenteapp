# Migração para domínio da Vercel + APIs de IA

## O que foi ajustado
- O frontend usa o domínio atual da Vercel como prioridade para o proxy (`window.location.origin/api/ai`).
- O backend `/api/ai` agora usa **Hugging Face** para:
  - **Linguagem:** OpenAI SDK com `baseURL: https://router.huggingface.co/v1`, chave `HF_TOKEN` e modelo `moonshotai/Kimi-K2-Thinking:novita`.
  - **Imagem:** Hugging Face Inference (`@huggingface/inference`) com `provider: fal-ai`, modelo `Qwen/Qwen-Image-2512` e chave `HF_TOKEN`.
- A geração de linguagem segue o padrão solicitado:
  - frases curtas;
  - foco em problemas pessoais;
  - até 200 caracteres;
  - tom informal e pessoal;
  - segunda pessoa do singular;
  - sequência cíclica de estilos de resposta.

## Variáveis na Vercel
Cadastre no projeto da Vercel:

- `HF_TOKEN`
- `HF_TEXT_MODEL` (opcional)
  - padrão: `moonshotai/Kimi-K2-Thinking:novita`
- `ALLOWED_ORIGINS` (opcional)

## Payloads aceitos em `/api/ai`

### 1) Linguagem (chat)
```json
{
  "task": "chat",
  "messages": [{ "role": "user", "content": "texto" }],
  "temperature": 0.7,
  "max_tokens": 220
}
```

### 2) Imagem
```json
{
  "task": "image",
  "prompt": "Astronaut riding a horse"
}
```

Resposta:
```json
{
  "image_base64": "...",
  "mime_type": "image/png"
}
```

## Checklist pós-deploy
1. Publicar o deploy na Vercel com as variáveis acima.
2. Confirmar que o frontend está carregando no domínio da Vercel.
3. Testar chat (HF Router com `HF_TOKEN`).
4. Testar geração de imagem (Hugging Face com `HF_TOKEN`).
