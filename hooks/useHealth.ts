import { useState, useEffect, useCallback } from 'react';
import { SaudeData, WaterEntry, NutriHistory, ExerciseLog } from '../types';
import { HealthUtils } from '../utils/healthUtils';
import { DateUtils } from '../utils/dateUtils';
import FirebaseService from '../services/firebase';

/**
 * Hook para gerenciar dados de saúde
 */
export const useHealth = (userId: string) => {
  const [healthData, setHealthData] = useState<SaudeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados de saúde
  const loadHealthData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const firebase = FirebaseService.getInstance();
      const data = await firebase.loadHealthData(userId);
      
      if (data) {
        setHealthData(data);
      } else {
        // Inicializar dados vazios se não existirem
        const initialData: SaudeData = {
          water: {
            total: 0,
            history: [],
            day: DateUtils.getTodayStr(),
            goalReachedAt: null
          },
          exercise: {
            day: DateUtils.getTodayStr(),
            goal: 20,
            total: 0,
            logs: []
          },
          anxietyDaily: {
            day: DateUtils.getTodayStr(),
            score: undefined,
            completed: false
          }
        };
        setHealthData(initialData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados de saúde');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Salvar dados de saúde
  const saveHealthData = useCallback(async (updates: Partial<SaudeData>) => {
    if (!userId || !healthData) return;

    try {
      setError(null);
      const firebase = FirebaseService.getInstance();
      
      const updatedData = { ...healthData, ...updates };
      await firebase.saveHealthData(userId, updatedData);
      setHealthData(updatedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar dados de saúde');
    }
  }, [userId, healthData]);

  // Calcular IMC
  const calculateIMC = useCallback((weight: number, height: number) => {
    return HealthUtils.calculateIMC(weight, height);
  }, []);

  // Calcular necessidade calórica
  const calculateCalorieNeed = useCallback((gender: 'masculino' | 'feminino', age: number) => {
    if (!healthData) return 2000;
    return HealthUtils.calculateCalorieNeed(healthData, gender, age);
  }, [healthData]);

  // Adicionar entrada de água
  const addWaterEntry = useCallback(async (amount: number, label: string) => {
    if (!healthData) return;

    const validAmount = Math.round(amount * HealthUtils.getHydrationFactor(label));
    const entry: WaterEntry = {
      amount,
      label,
      valid: validAmount,
      at: Date.now()
    };

    const updatedWater = {
      ...healthData.water,
      total: (healthData.water?.total || 0) + validAmount,
      history: [...(healthData.water?.history || []), entry],
      lastEntry: entry
    };

    await saveHealthData({ water: updatedWater });
  }, [healthData, saveHealthData]);

  // Resetar água diária
  const resetDailyWater = useCallback(async () => {
    if (!healthData) return;

    const updatedWater = {
      total: 0,
      history: [],
      day: DateUtils.getTodayStr(),
      goalReachedAt: null
    };

    await saveHealthData({ water: updatedWater });
  }, [healthData, saveHealthData]);

  // Adicionar entrada nutricional
  const addNutriEntry = useCallback(async (entry: Omit<NutriHistory, 'date' | 'day'>) => {
    if (!healthData) return;

    const nutriEntry: NutriHistory = {
      ...entry,
      date: new Date().toLocaleDateString('pt-BR'),
      day: DateUtils.getTodayStr()
    };

    const updatedHistory = [nutriEntry, ...(healthData.nutriHistory || [])];

    await saveHealthData({ nutriHistory: updatedHistory });
  }, [healthData, saveHealthData]);

  // Adicionar log de exercício
  const addExerciseLog = useCallback(async (log: Omit<ExerciseLog, 'at'>) => {
    if (!healthData) return;

    const exerciseLog: ExerciseLog = {
      ...log,
      at: Date.now()
    };

    const updatedExercise = {
      ...healthData.exercise,
      total: (healthData.exercise?.total || 0) + log.duration,
      logs: [...(healthData.exercise?.logs || []), exerciseLog]
    };

    await saveHealthData({ exercise: updatedExercise });
  }, [healthData, saveHealthData]);

  // Resetar exercícios diários
  const resetDailyExercise = useCallback(async () => {
    if (!healthData) return;

    const updatedExercise = {
      day: DateUtils.getTodayStr(),
      goal: 20,
      total: 0,
      logs: []
    };

    await saveHealthData({ exercise: updatedExercise });
  }, [healthData, saveHealthData]);

  // Salvar avaliação de ansiedade
  const saveAnxietyAssessment = useCallback(async (score: number) => {
    if (!healthData) return;

    const updatedAnxiety = {
      day: DateUtils.getTodayStr(),
      score,
      completed: true
    };

    await saveHealthData({ 
      anxietyDaily: updatedAnxiety,
      anxietyScore: score 
    });
  }, [healthData, saveHealthData]);

  // Salvar dados cardiovasculares
  const saveCardioData = useCallback(async (beats: number, rank: string) => {
    if (!healthData) return;

    const cardioEntry = {
      beats,
      rank,
      date: new Date().toLocaleString()
    };

    const updatedCardio = [...(healthData.cardio || []), cardioEntry];

    await saveHealthData({ cardio: updatedCardio });
  }, [healthData, saveHealthData]);

  // Verificar se precisa resetar dados diários
  const checkDailyReset = useCallback(async () => {
    if (!healthData) return;

    const today = DateUtils.getTodayStr();
    let needsUpdate = false;
    const updates: Partial<SaudeData> = {};

    // Verificar água
    if (healthData.water?.day !== today) {
      updates.water = {
        total: 0,
        history: [],
        day: today,
        goalReachedAt: null
      };
      needsUpdate = true;
    }

    // Verificar exercícios
    if (healthData.exercise?.day !== today) {
      updates.exercise = {
        day: today,
        goal: 20,
        total: 0,
        logs: []
      };
      needsUpdate = true;
    }

    // Verificar ansiedade
    if (healthData.anxietyDaily?.day !== today) {
      updates.anxietyDaily = {
        day: today,
        score: undefined,
        completed: false
      };
      needsUpdate = true;
    }

    if (needsUpdate) {
      await saveHealthData(updates);
    }
  }, [healthData, saveHealthData]);

  // Obter meta de hidratação
  const getHydrationGoal = useCallback(() => {
    return HealthUtils.getHydrationGoal(healthData?.weight);
  }, [healthData]);

  // Obter progresso de hidratação
  const getHydrationProgress = useCallback(() => {
    if (!healthData?.water) return { current: 0, goal: 0, percentage: 0 };
    
    const goal = getHydrationGoal();
    const current = healthData.water.total || 0;
    const percentage = HealthUtils.calculateProgress(current, goal);

    return { current, goal, percentage };
  }, [healthData, getHydrationGoal]);

  // Obter progresso de exercícios
  const getExerciseProgress = useCallback(() => {
    if (!healthData?.exercise) return { current: 0, goal: 20, percentage: 0 };
    
    const goal = healthData.exercise.goal || 20;
    const current = healthData.exercise.total || 0;
    const percentage = HealthUtils.calculateProgress(current, goal);

    return { current, goal, percentage };
  }, [healthData]);

  // Carregar dados na montagem
  useEffect(() => {
    loadHealthData();
  }, [loadHealthData]);

  // Verificar reset diário
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  return {
    healthData,
    loading,
    error,
    calculateIMC,
    calculateCalorieNeed,
    addWaterEntry,
    resetDailyWater,
    addNutriEntry,
    addExerciseLog,
    resetDailyExercise,
    saveAnxietyAssessment,
    saveCardioData,
    getHydrationGoal,
    getHydrationProgress,
    getExerciseProgress,
    refreshData: loadHealthData
  };
};

export default useHealth;
