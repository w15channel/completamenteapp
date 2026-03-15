import React, { useState } from 'react';
import { HealthData } from '../types';

interface iOSHealthProfileProps {
  healthData: HealthData;
  gender: string;
  age: number;
  onUpdateHealthData: (data: HealthData) => void;
  onResetProfile: () => void;
  onSyncData: () => void;
  onExportData: () => void;
  onClearBackups: () => void;
}

export const iOSHealthProfile: React.FC<iOSHealthProfileProps> = ({
  healthData,
  gender,
  age,
  onUpdateHealthData,
  onResetProfile,
  onSyncData,
  onExportData,
  onClearBackups
}) => {
  const [activeSection, setActiveSection] = useState('perfil');

  const sections = [
    { id: 'perfil', label: 'Perfil', icon: 'fas fa-user' },
    { id: 'agua', label: 'Água', icon: 'fas fa-tint' },
    { id: 'nutricao', label: 'Nutrição', icon: 'fas fa-apple-alt' },
    { id: 'exercicio', label: 'Exercício', icon: 'fas fa-running' },
    { id: 'cardio', label: 'Cardio', icon: 'fas fa-heartbeat' },
    { id: 'ansiedade', label: 'Ansiedade', icon: 'fas fa-brain' }
  ];

  const calculateBMI = () => {
    if (healthData.weight && healthData.height) {
      const bmi = healthData.weight / (healthData.height * healthData.height);
      return bmi.toFixed(1);
    }
    return '--';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const getWaterProgress = () => {
    const goal = 2000; // 2L default goal
    const percentage = Math.min((healthData.waterIntake || 0) / goal * 100, 100);
    return percentage;
  };

  const renderPerfilSection = () => (
    <div className="space-y-4">
      <div className="ios-card-large">
        <div className="flex items-center justify-between mb-6">
          <h3 className="ios-headline ios-text-primary">Perfil Biológico</h3>
          <div className="text-right">
            <div className="ios-title3 text-blue-600">IMC: {calculateBMI()}</div>
            <div className="ios-footnote ios-text-secondary">
              {healthData.weight && healthData.height ? getBMICategory(parseFloat(calculateBMI())) : '--'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="ios-caption1 ios-text-secondary font-medium mb-2 block">
              Peso (kg)
            </label>
            <input
              type="number"
              value={healthData.weight || ''}
              onChange={(e) => onUpdateHealthData({...healthData, weight: parseFloat(e.target.value)})}
              className="ios-input text-center"
              placeholder="75"
            />
          </div>
          <div>
            <label className="ios-caption1 ios-text-secondary font-medium mb-2 block">
              Altura (m)
            </label>
            <input
              type="number"
              step="0.01"
              value={healthData.height || ''}
              onChange={(e) => onUpdateHealthData({...healthData, height: parseFloat(e.target.value)})}
              className="ios-input text-center"
              placeholder="1.75"
            />
          </div>
        </div>

        <button className="ios-button w-full">
          Atualizar Medidas
        </button>
      </div>

      <div className="ios-card-large">
        <h3 className="ios-headline ios-text-primary mb-4">Informações Pessoais</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="ios-body ios-text-secondary">Gênero</span>
            <span className="ios-body ios-text-primary font-medium capitalize">{gender}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="ios-body ios-text-secondary">Idade</span>
            <span className="ios-body ios-text-primary font-medium">{age} anos</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="ios-body ios-text-secondary">Tipo Sanguíneo</span>
            <span className="ios-body ios-text-primary font-medium">{healthData.bloodType || 'Não informado'}</span>
          </div>
        </div>
      </div>

      <div className="ios-card-large">
        <h3 className="ios-headline ios-text-primary mb-4">Gerenciamento de Dados</h3>
        <div className="space-y-3">
          <button onClick={onSyncData} className="ios-button-secondary w-full flex items-center justify-center gap-2">
            <i className="fas fa-sync"></i>
            Sincronizar Dados
          </button>
          <button onClick={onExportData} className="ios-button-secondary w-full flex items-center justify-center gap-2">
            <i className="fas fa-download"></i>
            Exportar Backup
          </button>
          <button onClick={onClearBackups} className="ios-button-destructive w-full flex items-center justify-center gap-2">
            <i className="fas fa-trash"></i>
            Limpar Backups
          </button>
          <button onClick={onResetProfile} className="ios-button-plain w-full text-red-600">
            Resetar Perfil
          </button>
        </div>
      </div>
    </div>
  );

  const renderAguaSection = () => (
    <div className="space-y-4">
      <div className="ios-card-large">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="ios-headline ios-text-primary flex items-center gap-2">
              <i className="fas fa-tint text-blue-500"></i>
              Hidratação
            </h3>
            <p className="ios-footnote ios-text-secondary mt-1">
              Meta diária: 2000ml
            </p>
          </div>
          <div className="text-right">
            <div className="ios-title3 text-blue-600">{healthData.waterIntake || 0}ml</div>
            <div className="ios-footnote ios-text-secondary">{getWaterProgress().toFixed(0)}%</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${getWaterProgress()}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <select className="ios-select">
            <option>Água pura</option>
            <option>Suco</option>
            <option>Chá</option>
            <option>Refrigerante</option>
          </select>
          <input
            type="number"
            value="250"
            className="ios-input text-center"
            placeholder="ml"
          />
        </div>

        <div className="flex gap-3">
          <button className="ios-button-secondary flex-1">
            <i className="fas fa-minus"></i>
          </button>
          <button className="ios-button flex-[2]">
            <i className="fas fa-plus mr-2"></i>
            Adicionar
          </button>
        </div>
      </div>

      <div className="ios-card">
        <h4 className="ios-subhead ios-text-primary mb-3">Lembrete</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="ios-body ios-text-secondary">Alerta a cada</p>
            <p className="ios-footnote ios-text-tertiary">60 minutos</p>
          </div>
          <button className="ios-switch active">
            <div className="ios-switch-thumb"></div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderNutricaoSection = () => (
    <div className="space-y-4">
      <div className="ios-card-large">
        <h3 className="ios-headline ios-text-primary mb-4">
          <i className="fas fa-utensils text-green-600 mr-2"></i>
          Análise Nutricional
        </h3>
        
        <div className="mb-4">
          <label className="ios-caption1 ios-text-secondary font-medium mb-2 block">
            Descreva sua refeição
          </label>
          <textarea
            className="ios-textarea"
            rows={3}
            placeholder="Ex: frango grelhado, arroz integral e salada"
          ></textarea>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <select className="ios-select text-xs">
            <option>Café</option>
            <option>Almoço</option>
            <option>Jantar</option>
            <option>Lanche</option>
          </select>
          <input type="number" className="ios-input text-xs" placeholder="Qtd" />
          <select className="ios-select text-xs">
            <option>gramas</option>
            <option>unid</option>
            <option>xícara</option>
          </select>
        </div>

        <button className="ios-button w-full">
          <i className="fas fa-search-pie mr-2"></i>
          Analisar Nutrição
        </button>
      </div>

      <div className="ios-card-large">
        <h3 className="ios-headline ios-text-primary mb-4">
          <i className="fas fa-clipboard-list text-teal-600 mr-2"></i>
          Plano de Refeições
        </h3>
        
        <div className="space-y-3">
          <select className="ios-select">
            <option>🏡 Dia a dia brasileiro</option>
            <option>💪 Ganho de massa muscular</option>
            <option>⚖️ Perder peso</option>
            <option>🧠 Foco cognitivo</option>
          </select>
          
          <div className="grid grid-cols-2 gap-2">
            <select className="ios-select">
              <option>Plano completo</option>
              <option>Café da manhã</option>
              <option>Almoço</option>
              <option>Jantar</option>
            </select>
            <select className="ios-select">
              <option>3 dias</option>
              <option>5 dias</option>
              <option>7 dias</option>
            </select>
          </div>

          <button className="ios-button-secondary w-full">
            Gerar plano de refeições
          </button>
        </div>
      </div>
    </div>
  );

  const renderExercicioSection = () => (
    <div className="space-y-4">
      <div className="ios-card-large">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="ios-headline ios-text-primary flex items-center gap-2">
              <i className="fas fa-running text-orange-500"></i>
              Exercício
            </h3>
            <p className="ios-footnote ios-text-secondary mt-1">
              Meta diária: 30 minutos
            </p>
          </div>
          <div className="text-right">
            <div className="ios-title3 text-orange-600">{healthData.exerciseMinutes || 0}min</div>
            <div className="ios-footnote ios-text-secondary">
              Faltam {Math.max(0, 30 - (healthData.exerciseMinutes || 0))}min
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min((healthData.exerciseMinutes || 0) / 30 * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-3">
          <select className="ios-select">
            <option>Caminhada</option>
            <option>Corrida</option>
            <option>Musculação</option>
            <option>Yoga</option>
            <option>Ciclismo</option>
            <option>Natação</option>
            <option>Pilates</option>
            <option>Dança</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="number"
              className="ios-input flex-1 text-center"
              placeholder="Duração (min)"
            />
            <button className="ios-button">
              Lançar
            </button>
          </div>
        </div>
      </div>

      <div className="ios-card">
        <h4 className="ios-subhead ios-text-primary mb-3">Atividade Recente</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <i className="fas fa-walking text-blue-500"></i>
              <div>
                <p className="ios-body ios-text-primary">Caminhada</p>
                <p className="ios-footnote ios-text-tertiary">Hoje, 08:30</p>
              </div>
            </div>
            <span className="ios-body ios-text-primary font-medium">30min</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'perfil': return renderPerfilSection();
      case 'agua': return renderAguaSection();
      case 'nutricao': return renderNutricaoSection();
      case 'exercicio': return renderExercicioSection();
      default: return renderPerfilSection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* iOS Navigation Header */}
      <div className="ios-navigation-bar">
        <button className="ios-navigation-bar-button">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="ios-navigation-bar-title">
          Saúde & Corpo
        </div>
        <button className="ios-navigation-bar-button">
          <i className="fas fa-info-circle"></i>
        </button>
      </div>

      {/* Section Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className={`fas ${section.icon.replace('fas ', '')} text-xs`}></i>
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default iOSHealthProfile;
