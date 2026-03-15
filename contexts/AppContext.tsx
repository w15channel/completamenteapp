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

  // Initialize localStorage data
  useEffect(() => {
    const initializeApp = () => {
      try {
        const storage = window.localStorage;
        const session = window.sessionStorage;
        
        // Load data from localStorage
        const rememberedUser = storage.getItem('wr_remember') === 'true';
        const savedUser = storage.getItem('wr_user');
        const savedPass = storage.getItem('wr_pass');
        const acceptedTerms = session.getItem('wr_terms_accepted') === 'true';

        // Configure API URLs
        if (typeof window !== 'undefined') {
          window.AI_PROXY_URL = (window.location.origin && window.location.origin.startsWith("http"))
            ? `${window.location.origin}/api/ai`
            : "/api/ai";
          window.CHAT_AI_PROXY_URL = (window.location.origin && window.location.origin.startsWith("http"))
            ? `${window.location.origin}/api/chat`
            : "/api/chat";
        }

        // Auto-login if remembered
        if (rememberedUser && savedUser && savedPass) {
          const loginData: Partial<UserData> = {
            fullName: savedUser,
            pass: savedPass,
            gender: 'M',
            created: Date.now()
          };
          // Login will be done after function declaration
          setTimeout(() => login(loginData, true), 0);
        } else {
          setIsLoading(false);
        }

        // Configure global variables
        if (typeof window !== 'undefined') {
          window.hasAcceptedTerms = acceptedTerms;
        }

      } catch (err) {
        console.error('Error initializing application:', err);
        setError('Failed to initialize application');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [login]);

  // User login
  const login = useCallback(async (loginData: Partial<UserData>, isAuto = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate data
      if (!isAuto) {
        if (!loginData.fullName || loginData.fullName.split(' ').length < 2) {
          throw new Error('Enter First and Last Name');
        }
        if (!loginData.pass || !/^[0-9]{8}$/.test(loginData.pass)) {
          throw new Error('Password must have exactly 8 numbers');
        }
      }

      // Create user object
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

      // Initialize complete user data
      const completeUserData: UserData = {
        pass: loginData.pass || '',
        fullName: loginData.fullName || '',
        gender: loginData.gender || 'M',
        created: Date.now(),
        relacional: {},
        saude: {},
        financas: { transactions: [] }
      };

      // Save in global variables (compatibility)
      if (typeof window !== 'undefined') {
        window.clientId = userId;
        window.clientName = userName;
        window.userDataCache = completeUserData;
      }

      // Save to localStorage if not auto-login
      if (!isAuto) {
        const storage = window.localStorage;
        storage.setItem('wr_user', loginData.fullName || '');
        storage.setItem('wr_pass', loginData.pass || '');
        if (document.getElementById('remember-me') as HTMLInputElement)?.checked) {
          storage.setItem('wr_remember', 'true');
        }
      }

      // Sync with Firebase if available
      const firebase = FirebaseService.getInstance();
      if (firebase.isFirebaseOnline()) {
        await firebase.smartSync(userId);
      }

      // Update state
      setUser(newUser);
      setUserData(completeUserData);
      setActiveTherapist(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // User logout
  const logout = useCallback(() => {
    try {
      // Clear global variables
      if (typeof window !== 'undefined') {
        window.clientId = '';
        window.clientName = '';
        window.userDataCache = null;
        window.activeTherapist = null;
        window.activeChatRef = null;
      }

      // Clear state
      setUser(null);
      setUserData(null);
      setActiveTherapist(null);
      setError(null);

    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Update user data
  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!user || !userData) return;

    try {
      setError(null);
      
      const updatedUserData = { ...userData, ...updates };
      
      // Update global variables
      if (typeof window !== 'undefined') {
        window.userDataCache = updatedUserData;
      }

      // Save to Firebase
      const firebase = FirebaseService.getInstance();
      if (firebase.isFirebaseOnline()) {
        await firebase.saveUserData(user.id, updatedUserData);
      }

      // Update state
      setUserData(updatedUserData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating data';
      setError(errorMessage);
      throw err;
    }
  }, [user, userData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Manual sync
  const manualSync = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const firebase = FirebaseService.getInstance();
      
      if (!firebase.isFirebaseOnline()) {
        throw new Error('Firebase not available');
      }

      const success = await firebase.robustSync(user.id);
      
      if (success) {
        // Reload data from global cache
        if (typeof window !== 'undefined' && window.userDataCache) {
          setUserData(window.userDataCache);
        }
        
        // Update specific interfaces
        if (typeof window !== 'undefined' && window.userDataCache?.saude) {
          if (typeof window.renderHydration === 'function') {
            window.renderHydration();
          }
          if (typeof window.renderCaloricNeed === 'function') {
            window.renderCaloricNeed();
          }
        }
      } else {
        throw new Error('Could not sync data');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync error';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  // Export data
  const exportData = useCallback(() => {
    if (!userData) return;

    try {
      const exportData = {
        userData,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Save to localStorage
      const backupKey = `wr_backup_${Date.now()}`;
      const storage = window.localStorage;
      storage.setItem(backupKey, JSON.stringify(exportData));

      // Create download
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

      // Keep only last 5 backups
      const keys = Object.keys(storage).filter(k => k.startsWith('wr_backup_'));
      if (keys.length > 5) {
        keys.sort().slice(0, -5).forEach(k => storage.removeItem(k));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export error';
      setError(errorMessage);
      throw err;
    }
  }, [userData]);

  // Clear backups
  const clearBackups = useCallback(() => {
    try {
      const storage = window.localStorage;
      const keys = Object.keys(storage).filter(k => k.startsWith('wr_backup_'));
      keys.forEach(k => storage.removeItem(k));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Clear backups error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Context value
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
