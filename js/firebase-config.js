// Configuração do Firebase - Usa variáveis de ambiente em produção
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "completamenteapp.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://completamenteapp-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "completamenteapp",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "completamenteapp.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "343038230333",
  appId: process.env.FIREBASE_APP_ID || "1:343038230333:web:2338b20d2e706743b40f54"
};

// Variável global do Firebase para uso em todo o aplicativo
window.db = null;
let firebaseOffline = false;

try {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
  
  // Testar conexão
  window.db.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
      console.log("Firebase conectado com sucesso");
      firebaseOffline = false;
    } else {
      console.warn("Firebase offline - usando modo de proteção");
      firebaseOffline = true;
    }
  });
  
} catch(e) {
  console.warn("Firebase inicialização falhou, modo offline ativado:", e);
  firebaseOffline = true;
}

// Função para verificar status do Firebase
window.isFirebaseOnline = function() {
  return !firebaseOffline && window.db !== null;
};

// Função para operações seguras
window.safeFirebaseOperation = function(operation, fallback = null) {
  if (window.isFirebaseOnline()) {
    return operation();
  } else {
    console.warn("Firebase offline - usando fallback");
    return fallback || null;
  }
};

// Função de diagnóstico da conexão
window.diagnoseFirebaseConnection = async function() {
  console.log("🔍 Diagnosticando conexão Firebase...");
  console.log("📍 Database URL:", firebaseConfig.databaseURL);
  
  if (!window.db) {
    console.error("❌ Firebase DB não inicializado");
    return false;
  }
  
  try {
    // Testar conexão básica
    const testRef = window.db.ref('.info/connected');
    const snapshot = await new Promise((resolve) => {
      testRef.once('value', resolve);
    });
    
    const connected = snapshot.val();
    console.log("🔗 Status de conexão:", connected ? "CONECTADO" : "DESCONECTADO");
    
    // Testar escrita/leitura
    const testPath = `test/connection_${Date.now()}`;
    await window.db.ref(testPath).set({ timestamp: Date.now(), status: "test" });
    const readSnapshot = await window.db.ref(testPath).once('value');
    const testData = readSnapshot.val();
    
    if (testData && testData.status === "test") {
      console.log("✅ Teste de escrita/leitura: SUCESSO");
      await window.db.ref(testPath).remove(); // Limpar teste
    } else {
      console.log("❌ Teste de escrita/leitura: FALHOU");
    }
    
    return connected;
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
    return false;
  }
};

// Executar diagnóstico automaticamente
setTimeout(() => {
  window.diagnoseFirebaseConnection();
}, 2000);

// Função de sincronização automática completa (baseada na versão antiga)
window.autoSyncAllData = async function(userId) {
  if (!window.db || !userId) {
    console.log("⚠️ Firebase ou userId não disponível para sincronização automática");
    return false;
  }
  
  try {
    console.log("🔄 Iniciando sincronização automática completa para:", userId);
    
    // 1. Sincronizar dados do usuário
    const userSynced = await window.syncUserData(userId);
    if (!userSynced) {
      console.log("⚠️ Falha na sincronização do usuário, mas continuando...");
    }
    
    // 2. Recuperar dados completos do Firebase
    const allData = await window.recoverAllFirebaseData();
    if (allData) {
      console.log("✅ Dados completos recuperados na sincronização automática");
      
      // 3. Carregar dados específicos do usuário
      await window.loadMuralFromFirebase();
      await window.loadChatsFromFirebase();
      
      // 4. Atualizar interface se estiver na página principal
      setTimeout(() => {
        if (window.userDataCache && window.userDataCache.saude) {
          if (typeof window.renderHydration === 'function') window.renderHydration();
          if (typeof window.renderCaloricNeed === 'function') window.renderCaloricNeed();
        }
      }, 500);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Erro na sincronização automática:", error);
    return false;
  }
};

// Função para sincronizar dados do usuário
window.syncUserData = async function(userId) {
  if (!window.db || !userId) {
    console.warn("❌ Impossível sincronizar: Firebase não disponível ou userId ausente");
    return false;
  }
  
  try {
    console.log("🔄 Sincronizando dados do usuário:", userId);
    
    // Buscar dados completos do usuário
    const userSnapshot = await window.db.ref('users/' + userId).once('value');
    const userData = userSnapshot.val();
    
    if (userData) {
      console.log("✅ Dados encontrados no Firebase:", userData);
      
      // Mesclar com cache local, priorizando dados do Firebase
      if (!window.userDataCache) {
        window.userDataCache = {};
      }
      
      // Preservar dados locais temporários se existirem
      const localBackup = { ...window.userDataCache };
      
      // Sobrescrever com dados do Firebase
      window.userDataCache = { ...userData };
      
      // Restaurar dados locais importantes que podem não estar no Firebase
      if (localBackup.relacional && !window.userDataCache.relacional) {
        window.userDataCache.relacional = localBackup.relacional;
      }
      
      console.log("✅ Dados sincronizados com sucesso");
      return true;
    } else {
      console.log("ℹ️ Nenhum dado encontrado para o usuário:", userId);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
    return false;
  }
};

// Função para forçar salvamento imediato
window.forceSaveUserData = async function() {
  if (!window.db || !window.clientId) {
    console.warn("❌ Impossível salvar: Firebase ou clientId não disponível");
    return false;
  }
  
  try {
    console.log("💾 Forçando salvamento dos dados...");
    
    // Salvar dados completos do usuário
    await window.db.ref('users/' + window.clientId).set(window.userDataCache);
    
    console.log("✅ Dados salvos com sucesso");
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar dados:", error);
    return false;
  }
};

// Função completa para recuperar todos os dados do Firebase
window.recoverAllFirebaseData = async function() {
  if (!window.db) {
    console.error("❌ Firebase não disponível para recuperação de dados");
    return false;
  }
  
  try {
    console.log("🔄 Iniciando recuperação completa de dados do Firebase...");
    
    const recoveredData = {
      users: {},
      mural: [],
      chats: {},
      admin_auth: null,
      ai_status: {},
      timestamp: new Date().toISOString()
    };
    
    // 1. Recuperar todos os usuários
    console.log("📥 Recuperando dados de usuários...");
    const usersSnapshot = await window.db.ref('users').once('value');
    recoveredData.users = usersSnapshot.val() || {};
    console.log(`✅ ${Object.keys(recoveredData.users).length} usuários recuperados`);
    
    // 2. Recuperar mural
    console.log("📥 Recuperando dados do mural...");
    const muralSnapshot = await window.db.ref('mural').once('value');
    const muralData = muralSnapshot.val();
    if (muralData) {
      recoveredData.mural = Object.keys(muralData).map(key => ({
        id: key,
        ...muralData[key]
      }));
      console.log(`✅ ${recoveredData.mural.length} posts do mural recuperados`);
    }
    
    // 3. Recuperar todos os chats
    console.log("📥 Recuperando históricos de chat...");
    const chatsSnapshot = await window.db.ref('chats').once('value');
    const chatsData = chatsSnapshot.val();
    if (chatsData) {
      recoveredData.chats = chatsData;
      console.log(`✅ ${Object.keys(chatsData).length} chats recuperados`);
    }
    
    // 4. Recuperar configurações de admin
    console.log("📥 Recuperando configurações de admin...");
    const adminSnapshot = await window.db.ref('admin_auth').once('value');
    recoveredData.admin_auth = adminSnapshot.val();
    
    // 5. Recuperar status da IA
    console.log("📥 Recuperando status da IA...");
    const aiStatusSnapshot = await window.db.ref('ai_status').once('value');
    recoveredData.ai_status = aiStatusSnapshot.val() || {};
    
    // 6. Salvar dados recuperados em localStorage para backup
    console.log("💾 Salvando backup local dos dados recuperados...");
    localStorage.setItem('firebase_backup_' + Date.now(), JSON.stringify(recoveredData, null, 2));
    
    // 7. Restaurar dados do usuário atual se existir
    if (window.clientId && recoveredData.users[window.clientId]) {
      console.log("🔄 Restaurando dados do usuário atual:", window.clientId);
      window.userDataCache = recoveredData.users[window.clientId];
      
      // Atualizar interface
      if (window.userDataCache.saude) {
        window.renderHydration();
        window.renderCaloricNeed();
      }
      
      console.log("✅ Dados do usuário restaurados com sucesso");
    }
    
    console.log("🎉 Recuperação completa concluída!");
    console.log("📊 Resumo dos dados recuperados:", {
      usuarios: Object.keys(recoveredData.users).length,
      mural: recoveredData.mural.length,
      chats: Object.keys(recoveredData.chats).length,
      admin_config: recoveredData.admin_auth ? 'disponível' : 'não encontrado',
      ia_status: Object.keys(recoveredData.ai_status).length
    });
    
    return recoveredData;
    
  } catch (error) {
    console.error("❌ Erro na recuperação de dados:", error);
    return false;
  }
};

// Função para restaurar mural específico
window.loadMuralFromFirebase = async function() {
  if (!window.db) {
    console.error("❌ Firebase não disponível para carregar mural");
    return;
  }
  
  try {
    console.log("📥 Carregando mural do Firebase...");
    const muralSnapshot = await window.db.ref('mural').once('value');
    const muralData = muralSnapshot.val();
    
    if (muralData) {
      // Converter para array de posts
      window.muralPosts = Object.keys(muralData).map(key => ({
        id: key,
        ...muralData[key]
      })).reverse(); // Posts mais recentes primeiro
      
      console.log(`✅ ${window.muralPosts.length} posts do mural carregados`);
      
      // Se existir função de renderizar mural, chamá-la
      if (typeof window.loadMural === 'function') {
        window.loadMural();
      }
    } else {
      console.log("ℹ️ Nenhum post encontrado no mural");
      window.muralPosts = [];
    }
  } catch (error) {
    console.error("❌ Erro ao carregar mural:", error);
  }
};

// Função para restaurar chats específicos
window.loadChatsFromFirebase = async function() {
  if (!window.db || !window.clientId) {
    console.error("❌ Firebase ou clientId não disponível para carregar chats");
    return;
  }
  
  try {
    console.log("📥 Carregando chats do usuário:", window.clientId);
    const chatsSnapshot = await window.db.ref('chats').once('value');
    const chatsData = chatsSnapshot.val();
    
    if (chatsData) {
      // Filtrar chats do usuário atual
      const userChats = {};
      Object.keys(chatsData).forEach(chatId => {
        if (chatId.startsWith(window.clientId + '_')) {
          userChats[chatId] = chatsData[chatId];
        }
      });
      
      window.userChats = userChats;
      console.log(`✅ ${Object.keys(userChats).length} chats do usuário carregados`);
      
      // Se existir terapeuta ativo, atualizar chat
      if (window.activeTherapist && window.activeChatRef) {
        const currentChatId = `${window.clientId}_${window.activeTherapist.id}`;
        if (userChats[currentChatId]) {
          window.refreshChatDisplay(userChats[currentChatId]);
        }
      }
    } else {
      console.log("ℹ️ Nenhum chat encontrado");
      window.userChats = {};
    }
  } catch (error) {
    console.error("❌ Erro ao carregar chats:", error);
  }
};

// Função de sincronização inteligente periódica
window.startSmartSync = function(userId) {
  if (!userId || !window.db) return;
  
  // Limpar sincronização anterior se existir
  if (window.smartSyncInterval) {
    clearInterval(window.smartSyncInterval);
  }
  
  console.log("🔄 Iniciando sincronização inteligente a cada 30 segundos...");
  
  window.smartSyncInterval = setInterval(async () => {
    try {
      // Verificar se há atividade recente do usuário
      const lastActivity = localStorage.getItem('wr_last_activity') || Date.now();
      const timeSinceActivity = Date.now() - parseInt(lastActivity);
      
      // Só sincronizar se houve atividade nos últimos 5 minutos
      if (timeSinceActivity < 5 * 60 * 1000) {
        console.log("🔄 Sincronização inteligente automática...");
        await window.autoSyncAllData(userId);
      }
    } catch (error) {
      console.error("❌ Erro na sincronização inteligente:", error);
    }
  }, 30000); // A cada 30 segundos
};

// Parar sincronização inteligente
window.stopSmartSync = function() {
  if (window.smartSyncInterval) {
    clearInterval(window.smartSyncInterval);
    console.log("⏹️ Sincronização inteligente parada");
  }
};

// Atualizar atividade do usuário
document.addEventListener('click', () => {
  localStorage.setItem('wr_last_activity', Date.now());
});
document.addEventListener('keypress', () => {
  localStorage.setItem('wr_last_activity', Date.now());
});

// Funções utilitárias para acessar dados recuperados
window.getRecoveredData = function() {
  const backups = Object.keys(localStorage).filter(key => key.startsWith('firebase_backup_'));
  if (backups.length === 0) {
    console.log("ℹ️ Nenhum backup local encontrado");
    return null;
  }
  
  // Pegar o backup mais recente
  const latestBackup = backups.sort().pop();
  try {
    const data = JSON.parse(localStorage.getItem(latestBackup));
    console.log(`📦 Backup encontrado: ${latestBackup}`);
    return data;
  } catch (error) {
    console.error("❌ Erro ao ler backup:", error);
    return null;
  }
};

window.exportRecoveredData = function() {
  const data = window.getRecoveredData();
  if (!data) {
    alert("Nenhum dado recuperado disponível para exportar.");
    return;
  }
  
  // Criar blob e download
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `firebase_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log("📤 Dados exportados com sucesso");
};

window.clearLocalBackups = function() {
  const backups = Object.keys(localStorage).filter(key => key.startsWith('firebase_backup_'));
  backups.forEach(key => localStorage.removeItem(key));
  console.log(`🗑️ ${backups.length} backups locais removidos`);
  alert(`${backups.length} backups locais foram removidos.`);
};
