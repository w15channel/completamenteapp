# Integração com Vercel — Completamente App

Este documento centraliza os dados de produção para sincronização do projeto com a Vercel.

## Identificação do projeto

- **Vercel Project ID:** `prj_3id6t6KllH2CjUQ1aFOw7aMXmzfW`
- **Dashboard:** https://vercel.com/w15-channels-projects/completamenteapp
- **Domínio de produção:** https://completamenteapp.vercel.app
- **Endpoint de integração (Backend/Serverless):** https://completamenteapp.vercel.app/api/

## Variáveis de ambiente

- **Nome da variável:** `QWEEN_API_KEY`
- **Uso esperado no backend:** `process.env.QWEEN_API_KEY`

## Checklist rápido de sincronização

1. Abrir o projeto no dashboard da Vercel.
2. Confirmar se o **Project ID** é o mesmo deste documento.
3. Configurar a variável `QWEEN_API_KEY` em **Settings → Environment Variables**.
4. Validar que as funções serverless estão publicadas em `/api/`.
5. Rodar um deploy e testar o endpoint em produção.
