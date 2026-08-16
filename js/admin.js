window.isAdmin = false;
window.adminPassword = 'wr@2026';
window.adminData = {
  users: {},
  chats: {},
  overrides: {},
  selectedUserId: null,
  selectedChatId: null
};

window.escapeAdminHtml = function (value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

window.checkAdminAccess = function () {
  const password = prompt('Digite a senha administrativa:');
  if (password === null) return;
  if (password !== window.adminPassword) {
    alert('Senha incorreta! Acesso negado.');
    return;
  }

  window.isAdmin = true;
  sessionStorage.setItem('admin_logged_in', 'true');
  const box = document.getElementById('admin-access');
  if (box) box.classList.remove('hidden');
  window.showTab('admin');
  window.loadAdminData();
  alert('Acesso administrativo concedido!');
};

window.verifyAdminAccess = function () {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
  window.isAdmin = isLoggedIn;
  const box = document.getElementById('admin-access');
  if (box) box.classList.toggle('hidden', !isLoggedIn);
};

window.showAdminSubTab = function (tabId) {
  ['admin-overview', 'admin-users', 'admin-chats'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  ['btn-admin-overview', 'btn-admin-users', 'btn-admin-chats'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });
  document.getElementById(tabId)?.classList.remove('hidden');
  document.getElementById(`btn-${tabId}`)?.classList.add('active');
};

window.loadAdminData = async function () {
  if (!window.isAdmin || !window.db && typeof db === 'undefined') return;
  const database = typeof db !== 'undefined' ? db : window.db;
  if (!database) return;

  const [usersSnap, chatsSnap, overridesSnap] = await Promise.all([
    database.ref('users').once('value'),
    database.ref('chats').once('value'),
    database.ref('adminOverrides').once('value')
  ]);

  window.adminData.users = usersSnap.val() || {};
  window.adminData.chats = chatsSnap.val() || {};
  window.adminData.overrides = overridesSnap.val() || {};

  document.getElementById('admin-total-users').innerText = Object.keys(window.adminData.users).length;
  document.getElementById('admin-total-chats').innerText = Object.keys(window.adminData.chats).length;

  window.renderAssumedChats();
  window.renderAdminUsers();
  window.renderAdminChats();

  if (window.adminData.selectedUserId) window.previewAdminUser(window.adminData.selectedUserId);
  if (window.adminData.selectedChatId) window.openAdminChat(window.adminData.selectedChatId, false);
};

window.renderAssumedChats = function () {
  const container = document.getElementById('admin-assumed-list');
  if (!container) return;
  const entries = Object.entries(window.adminData.overrides || {}).filter(([, value]) => value?.assumed);
  if (!entries.length) {
    container.innerHTML = '<div class="text-[10px] text-slate-500">Nenhuma conversa assumida no momento.</div>';
    return;
  }

  container.innerHTML = entries.map(([chatId, value]) => `
    <button onclick="window.openAdminChat('${window.escapeAdminHtml(chatId)}')" class="w-full text-left p-3 rounded-xl bg-amber-950/40 border border-amber-700/40 hover:bg-amber-900/50 transition">
      <div class="font-bold text-amber-300">${window.escapeAdminHtml(chatId)}</div>
      <div class="text-[10px] text-slate-400">Assumido em ${new Date(value.updatedAt || Date.now()).toLocaleString('pt-BR')}</div>
    </button>
  `).join('');
};

window.renderAdminUsers = function () {
  const container = document.getElementById('admin-users-list');
  const search = (document.getElementById('admin-user-search')?.value || '').trim().toLowerCase();
  if (!container) return;

  const users = Object.entries(window.adminData.users || {}).filter(([id, user]) => {
    const haystack = `${id} ${user?.fullName || ''}`.toLowerCase();
    return !search || haystack.includes(search);
  });

  if (!users.length) {
    container.innerHTML = '<div class="text-center text-slate-500 text-xs py-6">Nenhum usuário encontrado.</div>';
    return;
  }

  container.innerHTML = users.map(([id, user]) => `
    <button onclick="window.previewAdminUser('${window.escapeAdminHtml(id)}')" class="w-full text-left p-3 rounded-xl border ${window.adminData.selectedUserId===id?'border-amber-500 bg-amber-950/30':'border-slate-700 bg-slate-900'} hover:border-amber-600 transition">
      <div class="font-bold text-white text-sm">${window.escapeAdminHtml(user?.fullName || id)}</div>
      <div class="text-[10px] text-slate-400 uppercase">${window.escapeAdminHtml(id)}</div>
    </button>
  `).join('');
};

window.previewAdminUser = function (userId) {
  window.adminData.selectedUserId = userId;
  const data = window.adminData.users?.[userId] || {};
  const preview = document.getElementById('admin-user-preview');
  if (preview) {
    preview.textContent = JSON.stringify(data, null, 2);
  }
  window.renderAdminUsers();
  window.renderAdminChats();
};

window.renderAdminChats = function () {
  const container = document.getElementById('admin-chats-list');
  const search = (document.getElementById('admin-chat-search')?.value || '').trim().toLowerCase();
  if (!container) return;

  const chats = Object.entries(window.adminData.chats || {}).filter(([chatId]) => {
    const byUserFilter = !window.adminData.selectedUserId || chatId.startsWith(`${window.adminData.selectedUserId}_`);
    const byTextFilter = !search || chatId.toLowerCase().includes(search);
    return byUserFilter && byTextFilter;
  });

  if (!chats.length) {
    container.innerHTML = '<div class="text-center text-slate-500 text-xs py-6">Nenhuma conversa encontrada.</div>';
    return;
  }

  container.innerHTML = chats.map(([chatId, history]) => {
    const last = Array.isArray(history) ? history.filter((m) => m.role !== 'system').slice(-1)[0] : null;
    const assumed = !!window.adminData.overrides?.[chatId]?.assumed;
    return `
      <button onclick="window.openAdminChat('${window.escapeAdminHtml(chatId)}')" class="w-full text-left p-3 rounded-xl border ${window.adminData.selectedChatId===chatId?'border-amber-500 bg-amber-950/30':'border-slate-700 bg-slate-900'} hover:border-amber-600 transition">
        <div class="flex items-center justify-between gap-2">
          <div class="font-bold text-white text-sm">${window.escapeAdminHtml(chatId)}</div>
          <div class="text-[10px] font-black uppercase ${assumed?'text-amber-300':'text-slate-500'}">${assumed?'Assumido':'Automático'}</div>
        </div>
        <div class="text-[10px] text-slate-400 mt-1 line-clamp-2">${window.escapeAdminHtml(last?.content || 'Sem mensagens ainda.')}</div>
      </button>
    `;
  }).join('');
};

window.openAdminChat = async function (chatId, switchTab = true) {
  if (switchTab) window.showAdminSubTab('admin-chats');
  window.adminData.selectedChatId = chatId;
  document.getElementById('admin-selected-chat-title').innerText = chatId;
  window.updateAdminTakeoverButton();
  await window.refreshAdminSelectedChat();
  window.renderAdminChats();
};

window.refreshAdminSelectedChat = async function () {
  const chatId = window.adminData.selectedChatId;
  if (!chatId) return;
  const database = typeof db !== 'undefined' ? db : window.db;
  if (!database) return;
  const snap = await database.ref(`chats/${chatId}`).once('value');
  const history = snap.val() || [];
  window.adminData.chats[chatId] = history;
  const container = document.getElementById('admin-chat-messages');
  if (!container) return;
  container.innerHTML = history.map((message) => {
    const role = message?.role || 'system';
    const label = role === 'user' ? 'Usuário' : role === 'assistant' ? 'Assistente' : 'Sistema';
    const source = message?.meta?.source === 'admin' ? ' • enviado pelo Admin' : '';
    return `<div class="admin-chat-line ${role}"><div class="text-[10px] uppercase font-black mb-1 ${role==='user'?'text-sky-300':role==='assistant'?'text-emerald-300':'text-amber-200'}">${label}${source}</div><div>${window.escapeAdminHtml(message?.content || '')}</div></div>`;
  }).join('') || '<div class="text-center text-slate-500 text-xs py-8">Sem histórico nesta conversa.</div>';
  container.scrollTop = container.scrollHeight;
};

window.updateAdminTakeoverButton = function () {
  const chatId = window.adminData.selectedChatId;
  const assumed = chatId ? !!window.adminData.overrides?.[chatId]?.assumed : false;
  const button = document.getElementById('admin-assume-toggle');
  const status = document.getElementById('admin-selected-chat-status');
  if (button) {
    button.innerText = assumed ? 'Liberar automático' : 'Assumir conversa';
    button.className = `w-full p-3 rounded-xl text-[10px] font-black uppercase ${assumed ? 'bg-rose-700 text-white' : 'bg-amber-700 text-white'}`;
  }
  if (status) status.innerText = assumed ? 'Modo assumido pelo Admin' : 'Modo automático';
};

window.toggleAdminTakeover = async function () {
  const chatId = window.adminData.selectedChatId;
  if (!chatId) return alert('Selecione uma conversa primeiro.');
  const database = typeof db !== 'undefined' ? db : window.db;
  if (!database) return alert('Banco de dados indisponível.');

  const assumed = !!window.adminData.overrides?.[chatId]?.assumed;
  const nextValue = {
    assumed: !assumed,
    updatedAt: Date.now(),
    updatedBy: 'admin'
  };

  await database.ref(`adminOverrides/${chatId}`).set(nextValue);
  window.adminData.overrides[chatId] = nextValue;
  window.updateAdminTakeoverButton();
  window.renderAssumedChats();
  window.renderAdminChats();
};

window.sendAdminReplyAsBot = async function () {
  const chatId = window.adminData.selectedChatId;
  const input = document.getElementById('admin-reply-input');
  const content = input?.value.trim();
  if (!chatId) return alert('Selecione uma conversa primeiro.');
  if (!content) return alert('Digite a resposta que será enviada como assistente.');

  const database = typeof db !== 'undefined' ? db : window.db;
  if (!database) return alert('Banco de dados indisponível.');

  const snap = await database.ref(`chats/${chatId}`).once('value');
  const history = snap.val() || [];
  history.push({
    role: 'assistant',
    content,
    meta: {
      source: 'admin',
      sentAt: Date.now()
    }
  });
  await database.ref(`chats/${chatId}`).set(history);
  window.adminData.chats[chatId] = history;
  input.value = '';
  await database.ref(`adminOverrides/${chatId}`).set({
    assumed: true,
    updatedAt: Date.now(),
    updatedBy: 'admin'
  });
  window.adminData.overrides[chatId] = {
    assumed: true,
    updatedAt: Date.now(),
    updatedBy: 'admin'
  };
  window.updateAdminTakeoverButton();
  window.renderAssumedChats();
  window.renderAdminChats();
  window.refreshAdminSelectedChat();
};

document.addEventListener('DOMContentLoaded', () => {
  window.verifyAdminAccess();
});
