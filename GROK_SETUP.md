# 🤖 Configuração do Grok (xAI) - WR TERAPIA

## 🎯 Visão Geral

A aplicação está configurada para usar **Grok (xAI)** como provedor principal de inteligência artificial em todas as funcionalidades.

## 📋 Funcionalidades que Usam Grok

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

### 1️⃣ Obter Chave API do xAI

1. Acesse [x.ai](https://x.ai)
2. Faça login com sua conta
3. Vá para **API Access** ou **Developer Portal**
4. Copie sua **XAI_API_KEY**

### 2️⃣ Configurar Variáveis de Ambiente

No painel da Vercel:
1. Vá para **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

```bash
# OBRIGATÓRIO - Principal provedor de IA
XAI_API_KEY=xai_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OPCIONAL - Modelos específicos
XAI_MODEL=grok-2-latest

# BACKUP - Providers alternativos (opcional)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3️⃣ Prioridade de Providers

A aplicação segue esta ordem:

1. **🥇 Grok (xAI)** - Padrão principal
2. **🥈 Groq** - Backup rápido
3. **🥉 Gemini** - Fallback final

## 🚀 Teste de Configuração

### Verificar no Deploy
Após configurar as variáveis, faça deploy e verifique:

```bash
# Testar API multi-provider
curl -X POST https://seu-app.vercel.app/api/ai \
  -H "Content-Type: application/json" \
  -d '{"mensagem": "Olá Grok!"}'

# Testar chat direto
curl -X POST https://seu-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Olá!"}]}'
```

### Logs de Erro
Se ocorrerem erros, verifique os logs na Vercel:

- **"Chave XAI_API_KEY não encontrada"** → Configure a variável de ambiente
- **"Erro da API Grok"** → Verifique se a chave é válida
- **"Falha na resposta"** → Verifique limites de rate limiting

## 📊 Modelos Disponíveis

### Grok (xAI)
- `grok-2-latest` - Mais recente e capaz (padrão)
- `grok-2-mini` - Mais rápido e econômico
- `grok-vision-beta` - Com capacidade de imagem

### Configuração por Modelo
```bash
# Para usar modelo específico
XAI_MODEL=grok-2-mini

# Para capacidades visuais
XAI_MODEL=grok-vision-beta
```

## 🎛️ Personalização

### Prompt Engineering
O sistema já está otimizado para Grok com prompts específicos:

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
- ✅ Rate limiting aplicado pela xAI

### Rate Limits
- **Grok-2**: ~100 requisições/minuto
- **Grok-2-mini**: ~200 requisições/minuto
- Monitore uso no dashboard xAI

## 🚨 Troubleshooting

### Problemas Comuns

#### ❌ "Chave não configurada"
```bash
# Verifique se a variável foi configurada corretamente
echo $XAI_API_KEY
```

#### ❌ "Resposta vazia"
- Verifique se o modelo está disponível
- Confira limits de uso
- Teste com prompt simples

#### ❌ "Erro 429 Too Many Requests"
- Aguarde alguns segundos
- Considere usar `grok-2-mini`
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
- **Latência** das respostas Grok
- **Taxa de sucesso** das requisições
- **Uso de tokens** por funcionalidade
- **Custo** por requisição

### Dashboard xAI
Acesse [x.ai/dashboard](https://x.ai/dashboard) para:
- Monitorar uso da API
- Verificar limites
- Analisar performance

## 🎯 Benefícios do Grok

### ✅ Vantagens
- **Contexto atualizado** até 2024
- **Respostas mais naturais** e humanas
- **Melhor compreensão** de português
- **Performance superior** em tarefas complexas
- **Integração** com ecossistema X/Twitter

### 🚀 Performance Comparativa
| Característica | Grok | Gemini | GPT-4 |
|---------------|------|---------|-------|
| Velocidade | ⚡⚡⚡ | ⚡⚡ | ⚡ |
| Qualidade PT-BR | 🇧🇷🇧🇷🇧🇷 | 🇧🇷🇧🇷 | 🇧🇷 |
| Contexto Atual | 📅📅📅 | 📅 | 📅📅 |
| Custo/Token | 💰💰 | 💰💰💰 | 💰💰 |

---

## 🎉 Pronto!

Sua aplicação agora está **100% integrada com Grok (xAI)**! 

Todas as funcionalidades de IA usarão o poder do Grok para proporcionar experiências mais inteligentes e contextuais aos seus usuários. 🚀
