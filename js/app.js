// ==========================================
// CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================
const firebaseConfig={apiKey:"AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY",authDomain:"completamenteapp.firebaseapp.com",databaseURL:"https://completamenteapp-default-rtdb.firebaseio.com",projectId:"completamenteapp",storageBucket:"completamenteapp.firebasestorage.app",messagingSenderId:"343038230333",appId:"1:343038230333:web:2338b20d2e706743b40f54"};
let db=null; try{ firebase.initializeApp(firebaseConfig); db=firebase.database(); }catch(e){ console.warn("DB offline",e); }

window.AI_PROXY_URL=(location.origin&&location.origin.startsWith("http"))?`${location.origin}/api/ai`:"/api/ai";
window.CHAT_AI_PROXY_URL=(location.origin&&location.origin.startsWith("http"))?`${location.origin}/api/chat`:"/api/chat";
window.clientId=""; window.clientName=""; window.hasAcceptedTerms=sessionStorage.getItem('wr_terms_accepted')==='true';
window.userDataCache=null; window.activeTherapist=null; window.isWaiting=false;
window.activeChatRef=null; window.waterReminderInterval=null; window.cardioTimer=null; window.ansioMessages=[]; window.currentIv=null;

document.addEventListener("DOMContentLoaded",()=>{
    if(localStorage.getItem('wr_remember')==='true'){
        const u=localStorage.getItem('wr_user'); const p=localStorage.getItem('wr_pass');
        if(u&&p){
            if(document.getElementById('user-name-input')) document.getElementById('user-name-input').value=u;
            if(document.getElementById('user-pass-input')) document.getElementById('user-pass-input').value=p;
            if(document.getElementById('remember-me')) document.getElementById('remember-me').checked=true;
            setTimeout(()=>window.login(true),300);
        }
    }
    window.renderArt();
});

window.getTodayStr=function(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};

// ==========================================
// NAVEGAÇÃO E LOGIN
// ==========================================
window.showTab=function(id){
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    if(id!=='chat'&&window.activeChatRef){window.activeChatRef.off();window.activeChatRef=null;}
    if(id==='relacional')window.initRelacionalTab();
    if(id==='routines'){if(Notification.permission==='default')Notification.requestPermission();window.renderTasks();}
    if(id==='financas')window.renderFinances();
    if(id==='saude')window.initSaudeTab();
    if(id==='relaxation')window.showRelaxSubTab('rx-video');
    
    document.getElementById('main-area').style.maxWidth='480px';
}

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
            return alert("Atenção: Selecione gênero, Nome Completo e Senha (8 números).");
        }

        window.clientId = n.replace(/\s+/g, '_');
        window.clientName = n.split(' ')[0];

        if (!window.userDataCache) window.userDataCache = { relacional: {}, saude: {}, financas: { transactions: [] } };

        if (db) {
            const snap = await db.ref('users/' + window.clientId).once('value');
            if (!snap.exists()) {
                const newUser = { pass: p, fullName: n, gender: g || 'M', created: Date.now(), relacional: { linkedPartner: partnerCode }, saude: {}, financas: { transactions: [] } };
                await db.ref('users/' + window.clientId).set(newUser);
                window.userDataCache = newUser;
            } else {
                const u = snap.val();
                if (u.pass !== p) return alert("Senha incorreta.");
                window.userDataCache = u;
                if (partnerCode && window.userDataCache.relacional.linkedPartner !== partnerCode) {
                    window.userDataCache.relacional.linkedPartner = partnerCode;
                    await db.ref('users/' + window.clientId + '/relacional/linkedPartner').set(partnerCode);
                }
            }
        }

        const rememberMe = document.getElementById('remember-me');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('wr_remember', 'true'); localStorage.setItem('wr_user', n); localStorage.setItem('wr_pass', p);
        }

        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName);
        window.showTab('home');
    } catch (error) {
        console.error("Erro no Login:", error);
        window.showTab('home');
    }
};

window.logoutUser=function(){localStorage.clear(); window.location.reload();}

// ==========================================
// SAÚDE E NUTRIÇÃO
// ==========================================
window.initSaudeTab=async function(){
    window.showSaudeSubTab('sd-perfil');
    window.ensureHealthStructures();
    await window.resetWaterIfNewDay();
    const s = window.userDataCache.saude;
    if(s.weight) document.getElementById('health-weight').value = s.weight;
    if(s.height) document.getElementById('health-height').value = s.height;
    if(s.imc) document.getElementById('imc-result').innerText = `IMC: ${s.imc} (${s.imcCategory})`;
    
    window.renderHydration(); window.renderNutriHistory(); window.renderExerciseProgress(); window.renderAnxietyDailyState();
}

window.calcIMC=async function(){
    const w = parseFloat(document.getElementById('health-weight').value);
    const h = parseFloat(document.getElementById('health-height').value);
    if(!w || !h) return alert("Preencha peso e altura.");
    const imc = (w / (h * h)).toFixed(1);
    let cat = imc < 18.5 ? "Abaixo do peso" : imc < 25 ? "Normal" : imc < 30 ? "Sobrepeso" : "Obesidade";
    document.getElementById('imc-result').innerText = `IMC: ${imc} (${cat})`;
    
    window.ensureHealthStructures();
    window.userDataCache.saude.weight = w; window.userDataCache.saude.height = h; 
    window.userDataCache.saude.imc = imc; window.userDataCache.saude.imcCategory = cat;
    
    if(db) await db.ref('users/'+window.clientId+'/saude').update(window.userDataCache.saude);
    window.renderHydration();
}

window.doNutriAnalysis = async function() {
    const input = document.getElementById('mealInput');
    const qty = document.getElementById('mealQty')?.value || '100';
    const unit = document.getElementById('mealUnit')?.value || 'G';
    const text = input.value.trim();
    if (!text) return alert('Descreva sua refeição.');

    const btn = document.querySelector('button[onclick="window.doNutriAnalysis()"]');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const prompt = `Atue como nutricionista. Analise ${qty}${unit} de ${text}. Retorne APENAS JSON: {"cal":n,"p":n,"c":n,"f":n}`;

    try {
        const res = await fetch(window.AI_PROXY_URL, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ messages: [{role:'system', content: prompt}], temperature: 0.3 })
        });
        const data = await res.json();
        const nutri = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, '').trim());

        document.getElementById('nutriResultPane').classList.remove('hidden');
        document.getElementById('nutriTotalCal').innerText = Math.round(nutri.cal);
        document.getElementById('nutriProt').innerText = nutri.p + 'g';
        document.getElementById('nutriCarb').innerText = nutri.c + 'g';
        document.getElementById('nutriGord').innerText = nutri.f + 'g';

        if(!window.userDataCache.saude.nutriHistory) window.userDataCache.saude.nutriHistory = [];
        window.userDataCache.saude.nutriHistory.unshift({meal: text, cal: nutri.cal, date: new Date().toLocaleDateString()});
        window.renderNutriHistory();
        if(db) await db.ref('users/'+window.clientId+'/saude/nutriHistory').set(window.userDataCache.saude.nutriHistory);
    } catch(e) { console.error(e); }
    finally { btn.disabled = false; btn.innerHTML = 'Analisar Nutrição'; }
};

// ==========================================
// TREINO GUIADO (MODO PLAY)
// ==========================================
const WORKOUT_DB = {
    cardio: [
        { n: 'Polichinelos', d: 'Mantenha o ritmo constante.', type: 'time', val: 45 },
        { n: 'Corrida no Lugar', d: 'Eleve bem os joelhos.', type: 'time', val: 60 }
    ],
    forca: [
        { n: 'Flexão de Braços', d: 'Mantenha o corpo reto.', type: 'unit', val: 15 },
        { n: 'Agachamento', d: 'Coluna neutra, calcanhares no chão.', type: 'unit', val: 20 }
    ]
};

window.workoutState = { active:false, mode:null, currentIdx:0, list:[], totalMins:0 };

window.startWorkoutSession=function(mode){
    window.workoutState.mode=mode;
    window.workoutState.list=WORKOUT_DB[mode];
    window.workoutState.totalMins=parseInt(document.getElementById('ex-total-duration')?.value||'20');
    
    document.getElementById('ex-setup-panel').classList.add('hidden');
    document.getElementById('ex-active-session').classList.remove('hidden');
    window.runPreparation();
};

window.runPreparation=function(){
    let timeLeft=20;
    const display=document.getElementById('ex-prep-timer');
    const overlay=document.getElementById('ex-prep-overlay');
    const nextEx=window.workoutState.list[window.workoutState.currentIdx];
    
    document.getElementById('ex-next-name').innerText=`Próximo: ${nextEx.n}`;
    overlay.classList.remove('hidden');
    document.getElementById('ex-current-card').classList.add('hidden');

    const prepIv=setInterval(()=>{
        timeLeft--; display.innerText=timeLeft;
        if(timeLeft<=0){ clearInterval(prepIv); overlay.classList.add('hidden'); window.startCurrentExercise(); }
    },1000);
};

window.startCurrentExercise=function(){
    const ex=window.workoutState.list[window.workoutState.currentIdx];
    const card=document.getElementById('ex-current-card');
    card.classList.remove('hidden');
    document.getElementById('ex-title').innerText=ex.n;
    document.getElementById('ex-desc').innerText=ex.d;
    
    if(ex.type==='time'){
        let sec=ex.val; const counter=document.getElementById('ex-main-counter');
        const iv=setInterval(()=>{
            sec--; counter.innerText=sec;
            if(sec<=0){ clearInterval(iv); window.playBipe(); window.nextWorkoutStep(); }
        },1000);
    } else {
        document.getElementById('ex-main-counter').innerText=ex.val;
    }
};

window.nextWorkoutStep=function(){
    window.workoutState.currentIdx++;
    if(window.workoutState.currentIdx < window.workoutState.list.length) window.runPreparation();
    else window.finishWorkout();
}

window.finishWorkout=async function(){
    document.getElementById('ex-active-session').classList.add('hidden');
    document.getElementById('ex-finish-area').classList.remove('hidden');
    
    window.ensureHealthStructures();
    window.userDataCache.saude.exercise.total += window.workoutState.totalMins;
    window.renderExerciseProgress();
    if(db) await db.ref('users/'+window.clientId+'/saude/exercise/total').set(window.userDataCache.saude.exercise.total);
};

// ==========================================
// JOGOS DE DESCOMPRESSÃO (16 NÍVEIS)
// ==========================================
const gameDefs = [
    { 
        n: "Respiração Terapêutica (4-4-4)", 
        r: () => `
            <div class="relative w-44 h-44 mx-auto mt-6 flex items-center justify-center">
                <div id="brt-circ" class="absolute w-20 h-20 rounded-full bg-emerald-500 transition-all duration-[4000ms] ease-linear shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                <span id="brt-txt" class="relative z-10 text-[11px] font-black text-black uppercase tracking-tighter">Inspirar_</span>
            </div>
            <p class="text-[9px] text-slate-500 mt-8 font-bold">Ciclos: <span id="brt-rep" class="text-white">0</span>/3</p>
        `, 
        i: () => {
            let r=0, state=0; // 0:Inhale, 1:Hold, 2:Exhale
            const c=document.getElementById('brt-circ'), t=document.getElementById('brt-txt'), rp=document.getElementById('brt-rep');
            const step = () => {
                if(state===0) { // INSPIRAR (CRESCE LENTO)
                    c.style.transform="scale(2.4)"; c.style.backgroundColor="#10b981";
                    t.innerText="Inspirar_"; state=1; setTimeout(step, 4000);
                } else if(state===1) { // PRENDER (ESTÁTICA)
                    c.style.backgroundColor="#facc15";
                    t.innerText="Segurar_"; state=2; setTimeout(step, 4000);
                } else if(state===2) { // EXSPIRAR (ESVAZIA LENTO)
                    c.style.transform="scale(1)"; c.style.backgroundColor="#3b82f6";
                    t.innerText="Expirar_"; state=0;
                    setTimeout(() => { r++; rp.innerText=r; if(r>=3) window.gameWin(); else step(); }, 4000);
                }
            }; setTimeout(step, 500);
        }
    },
    { n: "Memória", r: () => `<div id="mem-grid" class="grid grid-cols-5 gap-1 w-full max-w-[280px]"></div>`, i: () => {
        const icons=['🧘','🌊','🍀','✨','🧠','💎','☀️','🌙','🔥','🌈'];
        const pairs=[...icons,...icons].sort(()=>Math.random()-0.5);
        let s1=null, s2=null, solved=0;
        pairs.forEach(icon => {
            const card=document.createElement('div'); card.className="h-10 bg-slate-800 rounded flex items-center justify-center text-sm cursor-pointer";
            card.onclick=function(){
                if(this.innerText || s2) return; this.innerText=icon;
                if(!s1) s1=this; else { s2=this; if(s1.innerText===s2.innerText){ solved++; s1=s2=null; if(solved===10) window.gameWin(); } else { setTimeout(()=>{s1.innerText=''; s2.innerText=''; s1=s2=null;},500); } }
            }; document.getElementById('mem-grid').appendChild(card);
        });
    }},
    { n: "Cofre Foco", r: () => `<div id="safe-code" class="text-4xl font-black text-amber-500 mb-4">****</div><input type="number" id="safe-in" class="bg-slate-900 border border-slate-700 p-3 rounded-xl text-center w-full text-white font-bold">`, i: () => {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        document.getElementById('safe-code').innerText=code;
        setTimeout(() => {
            document.getElementById('safe-code').innerText="QUAL ERA?";
            document.getElementById('safe-in').oninput=function(){ if(this.value===code) window.gameWin(); };
        }, 2000);
    }}
    // (Outros 13 jogos seguem o padrão de lógica de cliques/foco...)
];

window.startDescompressao=function(){ window.cgi=0; window.loadGame(0); }
window.loadGame=function(i){
    const container=document.getElementById('game-container');
    document.getElementById('game-level-display').innerText=`Desafio ${i+1}/16`;
    document.getElementById('next-game-btn').classList.add('hidden');
    container.innerHTML=gameDefs[i].r(); gameDefs[i].i();
}
window.gameWin=function(){ 
    document.getElementById('next-game-btn').classList.remove('hidden'); 
    window.playBipe(); 
    const c=document.getElementById('game-container'); c.style.boxShadow="0 0 30px #10b981"; setTimeout(()=>c.style.boxShadow="none", 500);
}
window.nextGame=function(){ window.cgi++; if(window.cgi<16) window.loadGame(window.cgi); else window.finishDescompressao(); }

// ==========================================
// UTILITÁRIOS E CHAT
// ==========================================
window.playBipe=function(){ try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); osc.connect(ctx.destination); osc.start(); setTimeout(()=>osc.stop(), 400); }catch(e){} };

window.submitChat=async function(t){
    if(!t||window.isWaiting)return; const chatId=`${window.clientId}_${window.activeTherapist.id}`;
    document.getElementById('chat-input').value=''; window.isWaiting=true;
    const snap=await db.ref(`chats/${chatId}`).once('value'); let h=snap.val()||[]; h.push({role:'user',content:t}); await db.ref(`chats/${chatId}`).set(h);
    
    document.getElementById('active-status-text').innerText = "Lendo_";
    setTimeout(async () => {
        document.getElementById('active-status-text').innerText = "Online";
        document.getElementById('typing-box').classList.remove('hidden');
        setTimeout(async () => {
            try{
                const res=await fetch(window.CHAT_AI_PROXY_URL||window.AI_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:h,temperature:0.7,max_tokens:300})});
                const data=await res.json(); let rt=data.choices[0].message.content.replace(/\.\.\./g, '');
                h.push({role:'assistant',content:rt}); await db.ref(`chats/${chatId}`).set(h);
            }catch(err){}finally{ document.getElementById('typing-box').classList.add('hidden'); window.isWaiting=false; }
        }, 8000); 
    }, 12000); 
}

// Funções de apoio (Renderers e Estruturas) omitidas para brevidade mas agrupadas no objeto userDataCache.
window.ensureHealthStructures=function(){
    if(!window.userDataCache.saude) window.userDataCache.saude={};
    const s=window.userDataCache.saude;
    if(!s.water) s.water={total:0};
    if(!s.exercise) s.exercise={total:0, goal:20};
    if(!s.nutriHistory) s.nutriHistory=[];
}
window.resetWaterIfNewDay=async function(){
    const today = window.getTodayStr();
    if(window.userDataCache.saude.lastDay !== today){
        window.userDataCache.saude.lastDay = today; window.userDataCache.saude.water.total = 0;
        if(db) await db.ref('users/'+window.clientId+'/saude').update(window.userDataCache.saude);
    }
}
window.renderExerciseProgress=function(){
    const e = window.userDataCache.saude.exercise;
    const pct = Math.min(100, Math.round((e.total/e.goal)*100));
    document.getElementById('ex-progress-bar').style.width=pct+'%';
}
