import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserData, AppContextType } from '../types';
import { DateUtils } from '../utils/dateUtils';
import FirebaseService from '../services/firebase';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTherapist, setActiveTherapist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar dados do localStorage
  useEffect(() => {
    const initializeApp = () => {
      try {
        const storage = window.localStorage;
        const session = window.sessionStorage;
        
        // Carregar dados do localStorage
        const rememberedUser = storage.getItem('wr_remember') === 'true';
        const savedUser = storage.getItem('wr_user');
        const savedPass = storage.getItem('wr_pass');
        const acceptedTerms = session.getItem('wr_terms_accepted') === 'true';

        // Configurar URLs da API
        if (typeof window !== 'undefined') {
          window.AI_PROXY_URL = (window.location.origin && window.location.origin.startsWith("http"))
            ? `${window.location.origin}/api/ai`
            : "/api/ai";
          window.CHAT_AI_PROXY_URL = (window.location.origin && window.location.origin.startsWith("http"))
            ? `${window.location.origin}/api/chat`
            : "/api/chat";
        }

        // Auto-login se lembrado
        if (rememberedUser && savedUser && savedPass) {
          const loginData: Partial<UserData> = {
            fullName: savedUser,
            pass: savedPass,
            gender: 'M', // padrão, será atualizado no login real
            created: Date.now()
          };
          // Login será feito após a declaração da função
          setTimeout(() => login(loginData, true), 0);
        } else {
          setIsLoading(false);
        }

        // Configurar variáveis globais
        if (typeof window !== 'undefined') {
          window.hasAcceptedTerms = acceptedTerms;
        }

      } catch (err) {
        console.error('Erro ao inicializar aplicação:', err);
        setError('Falha ao inicializar aplicação');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Login do usuário
  const login = useCallback(async (loginData: Partial<UserData>, isAuto = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar dados
      if (!isAuto) {
        if (!loginData.fullName || loginData.fullName.split(' ').length < 2) {
          throw new Error('Digite Nome e Sobrenome');
        }
        if (!loginData.pass || !/^[0-9]{8}$/.test(loginData.pass)) {
          throw new Error('Senha deve ter exatamente 8 números');
        }
      }

      // Criar objeto usuário
      const userId = loginData.fullName?.replace(/\s+/g, '_') || '';
      const userName = loginData.fullName?.split(' ')[0] || '';
      
      const newUser: User = {
        id: userId,
        name: userName,
        fullName: loginData.fullName || '',
        gender: loginData.gender || 'M',
        pass: loginData.pass || '',
        createdAt: Date.now()
      };

      // Inicializar dados completos do usuário
      const completeUserData: UserData = {
        pass: loginData.pass || '',
        fullName: loginData.fullName || '',
        gender: loginData.gender || 'M',
        created: Date.now(),
        relacional: {},
        saude: {},
        financas: { transactions: [] }
      };

      // Salvar em variáveis globais (compatibilidade)
      if (typeof window !== 'undefined') {
        window.clientId = userId;
        window.clientName = userName;
        window.userDataCache = completeUserData;
      }

      // Salvar no localStorage se não for auto-login
      if (!isAuto) {
        const storage = window.localStorage;
        storage.setItem('wr_user', loginData.fullName || '');
        storage.setItem('wr_pass', loginData.pass || '');
        if (document.getElementById('remember-me') as HTMLInputElement)?.checked) {
          storage.setItem('wr_remember', 'true');
        }
      }

      // Sincronizar com Firebase se disponível
      const firebase = FirebaseService.getInstance();
      if (firebase.isFirebaseOnline()) {
        await firebase.smartSync(userId);
      }

      // Atualizar estado
      setUser(newUser);
      setUserData(completeUserData);
      setActiveTherapist(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout do usuário
  const logout = useCallback(() => {
    try {
      // Limpar variáveis globais
      if (typeof window !== 'undefined') {
        window.clientId = '';
        window.clientName = '';
        window.userDataCache = null;
        window.activeTherapist = null;
        window.activeChatRef = null;
      }

      // Limpar estado
      setUser(null);
      setUserData(null);
      setActiveTherapist(null);
      setError(null);

      // Limpar localStorage (opcional, manter "remember me")
      // const storage = window.localStorage;
      // storage.removeItem('wr_user');
      // storage.removeItem('wr_pass');
      // storage.removeItem('wr_remember');

    } catch (err) {
      console.error('Erro no logout:', err);
    }
  }, []);

  // Atualizar dados do usuário
  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!user || !userData) return;

    try {
      setError(null);
      
      const updatedUserData = { ...userData, ...updates };
      
      // Atualizar variáveis globais
      if (typeof window !== 'undefined') {
        window.userDataCache = updatedUserData;
      }

      // Salvar no Firebase
      const firebase = FirebaseService.getInstance();
      if (firebase.isFirebaseOnline()) {
        await firebase.saveUserData(user.id, updatedUserData);
      }

      // Atualizar estado
      setUserData(updatedUserData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      setError(errorMessage);
      throw err;
    }
  }, [user, userData]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Sincronização manual
  const manualSync = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const firebase = FirebaseService.getInstance();
      
      if (!firebase.isFirebaseOnline()) {
        throw new Error('Firebase não disponível');
      }

      const success = await firebase.robustSync(user.id);
      
      if (success) {
        // Recarregar dados do cache global
        if (typeof window !== 'undefined' && window.userDataCache) {
          setUserData(window.userDataCache);
        }
        
        // Atualizar interfaces específicas
        if (typeof window !== 'undefined' && window.userDataCache?.saude) {
          if (typeof window.renderHydration === 'function') {
            window.renderHydration();
          }
          if (typeof window.renderCaloricNeed === 'function') {
            window.renderCaloricNeed();
          }
        }
      } else {
        throw new Error('Não foi possível sincronizar os dados');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  // Exportar dados
  const exportData = useCallback(() => {
    if (!userData) return;

    try {
      const exportData = {
        userData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar no localStorage
      const backupKey = `wr_backup_${Date.now()}`;
      const storage = window.localStorage;
      storage.setItem(backupKey, JSON.stringify(exportData));

      // Criar download
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `completamente_backup_${DateUtils.getTodayStr()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Manter apenas últimos 5 backups
      const keys = Object.keys(storage).filter(k => k.startsWith('wr_backup_'));
      if (keys.length > 5) {
        keys.sort().slice(0, -5).forEach(k => storage.removeItem(k));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar dados';
      setError(errorMessage);
      throw err;
    }
  }, [userData]);

  // Limpar backups
  const clearBackups = useCallback(() => {
    try {
      const storage = window.localStorage;
      const keys = Object.keys(storage).filter(k => k.startsWith('wr_backup_'));
      keys.forEach(k => storage.removeItem(k));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar backups';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Valor do contexto
  const value: AppContextType = {
    user,
    userData,
    activeTherapist,
    isLoading,
    error,
    login,
    logout,
    updateUserData,
    clearError,
    manualSync,
    exportData,
    clearBackups
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
