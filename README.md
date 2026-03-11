# WR TERAPIA - Guia de Configuração

## Estrutura do Projeto

```
completamenteapp/
├── api/                    # Serverless functions (Vercel)
│   ├── ai.js              # API multi-provider de IA
│   └── chat.js            # API OpenAI dedicada
├── js/
│   ├── app.js             # Aplicação principal
│   └── firebase-config.js # Configuração segura do Firebase
├── css/
│   └── style.css          # Estilos personalizados
├── index.html             # Página principal
├── package.json           # Dependências
├── vercel.json           # Configuração do deploy
└── .env.example          # Modelo de variáveis de ambiente
```

## Integrações Configuradas

### 1. Firebase Database
- **Uso**: Armazenamento de dados dos usuários
- **Configuração**: Variáveis de ambiente (seguro)
- **Status**: ✅ Seguro após correção

### 2. APIs de IA (Multi-provider)
- **OpenAI**: GPT-4o-mini (padrão)
- **Google Gemini**: Gemini-1.5-flash
- **Qwen**: Qwen-plus
- **Groq**: Llama-3.1-8b-instant
- **Fallback**: Automático entre providers

### 3. Serviços Externos
- **TailwindCSS**: Framework CSS via CDN
- **Font Awesome**: Ícones via CDN
- **html2canvas**: Exportação de certificados

## Configuração Obrigatória

### 1. Variáveis de Ambiente (Vercel)

Configure no painel da Vercel > Settings > Environment Variables:

```bash
# Pelo menos uma API de IA é obrigatória
OPENAI_API_KEY=sk-...          # Ou
GEMINI_API_KEY=...             # Ou  
QWEN_API_KEY=...               # Ou
GROQ_API_KEY=...

# Opcionais (usar valores padrão se não definidos)
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-1.5-flash
```

### 2. Segurança Firebase

**ANTES**: API key exposta no frontend ❌
```javascript
// VULNERÁVEL - NÃO USAR
const firebaseConfig = {
  apiKey: "AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY", // Exposta!
  // ...
};
```

**AGORA**: Configuração segura ✅
```javascript
// js/firebase-config.js - Seguro
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "fallback",
  // ...
};
```

## Deploy na Vercel

1. **Conectar repositório** à Vercel
2. **Configurar variáveis** de ambiente
3. **Deploy automático** com `vercel.json`

## Endpoints da API

- `POST /api/ai` - Multi-provider IA
- `POST /api/chat` - OpenAI dedicada

## Segurança Implementada

- ✅ API keys em variáveis de ambiente
- ✅ CORS configurado
- ✅ Validação de métodos HTTP
- ✅ Tratamento de erros
- ✅ Fallback automático de providers

## Próximos Passos Recomendados

1. **Configurar regras de segurança** do Firebase
2. **Implementar autenticação** de usuários
3. **Adicionar monitoring** de erros
4. **Testar APIs** em ambiente de staging
