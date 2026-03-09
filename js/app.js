// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig={apiKey:"AIzaSyCCi1hrmt4OQFlgrQThbB6-n54v5WwlJoY",authDomain:"completamenteapp.firebaseapp.com",databaseURL:"https://completamenteapp-default-rtdb.firebaseio.com",projectId:"completamenteapp",storageBucket:"completamenteapp.firebasestorage.app",messagingSenderId:"343038230333",appId:"1:343038230333:web:2338b20d2e706743b40f54"};
let db=null; try{ firebase.initializeApp(firebaseConfig); db=firebase.database(); }catch(e){ console.warn("DB offline",e); }

window.AI_PROXY_URL=(location.origin&&location.origin.startsWith("http"))?`${location.origin}/api/ai`:"/api/ai";
window.CHAT_AI_PROXY_URL=(location.origin&&location.origin.startsWith("http"))?`${location.origin}/api/chat`:"/api/chat";
window.clientId="";window.clientName="";window.hasAcceptedTerms=sessionStorage.getItem('wr_terms_accepted')==='true';
window.userDataCache=null;window.activeTherapist=null;window.isWaiting=false;
window.activeChatRef=null; window.waterReminderInterval=null; window.cardioTimer=null; window.ansioMessages=[];

document.addEventListener("DOMContentLoaded",()=>{
    if(localStorage.getItem('wr_remember')==='true'){
        const u=localStorage.getItem('wr_user'); const p=localStorage.getItem('wr_pass');
        if(u&&p){
            document.getElementById('user-name-input').value=u; document.getElementById('user-pass-input').value=p;
            document.getElementById('remember-me').checked=true; setTimeout(()=>window.login(true),300);
        }
    }
    window.renderArt();
});
window.getTodayStr=function(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};

window.showTab=function(id){
    document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active')); document.getElementById(id).classList.add('active');
    if(id!=='chat'&&window.activeChatRef){window.activeChatRef.off();window.activeChatRef=null;}
    if(id==='relacional')window.initRelacionalTab();
    if(id==='routines'){if(Notification.permission==='default')Notification.requestPermission();window.renderTasks();}
    if(id==='financas')window.renderFinances();
    if(id==='saude')window.initSaudeTab();
    if(id==='relaxation')window.showRelaxSubTab('rx-video');
    const mainArea=document.getElementById('main-area');
    if(id==='onboarding') mainArea.style.maxWidth='480px'; else mainArea.style.maxWidth='480px';
}

// CORREÇÃO CRÍTICA DO LOGIN APLICADA AQUI
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
            return alert("Atenção: Selecione seu gênero, digite Nome e Sobrenome e a Senha (exatamente 8 números).");
        }

        window.clientId = n.replace(/\s+/g, '_');
        window.clientName = n.split(' ')[0];

        // Blindagem do Objeto Mestre (Impede travamento ao abrir abas)
        if (!window.userDataCache) window.userDataCache = { relacional: {}, saude: {}, financas: { transactions: [] } };

        if (db) {
            const snap = await db.ref('users/' + window.clientId).once('value');
            if (!snap.exists()) {
                const newUser = { pass: p, fullName: n, gender: g || 'M', created: Date.now(), relacional: {}, saude: {}, financas: { transactions: [] } };
                if (partnerCode) newUser.relacional.linkedPartner = partnerCode;
                await db.ref('users/' + window.clientId).set(newUser);
                window.userDataCache = newUser;
            } else {
                const u = snap.val();
                if (u.pass !== p) return alert("Senha incorreta.");
                
                window.userDataCache = u || window.userDataCache;
                if (!window.userDataCache.relacional) window.userDataCache.relacional = {};
                
                if (partnerCode && window.userDataCache.relacional.linkedPartner !== partnerCode) {
                    window.userDataCache.relacional.linkedPartner = partnerCode;
                    await db.ref('users/' + window.clientId + '/relacional/linkedPartner').set(partnerCode);
                }
            }
        } else {
            // Se Firebase estiver offline ou for bloqueado pelo navegador
            window.userDataCache.pass = p;
            window.userDataCache.fullName = n;
            window.userDataCache.gender = g || 'M';
            if (partnerCode) window.userDataCache.relacional.linkedPartner = partnerCode;
        }

        const rememberMe = document.getElementById('remember-me');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('wr_remember', 'true');
            localStorage.setItem('wr_user', n);
            localStorage.setItem('wr_pass', p);
        } else if (!isAuto) {
            localStorage.removeItem('wr_remember');
            localStorage.removeItem('wr_user');
            localStorage.removeItem('wr_pass');
        }

        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName);
        window.showTab('home');

    } catch (error) {
        console.error("Erro no Login:", error);
        alert("Houve um erro de conexão. Iniciando modo de proteção offline.");
        window.userDataCache = window.userDataCache || { relacional: {}, saude: {}, financas: { transactions: [] } };
        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName || 'Usuário');
        window.showTab('home');
    }
};

window.logoutUser=function(){localStorage.removeItem('wr_remember');localStorage.removeItem('wr_user');localStorage.removeItem('wr_pass');window.location.reload();}

window.showSaudeSubTab=function(id){
    document.querySelectorAll('#saude .rel-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('btn-'+id).classList.add('active');
    ['sd-perfil','sd-agua','sd-nutricao','sd-exercicio','sd-cardio','sd-ansiedade'].forEach(t=>document.getElementById(t).classList.add('hidden'));document.getElementById(id).classList.remove('hidden');
}
window.initSaudeTab=function(){
    window.showSaudeSubTab('sd-perfil');
    if(!window.userDataCache.saude)window.userDataCache.saude={water:{}, exerciseLogs:{}};
    const s = window.userDataCache.saude;
    if(s.weight) document.getElementById('health-weight').value = s.weight;
    if(s.height) document.getElementById('health-height').value = s.height;
    if(s.imc) document.getElementById('imc-result').innerText = `IMC: ${s.imc} (${s.imcCategory})`;
}
window.calcIMC=async function(){
    const w = parseFloat(document.getElementById('health-weight').value); const h = parseFloat(document.getElementById('health-height').value);
    if(!w || !h) return alert("Preencha peso e altura.");
    const imc = (w / (h * h)).toFixed(1); let cat = "Normal";
    if(imc < 18.5) cat = "Abaixo do peso"; else if(imc >= 18.5 && imc < 25) cat = "Normal"; else if(imc >= 25 && imc < 30) cat = "Sobrepeso"; else cat = "Obesidade";
    document.getElementById('imc-result').innerText = `IMC: ${imc} (${cat})`;
    if(!window.userDataCache.saude) window.userDataCache.saude={};
    window.userDataCache.saude.weight = w; window.userDataCache.saude.height = h; window.userDataCache.saude.imc = imc; window.userDataCache.saude.imcCategory = cat;
    if(db) await db.ref('users/'+window.clientId+'/saude').set(window.userDataCache.saude);
}

window.startCardioTimer=function(){
    const btn = document.getElementById('cardio-btn'); btn.disabled = true; btn.innerHTML = '<i class="fas fa-stopwatch text-4xl animate-pulse ml-2"></i>';
    document.getElementById('cardio-input-area').classList.add('hidden'); document.getElementById('cardio-result').classList.add('hidden');
    let secs = 60;
    window.cardioTimer = setInterval(() => {
        secs--;
        if(secs <= 0){
            clearInterval(window.cardioTimer); btn.innerHTML = '<i class="fas fa-play text-4xl ml-2"></i>'; btn.disabled = false;
            document.getElementById('cardio-input-area').classList.remove('hidden');
            try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); osc.connect(ctx.destination); osc.frequency.value = 800; osc.start(); setTimeout(()=>osc.stop(), 800); } catch(e){}
        }
    }, 1000);
}
window.saveCardio=async function(){
    const beats = parseInt(document.getElementById('cardio-beats').value); if(!beats) return;
    let rank = "Atenção", color = "text-red-400";
    if(beats >= 50 && beats <= 60) { rank = "Excelente"; color = "text-sky-400"; }
    else if(beats > 60 && beats <= 70) { rank = "Bom"; color = "text-green-400"; }
    else if(beats > 70 && beats <= 85) { rank = "Mediano"; color = "text-yellow-400"; }
    else if(beats > 85 && beats <= 100) { rank = "Baixo/Atenção"; color = "text-orange-400"; }
    else { rank = "Atenção (Fora do Padrão)"; color = "text-red-500"; }

    const resBox = document.getElementById('cardio-result'); resBox.innerText = `Resultado: ${beats} bpm (${rank})`; resBox.className = `mt-4 p-4 rounded-xl text-sm font-bold border border-slate-600 bg-slate-900 block ${color}`;
    if(!window.userDataCache.saude.cardio) window.userDataCache.saude.cardio = []; window.userDataCache.saude.cardio.push({beats, rank, date: new Date().toLocaleString()});
    if(db) await db.ref('users/'+window.clientId+'/saude/cardio').set(window.userDataCache.saude.cardio);
}

window.startAnxietyCheck=function(){
    window.ansioMessages=[]; document.getElementById('ans-chat-area').classList.remove('hidden'); document.getElementById('ans-messages').innerHTML='';
    const sys = "Atue como terapeuta. Faça 20 perguntas curtas, UMA POR VEZ (numere 1/20), para avaliar ansiedade. Após a 20ª resposta, diga APENAS um número de 0 a 100 definindo o nível de ansiedade. Sem uso de reticencias.";
    window.ansioMessages.push({role:'system', content:sys}); window.callAnsAI("Quero avaliar minha ansiedade. Primeira pergunta.");
}
window.sendAnsReply=function(){
    const input=document.getElementById('ans-input'); const txt=input.value.trim(); if(!txt)return;
    document.getElementById('ans-messages').innerHTML+=`<div class="text-right mb-2"><span class="bg-sky-600 text-white px-3 py-2 rounded-xl inline-block text-sm">${txt}</span></div>`;
    input.value=''; window.ansioMessages.push({role:'user', content:txt}); window.callAnsAI(null);
}
window.callAnsAI=async function(overrideText){
    const btn=document.getElementById('ans-send-btn'); btn.disabled=true;
    document.getElementById('ans-messages').innerHTML+=`<div id="ans-typ" class="text-left mb-2 text-sky-400 text-xs italic">Avaliando_</div>`;
    try{
        let msgs = window.ansioMessages; if(overrideText) msgs.push({role:'user',content:overrideText});
        const res=await fetch(window.AI_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,temperature:0.7,max_tokens:300})});
        const data=await res.json(); const reply=data.choices[0].message.content.replace(/\.\.\./g, '');
        document.getElementById('ans-typ').remove(); window.ansioMessages.push({role:'assistant', content:reply});
        document.getElementById('ans-messages').innerHTML+=`<div class="text-left mb-2"><span class="bg-slate-700 text-white px-3 py-2 rounded-xl inline-block text-sm">${reply}</span></div>`;
        const mc=document.getElementById('ans-messages'); mc.scrollTop=mc.scrollHeight;
        
        if(window.ansioMessages.length >= 40){
            let scoreMatch = reply.match(/\b([0-9]{1,2}|100)\b/); let score = scoreMatch ? parseInt(scoreMatch[0]) : 50;
            let bar = document.getElementById('ansio-bar'); bar.style.width = score + '%';
            if(score <= 25) bar.className = 'bg-blue-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.8)]'; 
            else if(score <= 50) bar.className = 'bg-green-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(34,197,94,0.8)]'; 
            else if(score <= 75) bar.className = 'bg-orange-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(249,115,22,0.8)]'; 
            else bar.className = 'bg-red-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(220,38,38,0.8)]';
            window.userDataCache.saude.anxietyScore = score; if(db) await db.ref('users/'+window.clientId+'/saude/anxietyScore').set(score);
        }
    }catch(e){} finally{ btn.disabled=false; }
}

window.showRelSubTab=function(id){document.querySelectorAll('#relacional .rel-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('btn-'+id).classList.add('active');['rel-pessoal','rel-parceria','rel-cupom','rel-amor'].forEach(t=>document.getElementById(t).classList.add('hidden'));document.getElementById(id).classList.remove('hidden');if(id==='rel-parceria')window.loadLinkedPartner();}
window.initRelacionalTab=function(){window.showRelSubTab('rel-pessoal');if(!window.userDataCache.relacional)window.userDataCache.relacional={};const rel=window.userDataCache.relacional;if(rel.age)document.getElementById('rel-age-input').value=rel.age;if(rel.shareCode)document.getElementById('rel-share-code').value=rel.shareCode;else window.generateRelShareCode();}
window.generateRelShareCode=async function(){const code=Math.random().toString(36).substring(2,8).toUpperCase();document.getElementById('rel-share-code').value=code;if(!window.userDataCache.relacional)window.userDataCache.relacional={};window.userDataCache.relacional.shareCode=code; if(db) await db.ref('users/'+window.clientId+'/relacional/shareCode').set(code);}
window.copyRelShareCode=function(){const input=document.getElementById('rel-share-code');input.select();document.execCommand("copy");alert("Código copiado.");}

window.loadLinkedPartner=async function(){
    const code=window.userDataCache.relacional?.linkedPartner;
    if(!code){document.getElementById('rel-partner-setup').classList.remove('hidden');document.getElementById('rel-partner-content').classList.add('hidden');return;}
    document.getElementById('rel-partner-setup').classList.add('hidden'); if(!db) return;
    const snap=await db.ref('users').once('value');const users=snap.val()||{};let partner=null;
    for(const key in users){if(users[key].relacional?.shareCode===code){partner=users[key];break;}}
    if(partner){
        const pRel=partner.relacional||{}; const pSau=partner.saude||{}; const pFin=partner.financas||{transactions:[]}; const pGoals=partner.goals||{};
        document.getElementById('rel-partner-title').innerText="Espaço de "+partner.fullName.split(' ')[0];
        
        let sHtml = '';
        if(pSau.anxietyScore) sHtml += `<div><b class="text-sky-400">Ansiômetro:</b> Nível ${pSau.anxietyScore}/100</div>`;
        if(pSau.cardio && pSau.cardio.length>0) sHtml += `<div><b class="text-rose-400">Cardio Recente:</b> ${pSau.cardio[pSau.cardio.length-1].beats} bpm (${pSau.cardio[pSau.cardio.length-1].rank})</div>`;
        document.getElementById('rel-partner-saude').innerHTML = sHtml || 'Sem dados.';

        document.getElementById('rel-partner-rotina').innerHTML = `<div><b class="text-emerald-400">Meta Semanal:</b> ${pGoals.week||'Não definida'}</div><div><b class="text-teal-400">Meta Mensal:</b> ${pGoals.month||'Não definida'}</div>`;

        let inT=0, outT=0; pFin.transactions.forEach(t=>{if(t.type==='in')inT+=parseFloat(t.val);else outT+=parseFloat(t.val);});
        document.getElementById('rel-partner-fin').innerHTML = `<div><b class="text-emerald-400">Receitas:</b> R$ ${inT.toFixed(2)}</div><div><b class="text-rose-400">Despesas:</b> R$ ${outT.toFixed(2)}</div>`;

        let pEvals = '';
        if(pRel.loveLanguage) pEvals += `<div class="mb-1"><b class="text-rose-400">Amor:</b> ${pRel.loveLanguage.substring(0,50)}</div>`;
        if(pRel.temperament) pEvals += `<div><b class="text-amber-400">Temp:</b> ${pRel.temperament.substring(0,50)}</div>`;
        document.getElementById('rel-partner-evals').innerHTML = pEvals || 'Sem testes realizados.';

        document.getElementById('rel-partner-moods').innerHTML=(pRel.moods||[]).slice(0,3).map(m=>`<div><span class="text-sky-400 font-bold">${m.dateStr.split(' ')[0]}</span> - ${m.mood}</div>`).join('')||'Nenhum registro.';
        
        document.getElementById('rel-partner-content').classList.remove('hidden');
    }
}

window.showRelaxSubTab=function(id){
    document.querySelectorAll('#relaxation .rel-nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('btn-'+id).classList.add('active');
    ['rx-video','rx-cinema','rx-arte','rx-mural','rx-biblioteca','rx-caixinha','rx-jogos'].forEach(t=>document.getElementById(t).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if(id==='rx-mural') window.loadMural();
}

window.currentColor = '#ffffff';
window.currentArtIndex = 0;
const arts = [
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M50 10 Q60 40 90 50 Q60 60 50 90 Q40 60 10 50 Q40 40 50 10 Z" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="10" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><rect x="10" y="10" width="35" height="35" onclick="window.fillArea(this)"/><rect x="55" y="10" width="35" height="35" onclick="window.fillArea(this)"/><rect x="10" y="55" width="35" height="35" onclick="window.fillArea(this)"/><rect x="55" y="55" width="35" height="35" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="15" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M50 5 L95 50 L50 95 L5 50 Z" onclick="window.fillArea(this)"/><path d="M50 20 L80 50 L50 80 L20 50 Z" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="10" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M20 80 L50 20 L80 80 Z" onclick="window.fillArea(this)"/><path d="M20 20 L80 20 L50 80 Z" onclick="window.fillArea(this)"/><polygon points="50,40 60,60 40,60" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><circle cx="30" cy="30" r="20" onclick="window.fillArea(this)"/><circle cx="70" cy="30" r="20" onclick="window.fillArea(this)"/><circle cx="30" cy="70" r="20" onclick="window.fillArea(this)"/><circle cx="70" cy="70" r="20" onclick="window.fillArea(this)"/><rect x="40" y="40" width="20" height="20" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M50 0 A 50 50 0 0 1 100 50 A 50 50 0 0 1 50 100 A 50 50 0 0 1 0 50 A 50 50 0 0 1 50 0 Z" fill="none" stroke="black"/><path d="M50 10 A 40 40 0 0 1 90 50 A 40 40 0 0 1 50 90 A 40 40 0 0 1 10 50 A 40 40 0 0 1 50 10 Z" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="20" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><polygon points="10,10 90,10 90,90 10,90" onclick="window.fillArea(this)"/><polygon points="20,20 80,20 80,80 20,80" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="25" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M10 50 Q50 10 90 50 Q50 90 10 50 Z" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="15" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><path d="M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z" onclick="window.fillArea(this)"/><circle cx="50" cy="55" r="10" onclick="window.fillArea(this)"/></svg>`,
    `<svg viewBox="0 0 100 100" class="art-svg w-full h-full"><rect x="5" y="5" width="40" height="90" onclick="window.fillArea(this)"/><rect x="55" y="5" width="40" height="90" onclick="window.fillArea(this)"/><circle cx="50" cy="50" r="25" onclick="window.fillArea(this)"/></svg>`
];
window.selColor=function(c){window.currentColor=c;}
window.fillArea=function(el){el.style.fill=window.currentColor;}
window.renderArt=function(){document.getElementById('art-canvas').innerHTML=arts[window.currentArtIndex];document.getElementById('art-counter').innerText=`Desenho ${window.currentArtIndex+1}/10`;}
window.nextArt=function(){if(window.currentArtIndex<9){window.currentArtIndex++;window.renderArt();}}
window.prevArt=function(){if(window.currentArtIndex>0){window.currentArtIndex--;window.renderArt();}}

window.gameIndex = 0;
const gameDefs = [
    { n: "Respiração 6-5-4", r: () => `<div id="brt-circ" class="breathe-circle mt-10"></div><p id="brt-txt" class="mt-8 font-bold text-emerald-400">Inspire (6s)</p><p class="text-[10px] text-slate-400 mt-2">Repetições: <span id="brt-rep">0</span>/3</p>`, i: () => {
        let r=0, s=0, c=document.getElementById('brt-circ'), t=document.getElementById('brt-txt'), rp=document.getElementById('brt-rep');
        let iv = setInterval(()=>{
            if(s===0) { c.style.transform="scale(2)"; c.style.background="#10b981"; t.innerText="Inspire (6s)"; t.className="mt-8 font-bold text-emerald-400"; s=1; setTimeout(()=>s=2, 6000); }
            else if(s===2) { c.style.transform="scale(2)"; c.style.background="#facc15"; t.innerText="Prenda (5s)"; t.className="mt-8 font-bold text-yellow-400"; s=3; setTimeout(()=>s=4, 5000); }
            else if(s===4) { c.style.transform="scale(1)"; c.style.background="#3b82f6"; t.innerText="Expire (4s)"; t.className="mt-8 font-bold text-blue-400"; s=5; setTimeout(()=>{r++; rp.innerText=r; if(r>=3){clearInterval(iv); window.gameWin();}else{s=0;}}, 4000); }
        }, 100); window.currentIv = iv;
    }},
    { n: "Memória", r: () => `<div id="mem-grid" class="game-grid" style="grid-template-columns:repeat(5,1fr); width:280px"></div>`, i: () => {
        const a=['🍎','🍌','🍇','🍉','🍓','🥑','🥕','🌽','🍕','🍔','🍟','🌭','🍿','🍩','🍪']; const p=[...a,...a].sort(()=>Math.random()-0.5);
        let g=document.getElementById('mem-grid'), s1=null, s2=null, pairs=0;
        p.forEach((e,i)=>{
            let c=document.createElement('div'); c.className="game-card h-12"; c.dataset.v=e;
            c.onclick=function(){
                if(this.innerHTML || s2) return; this.innerHTML=this.dataset.v; this.style.background="#475569";
                if(!s1) s1=this; else { s2=this; if(s1.dataset.v===s2.dataset.v){ pairs++; s1=s2=null; if(pairs===15) window.gameWin(); } else { setTimeout(()=>{s1.innerHTML=''; s1.style.background="#334155"; s2.innerHTML=''; s2.style.background="#334155"; s1=s2=null;},800); } }
            }; g.appendChild(c);
        });
    }},
    { n: "Puzzle Numérico", r: () => `<div id="puz-grid" class="game-grid" style="grid-template-columns:repeat(3,1fr); width:200px"></div><p class="text-[10px] mt-4">Ordene 1 a 8</p>`, i: () => {
        let b=[1,2,3,4,5,6,7,8,""].sort(()=>Math.random()-0.5), g=document.getElementById('puz-grid');
        const draw=()=>{
            g.innerHTML=''; b.forEach((n,i)=>{
                let c=document.createElement('div'); c.className="game-card h-14 font-black"; c.innerHTML=n; if(!n) c.style.background="transparent";
                c.onclick=()=>{
                    let ei=b.indexOf("");
                    if([ei-1,ei+1,ei-3,ei+3].includes(i) && !(ei%3===0 && i===ei-1) && !(i%3===0 && ei===i-1)){
                        b[ei]=n; b[i]=""; draw(); if(b.join(',')==="1,2,3,4,5,6,7,8,") window.gameWin();
                    }
                }; g.appendChild(c);
            });
        }; draw();
    }},
    { n: "Tic-Tac-Toe vs IA", r: () => `<div id="ttt-grid" class="game-grid" style="grid-template-columns:repeat(3,1fr); width:200px"></div>`, i: () => {
        let b=["","","","","","","","",""], g=document.getElementById('ttt-grid'), over=false;
        const check=(p)=>{ const w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return w.some(l=>b[l[0]]===p&&b[l[1]]===p&&b[l[2]]===p); };
        const draw=()=>{
            g.innerHTML=''; b.forEach((c,i)=>{
                let d=document.createElement('div'); d.className="game-card h-14 text-2xl font-black"; d.innerHTML=c; if(c==='X') d.style.color="#0ea5e9"; if(c==='O') d.style.color="#f43f5e";
                d.onclick=()=>{
                    if(over||c)return; b[i]='X'; draw();
                    if(check('X')){ over=true; window.gameWin(); return; }
                    let emp=b.map((v,idx)=>v===""?idx:null).filter(v=>v!==null);
                    if(emp.length===0){ b=["","","","","","","","",""]; over=false; draw(); return; }
                    b[emp[Math.floor(Math.random()*emp.length)]]='O'; draw();
                    if(check('O')){ b=["","","","","","","","",""]; over=false; draw(); }
                }; g.appendChild(d);
            });
        }; draw();
    }},
    { n: "Tangram Simples", r: () => `<div class="relative w-[200px] h-[200px] bg-slate-800 border border-slate-600 rounded mx-auto overflow-hidden"><div id="tg-target" class="absolute inset-0 opacity-20 bg-slate-500 clip-tg" style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%);"></div><div id="tg-piece" class="absolute w-[100px] h-[100px] bg-emerald-500 cursor-move shadow-lg" style="clip-path: polygon(50% 0%, 0% 100%, 100% 100%); top:10px; left:10px"></div></div><p class="text-[10px] mt-2">Arraste a peça verde para o triângulo de fundo.</p>`, i: () => {
        let p=document.getElementById('tg-piece'), t=document.getElementById('tg-target'), act=false, ox=0, oy=0;
        p.addEventListener('touchstart',e=>{ act=true; const r=p.getBoundingClientRect(); ox=e.touches[0].clientX-r.left; oy=e.touches[0].clientY-r.top; });
        p.addEventListener('touchmove',e=>{ if(!act)return; e.preventDefault(); p.style.left=(e.touches[0].clientX-p.parentElement.getBoundingClientRect().left-ox)+'px'; p.style.top=(e.touches[0].clientY-p.parentElement.getBoundingClientRect().top-oy)+'px'; });
        p.addEventListener('touchend',()=>{ act=false; const rP=p.getBoundingClientRect(), rT=t.getBoundingClientRect(); if(Math.abs(rP.left-rT.left)<20 && Math.abs(rP.top-rT.top)<20) { p.style.left='50px'; p.style.top='100px'; window.gameWin(); } });
    }},
    { n: "Carinha Diferente", r: () => `<div id="odd-grid" class="game-grid" style="grid-template-columns:repeat(6,1fr); width:280px"></div><p class="text-[10px] mt-2 text-rose-400">Encontre 5 rostos diferentes!</p>`, i: () => {
        let a=Array(30).fill('🙂'), g=document.getElementById('odd-grid'), f=0;
        let p=[]; while(p.length<5){let r=Math.floor(Math.random()*30); if(!p.includes(r)) p.push(r);}
        p.forEach(idx=>a[idx]='🙃');
        a.forEach((e,i)=>{
            let c=document.createElement('div'); c.className="game-card h-10"; c.innerHTML=e;
            c.onclick=function(){ if(p.includes(i) && this.innerHTML){ this.innerHTML=''; f++; this.style.background="#10b981"; if(f===5) window.gameWin(); } };
            g.appendChild(c);
        });
    }},
    { n: "Cofre", r: () => `<div id="safe-disp" class="text-4xl font-black text-yellow-400 tracking-widest bg-slate-800 p-4 rounded mb-4 w-full text-center"></div><button id="safe-btn" class="bg-sky-600 px-6 py-2 rounded text-white font-bold hidden">Gerar Sequências</button><div id="safe-inp-area" class="hidden"><input type="number" id="safe-inp" placeholder="Senha do Cofre" class="w-full p-2 text-center text-black font-bold mb-2 rounded"><button onclick="window.checkSafe()" class="w-full bg-emerald-600 text-white font-bold py-2 rounded">Abrir</button></div>`, i: () => {
        let code = Math.floor(1000 + Math.random() * 9000).toString(), d=document.getElementById('safe-disp'), b=document.getElementById('safe-btn'), ia=document.getElementById('safe-inp-area');
        window.safeCode = code; d.innerText = code;
        setTimeout(()=>{
            d.innerText="----"; b.classList.remove('hidden');
            b.onclick=()=>{
                b.classList.add('hidden'); let c=0;
                let iv = setInterval(()=>{
                    d.className="text-4xl font-black text-slate-400 tracking-widest bg-slate-800 p-4 rounded mb-4 w-full text-center";
                    d.innerText=Math.floor(1000 + Math.random() * 9000); c++;
                    if(c>=5){ clearInterval(iv); d.innerText="????"; ia.classList.remove('hidden'); }
                }, 800); window.currentIv = iv;
            };
        }, 3000);
        window.checkSafe=()=>{ if(document.getElementById('safe-inp').value === window.safeCode) window.gameWin(); else alert("Senha incorreta, tente focar."); };
    }},
    { n: "Estourar Balões", r: () => `<div id="bal-area" class="relative w-full h-[250px] bg-slate-800 overflow-hidden rounded"></div><p class="text-[10px] mt-2 font-bold text-sky-400">Estoure 10 balões AZUIS!</p>`, i: () => {
        let a=document.getElementById('bal-area'), c=0, iv=setInterval(()=>{
            let b=document.createElement('div'), clrs=['bg-blue-500','bg-red-500','bg-green-500','bg-yellow-500'];
            let isBlue = Math.random()>0.5; b.className=`absolute w-10 h-12 rounded-full cursor-pointer transition-transform ${isBlue?'bg-blue-500':clrs[Math.floor(Math.random()*clrs.length)]}`;
            b.style.left=Math.random()*80+'%'; b.style.bottom='-50px';
            b.onclick=function(){ if(this.classList.contains('bg-blue-500')){ c++; this.remove(); if(c>=10){ clearInterval(iv); window.gameWin(); } } };
            a.appendChild(b);
            let p=0, an=setInterval(()=>{ p+=2; b.style.bottom=p+'px'; if(p>300){ clearInterval(an); b.remove(); } }, 50);
        }, 800); window.currentIv = iv;
    }},
    { n: "Damas Aleatório", r: () => `<div id="chk-grid" class="game-grid bg-slate-600 p-1" style="grid-template-columns:repeat(5,1fr); width:200px"></div><p class="text-[10px] mt-2 text-slate-300 text-center">Capture a peça inimiga para vencer. (Movimento diagonal 1 casa)</p>`, i: () => {
        let g=document.getElementById('chk-grid'), sel=null;
        let b = Array(25).fill(0); b[2]=2; b[22]=1; 
        const draw=()=>{
            g.innerHTML=''; b.forEach((v,i)=>{
                let isDark = (Math.floor(i/5)+(i%5))%2!==0;
                let c=document.createElement('div'); c.className=`h-[38px] flex items-center justify-center ${isDark?'bg-slate-800':'bg-slate-300'}`;
                if(v===1) c.innerHTML=`<div class="w-6 h-6 rounded-full bg-blue-500 shadow-inner ring-2 ring-white/30"></div>`;
                if(v===2) c.innerHTML=`<div class="w-6 h-6 rounded-full bg-red-500 shadow-inner ring-2 ring-black/30"></div>`;
                if(sel===i) c.style.border="2px solid #0ea5e9";
                c.onclick=()=>{
                    if(v===1) { sel=i; draw(); }
                    else if(sel!==null && v===0 && isDark) {
                        let diff = Math.abs(sel-i);
                        if(diff===4 || diff===6) { b[sel]=0; b[i]=1; sel=null; moveAI(); draw(); }
                        else if((diff===8 || diff===12)) {
                            let mid = (sel+i)/2; if(b[mid]===2){ b[sel]=0; b[mid]=0; b[i]=1; window.gameWin(); return; }
                        }
                    }
                }; g.appendChild(c);
            });
        };
        const moveAI=()=>{ 
            let aiIdx=b.indexOf(2); if(aiIdx===-1)return; 
            let opts=[aiIdx-6, aiIdx-4, aiIdx+4, aiIdx+6].filter(x=>x>=0&&x<25&&b[x]===0&&((Math.floor(aiIdx/5)+(aiIdx%5))%2!==0));
            if(opts.length>0) { b[aiIdx]=0; b[opts[Math.floor(Math.random()*opts.length)]]=2; }
        }; draw();
    }},
    { n: "Tetris Style", r: () => `<div class="relative w-[200px] h-[200px] bg-slate-800 border border-slate-600 mx-auto rounded"><div id="tet-hole" class="absolute w-[80px] h-[80px] bg-slate-600 left-[60px] top-[60px]" style="clip-path: polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%);"></div><div id="tet-piece" class="absolute w-[80px] h-[80px] bg-sky-500 cursor-move shadow-lg" style="clip-path: polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%); top:10px; left:10px"></div></div><p class="text-[10px] mt-2">Encaixe a peça no formato.</p>`, i: () => {
        let p=document.getElementById('tet-piece'), t=document.getElementById('tet-hole'), act=false, ox=0, oy=0;
        p.addEventListener('touchstart',e=>{ act=true; const r=p.getBoundingClientRect(); ox=e.touches[0].clientX-r.left; oy=e.touches[0].clientY-r.top; });
        p.addEventListener('touchmove',e=>{ if(!act)return; e.preventDefault(); p.style.left=(e.touches[0].clientX-p.parentElement.getBoundingClientRect().left-ox)+'px'; p.style.top=(e.touches[0].clientY-p.parentElement.getBoundingClientRect().top-oy)+'px'; });
        p.addEventListener('touchend',()=>{ act=false; const rP=p.getBoundingClientRect(), rT=t.getBoundingClientRect(); if(Math.abs(rP.left-rT.left)<20 && Math.abs(rP.top-rT.top)<20) { p.style.left='60px'; p.style.top='60px'; window.gameWin(); } });
    }},
    { n: "Brick", r: () => `<canvas id="brk-cvs" width="280" height="200" class="bg-slate-800 rounded border border-slate-600"></canvas>`, i: () => {
        let c=document.getElementById('brk-cvs'), x=c.getContext('2d'), bx=140, by=180, dx=3, dy=-3, px=100, pw=80;
        let brks=[], r=3, col=6; for(let i=0;i<col;i++){for(let j=0;j<r;j++){brks.push({x:i*45+5, y:j*20+10, w:40, h:15, s:1});}}
        let act=true; c.addEventListener('touchmove', e=>{ e.preventDefault(); px=e.touches[0].clientX-c.getBoundingClientRect().left-pw/2; });
        let iv=setInterval(()=>{
            if(!act)return; x.clearRect(0,0,280,200); x.fillStyle="#0ea5e9"; x.fillRect(px,190,pw,10);
            x.beginPath(); x.arc(bx,by,5,0,Math.PI*2); x.fillStyle="#f43f5e"; x.fill(); x.closePath();
            brks.forEach(b=>{ if(b.s){ x.fillStyle="#10b981"; x.fillRect(b.x,b.y,b.w,b.h); if(bx>b.x&&bx<b.x+b.w&&by>b.y&&by<b.y+b.h){ dy=-dy; b.s=0; } } });
            if(bx+dx>280||bx+dx<0)dx=-dx; if(by+dy<0)dy=-dy; else if(by+dy>190){ if(bx>px&&bx<px+pw)dy=-dy; else { act=false; bx=140; by=180; setTimeout(()=>act=true,1000); } }
            bx+=dx; by+=dy; if(!brks.some(b=>b.s)){ clearInterval(iv); window.gameWin(); }
        }, 20); window.currentIv=iv;
    }},
    { n: "Labirinto", r: () => `<div id="mz-box" class="relative w-[200px] h-[200px] bg-slate-800 border border-slate-600 mx-auto rounded overflow-hidden"><div class="absolute bg-slate-600 w-[180px] h-[20px] top-[40px] left-0"></div><div class="absolute bg-slate-600 w-[20px] h-[100px] top-[40px] right-[20px]"></div><div class="absolute bg-emerald-500 w-[40px] h-[40px] bottom-0 right-0 flex items-center justify-center text-xs font-bold text-white">SAÍDA</div><div id="mz-ball" class="absolute w-[20px] h-[20px] bg-rose-500 rounded-full top-[10px] left-[10px] shadow"></div></div><p class="text-[10px] mt-2">Arraste a bolinha pelo espaço escuro até a saída.</p>`, i: () => {
        let b=document.getElementById('mz-ball'), bx=document.getElementById('mz-box'), act=false;
        bx.addEventListener('touchmove', e=>{
            e.preventDefault(); let r=bx.getBoundingClientRect(), tx=e.touches[0].clientX-r.left, ty=e.touches[0].clientY-r.top;
            if(tx>10 && tx<190 && ty>10 && ty<190) { b.style.left=(tx-10)+'px'; b.style.top=(ty-10)+'px'; }
            if(tx>160 && ty>160) window.gameWin();
        });
    }},
    { n: "Cores vs Palavras", r: () => `<div id="stp-word" class="text-4xl font-black mb-6 mt-4">VERMELHO</div><div class="flex gap-2 justify-center"><button class="bg-blue-500 w-16 h-16 rounded" onclick="window.checkStp('blue')"></button><button class="bg-red-500 w-16 h-16 rounded" onclick="window.checkStp('red')"></button><button class="bg-green-500 w-16 h-16 rounded" onclick="window.checkStp('green')"></button></div><p class="text-[10px] mt-4 font-bold">Clique na COR da qual a palavra está pintada!</p>`, i: () => {
        window.stpC=0; const w=document.getElementById('stp-word');
        const next=()=>{ const txts=["AZUL","VERMELHO","VERDE"], clrs=["#3b82f6","#ef4444","#22c55e"], vals=['blue','red','green']; let t=Math.floor(Math.random()*3), c=Math.floor(Math.random()*3); w.innerText=txts[t]; w.style.color=clrs[c]; window.stpCur=vals[c]; };
        window.checkStp=(v)=>{ if(v===window.stpCur){ window.stpC++; if(window.stpC>=5) window.gameWin(); else next(); } else { window.stpC=0; alert("Ops! Foco na COR da tinta."); next(); } }; next();
    }},
    { n: "Desembaralhar", r: () => `<div id="scrb-word" class="text-3xl font-black tracking-widest text-sky-400 mb-6 mt-4"></div><div id="scrb-opts" class="flex gap-2 justify-center flex-wrap"></div><div id="scrb-ans" class="h-10 mt-4 text-xl font-bold text-emerald-400 border-b-2 border-slate-600 min-w-[150px] inline-block"></div>`, i: () => {
        const words=["PAZ","FOCO","CALMA","RESPIRAR","MENTE"]; window.scrbI=0; window.scrbCur="";
        const draw=()=>{
            if(window.scrbI>=5){ window.gameWin(); return; }
            let w=words[window.scrbI], a=w.split('').sort(()=>Math.random()-0.5); window.scrbCur="";
            document.getElementById('scrb-ans').innerText=""; document.getElementById('scrb-opts').innerHTML="";
            a.forEach(l=>{ let b=document.createElement('button'); b.className="bg-slate-700 w-10 h-10 font-bold rounded"; b.innerText=l; b.onclick=function(){ this.style.visibility="hidden"; window.scrbCur+=l; document.getElementById('scrb-ans').innerText=window.scrbCur; if(window.scrbCur===w){ window.scrbI++; setTimeout(draw,500); } else if(window.scrbCur.length===w.length){ alert("Incorreto. Tente novamente."); draw(); } }; document.getElementById('scrb-opts').appendChild(b); });
        }; draw();
    }},
    { n: "Cobrinha", r: () => `<canvas id="snk-cvs" width="200" height="200" class="bg-slate-800 rounded mx-auto border border-slate-600"></canvas><div class="flex justify-center gap-4 mt-2"><button onclick="window.snkD={x:-10,y:0}" class="bg-slate-700 p-3 rounded"><i class="fas fa-arrow-left"></i></button><div class="flex flex-col gap-2"><button onclick="window.snkD={x:0,y:-10}" class="bg-slate-700 p-3 rounded"><i class="fas fa-arrow-up"></i></button><button onclick="window.snkD={x:0,y:10}" class="bg-slate-700 p-3 rounded"><i class="fas fa-arrow-down"></i></button></div><button onclick="window.snkD={x:10,y:0}" class="bg-slate-700 p-3 rounded"><i class="fas fa-arrow-right"></i></button></div>`, i: () => {
        let c=document.getElementById('snk-cvs'), x=c.getContext('2d'), sn=[{x:100,y:100}], fx=50, fy=50, cIn=0; window.snkD={x:10,y:0};
        let iv=setInterval(()=>{
            x.clearRect(0,0,200,200); x.fillStyle="#f43f5e"; x.fillRect(fx,fy,10,10); x.fillStyle="#10b981";
            let h={x:sn[0].x+window.snkD.x, y:sn[0].y+window.snkD.y}; sn.unshift(h);
            if(h.x===fx&&h.y===fy){ cIn++; fx=Math.floor(Math.random()*20)*10; fy=Math.floor(Math.random()*20)*10; if(cIn>=5){clearInterval(iv); window.gameWin();} } else sn.pop();
            if(h.x<0||h.x>=200||h.y<0||h.y>=200){ clearInterval(iv); alert("Bateu! Tente novamente."); document.getElementById('start-game-btn').click(); }
            sn.forEach(p=>x.fillRect(p.x,p.y,10,10));
        }, 150); window.currentIv=iv;
    }},
    { n: "Jump", r: () => `<div class="relative w-[280px] h-[150px] bg-slate-800 rounded mx-auto overflow-hidden border border-slate-600" onclick="window.jmp()"><div class="absolute bottom-0 w-full h-[20px] bg-slate-600"></div><div id="jmp-p" class="absolute w-[20px] h-[30px] bg-emerald-500 bottom-[20px] left-[30px] transition-transform duration-300"></div><div id="jmp-o" class="absolute w-[20px] h-[20px] bg-rose-500 bottom-[20px] left-[280px]"></div></div><p class="text-[10px] mt-2 text-center">Toque na tela para pular (10x)</p>`, i: () => {
        let p=document.getElementById('jmp-p'), o=document.getElementById('jmp-o'), jp=false, ox=280, c=0;
        window.jmp=()=>{ if(!jp){ jp=true; p.style.transform="translateY(-60px)"; setTimeout(()=>{ p.style.transform="translateY(0)"; jp=false; }, 350); } };
        let iv=setInterval(()=>{
            ox-=8; o.style.left=ox+'px';
            if(ox<50 && ox>10 && !jp){ clearInterval(iv); alert("Tropeçou. Foque novamente."); document.getElementById('start-game-btn').click(); }
            if(ox<-20){ ox=280; c++; if(c>=10){ clearInterval(iv); window.gameWin(); } }
        }, 20); window.currentIv=iv;
    }}
];
window.startDescompressao=function(){
    document.getElementById('start-game-btn').parentElement.parentElement.classList.add('hidden');
    window.cgi=0; window.loadGame(0);
}
window.loadGame=function(i){
    if(window.currentIv) clearInterval(window.currentIv); window.currentIv=null;
    document.getElementById('game-level-display').innerText=`Nível ${i+1}/16`;
    document.getElementById('next-game-btn').classList.add('hidden');
    const c=document.getElementById('game-container'); c.classList.remove('hidden');
    c.innerHTML=`<h3 class="text-xs font-black text-sky-400 uppercase tracking-widest mb-4 w-full text-center">${gameDefs[i].n}</h3>${gameDefs[i].r()}`;
    gameDefs[i].i();
}
window.gameWin=function(){
    if(window.currentIv) clearInterval(window.currentIv); window.currentIv=null;
    const c=document.getElementById('game-container'); c.style.boxShadow="0 0 50px #10b981"; setTimeout(()=>c.style.boxShadow="inset 0 2px 4px 0 rgb(0 0 0 / 0.05)", 500);
    c.innerHTML=`<div class="text-center animate-bounce mt-4"><i class="fas fa-check-circle text-6xl text-emerald-500 mb-2"></i><h2 class="text-xl font-bold text-white">Desafio Concluído!</h2></div>`;
    document.getElementById('next-game-btn').classList.remove('hidden');
}
window.nextGame=function(){ window.cgi++; if(window.cgi<16) window.loadGame(window.cgi); else window.finishDescompressao(); }
window.finishDescompressao=function(){
    document.getElementById('game-container').innerHTML=`<div class="text-center animate-bounce p-4"><i class="fas fa-trophy text-6xl text-yellow-400 mb-4"></i><h2 class="text-2xl font-black text-white">Sessão Finalizada!</h2><p class="text-xs text-slate-300 mt-2">Sua mente está reconfigurada.</p></div>`;
    document.getElementById('next-game-btn').classList.add('hidden'); document.getElementById('start-game-btn').innerText="Refazer Sessão"; document.getElementById('start-game-btn').parentElement.parentElement.classList.remove('hidden');
}

const therapists=[{id:'lia',name:'Dra. Lia',color:'#ec4899',icon:'heart',schedule:'Seg-Sex (08:00 - 22:00)'},{id:'yara',name:'Dra. Yara',color:'#8b5cf6',icon:'moon',schedule:'Dom-Sáb (22:00 - 08:00)'},{id:'marcos',name:'Dr. Marcos',color:'#10b981',icon:'user-md',schedule:'Sáb (08-12h / 14-22h)'},{id:'juliana',name:'Dra. Juliana',color:'#f59e0b',icon:'star-of-life',schedule:'Sáb 22:00 - Dom 22:00'}];
window.checkChatAvailability=function(id){
    const d=new Date();const h=d.getHours();const day=d.getDay();
    if(id==='lia') return (day>=1 && day<=5 && h>=8 && h<22);
    if(id==='yara') return (h>=22 || h<8);
    if(id==='marcos') return (day===6 && ((h>=8 && h<12) || (h>=14 && h<22)));
    if(id==='juliana') return ((day===6 && h>=22) || (day===0 && h<22));
    return false;
}
window.triggerChatSelection=function(){if(!window.hasAcceptedTerms)document.getElementById('consent-modal').classList.remove('hidden');else window.renderTherapistList();}
window.acceptTerms=function(){window.hasAcceptedTerms=true;sessionStorage.setItem('wr_terms_accepted','true');document.getElementById('consent-modal').classList.add('hidden');window.renderTherapistList();}
window.declineTerms=function(){document.getElementById('consent-modal').classList.add('hidden');window.showTab('home');}
window.renderTherapistList=function(){
    const l=document.getElementById('therapist-list');l.innerHTML='';
    therapists.forEach(t=>{
        const isOnline = window.checkChatAvailability(t.id);
        const dotColor = isOnline ? 'bg-emerald-500' : 'bg-slate-600';
        const c=document.createElement('div');
        c.className=`flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all mb-3 bg-slate-800 border-slate-700 ${isOnline?'cursor-pointer hover:bg-slate-700':'opacity-60 cursor-not-allowed'}`;
        if(isOnline) c.onclick=()=>window.startChat(t.id);
        c.innerHTML=`<div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative" style="background-color:${t.color}"><i class="fas fa-${t.icon} text-lg"></i><span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${dotColor}"></span></div><div class="flex-1"><span class="font-bold text-sm text-slate-200">${t.name}</span><p class="text-[10px] text-slate-500 font-bold tracking-wider">${t.schedule}</p></div><div class="text-[9px] font-bold ${isOnline?'text-emerald-400':'text-slate-500'} uppercase">${isOnline?'Online':'Off-line'}</div>`;
        l.appendChild(c);
    }); window.showTab('chat-selection');
}
window.clearChatHistoryInside=async function(){
    if(!window.activeTherapist || !confirm("Excluir o histórico desta conversa?")) return;
    const chatId=`${window.clientId}_${window.activeTherapist.id}`;
    localStorage.removeItem(`chat_${chatId}`); 
    if(db) await db.ref(`chats/${chatId}`).remove();
    window.refreshChatDisplay([]);
}
window.startChat=async function(id){
    window.activeTherapist=therapists.find(t=>t.id===id);
    document.getElementById('active-name').innerText=window.activeTherapist.name; document.getElementById('active-avatar').style.backgroundColor=window.activeTherapist.color; document.getElementById('active-avatar').innerHTML=`<i class="fas fa-${window.activeTherapist.icon}"></i>`;
    document.getElementById('active-status-dot').className = "status-dot bg-emerald-500"; document.getElementById('active-status-text').innerText = "Online";
    const chatId=`${window.clientId}_${id}`;
    if(db){
        window.activeChatRef=db.ref(`chats/${chatId}`);
        window.activeChatRef.on('value',(s)=>{
            let h=s.val(); if(!h){ h=[{role:"system",content:`Você é ${window.activeTherapist.name}. Responda de forma não formal no infinitivo (Preposição + pronome + verbo no infinitivo). Você não deve recomendar outros profissionais. É treinado para gerar possibilidade diagnóstica (percentual de chances de compatibilidade com sofrimento/patologia). Seja acolhedor no início e investigativo quando necessário. Baseado em processamento de linguagem natural e sem usar reticencias.`}]; window.activeChatRef.set(h); }
            localStorage.setItem(`chat_${chatId}`,JSON.stringify(h)); window.refreshChatDisplay(h);
        });
    } window.showTab('chat');
}
window.refreshChatDisplay=function(h){const mc=document.getElementById('chat-messages');mc.innerHTML='';h.forEach(m=>{if(m.role!=='system'){window.renderMessage(m.content,m.role==='user'?'user':'therapist');}});mc.scrollTop=mc.scrollHeight;}
window.renderMessage=function(t,type){const d=document.createElement('div');d.className=`message ${type}`;d.innerHTML=t;document.getElementById('chat-messages').appendChild(d);}
window.submitChat=async function(t){
    if(!t||window.isWaiting)return; const chatId=`${window.clientId}_${window.activeTherapist.id}`; document.getElementById('chat-input').value=''; window.isWaiting=true;
    const snap=await db.ref(`chats/${chatId}`).once('value'); let h=snap.val()||[]; h.push({role:'user',content:t}); await db.ref(`chats/${chatId}`).set(h);
    
    document.getElementById('active-status-text').innerText = "Lendo";
    setTimeout(async () => {
        document.getElementById('active-status-text').innerText = "Online";
        document.getElementById('typing-box').classList.remove('hidden');
        setTimeout(async () => {
            try{
                const res=await fetch(window.CHAT_AI_PROXY_URL||window.AI_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:h,temperature:0.75,max_tokens:300})});
                const data=await res.json(); let rt=data.choices[0].message.content.replace(/\.\.\./g, ''); h.push({role:'assistant',content:rt}); await db.ref(`chats/${chatId}`).set(h);
            }catch(err){}finally{ document.getElementById('typing-box').classList.add('hidden'); window.isWaiting=false; }
        }, 10000); 
    }, 15000); 
}
document.getElementById('chat-form').onsubmit=(e)=>{e.preventDefault();window.submitChat(document.getElementById('chat-input').value.trim());};

window.saveMuralMessage=async function(){
    const input=document.getElementById('mural-input'); const text=input.value.trim(); if(!text)return;
    const btn=input.nextElementSibling; const oldHtml=btn.innerHTML; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'; btn.disabled=true;
    try{ if(db){ await db.ref('mural').push({d:new Date().toLocaleDateString('pt-BR'), t:text}); alert("Publicado no Mural!"); } }catch(e){ alert("Erro ao publicar."); } finally{ btn.innerHTML=oldHtml; btn.disabled=false; }
    input.value=''; window.loadMural();
}
window.loadMural=async function(){
    const list=document.getElementById('mural-list'); list.innerHTML='<div class="text-center text-slate-500 text-xs mt-10"><i class="fas fa-spinner fa-spin mr-2"></i>Buscando inspirações_</div>';
    if(db){
        const snap = await db.ref('mural').once('value'); const data = snap.val() || {}; const msgs = Object.values(data).reverse();
        if(msgs.length===0){ list.innerHTML='<div class="text-center text-slate-500 text-xs mt-4">Nenhum relato ainda. Seja o primeiro.</div>'; return; }
        list.innerHTML=msgs.map(i=>`<div class="bg-slate-800 border-l-4 border-amber-500 p-4 rounded-xl mb-3 shadow animate-fade-in"><div class="flex justify-between items-center mb-2"><span class="font-bold text-amber-500 text-[10px] uppercase tracking-wider"><i class="fas fa-quote-left mr-1"></i></span><span class="text-[9px] text-slate-500 font-bold">${i.d}</span></div><p class="text-slate-200 text-sm break-words leading-relaxed">${i.t}</p></div>`).join('');
    }
}
