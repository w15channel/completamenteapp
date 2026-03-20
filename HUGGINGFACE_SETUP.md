# 🤗 Configuração Hugging Face - WR TERAPIA

## 🎯 Visão Geral

A aplicação está configurada para usar **Hugging Face** como provedor principal de inteligência artificial em todas as funcionalidades de fala e escrita.

## 📋 Funcionalidades que Usam Hugging Face

### 🔹 API Multi-Provider (`api/ai.js`)
- **HomeFit IA** - Geração de exercícios personalizados
- **Análise Nutricional** - Cálculo de calorias e macronutrientes
- **Planos de Refeição** - Geração de dietas equilibradas
- **Avaliações Psicológicas** - Testes de linguagem do amor e temperamentos
- **Ansiômetro** - Chat interativo para avaliação de ansiedade
- **Mensagens do Mural** - Geração de conteúdo inspirador
- **Biblioteca** - Geração de textos de autoconhecimento
- **Caixinha de Experiências** - Mensagens transformadoras

### 🔹 Chat Direto (`api/chat.js`)
- **Conversas com Terapeutas** - Chat em tempo real
- **Suporte Imediato** - Respostas rápidas e contextuais

## 🔧 Configuração na Vercel

### 1️⃣ Obter Chave API do Hugging Face

1. Acesse [huggingface.co](https://huggingface.co)
2. Faça login com sua conta
3. Vá para **Settings** → **Access Tokens**
4. Crie um novo token com permissões de escrita
5. Copie sua **HUGGFACE_KEY**

### 2️⃣ Configurar Variáveis de Ambiente

No painel da Vercel:
1. Vá para **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

```bash
# OBRIGATÓRIO - Principal provedor de IA
HUGGFACE_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OPCIONAL - Modelo específico
HF_MODEL=NousResearch/Hermes-3-Llama-3.1-8B:fastest

# BACKUP - Providers alternativos (opcional)
XAI_API_KEY=xai_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3️⃣ Prioridade de Providers

A aplicação segue esta ordem:

1. **🥇 Hugging Face** - Padrão principal
2. **🥈 Grok (xAI)** - Backup avançado
3. **🥉 Groq** - Backup rápido
4. **🏅 Gemini** - Fallback final

## 🚀 Teste de Configuração

### Verificar no Deploy
Após configurar as variáveis, faça deploy e verifique:

```bash
# Testar API multi-provider
curl -X POST https://seu-app.vercel.app/api/ai \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Olá Hugging Face!"}'

# Testar chat direto
curl -X POST https://seu-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Olá!"}]}'
```

### Logs de Erro
Se ocorrerem erros, verifique os logs na Vercel:

- **"Chave HUGGFACE_KEY não encontrada"** → Configure a variável de ambiente
- **"Erro da API Hugging Face"** → Verifique se a chave é válida
- **"Falha na resposta"** → Verifique limites de rate limiting

## 📊 Modelos Disponíveis

### Hugging Face
- `NousResearch/Hermes-3-Llama-3.1-8B:fastest` - Mais rápido (padrão)
- `meta-llama/Llama-3.1-70B-Instruct` - Mais potente
- `mistralai/Mixtral-8x7B-Instruct-v0.1` - Balanceado
- `microsoft/DialoGPT-medium` - Especializado em chat

### Configuração por Modelo
```bash
# Para usar modelo mais potente
HF_MODEL=meta-llama/Llama-3.1-70B-Instruct

# Para uso especializado em chat
HF_MODEL=microsoft/DialoGPT-medium

# Para máxima velocidade
HF_MODEL=NousResearch/Hermes-3-Llama-3.1-8B:fastest
```

## 🎛️ Personalização

### Prompt Engineering
O sistema já está otimizado para Hugging Face com prompts específicos:

#### 🏋️ HomeFit IA
```
"Você é um personal trainer IA especializado. Gere exercícios para [grupo muscular] 
com intensidade [nível] focando em [objetivo]."
```

#### 🥗 Nutrição
```
"Analise nutricionalmente: [refeição]. Forneça calorias, proteínas, carboidratos 
e gorduras com precisão."
```

#### 💬 Chat Terapêutico
```
"Você é um terapeuta IA empático. Responda com acolhimento e 
profissionalismo para: [mensagem do usuário]."
```

## 🔒 Segurança

### Proteção de Chaves
- ✅ Chaves armazenadas em **Environment Variables**
- ✅ Nunca expostas no frontend
- ✅ Criptografia TLS em todas as requisições
- ✅ Rate limiting aplicado pela Hugging Face

### Rate Limits
- **Hermes-3-Llama-3.1-8B**: ~1000 requisições/hora
- **Llama-3.1-70B**: ~500 requisições/hora
- Monitore uso no dashboard Hugging Face

## 🚨 Troubleshooting

### Problemas Comuns

#### ❌ "Chave não configurada"
```bash
# Verifique se a variável foi configurada corretamente
echo $HUGGFACE_KEY
```

#### ❌ "Resposta vazia"
- Verifique se o modelo está disponível
- Confira limits de uso
- Teste com prompt simples

#### ❌ "Erro 429 Too Many Requests"
- Aguarde alguns segundos
- Considere usar modelo mais rápido
- Implemente cache local

### Debug Avançado
```javascript
// Adicionar logs no api/ai.js
console.log('Provider selecionado:', provider.name);
console.log('Modelo:', provider.model);
console.log('Request body:', JSON.stringify(body, null, 2));
```

## 📈 Monitoramento

### Métricas Importantes
- **Latência** das respostas Hugging Face
- **Taxa de sucesso** das requisições
- **Uso de tokens** por funcionalidade
- **Custo** por requisição

### Dashboard Hugging Face
Acesse [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) para:
- Monitorar uso da API
- Verificar limites
- Analisar performance

## 🎯 Benefícios do Hugging Face

### ✅ Vantagens
- **Modelos open-source** de alta qualidade
- **Custo mais baixo** que providers comerciais
- **Flexibilidade** de escolha de modelos
- **Comunidade ativa** e suporte
- **Sem vendor lock-in**
- **Privacidade** aprimorada

### 🚀 Performance Comparativa
| Característica | Hugging Face | Grok | Gemini |
|---------------|-------------|------|---------|
| Custo/Token | 💰 | 💰💰 | 💰💰💰 |
| Velocidade | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Qualidade PT-BR | 🇧🇷🇧🇷 | 🇧🇷🇧🇷🇧🇷 | 🇧🇷🇧🇷 |
| Flexibilidade | 🔄🔄🔄 | 🔄 | 🔄🔄 |
| Privacidade | 🔒🔒🔒 | 🔒🔒 | 🔒 |

## 🔄 Código de Exemplo

### Função Query Principal
```javascript
async function query(data) {
  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      headers: {
        Authorization: `Bearer ${process.env.HUGGFACE_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  return result;
}

// Exemplo de uso
query({ 
  messages: [
    {
      role: "user",
      content: "Qual a capital do Brasil?",
    },
  ],
  model: "NousResearch/Hermes-3-Llama-3.1-8B:fastest",
}).then((response) => {
  console.log(JSON.stringify(response));
});
```

## 🎉 Pronto!

Sua aplicação agora está **100% integrada com Hugging Face**! 

Todas as funcionalidades de IA usarão o poder dos modelos open-source do Hugging Face para proporcionar experiências inteligentes, econômicas e privativas aos seus usuários. 🚀

---

## 📝 Notas Adicionais

### 🌐 Multi-Idioma
- Suporte nativo para português brasileiro
- Modelos treinados em múltiplos idiomas
- Tradução automática quando necessário

### 🔄 Atualizações
- Modelos constantemente atualizados
- Novas arquiteturas disponíveis
- Comunidade ativa de desenvolvimento

### 🎯 Especializações
- Modelos específicos para terapia
- Fine-tuning possível
- Datasets especializados disponíveis
