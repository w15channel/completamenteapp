import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import { useHealth } from '../hooks/useHealth';
import { Therapist, ChatMessage, SaudeData, FinancasData } from '../types';
import './PerfectApp.css';

interface ExerciseSession {
  id: string;
  name: string;
  bodyKey: string;
  intensity: string;
  targetType: 'reps' | 'tempo';
  targetReps?: number;
  perExerciseSec: number;
  restNote?: string;
  preExecutionGuide?: string[];
}

interface GameState {
  currentLevel: number;
  totalLevels: number;
  currentChallenge: string;
  isCompleted: boolean;
}

const PerfectApp: React.FC = () => {
  const { user, userData, isLoading } = useApp();
  const { therapists, startChat, activeChat, messages, sendMessage } = useChat(user?.id || '');
  const { healthData, updateHealthData } = useHealth();
  
  const [activeTab, setActiveTab] = useState<'home' | 'saude' | 'relacional' | 'financas' | 'chat-selection' | 'chat' | 'routines' | 'relaxation'>('home');
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Health states
  const [waterAmount, setWaterAmount] = useState(250);
  const [waterTotal, setWaterTotal] = useState(0);
  const [waterGoal] = useState(2000);
  const [exerciseSession, setExerciseSession] = useState<ExerciseSession | null>(null);
  const [exerciseTimer, setExerciseTimer] = useState({ phase: 'idle', remaining: 0 });
  
  // Game states
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    totalLevels: 16,
    currentChallenge: '',
    isCompleted: false
  });
  
  // Art states
  const [artCounter, setArtCounter] = useState(1);
  const [totalArtworks] = useState(10);
  
  // Mural states
  const [muralInput, setMuralInput] = useState('');
  const [muralMessages, setMuralMessages] = useState<Array<{id: string, text: string, author: string, timestamp: number}>>([]);

  // HomeFit states
  const [homeFitState, setHomeFitState] = useState({
    bodyKey: '',
    intensity: 'iniciante',
    targetType: 'reps' as 'reps' | 'tempo',
    targetReps: 15,
    perExerciseSec: 60,
    sessionMinutes: 20,
    mode: 'texto' as 'texto' | 'voz',
    currentExercise: null as ExerciseSession | null,
    history: [] as ExerciseSession[],
    isGenerating: false
  });

  const bodies = {
    'peito': 'Peitoral',
    'costas': 'Costas',
    'ombros': 'Ombros',
    'bracos': 'Braços',
    'abdomen': 'Abdômen/Core',
    'gluteos': 'Glúteos',
    'pernas': 'Pernas',
    'corpo-todo': 'Corpo todo',
    'mobilidade': 'Mobilidade/Postura'
  };

  const generateExercise = useCallback(async () => {
    setHomeFitState(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate AI generation
    setTimeout(() => {
      const exercise: ExerciseSession = {
        id: Date.now().toString(),
        name: 'Agachamento Livre',
        bodyKey: homeFitState.bodyKey || 'corpo-todo',
        intensity: homeFitState.intensity,
        targetType: homeFitState.targetType,
        targetReps: homeFitState.targetType === 'reps' ? homeFitState.targetReps : undefined,
        perExerciseSec: homeFitState.perExerciseSec,
        restNote: 'Agora descanse por 1 minuto antes do próximo exercício, hidratando e normalizando a respiração.',
        preExecutionGuide: [
          'Posicione os pés na largura dos ombros',
          'Mantenha as costas retas e o peito erguido',
          'Desça lentamente até os joelhos formarem 90 graus',
          'Retorne à posição inicial de forma controlada'
        ]
      };
      
      setHomeFitState(prev => ({
        ...prev,
        currentExercise: exercise,
        isGenerating: false
      }));
    }, 2000);
  }, [homeFitState.bodyKey, homeFitState.intensity, homeFitState.targetType, homeFitState.targetReps, homeFitState.perExerciseSec]);

  const startExercise = useCallback(() => {
    if (!homeFitState.currentExercise) return;
    
    setExerciseTimer({ phase: 'prep', remaining: 20 });
    
    const prepInterval = setInterval(() => {
      setExerciseTimer(prev => {
        if (prev.remaining <= 1) {
          clearInterval(prepInterval);
          return { phase: 'work', remaining: homeFitState.perExerciseSec };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    
    const workInterval = setInterval(() => {
      setExerciseTimer(prev => {
        if (prev.remaining <= 1) {
          clearInterval(workInterval);
          // Add to history
          setHomeFitState(prev => ({
            ...prev,
            history: [...prev.history, homeFitState.currentExercise!]
          }));
          return { phase: 'completed', remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
  }, [homeFitState.currentExercise, homeFitState.perExerciseSec]);

  const addWater = useCallback(() => {
    const newTotal = waterTotal + waterAmount;
    setWaterTotal(newTotal);
    
    // Update health data
    if (healthData) {
      updateHealthData({
        ...healthData,
        waterIntake: newTotal,
        water: {
          ...healthData.water,
          daily: newTotal,
          lastUpdate: Date.now()
        }
      });
    }
  }, [waterTotal, waterAmount, healthData, updateHealthData]);

  const sendMessageHandler = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTherapist) return;
    
    setIsTyping(true);
    sendMessage(chatInput);
    setChatInput('');
    
    // Simulate response
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  }, [chatInput, selectedTherapist, sendMessage]);

  const startGame = useCallback(() => {
    const challenges = [
      'Respire fundo 3 vezes',
      'Pense em 3 coisas gratas',
      'Alongue os braços por 30s',
      'Beba um copo de água',
      'Feche os olhos por 20s',
      'Sorria por 10 segundos',
      'Pense em uma memória feliz',
      'Alongue o pescoço'
    ];
    
    setGameState({
      currentLevel: 1,
      totalLevels: 16,
      currentChallenge: challenges[0],
      isCompleted: false
    });
  }, []);

  const nextGameChallenge = useCallback(() => {
    setGameState(prev => {
      if (prev.currentLevel >= prev.totalLevels) {
        return { ...prev, isCompleted: true };
      }
      
      const challenges = [
        'Respire fundo 3 vezes',
        'Pense em 3 coisas gratas',
        'Alongue os braços por 30s',
        'Beba um copo de água',
        'Feche os olhos por 20s',
        'Sorria por 10 segundos',
        'Pense em uma memória feliz',
        'Alongue o pescoço'
      ];
      
      return {
        ...prev,
        currentLevel: prev.currentLevel + 1,
        currentChallenge: challenges[prev.currentLevel % challenges.length]
      };
    });
  }, []);

  const saveMuralMessage = useCallback(() => {
    if (!muralInput.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      text: muralInput,
      author: user?.name || 'Anônimo',
      timestamp: Date.now()
    };
    
    setMuralMessages(prev => [newMessage, ...prev]);
    setMuralInput('');
  }, [muralInput, user]);

  const nextArtwork = useCallback(() => {
    setArtCounter(prev => (prev >= totalArtworks) ? 1 : prev + 1);
  }, [totalArtworks]);

  const prevArtwork = useCallback(() => {
    setArtCounter(prev => (prev <= 1) ? totalArtworks : prev - 1);
  }, [totalArtworks]);

  // Render components
  const renderHomeTab = () => (
    <div className="home-container">
      <div className="welcome-card">
        <div className="welcome-avatar">
          <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
        </div>
        <h2>Muito bom te ver aqui, {user?.name || 'Visitante'}</h2>
        <div className="quick-actions">
          <button onClick={() => setActiveTab('chat-selection')} className="action-card chat">
            <span className="action-icon">💬</span>
            <span className="action-title">Conversar</span>
          </button>
          <button onClick={() => setActiveTab('saude')} className="action-card health">
            <span className="action-icon">❤️</span>
            <span className="action-title">Saúde & Corpo</span>
          </button>
          <button onClick={() => setActiveTab('routines')} className="action-card routines">
            <span className="action-icon">✅</span>
            <span className="action-title">Minha Rotina</span>
          </button>
          <button onClick={() => setActiveTab('relacional')} className="action-card relational">
            <span className="action-icon">❤️</span>
            <span className="action-title">Relacional</span>
          </button>
          <button onClick={() => setActiveTab('financas')} className="action-card finance">
            <span className="action-icon">💰</span>
            <span className="action-title">Finanças</span>
          </button>
          <button onClick={() => setActiveTab('relaxation')} className="action-card relaxation">
            <span className="action-icon">🧘</span>
            <span className="action-title">Relaxamento</span>
          </button>
        </div>
      </div>
      
      <div className="daily-inspiration">
        <h3>Reflexão do Dia</h3>
        <p>"O autocuidado é o ato mais revolucionário que podemos praticar."</p>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="health-container">
      <div className="health-header">
        <button onClick={() => setActiveTab('home')} className="back-btn">←</button>
        <h2>Saúde & Corpo</h2>
      </div>
      
      <div className="health-tabs">
        <button className="tab-btn active">Perfil</button>
        <button className="tab-btn">Água</button>
        <button className="tab-btn">Nutrição</button>
        <button className="tab-btn">Exercício</button>
        <button className="tab-btn">Cardio</button>
        <button className="tab-btn">Ansiedade</button>
      </div>
      
      <div className="health-content">
        <div className="health-card">
          <h3>Hidratação</h3>
          <div className="water-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(waterTotal / waterGoal) * 100}%` }}></div>
            </div>
            <span>{waterTotal}ml / {waterGoal}ml</span>
          </div>
          
          <div className="water-controls">
            <select value={waterAmount} onChange={(e) => setWaterAmount(Number(e.target.value))}>
              <option value={200}>200ml</option>
              <option value={250}>250ml</option>
              <option value={300}>300ml</option>
              <option value={500}>500ml</option>
            </select>
            <button onClick={addWater} className="add-water-btn">Adicionar</button>
          </div>
        </div>
        
        <div className="health-card">
          <h3>HomeFit IA</h3>
          <div className="homefit-controls">
            <select value={homeFitState.bodyKey} onChange={(e) => setHomeFitState(prev => ({ ...prev, bodyKey: e.target.value }))}>
              <option value="">Selecione...</option>
              {Object.entries(bodies).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
            
            <div className="intensity-selector">
              <button className={homeFitState.intensity === 'iniciante' ? 'active' : ''} onClick={() => setHomeFitState(prev => ({ ...prev, intensity: 'iniciante' }))}>Iniciante</button>
              <button className={homeFitState.intensity === 'intermediario' ? 'active' : ''} onClick={() => setHomeFitState(prev => ({ ...prev, intensity: 'intermediario' }))}>Intermediário</button>
              <button className={homeFitState.intensity === 'avancado' ? 'active' : ''} onClick={() => setHomeFitState(prev => ({ ...prev, intensity: 'avancado' }))}>Avançado</button>
            </div>
            
            <button onClick={generateExercise} disabled={homeFitState.isGenerating} className="generate-exercise-btn">
              {homeFitState.isGenerating ? 'Gerando...' : 'Gerar Exercício'}
            </button>
          </div>
          
          {homeFitState.currentExercise && (
            <div className="exercise-display">
              <h4>{homeFitState.currentExercise.name}</h4>
              <p>{bodies[homeFitState.currentExercise.bodyKey as keyof typeof bodies]} - {homeFitState.currentExercise.intensity}</p>
              
              {homeFitState.currentExercise.preExecutionGuide && (
                <div className="exercise-guide">
                  <h5>Antes de iniciar:</h5>
                  <ul>
                    {homeFitState.currentExercise.preExecutionGuide.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {exerciseTimer.phase !== 'idle' && (
                <div className="exercise-timer">
                  <div className="timer-display">
                    {exerciseTimer.phase === 'prep' ? 'Preparação' : exerciseTimer.phase === 'work' ? 'Executando' : 'Concluído'}: {exerciseTimer.remaining}s
                  </div>
                  {exerciseTimer.phase === 'idle' && (
                    <button onClick={startExercise} className="start-exercise-btn">Iniciar Exercício</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderRelaxationTab = () => (
    <div className="relaxation-container">
      <div className="relaxation-header">
        <button onClick={() => setActiveTab('home')} className="back-btn">←</button>
        <h2>Central de Relaxamento & Foco</h2>
      </div>
      
      <div className="relaxation-grid">
        <div className="relaxation-card games">
          <h3>Sequência de Descompressão</h3>
          <div className="game-level">Nível {gameState.currentLevel}/{gameState.totalLevels}</div>
          
          {!gameState.isCompleted ? (
            <div className="game-content">
              <div className="game-challenge">
                <p>{gameState.currentChallenge || '16 Desafios para reconfigurar seu foco.'}</p>
              </div>
              
              {gameState.currentLevel === 1 ? (
                <button onClick={startGame} className="start-game-btn">Iniciar</button>
              ) : (
                <button onClick={nextGameChallenge} className="next-game-btn">Próximo Desafio</button>
              )}
            </div>
          ) : (
            <div className="game-completed">
              <h3>🎉 Parabéns!</h3>
              <p>Você completou todos os desafios!</p>
            </div>
          )}
        </div>
        
        <div className="relaxation-card art">
          <h3>Expressão Criativa</h3>
          <div className="art-controls">
            <button onClick={prevArtwork} className="art-nav">←</button>
            <span>Desenho {artCounter}/{totalArtworks}</span>
            <button onClick={nextArtwork} className="art-nav">→</button>
          </div>
          <div className="art-canvas">
            <div className="art-placeholder">
              <span>🎨</span>
              <p>Área para desenho</p>
            </div>
          </div>
        </div>
        
        <div className="relaxation-card mural">
          <h3>Mural de Transformação</h3>
          <div className="mural-input-area">
            <textarea
              value={muralInput}
              onChange={(e) => setMuralInput(e.target.value)}
              placeholder="Escreva algo transformador"
              className="mural-textarea"
            />
            <button onClick={saveMuralMessage} className="publish-btn">Publicar</button>
          </div>
          
          <div className="mural-messages">
            {muralMessages.map(message => (
              <div key={message.id} className="mural-message">
                <div className="message-header">
                  <span className="message-author">{message.author}</span>
                  <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="message-text">{message.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatSelection = () => (
    <div className="chat-selection-container">
      <div className="chat-selection-header">
        <button onClick={() => setActiveTab('home')} className="back-btn">←</button>
        <h2>Nossa Equipe</h2>
      </div>
      
      <div className="therapists-grid">
        {therapists.map(therapist => (
          <div key={therapist.id} className="therapist-card" onClick={() => {
            setSelectedTherapist(therapist);
            startChat(therapist.id);
            setActiveTab('chat');
          }}>
            <div className="therapist-avatar" style={{ backgroundColor: therapist.color || '#3b82f6' }}>
              <span>{therapist.icon || '👤'}</span>
            </div>
            <h3>{therapist.name}</h3>
            <p>{therapist.specialty}</p>
            <div className="therapist-status">
              <span className="status-dot online"></span>
              <span>Online</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="chat-container">
      <div className="chat-header">
        <div className="therapist-info">
          <div className="therapist-avatar" style={{ backgroundColor: selectedTherapist?.color || '#3b82f6' }}>
            <span>{selectedTherapist?.icon || '👤'}</span>
          </div>
          <div>
            <h3>{selectedTherapist?.name}</h3>
            <div className="status-indicator">
              <span className="status-dot online"></span>
              <span>Online</span>
            </div>
          </div>
        </div>
        <button onClick={() => setActiveTab('chat-selection')} className="close-btn">×</button>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender === 'user' ? 'user' : 'therapist'}`}>
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message therapist">
            <div className="typing-indicator">
              <span>Escrevendo</span>
              <span className="typing-dots">_</span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={sendMessageHandler} className="chat-input-form">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Escreva sua mensagem"
          className="chat-input"
        />
        <button type="submit" className="send-btn">
          <span>➤</span>
        </button>
      </form>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="perfect-app">
      <header className="app-header">
        <div className="header-content">
          <h1>ESPAÇO | WR TERAPIA®</h1>
          <div className="user-info">
            <span>Olá, {user?.name || 'Visitante'}</span>
            <button className="logout-btn">Sair</button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'home' && renderHomeTab()}
        {activeTab === 'saude' && renderHealthTab()}
        {activeTab === 'relaxation' && renderRelaxationTab()}
        {activeTab === 'chat-selection' && renderChatSelection()}
        {activeTab === 'chat' && renderChat()}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <span>🏠</span>
        </button>
        <button className={`nav-btn ${activeTab === 'saude' ? 'active' : ''}`} onClick={() => setActiveTab('saude')}>
          <span>❤️</span>
        </button>
        <button className={`nav-btn ${activeTab === 'relaxation' ? 'active' : ''}`} onClick={() => setActiveTab('relaxation')}>
          <span>🧘</span>
        </button>
        <button className={`nav-btn ${activeTab === 'chat-selection' ? 'active' : ''}`} onClick={() => setActiveTab('chat-selection')}>
          <span>💬</span>
        </button>
      </nav>
    </div>
  );
};

export default PerfectApp;
