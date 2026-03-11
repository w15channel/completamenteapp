// Configuração do Firebase - Em produção, configure via variáveis de ambiente no backend
const firebaseConfig = {
  apiKey: "AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY",
  authDomain: "completamenteapp.firebaseapp.com",
  databaseURL: "https://completamenteapp-default-rtdb.firebaseio.com",
  projectId: "completamenteapp",
  storageBucket: "completamenteapp.firebasestorage.app",
  messagingSenderId: "343038230333",
  appId: "1:343038230333:web:2338b20d2e706743b40f54"
};

let db = null;
let firebaseOffline = false;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  
  // Testar conexão
  db.ref('.info/connected').on('value', (snapshot) => {
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
