# Bloco de Configuração do Projeto (Codex)

## Identificação do Ambiente

- **Nome do Projeto:** Completamente App
- **Vercel Project ID:** `prj_3id6t6KllH2CjUQ1aFOw7aMXmzfW`
- **Painel de Controle (Dashboard):** https://vercel.com/w15-channels-projects/completamenteapp

## Rotas e Domínios

- **Domínio de Produção (URL Pública):** https://completamenteapp.vercel.app
- **Endpoint Base da Aplicação (Frontend):** acessado pelo usuário final na URL pública.
- **Endpoint de Integração (Backend/Serverless):**
  - Base: `https://completamenteapp.vercel.app/api/`
  - Rota principal atual: `https://completamenteapp.vercel.app/api/ai`

## Autenticação e Segurança

- **Nome da Variável de Ambiente:** `QWEEN_API_KEY`
- **Local de Cadastro:** aba **Environment Variables** no painel da Vercel.
- **Chamada no Código (Backend):** `process.env.QWEEN_API_KEY`

## Orientação de Arquitetura para a Conexão

Para que a conexão entre o aplicativo e a API ocorra sem falhas na Vercel, a arquitetura exige um cuidado específico de segurança.

Como chaves de API não podem ficar expostas no HTML/JavaScript executado no navegador, a integração com IA deve passar por **Serverless Functions**. A Vercel reconhece automaticamente arquivos dentro da pasta `api/` na raiz do projeto como rotas de backend.

### Fluxo recomendado

1. O frontend (`index.html`) envia a mensagem do usuário para a própria rota backend do projeto, por exemplo: `https://completamenteapp.vercel.app/api/ai`.
2. A função serverless (`api/ai.js`) lê a chave com segurança em `process.env.QWEEN_API_KEY`.
3. A função faz a chamada ao provedor de IA.
4. A função retorna a resposta estruturada para o frontend, sem expor a chave ao usuário final.

## Checklist rápido de deploy na Vercel

1. Confirmar que `QWEEN_API_KEY` está configurada no ambiente correto (Production/Preview/Development).
2. Garantir que o frontend esteja apontando para `/api/ai`.
3. Validar no deploy se a rota `/api/ai` responde com `POST`.
4. Em caso de erro `401/403`, revisar chave e espaços extras na variável de ambiente.
