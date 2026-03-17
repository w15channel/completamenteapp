import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import { useHealth } from '../hooks/useHealth';
import { Therapist, ChatMessage } from '../types';
import './AuraApp.css';

interface AuraCard {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  action: () => void;
  gradient: string;
}

const AuraApp: React.FC = () => {
  const { user, userData, isLoading } = useApp();
  const { therapists, startChat, activeChat } = useChat();
  const [activeSection, setActiveSection] = useState<'sanctuary' | 'journey' | 'vitality' | 'connections'>('sanctuary');
  const [breathingActive, setBreathingActive] = useState(false);
  const [affirmation, setAffirmation] = useState('');

  const affirmations = [
    "Eu sou merecedor de paz e bem-estar",
    "Minha jornada é única e valiosa",
    "Eu escolho a calma em cada respiração",
    "Meu corpo é meu templo sagrado",
    "Eu merece amor e respeito próprio"
  ];

  useEffect(() => {
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    setAffirmation(randomAffirmation);
  }, []);

  const auraCards: AuraCard[] = [
    {
      id: 'chat',
      title: 'Conversa Terapêutica',
      icon: '💬',
      color: 'purple',
      description: 'Conecte-se com terapeutas especializados',
      action: () => setActiveSection('journey'),
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'health',
      title: 'Bem-Estar Vital',
      icon: '🌟',
      color: 'emerald',
      description: 'Cuide do seu corpo e mente',
      action: () => setActiveSection('vitality'),
      gradient: 'from-emerald-600 to-teal-600'
    },
    {
      id: 'relax',
      title: 'Santuário Interior',
      icon: '🧘',
      color: 'blue',
      description: 'Encontre seu centro de calma',
      action: () => setBreathingActive(true),
      gradient: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'community',
      title: 'Conexões',
      icon: '🤝',
      color: 'rose',
      description: 'Compartilhe e cresça junto',
      action: () => setActiveSection('connections'),
      gradient: 'from-rose-600 to-orange-600'
    }
  ];

  const BreathingExercise = () => (
    <div className="breathing-overlay">
      <div className="breathing-circle">
        <div className="breathing-core"></div>
        <div className="breathing-text">Inspire... Expire...</div>
      </div>
      <button 
        className="close-breathing"
        onClick={() => setBreathingActive(false)}
      >
        ✕
      </button>
    </div>
  );

  const SanctuarySection = () => (
    <div className="sanctuary-container">
      <div className="sanctuary-header">
        <h1 className="sanctuary-title">Bem-vindo ao seu Santuário</h1>
        <p className="sanctuary-subtitle">{affirmation}</p>
      </div>
      
      <div className="aura-grid">
        {auraCards.map((card) => (
          <div
            key={card.id}
            className={`aura-card ${card.color}`}
            onClick={card.action}
          >
            <div className={`aura-gradient ${card.gradient}`}></div>
            <div className="aura-content">
              <div className="aura-icon">{card.icon}</div>
              <h3 className="aura-title">{card.title}</h3>
              <p className="aura-description">{card.description}</p>
            </div>
            <div className="aura-glow"></div>
          </div>
        ))}
      </div>

      <div className="daily-inspiration">
        <div className="inspiration-card">
          <h3>Reflexão do Dia</h3>
          <p>"O autocuidado não é egoísmo, é uma necessidade para poder cuidar dos outros."</p>
          <div className="inspiration-actions">
            <button className="inspiration-btn">Compartilhar</button>
            <button className="inspiration-btn">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );

  const JourneySection = () => (
    <div className="journey-container">
      <div className="journey-header">
        <button className="back-btn" onClick={() => setActiveSection('sanctuary')}>
          ← Voltar
        </button>
        <h2>Sua Jornada Terapêutica</h2>
      </div>
      
      <div className="therapists-galaxy">
        <div className="galaxy-center">
          <div className="user-avatar">
            <span>{user?.name?.[0] || 'U'}</span>
          </div>
          <p>Seu Eu Interior</p>
        </div>
        
        <div className="therapists-orbit">
          {therapists.map((therapist, index) => (
            <div
              key={therapist.id}
              className="therapist-planet"
              style={{
                '--orbit-delay': `${index * 0.5}s`,
                '--orbit-position': `${(360 / therapists.length) * index}deg`
              } as React.CSSProperties}
            >
              <div 
                className="planet-avatar"
                onClick={() => startChat(therapist.id)}
                style={{ backgroundColor: therapist.color }}
              >
                <span>{therapist.icon}</span>
              </div>
              <p>{therapist.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="journey-stats">
        <div className="stat-card">
          <span className="stat-number">12</span>
          <span className="stat-label">Sessões</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">89%</span>
          <span className="stat-label">Progresso</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">4.8</span>
          <span className="stat-label">Satisfação</span>
        </div>
      </div>
    </div>
  );

  const VitalitySection = () => (
    <div className="vitality-container">
      <div className="vitality-header">
        <button className="back-btn" onClick={() => setActiveSection('sanctuary')}>
          ← Voltar
        </button>
        <h2>Bem-Estrar Vital</h2>
      </div>

      <div className="vitality-metrics">
        <div className="metric-card water">
          <div className="metric-icon">💧</div>
          <div className="metric-info">
            <h3>Hidratação</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '65%' }}></div>
            </div>
            <span>1.3L / 2L</span>
          </div>
        </div>

        <div className="metric-card energy">
          <div className="metric-icon">⚡</div>
          <div className="metric-info">
            <h3>Energia</h3>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '78%' }}></div>
            </div>
            <span>Bom nível</span>
          </div>
        </div>

        <div className="metric-card mood">
          <div className="metric-icon">😊</div>
          <div className="metric-info">
            <h3>Humor</h3>
            <div className="mood-selector">
              {['😔', '😐', '🙂', '😊', '🤗'].map((emoji, index) => (
                <button key={index} className="mood-btn">{emoji}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="metric-card sleep">
          <div className="metric-icon">🌙</div>
          <div className="metric-info">
            <h3>Sono</h3>
            <div className="sleep-quality">
              <span>7h 30min</span>
              <div className="sleep-stars">⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </div>

      <div className="vitality-actions">
        <button className="action-btn primary">
          🏃 Registrar Atividade
        </button>
        <button className="action-btn secondary">
          🥗 Registrar Refeição
        </button>
        <button className="action-btn tertiary">
          💊 Medicamentos
        </button>
      </div>
    </div>
  );

  const ConnectionsSection = () => (
    <div className="connections-container">
      <div className="connections-header">
        <button className="back-btn" onClick={() => setActiveSection('sanctuary')}>
          ← Voltar
        </button>
        <h2>Conexões Comunitárias</h2>
      </div>

      <div className="community-space">
        <div className="support-groups">
          <h3>Grupos de Apoio</h3>
          <div className="groups-grid">
            <div className="group-card">
              <div className="group-icon">🧘‍♀️</div>
              <h4>Mindfulness</h4>
              <p>234 membros</p>
              <button className="join-btn">Entrar</button>
            </div>
            <div className="group-card">
              <div className="group-icon">💪</div>
              <h4>Autoestima</h4>
              <p>189 membros</p>
              <button className="join-btn">Entrar</button>
            </div>
            <div className="group-card">
              <div className="group-icon">🌱</div>
              <h4>Crescimento</h4>
              <p>156 membros</p>
              <button className="join-btn">Entrar</button>
            </div>
          </div>
        </div>

        <div className="shared-stories">
          <h3>Histórias Compartilhadas</h3>
          <div className="story-card">
            <div className="story-author">
              <div className="author-avatar">M</div>
              <div className="author-info">
                <span className="author-name">Maria</span>
                <span className="story-time">2h atrás</span>
              </div>
            </div>
            <p className="story-content">
              "Hoje consegui superar um medo antigo. Cada pequeno passo conta! 🌟"
            </p>
            <div className="story-actions">
              <button className="reaction-btn">❤️ 12</button>
              <button className="comment-btn">💬 3</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-orb">
          <div className="orb-core"></div>
          <div className="orb-rings"></div>
        </div>
        <p>Acessando seu santuário pessoal...</p>
      </div>
    );
  }

  return (
    <div className="aura-app">
      {breathingActive && <BreathingExercise />}
      
      <header className="aura-header">
        <div className="header-content">
          <div className="user-welcome">
            <span className="greeting">Olá, {user?.name || 'Visitante'}</span>
            <span className="time">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
          </div>
          <div className="header-actions">
            <button className="header-btn notification">🔔</button>
            <button className="header-btn profile">👤</button>
          </div>
        </div>
      </header>

      <main className="aura-main">
        {activeSection === 'sanctuary' && <SanctuarySection />}
        {activeSection === 'journey' && <JourneySection />}
        {activeSection === 'vitality' && <VitalitySection />}
        {activeSection === 'connections' && <ConnectionsSection />}
      </main>

      <nav className="aura-nav">
        <button 
          className={`nav-btn ${activeSection === 'sanctuary' ? 'active' : ''}`}
          onClick={() => setActiveSection('sanctuary')}
        >
          🏠
        </button>
        <button 
          className={`nav-btn ${activeSection === 'journey' ? 'active' : ''}`}
          onClick={() => setActiveSection('journey')}
        >
          🛤️
        </button>
        <button 
          className={`nav-btn ${activeSection === 'vitality' ? 'active' : ''}`}
          onClick={() => setActiveSection('vitality')}
        >
          💚
        </button>
        <button 
          className={`nav-btn ${activeSection === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveSection('connections')}
        >
          🤝
        </button>
      </nav>
    </div>
  );
};

export default AuraApp;
