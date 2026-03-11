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
  return !firebaseOffline && db !== null;
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
