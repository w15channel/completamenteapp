import { SaudeData, EnergyContext, ExerciseSuggestion } from '../types';
import { DateUtils } from './dateUtils';

/**
 * Utilitários para cálculos de saúde
 */
export class HealthUtils {
  /**
   * Calcula IMC
   */
  static calculateIMC(weight: number, height: number): { imc: number; category: string } {
    if (!weight || !height || height <= 0) {
      return { imc: 0, category: 'Dados inválidos' };
    }

    const imc = Number((weight / (height * height)).toFixed(1));
    let category: string;

    if (imc < 18.5) {
      category = 'Abaixo do peso';
    } else if (imc >= 18.5 && imc < 25) {
      category = 'Normal';
    } else if (imc >= 25 && imc < 30) {
      category = 'Sobrepeso';
    } else {
      category = 'Obesidade';
    }

    return { imc, category };
  }

  /**
   * Calcula necessidade calórica diária (Harris-Benedict Revisado)
   */
  static calculateCalorieNeed(healthData: SaudeData, gender: 'masculino' | 'feminino', age: number): number {
    const { weight, height, activityProfile, biotype } = healthData;

    if (!weight || !height) {
      return 2000; // valor padrão
    }

    // Taxa Metabólica Basal
    let tmb: number;
    if (gender === 'masculino') {
      // 66,5 + (13,75 × peso) + (5,003 × altura) - (6,75 × idade)
      tmb = 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
    } else {
      // 655,1 + (9,563 × peso) + (1,85 × altura) - (4,676 × idade)
      tmb = 655.1 + (9.563 * weight) + (1.85 * height) - (4.676 * age);
    }

    // Fator de Atividade
    const activityFactor = activityProfile?.factor || 1.2;
    const gastoComAtividade = tmb * activityFactor;

    // Ajuste por Biotipo
    let calorieNeed: number;
    switch (biotype?.result) {
      case 'ectomorfo':
        // +10% por ineficiência metabólica
        calorieNeed = gastoComAtividade * 1.10;
        break;
      case 'mesomorfo':
        // Mantém por equilíbrio genético
        calorieNeed = gastoComAtividade;
        break;
      case 'endomorfo':
        // -10% por eficiência metabólica elevada
        calorieNeed = gastoComAtividade * 0.90;
        break;
      default:
        calorieNeed = gastoComAtividade;
    }

    // Ajuste por idade
    if (age > 30) {
      const decades = Math.floor((age - 30) / 10) + 1;
      calorieNeed *= Math.max(0.7, 1 - (decades * 0.1));
    }

    // Ajuste por obesidade
    if (healthData.imc && healthData.imc >= 30) {
      calorieNeed *= 0.92;
    }

    return Math.round(calorieNeed);
  }

  /**
   * Calcula meta de hidratação diária
   */
  static getHydrationGoal(weight?: number): number {
    if (!weight) {
      return 2000; // valor padrão em ml
    }
    return Math.round(weight * 35); // 35ml por kg de peso corporal
  }

  /**
   * Calcula fator de hidratação por tipo de bebida
   */
  static getHydrationFactor(drinkType: string): number {
    const factors: Record<string, number> = {
      'water': 1.0,
      'tea': 0.75,
      'juice': 0.5,
      'soda': 0.25,
      'coffee': 0.8,
      'milk': 0.9
    };
    return factors[drinkType] || 1.0;
  }

  /**
   * Obtém contexto energético do usuário
   */
  static getEnergyContext(healthData: SaudeData, gender: 'masculino' | 'feminino', age: number): EnergyContext {
    const weight = healthData.weight || 0;
    const imc = healthData.imc || 0;

    // Gasto basal simplificado
    let gastoBasal = weight ? ((gender === 'masculino' ? 24 : 22) * weight) : 1600;

    // Ajuste por idade
    if (age > 30) {
      const decades = Math.floor((age - 30) / 10) + 1;
      gastoBasal *= Math.max(0.7, 1 - (decades * 0.1));
    }

    // Ajuste por obesidade
    if (imc >= 30) {
      gastoBasal *= 0.92;
    }

    const actFactor = healthData.activityProfile?.factor || 1.2;
    const gastoTotal = Math.round(gastoBasal * actFactor);

    // Calorias ingeridas hoje
    const today = DateUtils.getTodayStr();
    const ingeridas = (healthData.nutriHistory || [])
      .filter(h => h.day === today)
      .reduce((sum, h) => sum + (Number(h.cal) || 0), 0);

    // Calorias queimadas por exercício
    const extraBurn = Math.max(0, Number(healthData.exercise?.total || 0) * 5);

    // Superávit calórico
    const superavit = Math.max(0, Math.round(ingeridas - (gastoTotal + extraBurn)));

    return {
      age,
      gastoBasal: Math.round(gastoBasal),
      gastoTotal,
      ingeridas: Math.round(ingeridas),
      superavit,
      actFactor
    };
  }

  /**
   * Obtém sugestões de exercícios para queima calórica
   */
  static getExerciseSuggestions(weight: number = 75): ExerciseSuggestion[] {
    return [
      {
        name: 'Caminhada',
        icon: '🚶',
        calPerHour: Math.round(3.5 * weight)
      },
      {
        name: 'Corrida leve',
        icon: '🏃',
        calPerHour: Math.round(8.3 * weight)
      },
      {
        name: 'Pedalada',
        icon: '🚴',
        calPerHour: Math.round(6.8 * weight)
      },
      {
        name: 'Musculação',
        icon: '💪',
        calPerHour: Math.round(6 * weight)
      }
    ];
  }

  /**
   * Classifica frequência cardíaca
   */
  static classifyHeartRate(beats: number, age: number): { rank: string; color: string; status: string } {
    // Fórmula simplificada baseada em idade e frequência de repouso
    let rank: string;
    let color: string;
    let status: string;

    if (beats >= 50 && beats <= 60) {
      rank = 'Excelente';
      color = 'text-sky-400';
      status = 'Ótima condição cardiovascular';
    } else if (beats > 60 && beats <= 70) {
      rank = 'Bom';
      color = 'text-green-400';
      status = 'Boa condição cardiovascular';
    } else if (beats > 70 && beats <= 85) {
      rank = 'Mediano';
      color = 'text-yellow-400';
      status = 'Condição cardiovascular regular';
    } else if (beats > 85 && beats <= 100) {
      rank = 'Baixo/Atenção';
      color = 'text-orange-400';
      status = 'Atenção necessária à saúde cardiovascular';
    } else {
      rank = 'Atenção (Fora do Padrão)';
      color = 'text-red-500';
      status = 'Procure orientação médica';
    }

    return { rank, color, status };
  }

  /**
   * Classifica nível de ansiedade
   */
  static classifyAnxiety(score: number): { level: string; color: string; description: string } {
    let level: string;
    let color: string;
    let description: string;

    if (score <= 25) {
      level = 'Baixa';
      color = 'bg-blue-500';
      description = 'Nível de ansiedade normal e saudável';
    } else if (score <= 50) {
      level = 'Moderada';
      color = 'bg-green-500';
      description = 'Nível de ansiedade controlável';
    } else if (score <= 75) {
      level = 'Elevada';
      color = 'bg-yellow-400';
      description = 'Nível de ansiedade que merece atenção';
    } else {
      level = 'Alta';
      color = 'bg-red-600';
      description = 'Nível de ansiedade que requer intervenção';
    }

    return { level, color, description };
  }

  /**
   * Calcula percentual de progresso
   */
  static calculateProgress(current: number, goal: number): number {
    if (goal <= 0) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  }

  /**
   * Obtém status do progresso
   */
  static getProgressStatus(progress: number): { status: string; color: string } {
    if (progress >= 100) {
      return { status: 'Meta alcançada!', color: 'text-emerald-400' };
    } else if (progress >= 75) {
      return { status: 'Quase lá!', color: 'text-sky-400' };
    } else if (progress >= 50) {
      return { status: 'Bom progresso', color: 'text-indigo-400' };
    } else if (progress >= 25) {
      return { status: 'Começando bem', color: 'text-yellow-400' };
    } else {
      return { status: 'Vamos começar?', color: 'text-rose-400' };
    }
  }

  /**
   * Valida dados de saúde
   */
  static validateHealthData(data: Partial<SaudeData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.weight !== undefined) {
      if (data.weight <= 0 || data.weight > 500) {
        errors.push('Peso deve estar entre 1 e 500 kg');
      }
    }

    if (data.height !== undefined) {
      if (data.height <= 0 || data.height > 3) {
        errors.push('Altura deve estar entre 0.1 e 3 metros');
      }
    }

    if (data.imc !== undefined) {
      if (data.imc < 10 || data.imc > 60) {
        errors.push('IMC parece inválido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcula idade metabólica estimada
   */
  static calculateMetabolicAge(healthData: SaudeData, chronologicalAge: number): number {
    const weight = healthData.weight || 0;
    
    if (!weight) return chronologicalAge;

    const imc = healthData.imc || 0;
    const activityFactor = healthData.activityProfile?.factor || 1.2;

    // Fórmula simplificada para idade metabólica
    let metabolicAge = chronologicalAge;

    // Ajuste por IMC
    if (imc > 30) {
      metabolicAge += 5; // Obesidade aumenta idade metabólica
    } else if (imc < 18.5) {
      metabolicAge += 3; // Abaixo do peso afeta metabolismo
    }

    // Ajuste por atividade
    if (activityFactor >= 1.8) {
      metabolicAge -= 5; // Atividade intensa reduz idade metabólica
    } else if (activityFactor <= 1.2) {
      metabolicAge += 5; // Sedentarismo aumenta idade metabólica
    }

    return Math.max(15, Math.min(100, metabolicAge));
  }
}

export default HealthUtils;
