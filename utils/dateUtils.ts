/**
 * Utilitários para manipulação de datas
 */

export class DateUtils {
  /**
   * Obtém a data atual no formato YYYY-MM-DD
   */
  static getTodayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * Obtém o mês atual no formato YYYY-MM
   */
  static getMonthStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Formata data para exibição
   */
  static formatDate(date: Date | string | number, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return 'Data inválida';
    }

    const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
      short: { day: '2-digit', month: '2-digit', year: 'numeric' },
      long: { day: '2-digit', month: 'long', year: 'numeric' },
      time: { hour: '2-digit', minute: '2-digit' },
      datetime: { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    };

    return d.toLocaleDateString('pt-BR', formatOptions[format]);
  }

  /**
   * Calcula idade a partir da data de nascimento
   */
  static calculateAge(birthDate: Date | string | number): number {
    const birth = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) {
      return 0;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Extrai idade a partir da senha no formato DDMMYYYY
   */
  static extractAgeFromPassword(password: string): number {
    if (!/^\d{8}$/.test(password)) {
      return 40; // idade padrão
    }

    try {
      const day = parseInt(password.slice(0, 2), 10);
      const month = parseInt(password.slice(2, 4), 10) - 1;
      const year = parseInt(password.slice(4), 10);
      
      const birthDate = new Date(year, month, day);
      
      if (isNaN(birthDate.getTime())) {
        return 40;
      }

      return this.calculateAge(birthDate);
    } catch (error) {
      console.error('Erro ao calcular idade da senha:', error);
      return 40;
    }
  }

  /**
   * Verifica se é um novo dia
   */
  static isNewDay(lastDate: string): boolean {
    return lastDate !== this.getTodayStr();
  }

  /**
   * Verifica se é um novo mês
   */
  static isNewMonth(lastMonth: string): boolean {
    return lastMonth !== this.getMonthStr();
  }

  /**
   * Obtém timestamp atual
   */
  static now(): number {
    return Date.now();
  }

  /**
   * Converte timestamp para data formatada
   */
  static timestampToDate(timestamp: number, format: 'short' | 'long' | 'time' | 'datetime' = 'datetime'): string {
    return this.formatDate(timestamp, format);
  }

  /**
   * Obtém dias da semana
   */
  static getDayOfWeek(date?: Date): number {
    const d = date || new Date();
    return d.getDay();
  }

  /**
   * Obtém hora atual
   */
  static getCurrentHour(): number {
    return new Date().getHours();
  }

  /**
   * Verifica se é dia útil (Seg-Sex)
   */
  static isWeekday(date?: Date): boolean {
    const day = this.getDayOfWeek(date);
    return day >= 1 && day <= 5;
  }

  /**
   * Verifica se é fim de semana
   */
  static isWeekend(date?: Date): boolean {
    return !this.isWeekday(date);
  }

  /**
   * Formata duração em minutos para texto
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Obtém início do dia
   */
  static getStartOfDay(date?: Date): Date {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  /**
   * Obtém fim do dia
   */
  static getEndOfDay(date?: Date): Date {
    const d = date || new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  /**
   * Obtém diferença em dias entre duas datas
   */
  static getDaysDifference(date1: Date | string | number, date2: Date | string | number): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return 0;
    }

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se uma data está dentro de um intervalo
   */
  static isDateInRange(date: Date | string | number, startDate: Date | string | number, endDate: Date | string | number): boolean {
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(d.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    return d >= start && d <= end;
  }

  /**
   * Adiciona dias a uma data
   */
  static addDays(date: Date | string | number, days: number): Date {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return new Date();
    }
    
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Subtrai dias de uma data
   */
  static subtractDays(date: Date | string | number, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Obtém nome do mês
   */
  static getMonthName(month?: number): string {
    const m = month !== undefined ? month : new Date().getMonth();
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[m] || 'Mês inválido';
  }

  /**
   * Obtém nome do dia da semana
   */
  static getDayName(day?: number): string {
    const d = day !== undefined ? day : new Date().getDay();
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[d] || 'Dia inválido';
  }
}

export default DateUtils;
