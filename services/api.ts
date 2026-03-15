import { AIResponse, NutriAnalysisResult } from '../types';

// Configuração da API
const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.origin}/api` 
  : '/api';

export class ApiService {
  // URL proxies
  static readonly AI_PROXY_URL = `${API_BASE_URL}/ai`;
  static readonly CHAT_AI_PROXY_URL = `${API_BASE_URL}/chat`;

  /**
   * Faz requisição para a API de IA
   */
  static async requestAI(messages: Array<{role: string; content: string}>, temperature = 0.7, maxTokens = 300): Promise<AIResponse> {
    const response = await fetch(this.AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API de IA: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Faz requisição para a API de Chat
   */
  static async requestChat(messages: Array<{role: string; content: string}>, temperature = 0.75, maxTokens = 300): Promise<AIResponse> {
    const response = await fetch(this.CHAT_AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API de Chat: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Analisa nutrição via IA
   */
  static async analyzeNutrition(text: string, qty: number, unit: string): Promise<NutriAnalysisResult> {
    const systemPrompt = `Atue como nutricionista digital. Retorne APENAS JSON {"total_cal":num,"p":num,"c":num,"f":num}. Considere a porção: ${qty}${unit}.`;
    
    const response = await this.requestAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analise: ${text}` }
    ], 0.3, 100);

    const content = response.choices[0]?.message?.content || '{}';
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      throw new Error('Resposta inválida da API de nutrição');
    }
  }

  /**
   * Gera mensagem de esperança
   */
  static async generateHopeMessage(): Promise<string> {
    const systemPrompt = "Gere uma mensagem de esperança inspiradora e curta (máximo 220 caracteres). Seja positivo e encorajador.";
    
    const response = await this.requestAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Gere uma mensagem de esperança para alguém que precisa de força.' }
    ], 0.8, 100);

    return response.choices[0]?.message?.content || 'Mensagem não disponível no momento.';
  }

  /**
   * Gera conteúdo para biblioteca
   */
  static async generateLibraryContent(theme: string): Promise<{title: string; content: string}> {
    const systemPrompt = `Atue como bibliotecário terapêutico. Gere um texto inspirador sobre o tema: ${theme}. O texto deve ter entre 200-300 palavras, ser bem estruturado e conter sabedoria prática. Retorne em formato JSON: {"title":"título","content":"texto"}`;
    
    const response = await this.requestAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Gere conteúdo sobre ${theme}` }
    ], 0.7, 500);

    try {
      const content = response.choices[0]?.message?.content || '{}';
      const cleanedContent = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Erro ao parsear conteúdo da biblioteca:', error);
      return {
        title: 'Sabedoria',
        content: 'O conteúdo não está disponível no momento, mas a sabedoria sempre encontra um caminho até nós.'
      };
    }
  }

  /**
   * Processa mensagem do chat terapêutico
   */
  static async processChatMessage(messages: Array<{role: string; content: string}>): Promise<string> {
    const response = await this.requestChat(messages, 0.75, 300);
    return response.choices[0]?.message?.content?.replace(/\.\.\./g, '') || 'Não foi possível processar sua mensagem.';
  }

  /**
   * Inicia avaliação de ansiedade
   */
  static async startAnxietyAssessment(): Promise<string> {
    const systemPrompt = "Atue como terapeuta. Faça 20 perguntas curtas, UMA POR VEZ (numere 1/20), para avaliar ansiedade. Após a 20ª resposta, diga APENAS um número de 0 a 100 definindo o nível de ansiedade. Sem uso de reticencias.";
    
    const response = await this.requestAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Quero avaliar minha ansiedade. Primeira pergunta.' }
    ], 0.7, 300);

    return response.choices[0]?.message?.content || 'Não foi possível iniciar a avaliação.';
  }

  /**
   * Continua avaliação de ansiedade
   */
  static async continueAnxietyAssessment(messages: Array<{role: string; content: string}>): Promise<string> {
    const response = await this.requestAI(messages, 0.7, 300);
    return response.choices[0]?.message?.content || 'Não foi possível continuar a avaliação.';
  }

  /**
   * Testa conectividade com APIs
   */
  static async testConnectivity(): Promise<{internet: boolean; api: boolean}> {
    const results = {
      internet: false,
      api: false
    };

    // Testar conexão básica
    try {
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD', 
        mode: 'no-cors' 
      });
      results.internet = true;
    } catch (error) {
      console.error("❌ Conexão com internet: FALHOU", error);
    }

    // Testar API do site
    try {
      const response = await fetch(this.AI_PROXY_URL, { 
        method: 'HEAD' 
      });
      results.api = response.ok;
    } catch (error) {
      console.error("❌ API do site: FALHOU", error);
    }

    return results;
  }

  /**
   * Gera plano de refeições balanceado
   */
  static async generateBalancedMeal(params: {
    goal: string;
    type: string;
    days: number;
    restrictions: string[];
    preferences?: string;
  }): Promise<any> {
    const { goal, type, days, restrictions, preferences } = params;
    
    let prompt = `Gere um plano alimentar para ${days} dias com objetivo de ${goal}. `;
    prompt += `Tipo: ${type}. `;
    
    if (restrictions.length > 0) {
      prompt += `Restrições alimentares: ${restrictions.join(', ')}. `;
    }
    
    if (preferences) {
      prompt += `Preferências: ${preferences}. `;
    }
    
    prompt += `Retorne em formato JSON com estrutura detalhada de refeições.`;

    const response = await this.requestAI([
      { role: 'system', content: 'Você é um nutricionista especialista em planejamento alimentar personalizado.' },
      { role: 'user', content: prompt }
    ], 0.7, 1000);

    try {
      const content = response.choices[0]?.message?.content || '{}';
      const cleanedContent = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Erro ao gerar plano de refeições:', error);
      throw new Error('Não foi possível gerar o plano alimentar.');
    }
  }
}

export default ApiService;
