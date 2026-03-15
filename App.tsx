import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useChat } from './hooks/useChat';
import { useHealth } from './hooks/useHealth';
import { Therapist, ChatMessage } from './types';
import { DateUtils } from './utils/dateUtils';
import Chat from './components/Chat';
import TherapistList from './components/TherapistList';
import HealthProfile from './components/HealthProfile';

// Componente principal da aplicação
const AppComponent: React.FC = () => {
  const { user, userData, isLoading, error, clearError, manualSync, exportData, clearBackups } = useApp();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  // Hooks de chat e saúde
  const chat = useChat(user?.id || '');
  const health = useHealth(user?.id || '');

  // Estado inicial
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasAcceptedTerms(window.hasAcceptedTerms || false);
    }
  }, []);

  // Funções de navegação
  const showTab = useCallback((tabId: string) => {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    // Limpar chat ativo se não estiver na aba de chat
    if (tabId !== 'chat' && chat.activeChat) {
      chat.endChat();
    }

    // Inicializações específicas por aba
    switch (tabId) {
      case 'relacional':
        // initRelacionalTab();
        break;
      case 'routines':
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        // renderTasks();
        break;
      case 'financas':
        // renderFinances();
        break;
      case 'saude':
        // initSaudeTab();
        break;
      case 'relaxation':
        // showRelaxSubTab('rx-video');
        break;
    }

    setActiveTab(tabId);
  }, [chat]);

  // Disparar seleção de chat
  const triggerChatSelection = useCallback(() => {
    if (!hasAcceptedTerms) {
      const modal = document.getElementById('consent-modal');
      if (modal) modal.classList.remove('hidden');
    } else {
      setShowChatSelection(true);
    }
  }, [hasAcceptedTerms]);

  // Aceitar termos
  const acceptTerms = useCallback(() => {
    setHasAcceptedTerms(true);
    if (typeof window !== 'undefined') {
      window.hasAcceptedTerms = true;
      sessionStorage.setItem('wr_terms_accepted', 'true');
    }
    const modal = document.getElementById('consent-modal');
    if (modal) modal.classList.add('hidden');
    setShowChatSelection(true);
  }, []);

  // Declinar termos
  const declineTerms = useCallback(() => {
    const modal = document.getElementById('consent-modal');
    if (modal) modal.classList.add('hidden');
    showTab('home');
  }, [showTab]);

  // Iniciar chat
  const handleStartChat = useCallback(async (therapistId: string) => {
    const unsubscribe = await chat.startChat(therapistId);
    setShowChatSelection(false);
    showTab('chat');
    
    // Retornar função de cleanup (será usada no unmount)
    return unsubscribe;
  }, [chat, showTab]);

  // Renderizar conteúdo principal
  const renderMainContent = () => {
    if (showChatSelection) {
      return (
        <TherapistList
          therapists={chat.getAvailableTherapists()}
          onSelectTherapist={handleStartChat}
          onBack={() => setShowChatSelection(false)}
        />
      );
    }

    if (activeTab === 'chat' && chat.activeTherapist && chat.activeChat) {
      return (
        <Chat
          therapist={chat.activeTherapist}
          messages={chat.messages}
          onSendMessage={chat.sendMessage}
          onEndChat={chat.endChat}
          onClearHistory={chat.clearChatHistory}
          isWaiting={chat.isWaiting}
          isTyping={chat.isTyping}
          availability={chat.checkAvailability(chat.activeTherapist.id)}
          error={chat.error}
          onClearError={chat.clearError}
        />
      );
    }

    if (activeTab === 'saude' && health.healthData) {
      const gender = userData?.gender === 'M' ? 'masculino' : 'feminino';
      const age = DateUtils.extractAgeFromPassword(userData?.pass || '');

      return (
        <HealthProfile
          healthData={health.healthData}
          gender={gender}
          age={age}
          onUpdateHealthData={health.saveHealthData}
          onResetProfile={() => {
            // Implementar reset de perfil
            console.log('Reset profile');
          }}
          onSyncData={manualSync}
          onExportData={exportData}
          onClearBackups={clearBackups}
        />
      );
    }

    // Renderizar outras abas (placeholder)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-home text-6xl text-slate-600 mb-4"></i>
          <h2 className="text-2xl font-bold text-slate-400 mb-2">Aba: {activeTab}</h2>
          <p className="text-slate-500">Conteúdo em desenvolvimento</p>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-sky-500 mb-4"></i>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, mostrar tela de login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8">
            <h1 className="text-3xl font-black text-sky-400 mb-6 text-center">Completamente</h1>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const loginData = {
                fullName: formData.get('fullName') as string,
                gender: formData.get('gender') as 'M' | 'F',
                pass: formData.get('pass') as string
              };
              // Usar o contexto para login
              // login(loginData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Gênero</label>
                  <select name="gender" className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white outline-none">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Nome Completo</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Seu nome completo"
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Senha (8 números)</label>
                  <input
                    type="password"
                    name="pass"
                    placeholder="DDMMAAAA"
                    maxLength={8}
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-600 text-white outline-none"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember-me" className="rounded" />
                  <label htmlFor="remember-me" className="text-sm text-slate-400">Lembrar-me</label>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-sky-600 hover:to-blue-700 transition-all"
                >
                  Entrar
                </button>
              </div>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aplicação principal
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex-none bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-sky-400">Completamente</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Olá, {user.name}</span>
            <button
              onClick={() => {
                // Implementar logout
                console.log('Logout');
              }}
              className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600"
            >
              <i className="fas fa-sign-out-alt text-slate-300 text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderMainContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex-none bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-3 flex justify-around z-50">
        <button
          onClick={() => showTab('home')}
          className="text-sky-500 flex flex-col items-center gap-1 hover:text-sky-400 transition-colors"
        >
          <i className="fas fa-home"></i>
          <span className="text-[9px] font-bold tracking-widest">INÍCIO</span>
        </button>
        <button
          onClick={triggerChatSelection}
          className="text-slate-500 flex flex-col items-center gap-1 hover:text-slate-300 transition-colors"
        >
          <i className="fas fa-comment"></i>
          <span className="text-[9px] font-bold tracking-widest">CHAT</span>
        </button>
      </nav>

      {/* Modal de Termos */}
      <div id="consent-modal" className="hidden fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="glass-card p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-sky-400 mb-4">Termos de Consentimento</h2>
          <div className="text-slate-300 text-sm mb-6 max-h-60 overflow-y-auto">
            <p className="mb-4">
              Ao utilizar nossos serviços de terapia digital, você concorda com os seguintes termos:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Este é um serviço de suporte emocional e não substitui tratamento médico ou psicológico profissional</li>
              <li>Em caso de crise ou emergência, procure serviços de saúde imediatamente</li>
              <li>As conversas são criptografadas e armazenadas com segurança</li>
              <li>Você pode solicitar a exclusão de seus dados a qualquer momento</li>
              <li>Os terapeutas digitais utilizam IA para fornecer respostas baseadas em melhores práticas</li>
            </ul>
            <p className="mt-4">
              Ao continuar, você declara ter lido e concordado com estes termos.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={declineTerms}
              className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Recusar
            </button>
            <button
              onClick={acceptTerms}
              className="flex-1 bg-sky-500 text-white py-2 rounded-lg hover:bg-sky-400 transition-colors"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// App wrapper com provider
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppComponent />
    </AppProvider>
  );
};

export default App;
