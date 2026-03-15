import { UserData, ChatMessage, MuralMessage, DreamEntry } from '../types';

declare global {
  interface Window {
    db: any;
    firebase: any;
  }
}

export class FirebaseService {
  private static instance: FirebaseService;
  private db: any;

  private constructor() {
    this.db = window.db;
  }

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Verifica se Firebase está online
   */
  isFirebaseOnline(): boolean {
    return !!(window.db && window.firebase);
  }

  /**
   * Salva dados do usuário
   */
  async saveUserData(userId: string, userData: UserData): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`users/${userId}`).set(userData);
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Carrega dados do usuário
   */
  async loadUserData(userId: string): Promise<UserData | null> {
    if (!this.db) return null;
    
    try {
      const snapshot = await this.db.ref(`users/${userId}`).once('value');
      return snapshot.val() || null;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return null;
    }
  }

  /**
   * Salva dados de saúde específicos
   */
  async saveHealthData(userId: string, healthData: any): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`users/${userId}/saude`).set(healthData);
    } catch (error) {
      console.error('Erro ao salvar dados de saúde:', error);
      throw error;
    }
  }

  /**
   * Carrega dados de saúde
   */
  async loadHealthData(userId: string): Promise<any> {
    if (!this.db) return null;
    
    try {
      const snapshot = await this.db.ref(`users/${userId}/saude`).once('value');
      return snapshot.val() || null;
    } catch (error) {
      console.error('Erro ao carregar dados de saúde:', error);
      return null;
    }
  }

  /**
   * Salva dados do chat
   */
  async saveChatMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`chats/${chatId}`).set(messages);
    } catch (error) {
      console.error('Erro ao salvar mensagens do chat:', error);
      throw error;
    }
  }

  /**
   * Carrega mensagens do chat
   */
  async loadChatMessages(chatId: string): Promise<ChatMessage[]> {
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.ref(`chats/${chatId}`).once('value');
      return snapshot.val() || [];
    } catch (error) {
      console.error('Erro ao carregar mensagens do chat:', error);
      return [];
    }
  }

  /**
   * Configura listener para chat em tempo real
   */
  setupChatListener(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    if (!this.db) return () => {};
    
    const ref = this.db.ref(`chats/${chatId}`);
    
    ref.on('value', (snapshot: any) => {
      const messages = snapshot.val() || [];
      callback(messages);
    });

    // Return unsubscribe function
    return () => ref.off();
  }

  /**
   * Salva mensagem no mural
   */
  async saveMuralMessage(message: Omit<MuralMessage, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const newMessageRef = await this.db.ref('mural').push(message);
      return newMessageRef.key || '';
    } catch (error) {
      console.error('Erro ao salvar mensagem no mural:', error);
      throw error;
    }
  }

  /**
   * Carrega mensagens do mural
   */
  async loadMuralMessages(): Promise<MuralMessage[]> {
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.ref('mural').once('value');
      const data = snapshot.val() || {};
      return Object.entries(data).map(([id, msg]: [string, any]) => ({
        id,
        ...msg
      })).reverse();
    } catch (error) {
      console.error('Erro ao carregar mensagens do mural:', error);
      return [];
    }
  }

  /**
   * Salva sonho
   */
  async saveDream(userId: string, dream: Omit<DreamEntry, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      const newDreamRef = await this.db.ref(`dreams/${userId}`).push(dream);
      return newDreamRef.key || '';
    } catch (error) {
      console.error('Erro ao salvar sonho:', error);
      throw error;
    }
  }

  /**
   * Carrega sonhos do usuário
   */
  async loadDreams(userId: string): Promise<DreamEntry[]> {
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.ref(`dreams/${userId}`).once('value');
      const data = snapshot.val() || {};
      return Object.entries(data).map(([id, dream]: [string, any]) => ({
        id,
        ...dream
      })).reverse();
    } catch (error) {
      console.error('Erro ao carregar sonhos:', error);
      return [];
    }
  }

  /**
   * Salva transações financeiras
   */
  async saveTransactions(userId: string, transactions: any[]): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`users/${userId}/financas/transactions`).set(transactions);
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      throw error;
    }
  }

  /**
   * Carrega transações financeiras
   */
  async loadTransactions(userId: string): Promise<any[]> {
    if (!this.db) return [];
    
    try {
      const snapshot = await this.db.ref(`users/${userId}/financas/transactions`).once('value');
      return snapshot.val() || [];
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      return [];
    }
  }

  /**
   * Sincronização inteligente
   */
  async smartSync(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      console.log("🔄 Iniciando sincronização inteligente...");
      
      // Carregar dados do Firebase
      const remoteData = await this.loadUserData(userId);
      if (!remoteData) {
        console.log("📝 Nenhum dado remoto encontrado");
        return false;
      }

      // Obter dados locais
      const localData = window.userDataCache;
      if (!localData) {
        console.log("💾 Salvando dados remotos localmente");
        window.userDataCache = remoteData;
        return true;
      }

      // Comparar timestamps
      const remoteTime = remoteData.created || 0;
      const localTime = localData.created || 0;

      if (remoteTime > localTime) {
        console.log("⬇️ Dados remotos mais recentes, atualizando local");
        window.userDataCache = remoteData;
        return true;
      } else if (localTime > remoteTime) {
        console.log("⬆️ Dados locais mais recentes, atualizando remoto");
        await this.saveUserData(userId, localData);
        return true;
      } else {
        console.log("✅ Dados já sincronizados");
        return true;
      }
    } catch (error) {
      console.error("❌ Erro na sincronização inteligente:", error);
      return false;
    }
  }

  /**
   * Sincronização robusta (fallback)
   */
  async robustSync(userId: string): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      console.log("🔧 Iniciando sincronização robusta...");
      
      // Tentar múltiplas abordagens
      const methods = [
        () => this.smartSync(userId),
        () => this.loadUserData(userId).then(data => {
          if (data) {
            window.userDataCache = data;
            return true;
          }
          return false;
        }),
        () => this.saveUserData(userId, window.userDataCache).then(() => true)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result) {
            console.log("✅ Sincronização robusta bem-sucedida");
            return true;
          }
        } catch (error) {
          console.warn("⚠️ Método de sincronização falhou, tentando próximo:", error);
        }
      }

      console.log("❌ Todos os métodos de sincronização falharam");
      return false;
    } catch (error) {
      console.error("❌ Erro na sincronização robusta:", error);
      return false;
    }
  }

  /**
   * Limpa dados do usuário
   */
  async clearUserData(userId: string): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`users/${userId}`).remove();
    } catch (error) {
      console.error('Erro ao limpar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Limpa histórico de chat
   */
  async clearChatHistory(chatId: string): Promise<void> {
    if (!this.db) throw new Error('Firebase não inicializado');
    
    try {
      await this.db.ref(`chats/${chatId}`).remove();
    } catch (error) {
      console.error('Erro ao limpar histórico do chat:', error);
      throw error;
    }
  }

  /**
   * Exporta todos os dados do usuário
   */
  async exportAllUserData(userId: string): Promise<any> {
    if (!this.db) return null;
    
    try {
      const userData = await this.loadUserData(userId);
      const dreams = await this.loadDreams(userId);
      
      return {
        userData,
        dreams,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      return null;
    }
  }

  /**
   * Testa conexão com Firebase
   */
  async testConnection(): Promise<boolean> {
    if (!this.db) return false;
    
    try {
      await this.db.ref('.info/connected').once('value');
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Firebase:', error);
      return false;
    }
  }
}

export default FirebaseService;
