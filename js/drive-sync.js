// drive-sync.js - Serviço de sincronização automática com Google Drive

// Configurações
window.driveSyncConfig = {
  enabled: true,
  autoSave: true,
  syncInterval: 30000, // 30 segundos
  fileId: '1mQ7RAHiOBCAYPpoYkvUgZ36yYxyljhrH',
  lastSync: null,
  pendingChanges: false
};

// Fila de alterações pendentes
window.syncQueue = [];

// Iniciar sincronização automática
window.startDriveSync = function() {
  if (!window.driveSyncConfig.enabled) return;
  
  console.log('🔄 Drive Sync: Iniciando sincronização automática');
  
  // Sincronizar a cada X segundos
  setInterval(() => {
    if (window.driveSyncConfig.pendingChanges) {
      window.processSyncQueue();
    }
  }, window.driveSyncConfig.syncInterval);
  
  // Sincronizar quando a página perder foco
  window.addEventListener('beforeunload', () => {
    if (window.driveSyncConfig.pendingChanges) {
      window.syncToDriveImmediate();
    }
  });
};

// Adicionar alteração à fila de sincronização
window.queueDriveChange = function(type, data) {
  if (!window.driveSyncConfig.enabled) return;
  
  const change = {
    id: Date.now() + '_' + Math.random(),
    type: type, // 'user', 'chat', 'training', 'metrics', etc.
    data: data,
    timestamp: new Date().toISOString(),
    processed: false
  };
  
  window.syncQueue.push(change);
  window.driveSyncConfig.pendingChanges = true;
  
  console.log('📝 Drive Sync: Alteração enfileirada', change);
  
  // Se for importante, sincronizar imediatamente
  if (type === 'training' || type === 'critical') {
    window.syncToDriveImmediate();
  }
};

// Processar fila de sincronização
window.processSyncQueue = async function() {
  if (!window.syncQueue.length) return;
  
  console.log('🔄 Drive Sync: Processando', window.syncQueue.length, 'alterações');
  
  try {
    // Agrupar alterações por tipo
    const groupedChanges = window.groupChangesByType(window.syncQueue);
    
    // Preparar conteúdo completo para o Drive
    const driveContent = window.prepareDriveContent(groupedChanges);
    
    // Enviar para o Drive
    const response = await fetch('/api/drive-editor', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Key': window.adminPassword || 'wr@2026'
      },
      body: JSON.stringify({
        content: driveContent,
        operation: 'update',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      // Marcar como processado
      window.syncQueue.forEach(change => change.processed = true);
      window.syncQueue = window.syncQueue.filter(change => !change.processed);
      window.driveSyncConfig.pendingChanges = false;
      window.driveSyncConfig.lastSync = new Date().toISOString();
      
      console.log('✅ Drive Sync: Sincronização concluída');
    } else {
      throw new Error('Falha na sincronização');
    }
    
  } catch (error) {
    console.error('❌ Drive Sync: Erro na sincronização', error);
  }
};

// Sincronização imediata (para dados críticos)
window.syncToDriveImmediate = async function() {
  if (!window.syncQueue.length) return;
  
  console.log('⚡ Drive Sync: Sincronização imediata');
  
  try {
    const driveContent = window.prepareDriveContent(window.groupChangesByType(window.syncQueue));
    
    const response = await fetch('/api/drive-editor', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Key': window.adminPassword || 'wr@2026'
      },
      body: JSON.stringify({
        content: driveContent,
        operation: 'update',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      window.syncQueue = [];
      window.driveSyncConfig.pendingChanges = false;
      console.log('✅ Drive Sync: Sincronização imediata concluída');
    }
    
  } catch (error) {
    console.error('❌ Drive Sync: Erro na sincronização imediata', error);
  }
};

// Agrupar alterações por tipo
window.groupChangesByType = function(changes) {
  const grouped = {};
  
  changes.forEach(change => {
    if (!grouped[change.type]) {
      grouped[change.type] = [];
    }
    grouped[change.type].push(change);
  });
  
  return grouped;
};

// Preparar conteúdo para o Drive
window.prepareDriveContent = function(groupedChanges) {
  const content = {
    metadata: {
      lastSync: new Date().toISOString(),
      version: '1.0.0',
      totalChanges: window.syncQueue.length
    },
    data: {}
  };
  
  // Processar cada tipo de alteração
  Object.keys(groupedChanges).forEach(type => {
    switch (type) {
      case 'user':
        content.data.users = groupedChanges[type].map(c => c.data);
        break;
      case 'chat':
        content.data.chats = groupedChanges[type].map(c => c.data);
        break;
      case 'training':
        content.data.training = groupedChanges[type].map(c => c.data);
        break;
      case 'metrics':
        content.data.metrics = groupedChanges[type].map(c => c.data);
        break;
      case 'health':
        content.data.health = groupedChanges[type].map(c => c.data);
        break;
      case 'finance':
        content.data.finance = groupedChanges[type].map(c => c.data);
        break;
      default:
        content.data[type] = groupedChanges[type].map(c => c.data);
    }
  });
  
  return JSON.stringify(content, null, 2);
};

// Hooks para capturar alterações automaticamente
window.setupDriveHooks = function() {
  
  // Hook para treinamento da IA
  if (window.sendTrainingToAI) {
    const originalSendTraining = window.sendTrainingToAI;
    window.sendTrainingToAI = async function() {
      const result = await originalSendTraining.apply(this, arguments);
      
      // Adicionar à fila de sincronização
      window.queueDriveChange('training', {
        type: document.getElementById('training-type')?.value,
        instruction: document.getElementById('training-input')?.value,
        timestamp: new Date().toISOString()
      });
      
      return result;
    };
  }
  
  // Hook para mensagens do chat
  if (window.submitChat) {
    const originalSubmitChat = window.submitChat;
    window.submitChat = async function() {
      const result = await originalSubmitChat.apply(this, arguments);
      
      // Adicionar à fila de sincronização
      window.queueDriveChange('chat', {
        userMessage: arguments[0],
        therapist: window.activeTherapist?.name,
        timestamp: new Date().toISOString()
      });
      
      return result;
    };
  }
  
  // Hook para dados de saúde
  if (window.saveHealthData) {
    const originalSaveHealth = window.saveHealthData;
    window.saveHealthData = function() {
      const result = originalSaveHealth.apply(this, arguments);
      
      window.queueDriveChange('health', {
        weight: document.getElementById('health-weight')?.value,
        height: document.getElementById('health-height')?.value,
        timestamp: new Date().toISOString()
      });
      
      return result;
    };
  }
  
  console.log('🪝 Drive Sync: Hooks configurados');
};

// Iniciar sincronização quando carregar a página
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.startDriveSync();
    window.setupDriveHooks();
  }, 2000);
});

// Função para status da sincronização
window.getSyncStatus = function() {
  return {
    enabled: window.driveSyncConfig.enabled,
    pendingChanges: window.driveSyncConfig.pendingChanges,
    queueLength: window.syncQueue.length,
    lastSync: window.driveSyncConfig.lastSync,
    nextSync: new Date(Date.now() + window.driveSyncConfig.syncInterval).toLocaleTimeString()
  };
};
