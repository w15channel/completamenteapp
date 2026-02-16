# Migração de chaves para Vercel (Groq + Gemini fallback)

## O que foi ajustado
- O frontend não usa mais chave exposta no `index.html`.
- O site agora chama um proxy seguro em `/api/ai` hospedado na Vercel.
- O proxy tenta **Groq primeiro** e, se falhar, usa **Gemini** automaticamente.

## Variáveis na Vercel
Cadastre no projeto da Vercel:

- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS` (opcional, recomendado)
  - Exemplo: `https://seuusuario.github.io,https://www.seudominio.com`

> Se `ALLOWED_ORIGINS` não for definido, o endpoint aceita qualquer origem (`*`).

## Ajuste obrigatório no frontend
No arquivo `index.html`, atualize a constante:

```js
window.AI_PROXY_URL="https://SEU-PROJETO-VERCEL.vercel.app/api/ai";
```

Troque `SEU-PROJETO-VERCEL` pelo domínio real do deploy na Vercel.

## Fluxo de fallback
1. Frontend envia `messages` para `AI_PROXY_URL`.
2. API da Vercel chama Groq.
3. Se Groq falhar (erro/timeout/sem chave), chama Gemini.
4. API retorna resposta no formato compatível com o frontend (`choices[0].message.content`).

## Checklist pós-deploy
1. Fazer deploy na Vercel com as variáveis configuradas.
2. Atualizar `window.AI_PROXY_URL` para o domínio final.
3. Publicar no GitHub Pages.
4. Testar conversa normal (Groq ativo).
5. Simular falha da Groq (remover chave temporariamente na Vercel) e confirmar fallback Gemini.
