// Tipos globais para compatibilidade com código legado
import { UserData } from './index';

declare global {
  interface Window {
    // URLs de API
    AI_PROXY_URL?: string;
    CHAT_AI_PROXY_URL?: string;
    
    // Estado da aplicação
    hasAcceptedTerms?: boolean;
    userDataCache?: UserData | null;
    clientId?: string;
    clientName?: string;
    activeTherapist?: any;
    activeChatRef?: any;
    
    // Funções de renderização (compatibilidade)
    renderHydration?: () => void;
    renderCaloricNeed?: () => void;
    
    // Propriedades de localização estendidas
    location: Location & {
      origin?: string;
    };
    
    // Firebase (se disponível)
    db?: any;
    firebase?: any;
    
    // Funções legadas do app.js
    showTab?: (tabId: string) => void;
    showSaudeSubTab?: (subTabId: string) => void;
    calcIMC?: () => void;
    updateBiotypeFromTraits?: () => void;
    generateActivityProfile?: () => void;
    resetHealthProfileInfo?: () => void;
    manualSyncData?: () => void;
    exportRecoveredData?: () => void;
    clearLocalBackups?: () => void;
    
    // Sistema de chat
    startChat?: (therapistId: string) => void;
    renderTherapistList?: () => void;
    refreshChatDisplay?: (messages: any[]) => void;
    clearChatHistory?: () => void;
    
    // Sistema de saúde
    renderBalancedMealRestrictions?: () => void;
    renderNutriHistory?: () => void;
    renderExerciseProgress?: () => void;
    renderAnxietyDailyState?: () => void;
    renderHealthGoalsLog?: () => void;
    initHomeFitTool?: () => void;
    
    // Sistema de finanças
    renderFinances?: () => void;
    
    // Sistema de relaxamento
    showRelaxSubTab?: (subTabId: string) => void;
    loadMural?: () => void;
    
    // Sistema de áudio
    initAudioSystem?: () => void;
    
    // Outras funções legadas
    initRelacionalTab?: () => void;
    renderTasks?: () => void;
    initSaudeTab?: () => void;
  }
}

export {};
