const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "completamenteapp.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://completamenteapp-default-rtdb.firebaseio.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "completamenteapp",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "completamenteapp.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "343038230333",
  appId: process.env.FIREBASE_APP_ID || "1:343038230333:web:2338b20d2e706743b40f54"
};

let db = null;
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  console.log("Firebase inicializado com sucesso");
} catch(e) {
  console.warn("Firebase offline ou já inicializado:", e);
}
