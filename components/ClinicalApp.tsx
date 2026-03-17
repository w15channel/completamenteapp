import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useChat } from '../hooks/useChat';
import { useHealth } from '../hooks/useHealth';
import { Therapist, ChatMessage } from '../types';
import './ClinicalApp.css';

interface ClinicalModule {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'assessment' | 'therapy' | 'monitoring' | 'resources';
  description: string;
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  }[];
  action: () => void;
}

const ClinicalApp: React.FC = () => {
  const { user, userData, isLoading } = useApp();
  const { therapists, startChat, activeChat, messages } = useChat(user?.id || '');
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const clinicalModules: ClinicalModule[] = [
    {
      id: 'assessment',
      title: 'Avaliação Clínica',
      subtitle: 'Instrumentos de Avaliação',
      icon: '📋',
      category: 'assessment',
      description: 'Aplicar e gerenciar instrumentos de avaliação psicológica',
      metrics: [
        { label: 'Avaliações esta semana', value: '12', trend: 'up' },
        { label: 'Pendentes', value: '3', trend: 'down' }
      ],
      action: () => setActiveModule('assessment')
    },
    {
      id: 'therapy',
      title: 'Sessões Terapêuticas',
      subtitle: 'Gestão de Consultas',
      icon: '👥',
      category: 'therapy',
      description: 'Agendar e conduzir sessões terapêuticas',
      metrics: [
        { label: 'Sessões hoje', value: '8', trend: 'stable' },
        { label: 'Esta semana', value: '24', trend: 'up' }
      ],
      action: () => setActiveModule('therapy')
    },
    {
      id: 'monitoring',
      title: 'Monitoramento',
      subtitle: 'Evolução do Paciente',
      icon: '📊',
      category: 'monitoring',
      description: 'Acompanhar progresso e indicadores clínicos',
      metrics: [
        { label: 'Pacientes ativos', value: '45', trend: 'up' },
        { label: 'Em tratamento', value: '32', trend: 'stable' }
      ],
      action: () => setActiveModule('monitoring')
    },
    {
      id: 'resources',
      title: 'Recursos Clínicos',
      subtitle: 'Ferramentas e Materiais',
      icon: '📚',
      category: 'resources',
      description: 'Acessar recursos e materiais terapêuticos',
      metrics: [
        { label: 'Protocolos', value: '18', trend: 'up' },
        { label: 'Exercícios', value: '47', trend: 'up' }
      ],
      action: () => setActiveModule('resources')
    }
  ];

  const recentSessions = [
    { id: '1', patient: 'Ana Silva', time: '14:00', type: 'Individual', status: 'confirmed' },
    { id: '2', patient: 'Carlos Mendes', time: '15:30', type: 'Casal', status: 'confirmed' },
    { id: '3', patient: 'Mariana Costa', time: '17:00', type: 'Individual', status: 'pending' },
    { id: '4', patient: 'Roberto Alves', time: '18:00', type: 'Família', status: 'confirmed' }
  ];

  const patientsList = [
    { id: '1', name: 'Ana Silva', age: 28, condition: 'Ansiedade', sessions: 12, progress: 78 },
    { id: '2', name: 'Carlos Mendes', age: 35, condition: 'Depressão', sessions: 8, progress: 65 },
    { id: '3', name: 'Mariana Costa', age: 42, condition: 'Transtorno de Estresse', sessions: 15, progress: 82 },
    { id: '4', name: 'Roberto Alves', age: 51, condition: 'Dependência Química', sessions: 20, progress: 45 }
  ];

  const assessmentTools = [
    { id: '1', name: 'Beck Depression Inventory (BDI-II)', category: 'Depressão', time: '20 min', reliability: 0.92 },
    { id: '2', name: 'State-Trait Anxiety Inventory (STAI)', category: 'Ansiedade', time: '15 min', reliability: 0.89 },
    { id: '3', name: 'Hamilton Rating Scale for Depression', category: 'Depressão', time: '10 min', reliability: 0.90 },
    { id: '4', name: 'GAD-7', category: 'Ansiedade', time: '5 min', reliability: 0.92 }
  ];

  const DashboardView = () => (
    <div className="clinical-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Painel Clínico</h1>
          <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">Nova Sessão</button>
          <button className="btn-secondary">Relatórios</button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>Pacientes Ativos</h3>
            <span className="metric-trend up">↑ 12%</span>
          </div>
          <div className="metric-value">45</div>
          <div className="metric-detail">3 novos esta semana</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Sessões Esta Semana</h3>
            <span className="metric-trend stable">→ 0%</span>
          </div>
          <div className="metric-value">24</div>
          <div className="metric-detail">Meta: 25 sessões</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Taxa de Comparecimento</h3>
            <span className="metric-trend up">↑ 5%</span>
          </div>
          <div className="metric-value">92%</div>
          <div className="metric-detail">Últimos 30 dias</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Avaliações Pendentes</h3>
            <span className="metric-trend down">↓ 8%</span>
          </div>
          <div className="metric-value">3</div>
          <div className="metric-detail">Revisão necessária</div>
        </div>
      </div>

      <div className="modules-grid">
        {clinicalModules.map((module) => (
          <div key={module.id} className="module-card" onClick={module.action}>
            <div className="module-icon">{module.icon}</div>
            <div className="module-content">
              <h3>{module.title}</h3>
              <p>{module.subtitle}</p>
              <p className="module-description">{module.description}</p>
              {module.metrics && (
                <div className="module-metrics">
                  {module.metrics.map((metric, index) => (
                    <div key={index} className="mini-metric">
                      <span className="mini-value">{metric.value}</span>
                      <span className="mini-label">{metric.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="module-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Sessões de Hoje</h2>
          <div className="sessions-list">
            {recentSessions.map((session) => (
              <div key={session.id} className={`session-item ${session.status}`}>
                <div className="session-time">{session.time}</div>
                <div className="session-info">
                  <div className="patient-name">{session.patient}</div>
                  <div className="session-type">{session.type}</div>
                </div>
                <div className="session-status">
                  {session.status === 'confirmed' ? '✓ Confirmado' : '⏳ Pendente'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Pacientes em Destaque</h2>
          <div className="patients-summary">
            {patientsList.slice(0, 3).map((patient) => (
              <div key={patient.id} className="patient-card">
                <div className="patient-info">
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-details">{patient.age} anos • {patient.condition}</div>
                </div>
                <div className="patient-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${patient.progress}%` }}></div>
                  </div>
                  <span className="progress-text">{patient.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const AssessmentView = () => (
    <div className="assessment-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => setActiveModule('dashboard')}>
          ← Voltar
        </button>
        <div className="header-info">
          <h1>Avaliação Clínica</h1>
          <p>Instrumentos e protocolos de avaliação</p>
        </div>
      </div>

      <div className="assessment-grid">
        <div className="assessment-section">
          <h2>Instrumentos Disponíveis</h2>
          <div className="tools-list">
            {assessmentTools.map((tool) => (
              <div key={tool.id} className="tool-card">
                <div className="tool-header">
                  <h3>{tool.name}</h3>
                  <span className="tool-category">{tool.category}</span>
                </div>
                <div className="tool-specs">
                  <div className="spec">
                    <span className="spec-label">Duração:</span>
                    <span className="spec-value">{tool.time}</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Confiabilidade:</span>
                    <span className="spec-value">{tool.reliability}</span>
                  </div>
                </div>
                <div className="tool-actions">
                  <button className="btn-primary">Aplicar</button>
                  <button className="btn-secondary">Visualizar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="assessment-section">
          <h2>Avaliações Recentes</h2>
          <div className="recent-assessments">
            <div className="assessment-item">
              <div className="assessment-header">
                <div className="patient-name">Ana Silva</div>
                <div className="assessment-date">15/03/2025</div>
              </div>
              <div className="assessment-details">
                <div className="instrument">BDI-II</div>
                <div className="score">Pontuação: 18 (Leve)</div>
              </div>
              <div className="assessment-actions">
                <button className="btn-text">Ver Resultados</button>
              </div>
            </div>

            <div className="assessment-item">
              <div className="assessment-header">
                <div className="patient-name">Carlos Mendes</div>
                <div className="assessment-date">14/03/2025</div>
              </div>
              <div className="assessment-details">
                <div className="instrument">STAI</div>
                <div className="score">Pontuação: 45 (Moderado)</div>
              </div>
              <div className="assessment-actions">
                <button className="btn-text">Ver Resultados</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TherapyView = () => (
    <div className="therapy-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => setActiveModule('dashboard')}>
          ← Voltar
        </button>
        <div className="header-info">
          <h1>Sessões Terapêuticas</h1>
          <p>Gerenciamento de consultas e tratamento</p>
        </div>
      </div>

      <div className="therapy-grid">
        <div className="therapy-section">
          <h2>Agenda de Hoje</h2>
          <div className="schedule-timeline">
            {recentSessions.map((session, index) => (
              <div key={session.id} className="timeline-item">
                <div className="timeline-time">{session.time}</div>
                <div className="timeline-content">
                  <div className="session-card">
                    <div className="session-header">
                      <h4>{session.patient}</h4>
                      <span className={`session-status ${session.status}`}>
                        {session.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                    </div>
                    <div className="session-type">{session.type}</div>
                    <div className="session-actions">
                      <button className="btn-primary">Iniciar Sessão</button>
                      <button className="btn-text">Detalhes</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="therapy-section">
          <h2>Pacientes em Tratamento</h2>
          <div className="patients-grid">
            {patientsList.map((patient) => (
              <div key={patient.id} className="patient-card-detailed">
                <div className="patient-header">
                  <div className="patient-avatar">{patient.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="patient-info">
                    <h4>{patient.name}</h4>
                    <p>{patient.age} anos • {patient.condition}</p>
                  </div>
                </div>
                <div className="patient-stats">
                  <div className="stat">
                    <span className="stat-label">Sessões:</span>
                    <span className="stat-value">{patient.sessions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Progresso:</span>
                    <span className="stat-value">{patient.progress}%</span>
                  </div>
                </div>
                <div className="patient-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${patient.progress}%` }}></div>
                  </div>
                </div>
                <div className="patient-actions">
                  <button className="btn-primary">Ver Prontuário</button>
                  <button className="btn-secondary">Nova Sessão</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MonitoringView = () => (
    <div className="monitoring-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => setActiveModule('dashboard')}>
          ← Voltar
        </button>
        <div className="header-info">
          <h1>Monitoramento Clínico</h1>
          <p>Acompanhamento da evolução dos pacientes</p>
        </div>
      </div>

      <div className="monitoring-grid">
        <div className="monitoring-section">
          <h2>Indicadores Clínicos</h2>
          <div className="indicators-grid">
            <div className="indicator-card">
              <h3>Humor Geral</h3>
              <div className="indicator-chart">
                <div className="chart-bar" style={{ height: '70%' }}></div>
                <div className="chart-bar" style={{ height: '85%' }}></div>
                <div className="chart-bar" style={{ height: '75%' }}></div>
                <div className="chart-bar" style={{ height: '90%' }}></div>
              </div>
              <div className="indicator-trend">Melhora: +15%</div>
            </div>

            <div className="indicator-card">
              <h3>Nível de Ansiedade</h3>
              <div className="indicator-chart">
                <div className="chart-bar anxiety" style={{ height: '60%' }}></div>
                <div className="chart-bar anxiety" style={{ height: '55%' }}></div>
                <div className="chart-bar anxiety" style={{ height: '45%' }}></div>
                <div className="chart-bar anxiety" style={{ height: '40%' }}></div>
              </div>
              <div className="indicator-trend">Redução: -20%</div>
            </div>

            <div className="indicator-card">
              <h3>Adesão ao Tratamento</h3>
              <div className="indicator-chart">
                <div className="chart-bar adherence" style={{ height: '95%' }}></div>
                <div className="chart-bar adherence" style={{ height: '92%' }}></div>
                <div className="chart-bar adherence" style={{ height: '98%' }}></div>
                <div className="chart-bar adherence" style={{ height: '94%' }}></div>
              </div>
              <div className="indicator-trend">Estável: 94%</div>
            </div>
          </div>
        </div>

        <div className="monitoring-section">
          <h2>Alertas Clínicos</h2>
          <div className="alerts-list">
            <div className="alert-item high">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>Paciente em Risco</h4>
                <p>Roberto Alves - Piora nos sintomas depressivos</p>
                <div className="alert-time">Há 2 horas</div>
              </div>
              <button className="alert-action">Intervir</button>
            </div>

            <div className="alert-item medium">
              <div className="alert-icon">📊</div>
              <div className="alert-content">
                <h4>Avaliação Necessária</h4>
                <p>Mariana Costa - 30 dias sem avaliação</p>
                <div className="alert-time">Há 1 dia</div>
              </div>
              <button className="alert-action">Agendar</button>
            </div>

            <div className="alert-item low">
              <div className="alert-icon">📅</div>
              <div className="alert-content">
                <h4>Follow-up Requerido</h4>
                <p>Ana Silva - Próxima sessão em 3 dias</p>
                <div className="alert-time">Há 3 dias</div>
              </div>
              <button className="alert-action">Contatar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ResourcesView = () => (
    <div className="resources-view">
      <div className="view-header">
        <button className="back-btn" onClick={() => setActiveModule('dashboard')}>
          ← Voltar
        </button>
        <div className="header-info">
          <h1>Recursos Clínicos</h1>
          <p>Ferramentas e materiais terapêuticos</p>
        </div>
      </div>

      <div className="resources-grid">
        <div className="resources-section">
          <h2>Protocolos Terapêuticos</h2>
          <div className="protocols-list">
            <div className="protocol-card">
              <div className="protocol-header">
                <h3>TCC - Depressão</h3>
                <span className="protocol-duration">12 semanas</span>
              </div>
              <p>Protocolo baseado em evidências para tratamento de depressão maior</p>
              <div className="protocol-actions">
                <button className="btn-primary">Aplicar</button>
                <button className="btn-secondary">Visualizar</button>
              </div>
            </div>

            <div className="protocol-card">
              <div className="protocol-header">
                <h3>Terapia de Aceitação e Compromisso</h3>
                <span className="protocol-duration">8 semanas</span>
              </div>
              <p>Abordagem contextual para transtornos de ansiedade</p>
              <div className="protocol-actions">
                <button className="btn-primary">Aplicar</button>
                <button className="btn-secondary">Visualizar</button>
              </div>
            </div>

            <div className="protocol-card">
              <div className="protocol-header">
                <h3>Terapia Familiar Sistêmica</h3>
                <span className="protocol-duration">16 semanas</span>
              </div>
              <p>Intervenção familiar para conflitos relacionais</p>
              <div className="protocol-actions">
                <button className="btn-primary">Aplicar</button>
                <button className="btn-secondary">Visualizar</button>
              </div>
            </div>
          </div>
        </div>

        <div className="resources-section">
          <h2>Exercícios e Técnicas</h2>
          <div className="exercises-grid">
            <div className="exercise-card">
              <h3>Respiração Diafragmática</h3>
              <p>Técnica de relaxamento para ansiedade aguda</p>
              <div className="exercise-time">5-10 min</div>
              <button className="btn-text">Aplicar</button>
            </div>

            <div className="exercise-card">
              <h3>Restruturação Cognitiva</h3>
              <p>Identificação e modificação de pensamentos disfuncionais</p>
              <div className="exercise-time">15-20 min</div>
              <button className="btn-text">Aplicar</button>
            </div>

            <div className="exercise-card">
              <h3>Exposição Gradual</h3>
              <p>Técnica para tratamento de fobias e transtornos de ansiedade</p>
              <div className="exercise-time">20-30 min</div>
              <button className="btn-text">Aplicar</button>
            </div>

            <div className="exercise-card">
              <h3>Mindfulness</h3>
              <p>Atenção plena para redução de estresse</p>
              <div className="exercise-time">10-15 min</div>
              <button className="btn-text">Aplicar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando sistema clínico...</p>
      </div>
    );
  }

  return (
    <div className="clinical-app">
      <header className="clinical-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">Sistema Clínico</span>
          </div>
          <div className="user-info">
            <span className="user-name">Dr. {user?.name || 'Terapeuta'}</span>
            <button className="logout-btn">Sair</button>
          </div>
        </div>
      </header>

      <main className="clinical-main">
        {activeModule === 'dashboard' && <DashboardView />}
        {activeModule === 'assessment' && <AssessmentView />}
        {activeModule === 'therapy' && <TherapyView />}
        {activeModule === 'monitoring' && <MonitoringView />}
        {activeModule === 'resources' && <ResourcesView />}
      </main>

      <nav className="clinical-nav">
        <button 
          className={`nav-item ${activeModule === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveModule('dashboard')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Painel</span>
        </button>
        <button 
          className={`nav-item ${activeModule === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveModule('assessment')}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Avaliação</span>
        </button>
        <button 
          className={`nav-item ${activeModule === 'therapy' ? 'active' : ''}`}
          onClick={() => setActiveModule('therapy')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Terapia</span>
        </button>
        <button 
          className={`nav-item ${activeModule === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveModule('monitoring')}
        >
          <span className="nav-icon">📈</span>
          <span className="nav-label">Monitoramento</span>
        </button>
        <button 
          className={`nav-item ${activeModule === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveModule('resources')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Recursos</span>
        </button>
      </nav>
    </div>
  );
};

export default ClinicalApp;
