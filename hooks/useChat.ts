import { useState, useEffect, useCallback } from 'react';
import { Therapist, ChatMessage, ChatSession, AvailabilityStatus } from '../types';
import ApiService from '../services/api';
import FirebaseService from '../services/firebase';
import { DateUtils } from '../utils/dateUtils';

/**
 * Hook para gerenciar chat terapêutico
 */
export const useChat = (userId: string) => {
  const [therapists] = useState<Therapist[]>([
    { id: 'lia', name: 'Dra. Lia', color: '#ec4899', icon: 'heart', schedule: 'Seg-Sex (08:00 - 22:00)' },
    { id: 'yara', name: 'Dra. Yara', color: '#8b5cf6', icon: 'moon', schedule: 'Dom-Sáb (22:00 - 08:00)' },
    { id: 'william', name: 'William', color: '#0ea5e9', icon: 'user-tie', schedule: 'Seg-Sex (10-12h / 17-22h)' },
    { id: 'marcos', name: 'Dr. Marcos', color: '#10b981', icon: 'user-md', schedule: 'Sáb (08-12h / 14-22h)' },
    { id: 'juliana', name: 'Dra. Juliana', color: '#f59e0b', icon: 'star-of-life', schedule: 'Sáb 22:00 - Dom 22:00' }
  ]);

  const [activeTherapist, setActiveTherapist] = useState<Therapist | null>(null);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar disponibilidade do terapeuta
  const checkAvailability = useCallback((therapistId: string): AvailabilityStatus => {
    const d = new Date();
    const day = d.getDay();
    const h = d.getHours();
    const isWeekday = day >= 1 && day <= 5;
    let isOnline = false;

    switch (therapistId) {
      case 'lia':
        isOnline = isWeekday && h >= 8 && h < 22;
        break;
      case 'yara':
        isOnline = h >= 22 || h < 8;
        break;
      case 'william':
        if (isWeekday && ((h >= 10 && h < 12) || (h >= 17 && h < 22))) {
          return { status: 'busy', text: 'Ocupado (15 min)', color: '#f59e0b', allow: true };
        }
        break;
      case 'marcos':
        isOnline = day === 6 && ((h >= 8 && h < 12) || (h >= 14 && h < 22));
        break;
      case 'juliana':
        isOnline = (day === 6 && h >= 22) || (day === 0 && h < 22);
        break;
    }

    if (isOnline) {
      return { status: 'online', text: 'Online', color: '#10b981', allow: true };
    }

    return { status: 'offline', text: 'Fora do Horário', color: '#94a3b8', allow: false };
  }, []);

  // Iniciar chat com terapeuta
  const startChat = useCallback(async (therapistId: string) => {
    const availability = checkAvailability(therapistId);
    if (!availability.allow) {
      setError(`Terapeuta indisponível: ${availability.text}`);
      return;
    }

    try {
      setError(null);
      const therapist = therapists.find(t => t.id === therapistId);
      if (!therapist) {
        throw new Error('Terapeuta não encontrado');
      }

      setActiveTherapist(therapist);

      const chatId = `${userId}_${therapistId}`;
      const firebase = FirebaseService.getInstance();

      // Carregar mensagens existentes
      const existingMessages = await firebase.loadChatMessages(chatId);
      
      if (existingMessages.length === 0) {
        // Criar mensagem de sistema para novo chat
        const systemMessage: ChatMessage = {
          role: 'system',
          content: `Você é ${therapist.name}. Responda de forma não formal no infinitivo (Preposição + pronome + verbo no infinitivo). Você não deve recomendar outros profissionais. É treinado para gerar possibilidade diagnóstica (percentual de chances de compatibilidade com sofrimento/patologia). Seja acolhedor no início e investigativo quando necessário. Baseado em processamento de linguagem natural e sem usar reticencias.`,
          timestamp: Date.now()
        };
        
        await firebase.saveChatMessages(chatId, [systemMessage]);
        setMessages([systemMessage]);
      } else {
        setMessages(existingMessages);
      }

      // Criar sessão ativa
      const chatSession: ChatSession = {
        id: chatId,
        therapistId,
        messages: existingMessages,
        lastUpdate: Date.now()
      };

      setActiveChat(chatSession);

      // Configurar listener para atualizações em tempo real
      const unsubscribe = firebase.setupChatListener(chatId, (updatedMessages) => {
        setMessages(updatedMessages);
        if (chatSession) {
          chatSession.messages = updatedMessages;
          chatSession.lastUpdate = Date.now();
        }
      });

      // Retornar função de cleanup
      return unsubscribe;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar chat');
    }
  }, [userId, therapists, checkAvailability]);

  // Enviar mensagem
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isWaiting || !activeChat || !activeTherapist) return;

    try {
      setError(null);
      setIsWaiting(true);
      setMessages(prev => [...prev, {
        role: 'user',
        content: text.trim(),
        timestamp: Date.now()
      }]);

      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: Date.now()
      };

      const updatedMessages = [...activeChat.messages, userMessage];
      setMessages(updatedMessages);

      // Salvar no Firebase
      const firebase = FirebaseService.getInstance();
      await firebase.saveChatMessages(activeChat.id, updatedMessages);

      // Simular status "lendo"
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mostrar status "escrevendo"
      setIsTyping(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }]);

      // Processar mensagem via IA
      setTimeout(async () => {
        try {
          const response = await ApiService.processChatMessage(updatedMessages);
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          };

          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          await firebase.saveChatMessages(activeChat.id, finalMessages);

          if (activeChat) {
            activeChat.messages = finalMessages;
            activeChat.lastUpdate = Date.now();
          }
        } catch (err) {
          console.error('Erro ao processar mensagem:', err);
          setMessages(prev => [...prev.slice(0, -1), {
            role: 'assistant',
            content: 'Desculpe, tive um problema. Pode repetir?',
            timestamp: Date.now()
          }]);
        } finally {
          setIsTyping(false);
          setIsWaiting(false);
        }
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem');
      setIsWaiting(false);
      setIsTyping(false);
    }
  }, [isWaiting, activeChat, activeTherapist]);

  // Limpar histórico do chat
  const clearChatHistory = useCallback(async () => {
    if (!activeChat) return;

    try {
      setError(null);
      const firebase = FirebaseService.getInstance();
      
      // Manter apenas a mensagem de sistema
      const systemMessage = activeChat.messages.find(m => m.role === 'system');
      const messagesToKeep = systemMessage ? [systemMessage] : [];
      
      await firebase.clearChatHistory(activeChat.id);
      setMessages(messagesToKeep);
      
      if (activeChat) {
        activeChat.messages = messagesToKeep;
        activeChat.lastUpdate = Date.now();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao limpar histórico');
    }
  }, [activeChat]);

  // Encerrar chat
  const endChat = useCallback(() => {
    setActiveTherapist(null);
    setActiveChat(null);
    setMessages([]);
    setIsWaiting(false);
    setIsTyping(false);
  }, []);

  // Obter terapeutas disponíveis
  const getAvailableTherapists = useCallback(() => {
    return therapists.map(therapist => ({
      ...therapist,
      availability: checkAvailability(therapist.id)
    }));
  }, [therapists, checkAvailability]);

  // Obter última mensagem
  const getLastMessage = useCallback((): ChatMessage | null => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  // Obter contagem de mensagens não lidas
  const getUnreadCount = useCallback((): number => {
    // Em uma implementação real, isso verificaria quais mensagens foram lidas
    return 0;
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar se há chat ativo
  const hasActiveChat = useCallback(() => {
    return !!(activeChat && activeTherapist);
  }, [activeChat, activeTherapist]);

  return {
    therapists,
    activeTherapist,
    activeChat,
    messages,
    isWaiting,
    isTyping,
    error,
    checkAvailability,
    startChat,
    sendMessage,
    clearChatHistory,
    endChat,
    getAvailableTherapists,
    getLastMessage,
    getUnreadCount,
    clearError,
    hasActiveChat
  };
};

export default useChat;
