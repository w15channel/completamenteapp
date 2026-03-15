// Tipos principais da aplicação

export interface User {
  id: string;
  name: string;
  fullName: string;
  gender: 'M' | 'F';
  pass: string; // DDMMYYYY
  createdAt: number;
}

export interface UserData {
  pass: string;
  fullName: string;
  gender: 'M' | 'F';
  created: number;
  relacional: RelacionalData;
  saude: SaudeData;
  financas: FinancasData;
}

export interface RelacionalData {
  age?: string;
  shareCode?: string;
  linkedPartner?: string;
  partnerCode?: string;
}

export interface SaudeData {
  weight?: number;
  height?: number;
  imc?: number;
  imcCategory?: string;
  calorieNeed?: number;
  water?: WaterData;
  healthGoalLog?: HealthGoalLog;
  exercise?: ExerciseData;
  anxietyDaily?: AnxietyDaily;
  activityProfile?: ActivityProfile;
  biotype?: BiotypeData;
  nutriHistory?: NutriHistory[];
  cardio?: CardioData[];
  anxietyScore?: number;
}

export interface WaterData {
  total: number;
  history: WaterEntry[];
  day: string;
  goalReachedAt?: number;
  lastEntry?: WaterEntry;
}

export interface WaterEntry {
  amount: number;
  label: string;
  valid: number;
  at: number;
}

export interface HealthGoalLog {
  month: string;
  entries: HealthGoalEntry[];
}

export interface HealthGoalEntry {
  date: string;
  goal: string;
  completed: boolean;
  notes?: string;
}

export interface ExerciseData {
  day: string;
  goal: number;
  total: number;
  logs: ExerciseLog[];
}

export interface ExerciseLog {
  type: string;
  duration: number;
  calories: number;
  at: number;
}

export interface AnxietyDaily {
  day: string;
  score?: number;
  completed: boolean;
}

export interface ActivityProfile {
  level: 'sedentario' | 'moderado' | 'ativo' | 'atleta';
  name: string;
  factor: number;
  summary: string;
  at: number;
  locked: boolean;
}

export interface BiotypeData {
  result: 'ectomorfo' | 'mesomorfo' | 'endomorfo';
  at: number;
  locked: boolean;
}

export interface NutriHistory {
  meal: string;
  mealType: string;
  qty: number;
  unit: string;
  cal: number;
  p: number; // proteínas
  c: number; // carboidratos
  f: number; // gorduras
  date: string;
  day: string;
}

export interface CardioData {
  beats: number;
  rank: string;
  date: string;
}

export interface FinancasData {
  transactions: Transaction[];
  balance?: number;
  monthlyGoal?: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  month: string;
}

export interface Therapist {
  id: string;
  name: string;
  color: string;
  icon: string;
  schedule: string;
}

export interface AvailabilityStatus {
  status: 'online' | 'busy' | 'offline';
  text: string;
  color: string;
  allow: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface ChatSession {
  id: string;
  therapistId: string;
  messages: ChatMessage[];
  lastUpdate: number;
}

export interface GameDefinition {
  name: string;
  render: () => string;
  init: () => void;
}

export interface MuralMessage {
  id: string;
  date: string;
  text: string;
  author?: string;
}

export interface DreamEntry {
  id: string;
  text: string;
  date: string;
  mood?: string;
  tags?: string[];
}

export interface ArtWork {
  id: number;
  title: string;
  svg: string;
  currentColor: string;
}

// Tipos de configuração
export interface AppConfig {
  AI_PROXY_URL: string;
  CHAT_AI_PROXY_URL: string;
  CLIENT_ID: string;
  HAS_ACCEPTED_TERMS: boolean;
}

// Tipos de contexto
export interface AppContextType {
  user: User | null;
  userData: UserData | null;
  activeTherapist: Therapist | null;
  isLoading: boolean;
  error: string | null;
  login: (userData: Partial<UserData>, isAuto?: boolean) => Promise<void>;
  logout: () => void;
  updateUserData: (updates: Partial<UserData>) => Promise<void>;
  clearError: () => void;
  manualSync: () => Promise<void>;
  exportData: () => void;
  clearBackups: () => void;
}

export interface HealthContextType {
  healthData: SaudeData;
  updateHealthData: (updates: Partial<SaudeData>) => Promise<void>;
  calculateIMC: (weight: number, height: number) => { imc: number; category: string };
  calculateCalorieNeed: () => number;
  getHydrationGoal: () => number;
}

export interface ChatContextType {
  activeChat: ChatSession | null;
  therapists: Therapist[];
  startChat: (therapistId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  clearChatHistory: () => Promise<void>;
  checkAvailability: (therapistId: string) => AvailabilityStatus;
}

// Tipos de eventos
export interface AppEvent {
  type: string;
  payload?: any;
  timestamp: number;
}

// Tipos de utilitários
export interface EnergyContext {
  age: number;
  gastoBasal: number;
  gastoTotal: number;
  ingeridas: number;
  superavit: number;
  actFactor: number;
}

export interface ExerciseSuggestion {
  name: string;
  icon: string;
  calPerHour: number;
}

// Tipos de API
export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface NutriAnalysisResult {
  total_cal: number;
  p: number;
  c: number;
  f: number;
}

// Tipos de jogos
export interface GameState {
  currentLevel: number;
  score: number;
  isPlaying: boolean;
  completed: number[];
}

// Tipos de notificação
export interface NotificationConfig {
  enabled: boolean;
  waterReminder: boolean;
  exerciseReminder: boolean;
  medicationReminder: boolean;
}

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  icon?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
}

// End of types file
