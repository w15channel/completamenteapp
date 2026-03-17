import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { useChat } from './hooks/useChat';
import { useHealth } from './hooks/useHealth';
import { Therapist, ChatMessage } from './types';
import { DateUtils } from './utils/dateUtils';
import PerfectApp from './components/PerfectApp';
import './css/ios-style.css';

// App wrapper com provider
const App: React.FC = () => {
  return (
    <AppProvider>
      <PerfectApp />
    </AppProvider>
  );
};

export default App;
