// CONFIGURAÇÃO DO FIREBASE
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
} catch(e) { 
    console.warn("Banco de dados offline ou erro de conexão", e); 
}

// VARIÁVEIS GLOBAIS
window.AI_PROXY_URL = (location.origin && location.origin.startsWith("http")) ? `${location.origin}/api/ai` : "/api/ai";
window.CHAT_AI_PROXY_URL = (location.origin && location.origin.startsWith("http")) ? `${location.origin}/api/chat` : "/api/chat";
window.clientId = "";
window.clientName = "";
window.hasAcceptedTerms = sessionStorage.getItem('wr_terms_accepted') === 'true';
window.userDataCache = null;
window.activeTherapist = null;
window.isWaiting = false;
window.activeChatRef = null;
window.cardioTimer = null;
window.ansioMessages = [];

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem('wr_remember') === 'true') {
        const u = localStorage.getItem('wr_user');
        const p = localStorage.getItem('wr_pass');
        if (u && p) {
            const nEl = document.getElementById('user-name-input');
            const pEl = document.getElementById('user-pass-input');
            if(nEl) nEl.value = u;
            if(pEl) pEl.value = p;
            const rem = document.getElementById('remember-me');
            if(rem) rem.checked = true;
            setTimeout(() => window.login(true), 300);
        }
    }
    if (typeof window.renderArt === 'function') window.renderArt();
});

// FUNÇÕES DE NAVEGAÇÃO E LOGIN
window.showTab = function(id) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    if (id !== 'chat' && window.activeChatRef) {
        window.activeChatRef.off();
        window.activeChatRef = null;
    }
    
    // Inicializadores de abas específicas
    if (id === 'relacional') window.initRelacionalTab();
    if (id === 'routines') window.renderTasks();
    if (id === 'financas') window.renderFinances();
    if (id === 'saude') window.initSaudeTab();
    if (id === 'relaxation') window.showRelaxSubTab('rx-video');
};

window.login = async function(isAuto) {
    try {
        const gEl = document.getElementById('user-gender');
        const nEl = document.getElementById('user-name-input');
        const pEl = document.getElementById('user-pass-input');
        const partnerEl = document.getElementById('partner-code-input');
        
        const g = gEl ? gEl.value : '';
        const n = nEl ? nEl.value.trim().toUpperCase() : '';
        const p = pEl ? pEl.value.trim() : '';
        const partnerCode = partnerEl ? partnerEl.value.trim().toUpperCase() : '';

        if (!isAuto && (!g || n.split(' ').length < 2 || !/^[0-9]{8}$/.test(p))) {
            return alert("Atenção: Selecione o gênero, preencha Nome Completo e Senha de 8 dígitos.");
        }

        window.clientId = n.replace(/\s+/g, '_');
        window.clientName = n.split(' ')[0];

        if (!window.userDataCache) {
            window.userDataCache = { relacional: {}, saude: {}, financas: { transactions: [] } };
        }

        if (db) {
            const snap = await db.ref('users/' + window.clientId).once('value');
            if (!snap.exists()) {
                const newUser = { 
                    pass: p, fullName: n, gender: g || 'M', 
                    created: Date.now(), relacional: {}, saude: {}, 
                    financas: { transactions: [] } 
                };
                if (partnerCode) newUser.relacional.linkedPartner = partnerCode;
                await db.ref('users/' + window.clientId).set(newUser);
                window.userDataCache = newUser;
            } else {
                const u = snap.val();
                if (u.pass !== p) return alert("Senha incorreta.");
                window.userDataCache = u;
                if (partnerCode) {
                    await db.ref('users/' + window.clientId + '/relacional/linkedPartner').set(partnerCode);
                }
            }
        }

        const rem = document.getElementById('remember-me');
        if (rem && rem.checked) {
            localStorage.setItem('wr_remember', 'true');
            localStorage.setItem('wr_user', n);
            localStorage.setItem('wr_pass', p);
        }

        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName);
        window.showTab('home');

    } catch (error) {
        console.error("Erro no Login:", error);
        window.showTab('home');
    }
};

window.logoutUser = function() {
    localStorage.removeItem('wr_remember');
    localStorage.removeItem('wr_user');
    localStorage.removeItem('wr_pass');
    window.location.reload();
};

// MÓDULO SAÚDE
window.showSaudeSubTab = function(id) {
    document.querySelectorAll('#saude .rel-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + id);
    if(btn) btn.classList.add('active');
    ['sd-perfil', 'sd-agua', 'sd-nutricao', 'sd-exercicio', 'sd-cardio', 'sd-ansiedade'].forEach(t => {
        const el = document.getElementById(t);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
};

window.initSaudeTab = function() {
    window.showSaudeSubTab('sd-perfil');
    if (!window.userDataCache.saude) window.userDataCache.saude = {};
    const s = window.userDataCache.saude;
    if (s.weight) document.getElementById('health-weight').value = s.weight;
    if (s.height) document.getElementById('health-height').value = s.height;
    if (s.imc) document.getElementById('imc-result').innerText = `IMC: ${s.imc} (${s.imcCategory})`;
};

window.calcIMC = async function() {
    const w = parseFloat(document.getElementById('health-weight').value);
    const h = parseFloat(document.getElementById('health-height').value);
    if (!w || !h) return alert("Preencha peso e altura.");
    const imc = (w / (h * h)).toFixed(1);
    let cat = "Normal";
    if (imc < 18.5) cat = "Abaixo do peso";
    else if (imc < 25) cat = "Normal";
    else if (imc < 30) cat = "Sobrepeso";
    else cat = "Obesidade";
    
    document.getElementById('imc-result').innerText = `IMC: ${imc} (${cat})`;
    window.userDataCache.saude.weight = w;
    window.userDataCache.saude.height = h;
    window.userDataCache.saude.imc = imc;
    window.userDataCache.saude.imcCategory = cat;
    if (db) await db.ref('users/' + window.clientId + '/saude').update({weight:w, height:h, imc:imc, imcCategory:cat});
};

// JOGOS E RELAXAMENTO
window.showRelaxSubTab = function(id) {
    document.querySelectorAll('#relaxation .rel-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + id);
    if(btn) btn.classList.add('active');
    ['rx-video', 'rx-cinema', 'rx-arte', 'rx-mural', 'rx-biblioteca', 'rx-caixinha', 'rx-jogos'].forEach(t => {
        const el = document.getElementById(t);
        if(el) el.classList.add('hidden');
    });
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    if(id === 'rx-mural') window.loadMural();
};

// Aqui seriam incluídas as definições de gameDefs e outras lógicas de suporte
// Otimizado para o seu uso no GitHub.
