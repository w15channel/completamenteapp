import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import { useHealth } from '../hooks/useHealth';
import iOSChat from './iOSChat';
import iOSTherapistList from './iOSTherapistList';
import iOSHealthProfile from './iOSHealthProfile';
import '../css/ios-style.css';
import '../css/ios-animations.css';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  component?: React.ReactNode;
}

const iOSLayout: React.FC = () => {
  const { user, userData, isLoading, error, clearError } = useApp();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const chat = useChat(user?.id || '');
  const health = useHealth(user?.id || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasAcceptedTerms(window.hasAcceptedTerms || false);
    }
  }, []);

  const tabs: TabItem[] = [
    { id: 'home', label: 'Início', icon: 'fas fa-home' },
    { id: 'chat', label: 'Conversar', icon: 'fas fa-comment-medical' },
    { id: 'health', label: 'Saúde', icon: 'fas fa-heartbeat' },
    { id: 'routines', label: 'Rotina', icon: 'fas fa-check-circle' },
    { id: 'profile', label: 'Perfil', icon: 'fas fa-user' }
  ];

  const handleTabPress = (tabId: string) => {
    // Haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    
    if (tabId === 'chat') {
      if (!hasAcceptedTerms) {
        const modal = document.getElementById('consent-modal');
        if (modal) modal.classList.remove('hidden');
      } else {
        setShowChatSelection(true);
      }
    } else {
      setActiveTab(tabId);
      setShowChatSelection(false);
    }
  };

  const handleStartChat = async (therapistId: string) => {
    const unsubscribe = await chat.startChat(therapistId);
    setShowChatSelection(false);
    setActiveTab('chat');
    return unsubscribe;
  };

  const acceptTerms = () => {
    setHasAcceptedTerms(true);
    if (typeof window !== 'undefined') {
      window.hasAcceptedTerms = true;
      sessionStorage.setItem('wr_terms_accepted', 'true');
    }
    const modal = document.getElementById('consent-modal');
    if (modal) modal.classList.add('hidden');
    setShowChatSelection(true);
  };

  const declineTerms = () => {
    const modal = document.getElementById('consent-modal');
    if (modal) modal.classList.add('hidden');
    setActiveTab('home');
  };

  const renderStatusBar = () => (
    <div className="ios-status-bar ios-system">
      <div className="ios-status-bar-time">
        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="ios-status-bar-icons">
        <i className="fas fa-signal"></i>
        <i className="fas fa-wifi"></i>
        <i className="fas fa-battery-three-quarters"></i>
      </div>
    </div>
  );

  const renderNavigationHeader = () => (
    <div className="ios-navigation-bar">
      <button className="ios-navigation-bar-button">
        <i className="fas fa-bars"></i>
      </button>
      <div className="ios-navigation-bar-title">
        {showChatSelection ? 'Terapeutas' : 
         activeTab === 'chat' && chat.activeTherapist ? chat.activeTherapist.name :
         tabs.find(tab => tab.id === activeTab)?.label || 'TherapySpace'}
      </div>
      <button className="ios-navigation-bar-button">
        {user ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <i className="fas fa-cog"></i>
        )}
      </button>
    </div>
  );

  const renderHomeScreen = () => (
    <div className="p-4 space-y-4">
      <div className="ios-card-large">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="ios-title2 ios-text-primary">Olá, {user?.name || 'Visitante'}</h1>
            <p className="ios-body ios-text-secondary">Como você está hoje?</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleTabPress('chat')}
            className="ios-card ios-haptic p-6 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
              <i className="fas fa-comment-medical text-blue-600 text-xl"></i>
            </div>
            <span className="ios-callout ios-text-primary">Conversar</span>
          </button>
          
          <button
            onClick={() => handleTabPress('health')}
            className="ios-card ios-haptic p-6 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
              <i className="fas fa-heartbeat text-rose-600 text-xl"></i>
            </div>
            <span className="ios-callout ios-text-primary">Saúde</span>
          </button>
          
          <button
            onClick={() => handleTabPress('routines')}
            className="ios-card ios-haptic p-6 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
            </div>
            <span className="ios-callout ios-text-primary">Rotina</span>
          </button>
          
          <button
            className="ios-card ios-haptic p-6 text-center hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
              <i className="fas fa-spa text-purple-600 text-xl"></i>
            </div>
            <span className="ios-callout ios-text-primary">Relaxar</span>
          </button>
        </div>
      </div>

      <div className="ios-card">
        <h2 className="ios-headline ios-text-primary mb-4">Seu Progresso</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="ios-body ios-text-secondary">Conversas esta semana</span>
            <span className="ios-body ios-text-primary font-semibold">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="ios-body ios-text-secondary">Meta de água</span>
            <span className="ios-body ios-text-primary font-semibold">75%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="ios-body ios-text-secondary">Humor hoje</span>
            <span className="ios-body ios-text-primary font-semibold">😊 Bom</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (showChatSelection) {
      return (
        <iOSTherapistList
          therapists={chat.getAvailableTherapists()}
          onSelectTherapist={handleStartChat}
          onBack={() => setShowChatSelection(false)}
        />
      );
    }

    if (activeTab === 'chat' && chat.activeTherapist && chat.activeChat) {
      return (
        <iOSChat
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

    if (activeTab === 'health' && health.healthData) {
      const gender = userData?.gender === 'M' ? 'masculino' : 'feminino';
      const age = userData?.pass ? new Date().getFullYear() - parseInt(userData.pass.substring(4, 8)) : 25;

      return (
        <iOSHealthProfile
          healthData={health.healthData}
          gender={gender}
          age={age}
          onUpdateHealthData={health.saveHealthData}
          onResetProfile={() => console.log('Reset profile')}
          onSyncData={() => console.log('Sync data')}
          onExportData={() => console.log('Export data')}
          onClearBackups={() => console.log('Clear backups')}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return renderHomeScreen();
      case 'routines':
        return (
          <div className="p-4">
            <div className="ios-card-large text-center">
              <i className="fas fa-check-circle text-6xl text-emerald-500 mb-4"></i>
              <h2 className="ios-title2 ios-text-primary mb-2">Minha Rotina</h2>
              <p className="ios-body ios-text-secondary">Em desenvolvimento</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="p-4">
            <div className="ios-card-large">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="ios-title1 ios-text-primary">{user?.name}</h2>
                <p className="ios-body ios-text-secondary">{user?.email}</p>
              </div>
              
              <div className="ios-list">
                <button className="ios-list-item">
                  <i className="fas fa-user-edit ios-list-item-icon"></i>
                  <div className="ios-list-item-content">
                    <div className="ios-list-item-title">Editar Perfil</div>
                  </div>
                  <i className="fas fa-chevron-right ios-list-item-arrow"></i>
                </button>
                <button className="ios-list-item">
                  <i className="fas fa-bell ios-list-item-icon"></i>
                  <div className="ios-list-item-content">
                    <div className="ios-list-item-title">Notificações</div>
                  </div>
                  <i className="fas fa-chevron-right ios-list-item-arrow"></i>
                </button>
                <button className="ios-list-item">
                  <i className="fas fa-shield-alt ios-list-item-icon"></i>
                  <div className="ios-list-item-content">
                    <div className="ios-list-item-title">Privacidade</div>
                  </div>
                  <i className="fas fa-chevron-right ios-list-item-arrow"></i>
                </button>
                <button className="ios-list-item">
                  <i className="fas fa-question-circle ios-list-item-icon"></i>
                  <div className="ios-list-item-content">
                    <div className="ios-list-item-title">Ajuda</div>
                  </div>
                  <i className="fas fa-chevron-right ios-list-item-arrow"></i>
                </button>
              </div>
              
              <button className="ios-button-destructive w-full mt-6">
                Sair
              </button>
            </div>
          </div>
        );
      default:
        return renderHomeScreen();
    }
  };

  const renderTabBar = () => (
    <div className="ios-tab-bar ios-safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabPress(tab.id)}
          className={`ios-tab-item ios-haptic ${activeTab === tab.id ? 'active' : ''}`}
        >
          <i className={`${tab.icon} ios-tab-icon`}></i>
          <span className="ios-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const renderConsentModal = () => (
    <div id="consent-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="ios-alert ios-fade-in">
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <i className="fas fa-hand-holding-heart text-blue-600 text-2xl"></i>
          </div>
          <h3 className="ios-alert-title">Seu acolhimento em primeiro lugar</h3>
        </div>
        
        <div className="ios-body ios-text-secondary mb-6 text-center leading-relaxed">
          <p>Para garantir que você nunca fique sem amparo, utilizamos um sistema de <b>Atendimento Híbrido</b>. Sempre que nossos profissionais estiverem ocupados, acionamos nossa IA de suporte. Ela oferece escuta e conforto imediatos, sempre supervisionada.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={declineTerms}
            className="ios-button-secondary flex-1"
          >
            Não aceito
          </button>
          <button
            onClick={acceptTerms}
            className="ios-button flex-1"
          >
            Aceito os termos
          </button>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen ios-background-primary ios-system flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
          <p className="ios-body ios-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen ios-background-primary ios-system flex items-center justify-center p-4 ios-safe-area-top ios-safe-area-bottom">
        <div className="w-full max-w-sm">
          <div className="ios-card-large text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <i className="fas fa-fingerprint text-white text-3xl"></i>
            </div>
            
            <h1 className="ios-title-large ios-text-primary mb-2">TherapySpace</h1>
            <p className="ios-body ios-text-secondary mb-8">Seu espaço de bem-estar</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const loginData = {
                fullName: formData.get('fullName') as string,
                gender: formData.get('gender') as 'M' | 'F',
                pass: formData.get('pass') as string
              };
              console.log('Login data:', loginData);
            }} className="space-y-4">
              <select 
                name="gender" 
                className="ios-select"
                required
              >
                <option value="">Selecione seu gênero</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
              
              <input
                type="text"
                name="fullName"
                placeholder="Nome completo"
                className="ios-input"
                required
              />
              
              <input
                type="password"
                name="pass"
                placeholder="Data de nascimento (DDMMAAAA)"
                maxLength={8}
                className="ios-input"
                required
              />
              
              <button
                type="submit"
                className="ios-button w-full"
              >
                Entrar
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="ios-body text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ios-background-primary ios-system flex flex-col">
      {renderStatusBar()}
      {renderNavigationHeader()}
      
      <main className="flex-1 overflow-y-auto ios-background-secondary">
        {renderContent()}
      </main>
      
      {renderTabBar()}
      {renderConsentModal()}
    </div>
  );
};

export default iOSLayout;
