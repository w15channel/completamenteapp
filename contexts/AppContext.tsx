import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserData, AppContextType } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTherapist, setActiveTherapist] = useState<null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (loginData: Partial<UserData>, isAuto = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = (loginData.fullName || '').replace(/\s+/g, '_');
      const userName = (loginData.fullName || '').split(' ')[0];
      
      const newUser: User = {
        id: userId,
        name: userName,
        fullName: loginData.fullName || '',
        email: `${userName.toLowerCase()}@example.com`,
        gender: loginData.gender || 'M',
        pass: loginData.pass || '',
        createdAt: Date.now()
      };

      const completeUserData: UserData = {
        pass: loginData.pass || '',
        fullName: loginData.fullName || '',
        gender: loginData.gender || 'M',
        created: Date.now(),
        relacional: {},
        saude: {},
        financas: { transactions: [] }
      };

      if (typeof window !== 'undefined') {
        window.clientId = userId;
        window.clientName = userName;
        window.userDataCache = completeUserData;
      }

      if (!isAuto && typeof window !== 'undefined') {
        window.localStorage.setItem('wr_user', loginData.fullName || '');
        window.localStorage.setItem('wr_pass', loginData.pass || '');
      }

      setUser(newUser);
      setUserData(completeUserData);
      setActiveTherapist(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login error';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.clientId = '';
      window.clientName = '';
      window.userDataCache = null;
      window.activeTherapist = null;
      window.activeChatRef = null;
    }
    setUser(null);
    setUserData(null);
    setActiveTherapist(null);
    setError(null);
  }, []);

  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!user || !userData) return;
    
    try {
      const updated = { ...userData, ...updates };
      if (typeof window !== 'undefined') {
        window.userDataCache = updated;
      }
      setUserData(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update error';
      setError(msg);
    }
  }, [user, userData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const manualSync = useCallback(async () => {
    if (!user) return;
    try {
      if (typeof window !== 'undefined' && window.userDataCache) {
        setUserData(window.userDataCache);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync error';
      setError(msg);
    }
  }, [user]);

  const exportData = useCallback(() => {
    if (!userData) return;
    
    try {
      const data = {
        userData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export error';
      setError(msg);
    }
  }, [userData]);

  const clearBackups = useCallback(() => {
    try {
      const storage = window.localStorage;
      Object.keys(storage)
        .filter(k => k.startsWith('wr_backup_'))
        .forEach(k => storage.removeItem(k));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Clear error';
      setError(msg);
    }
  }, []);

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
}

export default AppContext;
