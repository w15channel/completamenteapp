// app-vanilla.js - Funcionalidades principais do aplicativo (versão vanilla JS)

// Configuração Firebase
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
try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
} catch (e) {
  console.warn("DB offline", e);
}

// Variáveis globais
window.clientId = "";
window.clientName = "";
window.hasAcceptedTerms = sessionStorage.getItem('wr_terms_accepted') === 'true';
window.userDataCache = null;
window.activeTherapist = null;
window.isWaiting = false;
window.activeChatRef = null;
window.waterReminderInterval = null;
window.cardioTimer = null;
window.ansioMessages = [];

// Terapeutas disponíveis
const therapists = [
  { id: 'lia', name: 'Dra. Lia', color: '#ec4899', icon: 'heart', schedule: 'Seg-Sex (08:00 - 22:00)' },
  { id: 'yara', name: 'Dra. Yara', color: '#8b5cf6', icon: 'moon', schedule: 'Dom-Sáb (22:00 - 08:00)' },
  { id: 'marcos', name: 'Dr. Marcos', color: '#10b981', icon: 'user-md', schedule: 'Sáb (08-12h / 14-22h)' },
  { id: 'juliana', name: 'Dra. Juliana', color: '#f59e0b', icon: 'star-of-life', schedule: 'Sáb 22:00 - Dom 22:00' }
];

// Funções principais
window.getTodayStr = function () {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

window.showTab = function (id) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const targetTab = document.getElementById(id);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  
  if (id !== 'chat' && window.activeChatRef) {
    window.activeChatRef.off();
    window.activeChatRef = null;
  }
  if (id === 'relacional') window.initRelacionalTab();
  if (id === 'routines') {
    if (Notification.permission === 'default') Notification.requestPermission();
    window.renderTasks();
  }
  if (id === 'financas') window.renderFinances();
};

// Login
window.login = async function (isPartner = false) {
  const gender = document.getElementById('user-gender')?.value;
  const name = document.getElementById('user-name-input')?.value?.trim();
  const pass = document.getElementById('user-pass-input')?.value;
  const partnerCode = document.getElementById('partner-code-input')?.value?.trim();

  if (!gender || !name || !pass) {
    alert('Preencha todos os campos obrigatórios!');
    return;
  }

  if (pass.length !== 8 || !/^\d{8}$/.test(pass)) {
    alert('Senha deve ter 8 dígitos numéricos (DDMMAAAA)!');
    return;
  }

  window.clientId = gender + '_' + name.replace(/\s+/g, '_') + '_' + pass;
  window.clientName = name;

  if (isPartner && partnerCode) {
    window.clientId += '_' + partnerCode;
  }

  // Salvar preferências
  if (document.getElementById('remember-me')?.checked) {
    localStorage.setItem('wr_user', window.clientId);
    localStorage.setItem('wr_pass', pass);
    localStorage.setItem('wr_remember', 'true');
  }

  // Carregar dados do usuário
  await window.loadUserData();
  window.showTab('home');
};

// Logout
window.logoutUser = function () {
  if (confirm('Deseja realmente sair?')) {
    localStorage.removeItem('wr_user');
    localStorage.removeItem('wr_pass');
    localStorage.removeItem('wr_remember');
    sessionStorage.removeItem('wr_terms_accepted');
    window.clientId = '';
    window.clientName = '';
    window.userDataCache = null;
    window.showTab('onboarding');
  }
};

// Carregar dados do usuário
window.loadUserData = async function () {
  if (!db || !window.clientId) return;

  try {
    const snap = await db.ref(`users/${window.clientId}`).once('value');
    let data = snap.val();

    if (!data) {
      // Criar dados iniciais
      data = {
        name: window.clientName,
        gender: window.clientId.split('_')[0],
        createdAt: new Date().toISOString(),
        saude: {
          weight: null,
          height: null,
          imc: null,
          water: { today: 0, goal: 2000 },
          exercise: { minutes: 0, last: null },
          anxietyScore: 0,
          anxietyDaily: { day: window.getTodayStr(), answers: [], score: 0, completed: false }
        },
        financas: {
          balance: 0,
          transactions: []
        },
        relational: {
          age: null,
          mood: null,
          partnerCode: null
        },
        routines: {
          tasks: [],
          goals: { week: '', month: '' }
        }
      };
      await db.ref(`users/${window.clientId}`).set(data);
    }

    window.userDataCache = data;
    window.updateUIWithUserData();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
};

// Atualizar UI com dados do usuário
window.updateUIWithUserData = function () {
  if (!window.userDataCache) return;

  // Atualizar nome no home
  const nameElements = document.querySelectorAll('.client-name');
  nameElements.forEach(el => {
    if (el) el.textContent = window.userDataCache.name || 'Aguardando';
  });

  // Atualizar dados de saúde se estiver na aba
  if (document.getElementById('saude').classList.contains('active')) {
    window.updateHealthUI();
  }
};

// Aceitar termos
window.acceptTerms = function () {
  window.hasAcceptedTerms = true;
  sessionStorage.setItem('wr_terms_accepted', 'true');
  document.getElementById('consent-modal').classList.add('hidden');
  window.renderTherapistList();
};

window.declineTerms = function () {
  document.getElementById('consent-modal').classList.add('hidden');
  window.showTab('home');
};

// Renderizar lista de terapeutas
window.renderTherapistList = function () {
  const list = document.getElementById('therapist-list');
  if (!list) return;

  list.innerHTML = '';
  therapists.forEach(t => {
    const isOnline = window.checkChatAvailability(t.id);
    const dotColor = isOnline ? 'bg-emerald-500' : 'bg-slate-600';
    const card = document.createElement('div');
    card.className = `flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all mb-3 bg-slate-800 border-slate-700 ${isOnline ? 'cursor-pointer hover:bg-slate-700' : 'opacity-60 cursor-not-allowed'}`;
    
    if (isOnline) {
      card.onclick = () => window.startChat(t.id);
    }
    
    card.innerHTML = `
      <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative" style="background-color:${t.color}">
        <i class="fas fa-${t.icon} text-lg"></i>
        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${dotColor}"></span>
      </div>
      <div class="flex-1">
        <span class="font-bold text-sm text-slate-200">${t.name}</span>
        <p class="text-[10px] text-slate-500 font-bold tracking-wider">${t.schedule}</p>
      </div>
      <div class="text-[9px] font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-500'} uppercase">${isOnline ? 'Online' : 'Off-line'}</div>
    `;
    
    list.appendChild(card);
  });
  
  window.showTab('chat-selection');
};

// Verificar disponibilidade do terapeuta
window.checkChatAvailability = function (id) {
  const d = new Date();
  const h = d.getHours();
  const day = d.getDay();
  
  if (id === 'lia') return (day >= 1 && day <= 5 && h >= 8 && h < 22);
  if (id === 'yara') return (h >= 22 || h < 8);
  if (id === 'marcos') return (day === 6 && ((h >= 8 && h < 12) || (h >= 14 && h < 22)));
  if (id === 'juliana') return ((day === 6 && h >= 22) || (day === 0 && h < 22));
  return false;
};

// Iniciar chat
window.startChat = async function (id) {
  window.activeTherapist = therapists.find(t => t.id === id);
  
  const nameEl = document.getElementById('active-name');
  const avatarEl = document.getElementById('active-avatar');
  const statusDotEl = document.getElementById('active-status-dot');
  const statusTextEl = document.getElementById('active-status-text');
  
  if (nameEl) nameEl.innerText = window.activeTherapist.name;
  if (avatarEl) {
    avatarEl.style.backgroundColor = window.activeTherapist.color;
    avatarEl.innerHTML = `<i class="fas fa-${window.activeTherapist.icon}"></i>`;
  }
  if (statusDotEl) statusDotEl.className = "status-dot bg-emerald-500";
  if (statusTextEl) statusTextEl.innerText = "Online";
  
  const chatId = `${window.clientId}_${id}`;
  
  // Limpar histórico antigo para começar fresh
  if (db) {
    await db.ref(`chats/${chatId}`).remove();
    localStorage.removeItem(`chat_${chatId}`);
  }
  
  // Criar nova conversa com mensagem de boas-vindas
  const welcomeMessages = [
    {
      role: 'system',
      content: `Você é ${window.activeTherapist.name}, um terapeuta profissional especialista em saúde mental. 
      Seu estilo é acolhedor, empático e profissional. 
      Responda de forma direta, calorosa e terapêutica.
      Use linguagem acessível e demonstre genuíno interesse pelo bem-estar do paciente.
      Inicie a conversa de forma acolhedora e pergunte como pode ajudar hoje.`
    },
    {
      role: 'assistant',
      content: `Olá! Sou ${window.activeTherapist.name}. 😊\n\nÉ muito bom ter você aqui hoje. Estou à disposição para te ouvir e acompanhar neste momento.\n\nPor que você gostaria de conversar? Como posso te ajudar?`
    }
  ];
  
  if (db) {
    window.activeChatRef = db.ref(`chats/${chatId}`);
    await db.ref(`chats/${chatId}`).set(welcomeMessages);
    
    window.activeChatRef.on('value', (s) => {
      let h = s.val() || welcomeMessages;
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(h));
      window.refreshChatDisplay(h);
    });
  } else {
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(welcomeMessages));
    window.refreshChatDisplay(welcomeMessages);
  }
  
  window.showTab('chat');
};

// Atualizar display do chat
window.refreshChatDisplay = function (h) {
  const mc = document.getElementById('chat-messages');
  if (!mc) return;
  
  mc.innerHTML = '';
  h.forEach(m => {
    if (m.role !== 'system') {
      window.renderMessage(m.content, m.role === 'user' ? 'user' : 'therapist');
    }
  });
  mc.scrollTop = mc.scrollHeight;
};

// Renderizar mensagem
window.renderMessage = function (t, type) {
  const d = document.createElement('div');
  d.className = `message ${type}`;
  d.innerHTML = t;
  
  const container = document.getElementById('chat-messages');
  if (container) {
    container.appendChild(d);
  }
};

// Enviar mensagem do chat
window.submitChat = async function (t) {
  if (!t || window.isWaiting) return;
  
  const chatId = `${window.clientId}_${window.activeTherapist.id}`;
  const inputEl = document.getElementById('chat-input');
  
  if (inputEl) inputEl.value = '';
  window.isWaiting = true;
  
  // Adicionar mensagem do usuário ao chat
  let h = [];
  if (db) {
    const snap = await db.ref(`chats/${chatId}`).once('value');
    h = snap.val() || [];
  }
  
  // Adicionar system message para terapeuta IA
  if (h.length === 0) {
    h.push({
      role: 'system',
      content: `Você é ${window.activeTherapist.name}, um terapeuta profissional especialista em saúde mental. 
      Seu estilo é acolhedor, empático e profissional. 
      Responda de forma direta, calorosa e terapêutica.
      Use linguagem acessível e demonstre genuíno interesse pelo bem-estar do paciente.
      Inicie a conversa de forma acolhedora e pergunte como pode ajudar hoje.`
    });
  }
  
  h.push({ role: 'user', content: t });
  
  if (db) await db.ref(`chats/${chatId}`).set(h);
  
  // Atualizar status
  const statusTextEl = document.getElementById('active-status-text');
  const typingBoxEl = document.getElementById('typing-box');
  
  if (statusTextEl) statusTextEl.innerText = "Processando";
  if (typingBoxEl) typingBoxEl.classList.remove('hidden');
  
  try {
    // Chamada direta à API do Hugging Face
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: h,
        temperature: 0.75,
        max_tokens: 500
      })
    });
    
    if (!res.ok) throw new Error('Erro na API');
    
    const data = await res.json();
    let rt = data.choices[0].message.content;
    
    // Limpar e formatar resposta
    rt = rt.replace(/\.\.\./g, '').trim();
    
    h.push({ role: 'assistant', content: rt });
    if (db) await db.ref(`chats/${chatId}`).set(h);
    
    // Atualizar interface
    window.refreshChatDisplay(h);
    
  } catch (err) {
    console.error('Erro no chat:', err);
    // Mensagem de fallback
    const fallbackMsg = "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. Estou aqui para ajudar você.";
    h.push({ role: 'assistant', content: fallbackMsg });
    if (db) await db.ref(`chats/${chatId}`).set(h);
    window.refreshChatDisplay(h);
  } finally {
    if (typingBoxEl) typingBoxEl.classList.add('hidden');
    if (statusTextEl) statusTextEl.innerText = "Online";
    window.isWaiting = false;
  }
};

// Limpar histórico do chat
window.clearChatHistoryInside = async function () {
  if (!window.activeTherapist || !confirm("Excluir o histórico desta conversa e recomeçar?")) return;
  
  const chatId = `${window.clientId}_${window.activeTherapist.id}`;
  localStorage.removeItem(`chat_${chatId}`);
  
  if (db) await db.ref(`chats/${chatId}`).remove();
  
  // Reiniciar com nova mensagem de boas-vindas
  const welcomeMessages = [
    {
      role: 'system',
      content: `Você é ${window.activeTherapist.name}, um terapeuta profissional especialista em saúde mental. 
      Seu estilo é acolhedor, empático e profissional. 
      Responda de forma direta, calorosa e terapêutica.
      Use linguagem acessível e demonstre genuíno interesse pelo bem-estar do paciente.
      Inicie a conversa de forma acolhedora e pergunte como pode ajudar hoje.`
    },
    {
      role: 'assistant',
      content: `Olá! Sou ${window.activeTherapist.name}. 😊\n\nÉ muito bom ter você aqui hoje. Estou à disposição para te ouvir e acompanhar neste momento.\n\nPor que você gostaria de conversar? Como posso te ajudar?`
    }
  ];
  
  if (db) {
    await db.ref(`chats/${chatId}`).set(welcomeMessages);
  }
  window.refreshChatDisplay(welcomeMessages);
};

// Trigger para seleção de chat
window.triggerChatSelection = function () {
  if (!window.hasAcceptedTerms) {
    const modal = document.getElementById('consent-modal');
    if (modal) modal.classList.remove('hidden');
  } else {
    window.renderTherapistList();
  }
};

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  // Verificar se usuário já está logado
  if (localStorage.getItem('wr_remember') === 'true') {
    const u = localStorage.getItem('wr_user');
    const p = localStorage.getItem('wr_pass');
    if (u && p) {
      window.clientId = u;
      window.clientName = u.split('_')[1].replace(/_/g, ' ');
      window.loadUserData();
      window.showTab('home');
    }
  }
  
  // Configurar formulário de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.login(false);
    });
  }
  
  // Configurar formulário de chat
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      if (input) {
        window.submitChat(input.value.trim());
      }
    });
  }
  
  // Verificar acesso administrativo
  setTimeout(() => {
    if (window.verifyAdminAccess) {
      window.verifyAdminAccess();
    }
  }, 1000);
});

// Funções placeholder (serão implementadas conforme necessário)
window.initRelacionalTab = function () { console.log('Aba relacional inicializada'); };
window.renderTasks = function () { console.log('Tarefas renderizadas'); };
window.renderFinances = function () { console.log('Finanças renderizadas'); };
window.updateHealthUI = function () { console.log('UI de saúde atualizada'); };
