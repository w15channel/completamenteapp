import React, { useState, useEffect } from 'react';
import { SaudeData, ActivityProfile, BiotypeData } from '../types';
import { HealthUtils } from '../utils/healthUtils';
import { DateUtils } from '../utils/dateUtils';

interface HealthProfileProps {
  healthData: SaudeData;
  gender: 'masculino' | 'feminino';
  age: number;
  onUpdateHealthData: (updates: Partial<SaudeData>) => void;
  onResetProfile: () => void;
  onSyncData: () => void;
  onExportData: () => void;
  onClearBackups: () => void;
}

const BIOTYPE_PROFILES = {
  ectomorfo: {
    name: 'Ectomorfo',
    emoji: '🧍',
    summary: 'Estrutura óssea linear e fina, ombros estreitos e alto gasto calórico. Tendência a provas de velocidade.'
  },
  mesomorfo: {
    name: 'Mesomorfo',
    emoji: '🏃',
    summary: 'Estrutura sólida e atlética, ombros largos e cintura fina. Perfil equilibrado para resistência e potência.'
  },
  endomorfo: {
    name: 'Endomorfo',
    emoji: '🏋️',
    summary: 'Corpo arredondado e macio, metabolismo mais lento e boa resposta para força bruta com constância.'
  }
};

const ACTIVITY_LEVELS = {
  sedentario: {
    name: 'Sedentário',
    factor: 1.2,
    summary: 'Rotina majoritariamente sentada, com baixa movimentação diária.'
  },
  moderado: {
    name: 'Moderado',
    factor: 1.5,
    summary: 'Movimentação regular no dia e exercícios leves em alguns dias da semana.'
  },
  ativo: {
    name: 'Ativo',
    factor: 1.8,
    summary: 'Treinos frequentes e rotina com alta demanda corporal.'
  },
  atleta: {
    name: 'Atleta',
    factor: 2.0,
    summary: 'Alto volume de treino e desempenho físico como foco principal.'
  }
};

export const HealthProfile: React.FC<HealthProfileProps> = ({
  healthData,
  gender,
  age,
  onUpdateHealthData,
  onResetProfile,
  onSyncData,
  onExportData,
  onClearBackups
}) => {
  const [weight, setWeight] = useState<string>(healthData.weight?.toString() || '');
  const [height, setHeight] = useState<string>(healthData.height?.toString() || '');
  const [selectedBiotypeTraits, setSelectedBiotypeTraits] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcular IMC
  const calculateIMC = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    
    if (!w || !h) {
      alert('Preencha peso e altura corretamente.');
      return;
    }

    setIsCalculating(true);
    
    const { imc, category } = HealthUtils.calculateIMC(w, h);
    
    onUpdateHealthData({
      weight: w,
      height: h,
      imc,
      imcCategory: category
    });

    setTimeout(() => setIsCalculating(false), 500);
  };

  // Gerar biotipo
  const generateBiotype = () => {
    if (selectedBiotypeTraits.length === 0) {
      alert('Selecione ao menos uma característica.');
      return;
    }

    const counts = { ectomorfo: 0, mesomorfo: 0, endomorfo: 0 };
    selectedBiotypeTraits.forEach(trait => {
      if (trait in counts) counts[trait as keyof typeof counts]++;
    });

    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as keyof typeof BIOTYPE_PROFILES;
    const profile = BIOTYPE_PROFILES[winner];

    const biotypeData: BiotypeData = {
      result: winner,
      at: Date.now(),
      locked: true
    };

    onUpdateHealthData({ biotype: biotypeData });
  };

  // Gerar perfil de atividade
  const generateActivityProfile = () => {
    if (!activityLevel) {
      alert('Selecione um nível de atividade válido.');
      return;
    }

    const profile = ACTIVITY_LEVELS[activityLevel as keyof typeof ACTIVITY_LEVELS];
    if (!profile) return;

    if (healthData.activityProfile?.locked) {
      alert('Perfil já definido. Use "Resetar info" para refazer os testes.');
      return;
    }

    const activityData: ActivityProfile = {
      level: activityLevel as any,
      name: profile.name,
      factor: profile.factor,
      summary: profile.summary,
      at: Date.now(),
      locked: true
    };

    onUpdateHealthData({ activityProfile: activityData });
  };

  // Renderizar opções de biotipo
  const renderBiotypeOptions = () => {
    return Object.entries(BIOTYPE_PROFILES).map(([key, profile], idx) => (
      <label key={key} className="flex items-start gap-2 p-2 rounded-lg border border-slate-600 bg-slate-900/40 cursor-pointer hover:bg-slate-800/60 transition-colors">
        <input
          type="checkbox"
          className="biotype-opt mt-1"
          data-kind={key}
          checked={selectedBiotypeTraits.includes(key)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedBiotypeTraits([...selectedBiotypeTraits, key]);
            } else {
              setSelectedBiotypeTraits(selectedBiotypeTraits.filter(t => t !== key));
            }
          }}
          disabled={healthData.biotype?.locked}
        />
        <span className="flex-1">
          <b className="text-slate-200">Perfil {idx + 1}</b>
          <br />
          <span className="text-slate-300 text-xs">{profile.summary}</span>
        </span>
      </label>
    ));
  };

  // Calcular necessidade calórica
  const calculateCalorieNeed = () => {
    if (!healthData.weight || !healthData.height) {
      return '-- kcal/dia';
    }

    const calorieNeed = HealthUtils.calculateCalorieNeed(healthData, gender, age);
    return `${calorieNeed.toLocaleString('pt-BR')} kcal/dia`;
  };

  // Obter descrição do cálculo
  const getCalculationDescription = () => {
    if (!healthData.weight || !healthData.height) {
      return 'Preencha peso, altura e perfil de atividade.';
    }

    const activityName = healthData.activityProfile?.name || 'Não definido';
    const biotypeName = healthData.biotype ? BIOTYPE_PROFILES[healthData.biotype.result]?.name || 'Não definido' : 'Não definido';
    
    return `Baseado em: ${age} anos, ${gender === 'masculino' ? 'masculino' : 'feminino'}, ${biotypeName}, ${activityName}`;
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <div className="health-card relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-4 -bottom-4 opacity-10">
          <i className="fas fa-weight scale-x-[-1] text-9xl"></i>
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Perfil Biológico</h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white shadow-inner">
              IMC: {healthData.imc ? `${healthData.imc} (${healthData.imcCategory})` : '--'}
            </span>
          </div>

          {/* Anthropometric Measures */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-[10px] text-rose-100 font-bold ml-1 uppercase">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 75"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-sm outline-none text-white text-center font-bold placeholder-white/40"
                disabled={isCalculating}
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-rose-100 font-bold ml-1 uppercase">Altura (m)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 1.75"
                step="0.01"
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-sm outline-none text-white text-center font-bold placeholder-white/40"
                disabled={isCalculating}
              />
            </div>
          </div>

          <button
            onClick={calculateIMC}
            disabled={isCalculating}
            className="w-full mb-4 bg-white text-rose-600 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            {isCalculating ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : null}
            Atualizar Medidas
          </button>

          {/* Caloric Need */}
          <div className="mb-4 bg-slate-900/40 border border-white/20 rounded-xl p-3">
            <p className="text-[10px] text-rose-100 font-bold uppercase mb-1">Necessidade calórica estimada</p>
            <p className="text-sm font-black text-amber-300">{calculateCalorieNeed()}</p>
            <p className="text-[9px] text-slate-300 mt-1">{getCalculationDescription()}</p>
          </div>

          {/* Biotype Section */}
          <div className="mb-4 bg-slate-900/40 border border-white/20 rounded-xl p-3">
            <p className="text-[10px] text-rose-100 font-bold uppercase mb-2">Seu Biotipo Predominante</p>
            <div className="space-y-2 text-[11px]">
              {renderBiotypeOptions()}
            </div>
            <button
              onClick={generateBiotype}
              disabled={healthData.biotype?.locked || selectedBiotypeTraits.length === 0}
              className="w-full mt-3 bg-rose-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {healthData.biotype?.locked ? 'Biotipo Definido' : 'Gerar meu biotipo'}
            </button>
            
            {healthData.biotype?.locked && (
              <div className="mt-3 text-[11px] text-white bg-slate-900/70 border border-slate-600 rounded-lg p-3">
                <p className="font-black text-rose-300">
                  {BIOTYPE_PROFILES[healthData.biotype.result].emoji} {BIOTYPE_PROFILES[healthData.biotype.result].name}
                </p>
                <p className="mt-1 text-slate-200">{BIOTYPE_PROFILES[healthData.biotype.result].summary}</p>
              </div>
            )}
          </div>

          {/* Activity Profile Section */}
          <div className="mb-4 bg-slate-900/40 border border-white/20 rounded-xl p-3">
            <p className="text-[10px] text-rose-100 font-bold uppercase mb-2">Perfil de atividade diária</p>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value)}
              disabled={healthData.activityProfile?.locked}
              className="w-full p-2 rounded-lg bg-slate-900/80 border border-slate-600 text-xs text-white outline-none disabled:opacity-50"
            >
              <option value="" selected disabled>Selecione seu nível</option>
              {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
                <option key={key} value={key}>{level.name}</option>
              ))}
            </select>
            <div className="mt-2 text-[10px] text-slate-300 bg-slate-950/40 border border-slate-700 rounded-lg p-2">
              {activityLevel && ACTIVITY_LEVELS[activityLevel as keyof typeof ACTIVITY_LEVELS]?.summary || 'Selecione um perfil para ver a explicação.'}
            </div>
            <button
              onClick={generateActivityProfile}
              disabled={healthData.activityProfile?.locked || !activityLevel}
              className="w-full mt-3 bg-indigo-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {healthData.activityProfile?.locked ? 'Perfil Definido' : 'Gerar perfil'}
            </button>
            
            {healthData.activityProfile?.locked && (
              <div className="mt-3 text-[11px] text-white bg-slate-900/70 border border-slate-600 rounded-lg p-3">
                <p className="font-black text-indigo-300">Perfil diário salvo: {healthData.activityProfile.name}</p>
                <p className="mt-1 text-slate-200">{healthData.activityProfile.summary}</p>
                <p className="mt-1 text-[10px] text-slate-400">Fator de atividade aplicado: {healthData.activityProfile.factor}x</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <button
            onClick={onResetProfile}
            className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            Resetar info de perfil e biotipo
          </button>

          <button
            onClick={onSyncData}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
          >
            <i className="fas fa-sync mr-1"></i> Sincronizar Dados com Firebase
          </button>

          <div className="mt-3 flex gap-2">
            <button
              onClick={onExportData}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
            >
              <i className="fas fa-download mr-1"></i> Exportar Backup
            </button>
            <button
              onClick={onClearBackups}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors"
            >
              <i className="fas fa-trash mr-1"></i> Limpar Backups
            </button>
          </div>
          
          <div className="mt-2 text-[8px] text-slate-400 text-center">
            <p>💡 Use Sincronizar para recuperar dados do Firebase</p>
            <p>📦 Exportar Backup salva dados localmente</p>
            <p>🗑️ Limpar Backups remove dados locais</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthProfile;
