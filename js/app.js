// Firebase configurado via firebase-config.js
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
window.login = async function(isAuto) {
    try {
        const gEl = document.getElementById('user-gender'); const nEl = document.getElementById('user-name-input');
        const pEl = document.getElementById('user-pass-input'); const partnerEl = document.getElementById('partner-code-input');
        const g = gEl ? gEl.value : ''; const n = nEl ? nEl.value.trim().toUpperCase() : '';
        const p = pEl ? pEl.value.trim() : ''; const partnerCode = partnerEl ? partnerEl.value.trim().toUpperCase() : '';
        if (!isAuto && (!g || n.split(' ').length < 2 || !/^[0-9]{8}$/.test(p))) return alert("Atenção: Selecione seu gênero, digite Nome e Sobrenome e a Senha (exatamente 8 números).");
        window.clientId = n.replace(/\s+/g, '_'); window.clientName = n.split(' ')[0];
        if (!window.userDataCache) window.userDataCache = { relacional: {}, saude: {}, financas: { transactions: [] } };
        if (window.db) {
            // Primeiro, tentar sincronizar dados existentes
            await window.syncUserData(window.clientId);
            
            // Se não encontrou dados ou sincronização falhou, criar novo usuário
            if (!window.userDataCache || !window.userDataCache.pass) {
                const newUser = { pass: p, fullName: n, gender: g || 'M', created: Date.now(), relacional: {}, saude: {}, financas: { transactions: [] } };
                if (partnerCode) newUser.relacional.linkedPartner = partnerCode;
                await window.db.ref('users/' + window.clientId).set(newUser);
                window.userDataCache = newUser;
                console.log("✅ Novo usuário criado:", window.clientId);
            } else {
                // Validar senha do usuário existente
                if (window.userDataCache.pass !== p) return alert("Senha incorreta.");
                
                // Atualizar dados se necessário
                if (!window.userDataCache.relacional) window.userDataCache.relacional = {};
                if (partnerCode && window.userDataCache.relacional.linkedPartner !== partnerCode) {
                    window.userDataCache.relacional.linkedPartner = partnerCode;
                    await window.db.ref('users/' + window.clientId + '/relacional/linkedPartner').set(partnerCode);
                }
                console.log("✅ Usuário existente carregado:", window.clientId);
            }
        } else {
            window.userDataCache.pass = p; window.userDataCache.fullName = n; window.userDataCache.gender = g || 'M';
            if (partnerCode) window.userDataCache.relacional.linkedPartner = partnerCode;
        }
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe && rememberMe.checked) {
            localStorage.setItem('wr_remember', 'true'); localStorage.setItem('wr_user', n); localStorage.setItem('wr_pass', p);
        } else if (!isAuto) {
            localStorage.removeItem('wr_remember'); localStorage.removeItem('wr_user'); localStorage.removeItem('wr_pass');
        }
        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName);
        window.showTab('home');
    } catch (error) {
        console.error("❌ Erro no Login:", error);
        console.error("📍 Detalhes:", error.message, error.stack);
        
        // Verificar tipo específico de erro
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            alert("❌ Erro de conexão com servidor.\n\nVerifique sua internet e tente novamente.\n\nSe o problema persistir, recarregue a página (F5).");
        } else if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
            alert("❌ Erro de permissão no Firebase.\n\nTente fazer login novamente ou contate o suporte.");
        } else if (window.isFirebaseOnline && !window.isFirebaseOnline()) {
            alert("⚠️ Conexão com banco de dados instável.\n\nModo offline ativado - suas alterações serão salvas localmente.");
        } else {
            alert("❌ Erro inesperado.\n\nTente novamente. Se o problema persistir, recarregue a página.\n\nErro: " + error.message);
        }
        
        window.userDataCache = window.userDataCache || { relacional: {}, saude: {}, financas: { transactions: [] } };
        document.querySelectorAll('.client-name').forEach(e => e.innerText = window.clientName || 'Usuário'); 
        window.showTab('home');
    }
};
window.logoutUser=function(){localStorage.removeItem('wr_remember');localStorage.removeItem('wr_user');localStorage.removeItem('wr_pass');window.location.reload();}
window.testConnectivity=async function(){
  console.log("🔍 Testando conectividade geral...");
  const results = {
    internet: false,
    api: false,
    firebase: false
  };
  
  // Testar conexão básica com a internet
  try {
    const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
    results.internet = true;
    console.log("✅ Conexão com internet: OK");
  } catch (error) {
    console.error("❌ Conexão com internet: FALHOU", error);
  }
  
  // Testar API do próprio site
  try {
    const response = await fetch('/api/ai', { method: 'HEAD' });
    results.api = response.ok;
    console.log(results.api ? "✅ API do site: OK" : "❌ API do site: FALHOU");
  } catch (error) {
    console.error("❌ API do site: FALHOU", error);
  }
  
  // Testar Firebase
  results.firebase = window.isFirebaseOnline ? window.isFirebaseOnline() : false;
  console.log(results.firebase ? "✅ Firebase: OK" : "❌ Firebase: FALHOU");
  
  console.table(results);
  return results;
};
window.manualSyncData=async function(){
  if(!window.clientId){
    alert("Faça login primeiro para sincronizar dados.");
    return;
  }
  
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Sincronizando...';
  btn.disabled = true;
  
  try{
    console.log("🔄 Iniciando sincronização manual completa...");
    
    // 1. Forçar diagnóstico primeiro
    await window.diagnoseFirebaseConnection();
    
    // 2. Recuperar TODOS os dados do Firebase
    console.log("📥 Recuperando dados completos do Firebase...");
    const recoveredData = await window.recoverAllFirebaseData();
    
    if(recoveredData){
      console.log("✅ Dados recuperados com sucesso!");
      
      // 3. Carregar dados específicos
      await window.loadMuralFromFirebase();
      await window.loadChatsFromFirebase();
      
      // 4. Forçar salvamento dos dados atuais
      await window.forceSaveUserData();
      
      // 5. Exibir resumo detalhado
      const summary = `
🎉 SINCRONIZAÇÃO COMPLETA REALIZADA!

📊 Dados Recuperados:
• 👥 Usuários: ${Object.keys(recoveredData.users).length}
• 🖼️ Mural: ${recoveredData.mural.length} posts
• 💬 Chats: ${Object.keys(recoveredData.chats).length}
• ⚙️ Config Admin: ${recoveredData.admin_auth ? 'Disponível' : 'Não encontrado'}
• 🤖 Status IA: ${Object.keys(recoveredData.ai_status).length}

💾 Backup salvo em localStorage com timestamp: ${recoveredData.timestamp}

✅ Seus dados pessoais foram restaurados!
✅ Mural e históricos de chat foram carregados!
✅ Interface atualizada com os dados recuperados!

Verifique o console (F12) para logs detalhados de todos os dados.`;
      
      alert(summary);
      
      // 6. Atualizar interface se necessário
      if(window.userDataCache.saude){
        window.renderHydration();
        window.renderCaloricNeed();
      }
      
      // 7. Se estiver na aba de relaxamento, atualizar mural
      const currentTab = document.querySelector('.tab-content.active');
      if(currentTab && currentTab.id === 'relaxation'){
        const muralTab = document.getElementById('rx-mural');
        if(muralTab && !muralTab.classList.contains('hidden')){
          window.loadMural();
        }
      }
      
    } else {
      alert("⚠️ Não foi possível recuperar dados. Verifique sua conexão e tente novamente.");
    }
  } catch(error){
    console.error("❌ Erro na sincronização manual:", error);
    alert("❌ Erro ao sincronizar: " + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};
window.showSaudeSubTab=function(id){
    document.querySelectorAll('#saude .rel-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('btn-'+id).classList.add('active');
    ['sd-perfil','sd-agua','sd-nutricao','sd-exercicio','sd-cardio','sd-ansiedade'].forEach(t=>document.getElementById(t).classList.add('hidden'));document.getElementById(id).classList.remove('hidden');
    
    // Renderizar restrições alimentares quando abrir guia de nutrição
    if(id === 'sd-nutricao') {
        window.ensureHealthStructures();
        window.renderBalancedMealRestrictions();
    }
}
window.calcIMC=async function(){
    const w = parseFloat(document.getElementById('health-weight').value); const h = parseFloat(document.getElementById('health-height').value);
    if(!w || !h) return alert("Preencha peso e altura.");
    const imc = (w / (h * h)).toFixed(1); let cat = "Normal";
    if(imc < 18.5) cat = "Abaixo do peso"; else if(imc >= 18.5 && imc < 25) cat = "Normal"; else if(imc >= 25 && imc < 30) cat = "Sobrepeso"; else cat = "Obesidade";
    document.getElementById('imc-result').innerText = `IMC: ${imc} (${cat})`;
    if(!window.userDataCache.saude) window.userDataCache.saude={};
    window.userDataCache.saude.weight = w; window.userDataCache.saude.height = h; window.userDataCache.saude.imc = imc; window.userDataCache.saude.imcCategory = cat;
    window.renderHydration(); window.renderCaloricNeed();
    if(window.db) await window.db.ref('users/'+window.clientId+'/saude').set(window.userDataCache.saude);
}
window.getHydrationGoal=function(){
    const weight = parseFloat(window.userDataCache?.saude?.weight);
    if(!weight) return 2000; return Math.round(weight * 35);
};
window.renderHydration=function(){
  window.ensureHealthStructures(); const w=window.userDataCache.saude.water;
  const totalEl=document.getElementById('water-total'); const goalEl=document.getElementById('water-goal-text'); const bar=document.getElementById('water-progress-bar');
  const goal=window.getHydrationGoal(); const total=w.total||0; const pct=Math.min(100, Math.round((total/goal)*100));
  if(totalEl) totalEl.innerText=`${total} ml`; if(goalEl) goalEl.innerText=`Meta: ${goal} ml`; if(bar) bar.style.width=`${pct}%`;
};
window.getHydrationFactor=function(drinkType){
    if(drinkType==='juice') return 0.5; if(drinkType==='soda') return 0.25; if(drinkType==='tea') return 0.75; return 1;
}
window.startCardioTimer=function(){
    const btn = document.getElementById('cardio-btn'); const elapsedEl = document.getElementById('cardio-elapsed');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-stopwatch text-4xl animate-pulse ml-2"></i>';
    document.getElementById('cardio-input-area').classList.add('hidden'); document.getElementById('cardio-result').classList.add('hidden');
    let secs = 60; if(elapsedEl) elapsedEl.innerText = 'Tempo: 00s / 60s';
    window.cardioTimer = setInterval(() => {
        secs--; if(elapsedEl) elapsedEl.innerText = `Tempo: ${String(60-secs).padStart(2,'0')}s / 60s`;
        if(secs <= 0){
            clearInterval(window.cardioTimer); btn.innerHTML = '<i class="fas fa-play text-4xl ml-2"></i>'; btn.disabled = false;
            document.getElementById('cardio-input-area').classList.remove('hidden'); if(elapsedEl) elapsedEl.innerText = 'Tempo: 60s / 60s';
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
    if(window.db) await window.db.ref('users/'+window.clientId+'/saude/cardio').set(window.userDataCache.saude.cardio);
}
window.startAnxietyCheck=function(){
    window.ensureHealthStructures(); const today = window.getTodayStr(); const a = window.userDataCache.saude.anxietyDaily;
    if(a.day===today && a.completed){ const redo = confirm('Você já concluiu o Ansiômetro hoje. Deseja refazer agora?'); if(!redo) return; }
    window.ansioMessages=[]; document.getElementById('ans-chat-area').classList.remove('hidden'); document.getElementById('ans-messages').innerHTML='';
    const sys = "Atue como terapeuta. Faça 20 perguntas curtas, UMA POR VEZ (numere 1/20), para avaliar ansiedade. Após a 20ª resposta, diga APENAS um número de 0 a 100 definindo o nível de ansiedade. Sem uso de reticencias.";
    window.ansioMessages.push({role:'system', content:sys}); window.callAnsAI('Quero avaliar minha ansiedade. Primeira pergunta.');
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
            else if(score <= 75) bar.className = 'bg-yellow-400 h-full transition-all duration-700 shadow-[0_0_10px_rgba(250,204,21,0.8)]'; 
            else bar.className = 'bg-red-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(220,38,38,0.8)]';
            window.userDataCache.saude.anxietyScore = score; window.userDataCache.saude.anxietyDaily = {day:window.getTodayStr(), score, completed:true};
            if(window.db){ await window.db.ref('users/'+window.clientId+'/saude/anxietyScore').set(score); await window.db.ref('users/'+window.clientId+'/saude/anxietyDaily').set(window.userDataCache.saude.anxietyDaily); }
        }
    }catch(e){} finally{ btn.disabled=false; }
}
window.showRelSubTab=function(id){document.querySelectorAll('#relacional .rel-nav-btn').forEach(b=>b.classList.remove('active'));document.getElementById('btn-'+id).classList.add('active');['rel-pessoal','rel-parceria','rel-cupom','rel-amor'].forEach(t=>document.getElementById(t).classList.add('hidden'));document.getElementById(id).classList.remove('hidden');if(id==='rel-parceria')window.loadLinkedPartner();}
window.initRelacionalTab=function(){window.showRelSubTab('rel-pessoal');if(!window.userDataCache.relacional)window.userDataCache.relacional={};const rel=window.userDataCache.relacional;if(rel.age)document.getElementById('rel-age-input').value=rel.age;if(rel.shareCode)document.getElementById('rel-share-code').value=rel.shareCode;else window.generateRelShareCode();}
window.generateRelShareCode=async function(){const code=Math.random().toString(36).substring(2,8).toUpperCase();document.getElementById('rel-share-code').value=code;if(!window.userDataCache.relacional)window.userDataCache.relacional={};window.userDataCache.relacional.shareCode=code; if(window.db) await window.db.ref('users/'+window.clientId+'/relacional/shareCode').set(code);}
window.copyRelShareCode=function(){const input=document.getElementById('rel-share-code');input.select();document.execCommand("copy");alert("Código copiado.");}
window.loadLinkedPartner=async function(){
    const code=window.userDataCache.relacional?.linkedPartner;
    if(!code){document.getElementById('rel-partner-setup').classList.remove('hidden');document.getElementById('rel-partner-content').classList.add('hidden');return;}
    document.getElementById('rel-partner-setup').classList.add('hidden'); if(!window.db) return;
    const snap=await window.db.ref('users').once('value');const users=snap.val()||{};let partner=null;
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
    document.querySelectorAll('#relaxation .rel-nav-btn').forEach(b=>b.classList.remove('active')); document.getElementById('btn-'+id).classList.add('active');
    ['rx-video','rx-cinema','rx-arte','rx-mural','rx-biblioteca','rx-caixinha','rx-jogos'].forEach(t=>document.getElementById(t).classList.add('hidden')); document.getElementById(id).classList.remove('hidden');
    if(id==='rx-mural') window.loadMural();
}
window.currentColor = '#ffffff'; window.currentArtIndex = 0;
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
        let g=document.getElementById('chk-grid'), sel=null; let b = Array(25).fill(0); b[2]=2; b[22]=1; 
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
window.startDescompressao=function(){document.getElementById('start-game-btn').parentElement.parentElement.classList.add('hidden'); window.cgi=0; window.loadGame(0);}
window.loadGame=function(i){
    if(window.currentIv) clearInterval(window.currentIv); window.currentIv=null;
    document.getElementById('game-level-display').innerText=`Nível ${i+1}/16`; document.getElementById('next-game-btn').classList.add('hidden');
    const c=document.getElementById('game-container'); c.classList.remove('hidden');
    c.innerHTML=`<h3 class="text-xs font-black text-sky-400 uppercase tracking-widest mb-4 w-full text-center">${gameDefs[i].n}</h3>${gameDefs[i].r()}`; gameDefs[i].i();
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
    if(id==='lia') return (day>=1 && day<=5 && h>=8 && h<22); if(id==='yara') return (h>=22 || h<8);
    if(id==='marcos') return (day===6 && ((h>=8 && h<12) || (h>=14 && h<22))); if(id==='juliana') return ((day===6 && h>=22) || (day===0 && h<22)); return false;
}
window.triggerChatSelection=function(){if(!window.hasAcceptedTerms)document.getElementById('consent-modal').classList.remove('hidden');else window.renderTherapistList();}
window.acceptTerms=function(){window.hasAcceptedTerms=true;sessionStorage.setItem('wr_terms_accepted','true');document.getElementById('consent-modal').classList.add('hidden');window.renderTherapistList();}
window.declineTerms=function(){document.getElementById('consent-modal').classList.add('hidden');window.showTab('home');}
window.renderTherapistList=function(){
    const l=document.getElementById('therapist-list');l.innerHTML='';
    therapists.forEach(t=>{
        const isOnline = window.checkChatAvailability(t.id); const dotColor = isOnline ? 'bg-emerald-500' : 'bg-slate-600';
        const c=document.createElement('div');
        c.className=`flex items-center gap-4 p-4 rounded-xl border shadow-sm transition-all mb-3 bg-slate-800 border-slate-700 ${isOnline?'cursor-pointer hover:bg-slate-700':'opacity-60 cursor-not-allowed'}`;
        if(isOnline) c.onclick=()=>window.startChat(t.id);
        c.innerHTML=`<div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold relative" style="background-color:${t.color}"><i class="fas fa-${t.icon} text-lg"></i><span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${dotColor}"></span></div><div class="flex-1"><span class="font-bold text-sm text-slate-200">${t.name}</span><p class="text-[10px] text-slate-500 font-bold tracking-wider">${t.schedule}</p></div><div class="text-[9px] font-bold ${isOnline?'text-emerald-400':'text-slate-500'} uppercase">${isOnline?'Online':'Off-line'}</div>`;
        l.appendChild(c);
    }); window.showTab('chat-selection');
}
window.clearChatHistoryInside=async function(){
    if(!window.activeTherapist || !confirm("Excluir o histórico desta conversa?")) return;
    const chatId=`${window.clientId}_${window.activeTherapist.id}`; localStorage.removeItem(`chat_${chatId}`); 
    if(db) await db.ref(`chats/${chatId}`).remove(); window.refreshChatDisplay([]);
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
        document.getElementById('active-status-text').innerText = "Online"; document.getElementById('typing-box').classList.remove('hidden');
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
window.BIOTYPE_PROFILES={ ectomorfo:{name:'Ectomorfo',emoji:'🧍',summary:'Estrutura óssea linear e fina, ombros estreitos e alto gasto calórico. Tendência a provas de velocidade.'}, mesomorfo:{name:'Mesomorfo',emoji:'🏃',summary:'Estrutura sólida e atlética, ombros largos e cintura fina. Perfil equilibrado para resistência e potência.'}, endomorfo:{name:'Endomorfo',emoji:'🏋️',summary:'Corpo arredondado e macio, metabolismo mais lento e boa resposta para força bruta com constância.'} };
window.ACTIVITY_LEVELS={ sedentario:{name:'Sedentário',factor:1.2,summary:'Rotina majoritariamente sentada, com baixa movimentação diária.'}, moderado:{name:'Moderado',factor:1.5,summary:'Movimentação regular no dia e exercícios leves em alguns dias da semana.'}, ativo:{name:'Ativo',factor:1.8,summary:'Treinos frequentes e rotina com alta demanda corporal.'}, atleta:{name:'Atleta',factor:2.0,summary:'Alto volume de treino e desempenho físico como foco principal.'} };
window.getMonthStr=function(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};
window.ensureHealthStructures=function(){
  if(!window.userDataCache) window.userDataCache={}; if(!window.userDataCache.saude) window.userDataCache.saude={};
  const s=window.userDataCache.saude;
  if(!s.water) s.water={total:0,history:[],day:window.getTodayStr(),goalReachedAt:null}; if(!Array.isArray(s.water.history)) s.water.history=[];
  if(!s.healthGoalLog || s.healthGoalLog.month!==window.getMonthStr()) s.healthGoalLog={month:window.getMonthStr(),entries:[]}; if(!Array.isArray(s.healthGoalLog.entries)) s.healthGoalLog.entries=[];
  if(!s.exercise || s.exercise.day!==window.getTodayStr()) s.exercise={day:window.getTodayStr(),goal:20,total:0,logs:[]}; if(!Array.isArray(s.exercise.logs)) s.exercise.logs=[];
  if(!s.anxietyDaily || s.anxietyDaily.day!==window.getTodayStr()) s.anxietyDaily={day:window.getTodayStr(), score:null, completed:false};
  if(!s.activityProfile) s.activityProfile={level:null,name:null,factor:1,summary:'',at:null,locked:false};
  if(!Array.isArray(s.nutriHistory)) s.nutriHistory=[];
};
window.renderBiotypeOptions=function(){
  const box=document.getElementById('biotype-options'); if(!box) return;
  box.innerHTML=Object.entries(window.BIOTYPE_PROFILES).map(([k,v],idx)=>`<label class="flex items-start gap-2 p-2 rounded-lg border border-slate-600 bg-slate-900/40"><input class="biotype-opt mt-1" type="checkbox" data-kind="${k}"><span><b>Perfil ${idx+1}</b><br><span class="text-slate-300">${v.summary}</span></span></label>`).join('');
};
window.updateBiotypeFromTraits=async function(){
  const selected=[...document.querySelectorAll('.biotype-opt:checked')].map(i=>i.dataset.kind);
  if(!selected.length) return alert('Selecione ao menos uma característica.');
  const counts={ectomorfo:0,mesomorfo:0,endomorfo:0}; selected.forEach(k=>counts[k]++);
  const winner=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]; const p=window.BIOTYPE_PROFILES[winner];
  const out=document.getElementById('biotype-result'); out.classList.remove('hidden');
  out.innerHTML=`<p class="font-black text-rose-300">Seu biotipo predominante: ${p.emoji} ${p.name}</p><p class="mt-1 text-slate-200">${p.summary}</p><p class="mt-2 text-[10px] text-amber-300"><b>Limitações comuns:</b> adaptação diferente a ganho de massa, resistência e recuperação. O progresso exige treino, alimentação e descanso individualizados.</p><p class="mt-1 text-[10px] text-slate-300">Seu resultado valida suas características integrais, mas não define sozinho sua capacidade física.</p>`;
  window.ensureHealthStructures(); window.userDataCache.saude.biotype={result:winner,at:Date.now(),locked:true};
  document.querySelectorAll('.biotype-opt').forEach((el)=>{el.disabled=true;});
  if(db) await db.ref('users/'+window.clientId+'/saude/biotype').set(window.userDataCache.saude.biotype);
};
window.renderActivityProfileState=function(){
  const sel=document.getElementById('activity-level-select'); const exp=document.getElementById('activity-level-explanation'); const out=document.getElementById('activity-level-result');
  if(!sel||!exp||!out) return; window.ensureHealthStructures(); const s=window.userDataCache.saude; const profile=window.ACTIVITY_LEVELS[sel.value];
  exp.innerText=profile?profile.summary:'Selecione um perfil para ver a explicação.';
  if(s.activityProfile?.locked && s.activityProfile.level){
    out.classList.remove('hidden'); out.innerHTML=`<p class="font-black text-indigo-300">Perfil diário salvo: ${s.activityProfile.name}</p><p class="mt-1 text-slate-200">${s.activityProfile.summary}</p><p class="mt-1 text-[10px] text-slate-400">Fator de atividade aplicado: ${s.activityProfile.factor}x</p>`;
    sel.value=s.activityProfile.level; sel.disabled=true;
  }else{ out.classList.add('hidden'); out.innerHTML=''; sel.disabled=false; }
};
window.generateActivityProfile=async function(){
  const sel=document.getElementById('activity-level-select'); if(!sel) return;
  const profile=window.ACTIVITY_LEVELS[sel.value]; if(!profile) return alert('Selecione um nível de atividade válido.');
  window.ensureHealthStructures(); if(window.userDataCache.saude.activityProfile?.locked) return alert('Perfil já definido. Use "Resetar info" para refazer os testes.');
  window.userDataCache.saude.activityProfile={level:sel.value,name:profile.name,factor:profile.factor,summary:profile.summary,at:Date.now(),locked:true};
  window.renderActivityProfileState(); window.renderBalancedMealRestrictions(); window.renderCaloricNeed(); window.renderNutriHistory();
  if(db) await db.ref('users/'+window.clientId+'/saude/activityProfile').set(window.userDataCache.saude.activityProfile);
};
window.resetHealthProfileInfo=async function(){
  window.ensureHealthStructures();
  window.userDataCache.saude.biotype={result:null,at:null,locked:false}; window.userDataCache.saude.activityProfile={level:null,name:null,factor:1,summary:'',at:null,locked:false};
  document.querySelectorAll('.biotype-opt').forEach((el)=>{el.checked=false;el.disabled=false;});
  const b=document.getElementById('biotype-result'); if(b){b.classList.add('hidden'); b.innerHTML='';}
  const s=document.getElementById('activity-level-select'); if(s){s.value=''; s.disabled=false;}
  const e=document.getElementById('activity-level-explanation'); if(e)e.innerText='Selecione um perfil para ver a explicação.';
  const a=document.getElementById('activity-level-result'); if(a){a.classList.add('hidden'); a.innerHTML='';}
  window.renderCaloricNeed(); window.renderNutriHistory();
  if(db){ await db.ref('users/'+window.clientId+'/saude/biotype').set(window.userDataCache.saude.biotype); await db.ref('users/'+window.clientId+'/saude/activityProfile').set(window.userDataCache.saude.activityProfile); }
};
window.getEnergyContext=function(){
  const s=window.userDataCache?.saude||{}; const w=parseFloat(s.weight)||0; const imc=parseFloat(s.imc)||0; const gender=(window.userDataCache?.gender||'masculino'); const pass=(window.userDataCache?.pass||'').trim(); let age=40;
  if(/^\d{8}$/.test(pass)){
    const d=parseInt(pass.slice(0,2),10),m=parseInt(pass.slice(2,4),10)-1,y=parseInt(pass.slice(4),10); const born=new Date(y,m,d);
    if(!Number.isNaN(born.getTime())){ const now=new Date(); age=now.getFullYear()-born.getFullYear(); const md=now.getMonth()-born.getMonth(); if(md<0 || (md===0 && now.getDate()<born.getDate())) age--; }
  }
  let gastoBasal=w?((gender==='masculino'?24:22)*w):1600;
  if(age>30){ const decades=Math.floor((age-30)/10)+1; gastoBasal*=Math.max(0.7,1-(decades*0.1)); }
  if(imc>=30) gastoBasal*=0.92;
  const actFactor=parseFloat(s.activityProfile?.factor)||1.2; const gastoTotal=Math.round(gastoBasal*actFactor);
  const ingeridas=(s.nutriHistory||[]).filter((h)=>h.day===window.getTodayStr()).reduce((a,b)=>a+(Number(b.cal)||0),0);
  const extraBurn=Math.max(0, Number(s.exercise?.total||0)*5); const superavit=Math.max(0, Math.round(ingeridas-(gastoTotal+extraBurn)));
  return {age,gastoBasal:Math.round(gastoBasal),gastoTotal,ingeridas:Math.round(ingeridas),superavit,actFactor};
};
window.getBurnExerciseSuggestions=function(){
  const w=parseFloat(window.userDataCache?.saude?.weight)||75;
  return [ {name:'Caminhada',icon:'🚶',calPerHour:Math.round(3.5*w)}, {name:'Corrida leve',icon:'🏃',calPerHour:Math.round(8.3*w)}, {name:'Pedalada',icon:'🚴',calPerHour:Math.round(6.8*w)}, {name:'Musculação',icon:'💪',calPerHour:Math.round(6*w)} ];
};
window.updateBurnSuggestionUI=function(){
  const pane=document.getElementById('exercisePane'), btn=document.getElementById('burn-suggestion-btn'), info=document.getElementById('burn-info');
  if(!pane||!btn||!info) return; const c=window.getEnergyContext();
  if(c.superavit<=0){
    pane.classList.add('hidden'); btn.classList.add('hidden'); info.classList.remove('hidden'); info.innerText='Sem queima extra no momento: suas calorias do dia estão dentro da necessidade basal + atividade.'; return;
  }
  const list=window.getBurnExerciseSuggestions(); const idx=window.currentBurnSuggestionIdx||0; const ex=list[idx%list.length]; const min=Math.max(1,Math.round((c.superavit/Math.max(1,ex.calPerHour))*60));
  pane.classList.remove('hidden'); btn.classList.remove('hidden'); info.classList.remove('hidden');
  document.getElementById('exIcon').innerText=ex.icon; document.getElementById('exName').innerText=ex.name; document.getElementById('exSurplus').innerText=`${c.superavit} kcal`; document.getElementById('exTime').innerText=min+' min';
  info.innerText=`Base diária: ${c.gastoTotal} kcal (basal ${c.gastoBasal} kcal x atividade ${c.actFactor}). Ingeridas hoje: ${c.ingeridas} kcal.`;
};
window.cycleBurnSuggestion=function(){ window.currentBurnSuggestionIdx=(window.currentBurnSuggestionIdx||0)+1; window.updateBurnSuggestionUI(); };
window.balancedGoalDisplay={ diaadia:'Dia a Dia (Tradicional Brasileira) ☕', diadia:'Dia a Dia (Tradicional Brasileira) ☕', ganho:'Ganho de Massa Muscular 💪', perda:'Perda de Peso ⚖️', performance:'Performance Física 🏃', foco:'Foco Cognitivo 🧠', imunidade:'Imunidade Fortalecida 🛡️', intestinal:'Saúde Intestinal 🦠', longevidade:'Longevidade 🌿', posop:'Recuperação Pós-Operatória 🏥', sono:'Qualidade do Sono 😴' };
window.balancedGoalCalorieStrategies={ diaadia:{mult:1.0,desc:'Necessidade diária equilibrada (2000 kcal).'}, diadia:{mult:1.0,desc:'Necessidade diária equilibrada (2000 kcal).'}, ganho:{mult:1.15,desc:'Superávit calórico para hipertrofia (+15%).'}, perda:{mult:0.8,desc:'Déficit calórico para perda de gordura (-20%).'}, performance:{mult:1.1,desc:'Energia extra para atividades físicas (+10%).'}, foco:{mult:1.0,desc:'Cérebro saudável (ômega-3 e antioxidantes).'}, imunidade:{mult:1.0,desc:'Imunidade fortalecida (vitaminas C, D e zinco).'}, intestinal:{mult:0.95,desc:'Digestão saudável (fibras e fermentados).'}, longevidade:{mult:0.85,desc:'Restrição calórica leve para longevidade (-15%).'}, posop:{mult:0.9,desc:'Recuperação com digestão facilitada (-10%).'}, sono:{mult:0.95,desc:'Triptofano e magnésio para sono de qualidade.'} };
window.balancedMealRestrictionOptions=[
  {id:'vegano',label:'Vegano',desc:'Exclui totalmente qualquer alimento de origem animal.',tags:['carne','frango','peixe','frutosmar','embutidos','ovo','leite','queijo','manteiga','iogurte','mel','gelatina','carmim','soro']},
  {id:'ovolacto',label:'Ovolactovegetariano',desc:'Permite ovos e laticínios; exclui carnes e frutos do mar.',tags:['carne','frango','peixe','frutosmar','crustaceos','moluscos','banha']},
  {id:'lacto',label:'Lactovegetariano',desc:'Permite laticínios; exclui carnes e ovos.',tags:['carne','frango','peixe','frutosmar','ovo']},
  {id:'ovo',label:'Ovovegetariano',desc:'Permite ovos; exclui carnes e laticínios.',tags:['carne','frango','peixe','leite','queijo','requeijao','cremeleite','manteiga','iogurte','soro']},
  {id:'pescetariano',label:'Pescetariano',desc:'Permite peixes e ovos; exclui carnes e frutos do mar.',tags:['carne','frango','crustaceos','moluscos','embutidos']},
  {id:'pescetariano_sem_frutos',label:'Pescetariano (sem frutos do mar)',desc:'Permite apenas peixes; exclui carnes, crustáceos e moluscos.',tags:['carne','frango','crustaceos','moluscos','camarao','lagosta','ostras','lula']},
  {id:'lowcarb',label:'Low Carb',desc:'Reduz carboidratos e açúcares; foco em proteínas e gorduras.',tags:['acucar','farinha','arroz','massa','pao','batata','mandioca','mel','doces']},
  {id:'liquida',label:'Dieta Líquida',desc:'Apenas alimentos líquidos; proíbe sólidos e pastosos.',tags:['solido','pastoso','carne','vegetais','graos','pao']},
  {id:'celiaco',label:'Celíaco (Isenção de Glúten)',desc:'Exclusão rigorosa de glúten e traços.',tags:['trigo','centeio','cevada','malte','gluten','contaminacao']},
  {id:'lactose',label:'Intolerante à Lactose',desc:'Exclui leite e derivados; permite sem lactose.',tags:['leite','queijofresco','cremeleite','leitecondensado','ultraprocessados','leitepo','soroleite']},
  {id:'alergico_nozes',label:'Alérgico Severo (Oleaginosas)',desc:'Exclusão absoluta de oleaginosas e traços.',tags:['amendoim','castanha','nozes','amendoas','avelas','pistache','macadamia','oleos','tracos']}
];
window.selectedMealRestrictionIds=window.selectedMealRestrictionIds||[];
window.addRestriction=function(id){
  if(!id) return;
  const set=new Set(window.selectedMealRestrictionIds||[]);
  if(!set.has(id)){
    set.add(id);
    window.selectedMealRestrictionIds=[...set];
    window.renderBalancedMealRestrictions();
  }
};
window.removeRestriction=function(id){
  const set=new Set(window.selectedMealRestrictionIds||[]);
  set.delete(id);
  window.selectedMealRestrictionIds=[...set];
  window.renderBalancedMealRestrictions();
};
window.toggleBalancedRestriction=function(id){
  const set=new Set(window.selectedMealRestrictionIds||[]);
  if(set.has(id)) set.delete(id); else set.add(id);
  window.selectedMealRestrictionIds=[...set];
  window.renderBalancedMealRestrictions();
};
window.renderBalancedMealRestrictions=function(){
  const container=document.getElementById('balancedMealRestrictionList'); if(!container) return;
  const selectedSet=new Set(window.selectedMealRestrictionIds||[]);
  
  container.innerHTML=`
    <div class="space-y-2">
      <select id="restrictionSelect" class="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none cursor-pointer" onchange="window.addRestriction(this.value)">
        <option value="">Selecione uma restrição alimentar...</option>
        ${window.balancedMealRestrictionOptions.map((opt)=>`
          <option value="${opt.id}" ${selectedSet.has(opt.id)?'disabled':''}>
            ${opt.label} - ${opt.desc}
          </option>
        `).join('')}
      </select>
      <div id="selectedRestrictions" class="space-y-1">
        ${selectedSet.size > 0 ? `
          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Restrições selecionadas:</p>
          ${Array.from(selectedSet).map(id => {
            const opt = window.balancedMealRestrictionOptions.find(o => o.id === id);
            return opt ? `
              <div class="flex items-center justify-between bg-slate-950/40 border border-teal-500 rounded-lg p-2">
                <span class="text-xs text-teal-300">${opt.label}</span>
                <button type="button" onclick="window.removeRestriction('${id}')" class="text-rose-400 hover:text-rose-300 text-xs">
                  <i class="fas fa-times"></i> Remover
                </button>
              </div>
            ` : '';
          }).join('')}
        ` : '<p class="text-[9px] text-slate-500">Nenhuma restrição selecionada</p>'}
      </div>
    </div>
  `;
};
window.getSelectedMealRestrictions=function(){
  const selectedIds=[...(window.selectedMealRestrictionIds||[])];
  const selected=window.balancedMealRestrictionOptions.filter((o)=>selectedIds.includes(o.id));
  return { selectedIds, labels:selected.map((o)=>o.label), tags:[...new Set(selected.flatMap((o)=>o.tags||[]))] };
};
window.filtrarReceitasPlano=function(receitas, restrictionTags){
  if(!restrictionTags.length) return receitas;
  return receitas.filter((r)=>{
    if(restrictionTags.includes('gluten') && (r.tags||[]).includes('gluten')) return false;
    if(restrictionTags.includes('lactose') && (r.tags||[]).includes('lactose')) return false;
    const ingText=(r.ing||[]).map((i)=>String(i.item||'').toLowerCase()).join(' ');
    if(restrictionTags.includes('carne') && (ingText.includes('bife') || ingText.includes('carne') || ingText.includes('linguica') || ingText.includes('porco'))) return false;
    if(restrictionTags.includes('frango') && ingText.includes('frango')) return false;
    if(restrictionTags.includes('peixe') && (ingText.includes('peixe') || ingText.includes('tilapia') || ingText.includes('atum') || ingText.includes('salmao'))) return false;
    if(restrictionTags.includes('frutosmar') && (ingText.includes('camarao') || ingText.includes('mexilhao') || ingText.includes('lula') || ingText.includes('polvo'))) return false;
    if(restrictionTags.includes('embutidos') && (ingText.includes('presunto') || ingText.includes('salame') || ingText.includes('salsicha') || ingText.includes('linguica'))) return false;
    if(restrictionTags.includes('ovo') && ingText.includes('ovo')) return false;
    if(restrictionTags.includes('mel') && ingText.includes('mel')) return false;
    if(restrictionTags.includes('nozes') && (ingText.includes('amendoim') || ingText.includes('castanha') || ingText.includes('noz'))) return false;
    if(restrictionTags.includes('liquida') && !(r.tags||[]).includes('liquida')) return false;
    if(restrictionTags.includes('lowcarb') && !(r.tags||[]).includes('lowcarb')) return false;
    return true;
  });
};
window.consultarIA=async function(prompt){
  if(!prompt||!prompt.trim()) return { text:'Nenhum texto foi enviado para a IA.', provider:'Sem provedor' };
  try{
    console.log("🔍 Enviando requisição para /api/ai...");
    const response=await fetch('/api/ai', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider_hint:'gemini',messages:[{role:"user",content:prompt}], temperature:0.3, max_tokens:1500})});
    
    if(!response.ok) {
      console.error("❌ Resposta da API não OK:", response.status, response.statusText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Resposta da API recebida:", data);
    return { text:data?.choices?.[0]?.message?.content||'Sem resposta textual da IA.', provider:data?.provider||'Provedor IA' };
  }catch(error){ 
    console.error('❌ Erro na IA:', error);
    console.error('📍 Detalhes do erro:', error.message, error.stack);
    
    // Verificar tipo de erro
    if(error.message.includes('Failed to fetch')) {
      return { text:'Falha de conexão com o servidor. Verifique sua internet e recarregue a página.', provider:'Indisponível' };
    } else if(error.message.includes('HTTP 404')) {
      return { text:'Endpoint da IA não encontrado. Contate o suporte.', provider:'Indisponível' };
    } else if(error.message.includes('HTTP 500')) {
      return { text:'Erro interno do servidor. Tente novamente em alguns minutos.', provider:'Indisponível' };
    } else {
      return { text:`Falha na comunicação: ${error.message}`, provider:'Indisponível' };
    }
  }
};
window.buildBalancedPlanPrompt=function({goal,goalLabel,days,mealTypeLabel,restrictionLabels,preferences}){
  const jantarSlot=goal==='perda'?'Lanche leve noturno (substitui jantar tradicional)':'Jantar leve';
  
  // Verificar se é plano completo ou refeição específica
  const isPlanoCompleto = mealTypeLabel.includes('Completo') || mealTypeLabel.includes('completo');
  
  if (isPlanoCompleto) {
    // Plano completo - gera todas as refeições
    return [
      'Você é nutricionista e chef especializado em culinária brasileira. Responda em português do Brasil.',
      'IMPORTANTE: Monte um plano APENAS com RECEITAS BRASILEIRAS REAIS E COESAS.',
      'NUNCA sugira ingredientes soltos (ex: "consumir amendoim"). Cada ingrediente deve fazer parte de uma receita completa.',
      'Use PREPARAÇÕES COMUNS NO BRASIL: arroz (branco, integral, à grega), feijão (carioca, preto, lentilha), frango grelhado/assado/cozido, peixes (tilápia, sardinha, salmão), carne vermelha magra, ovos, tapioca, pão de queijo, mandioca, batata doce, abóbora, legumes refogados, saladas temperadas, iogurte natural, frutas, sucos naturais, sopas, canjas, vitaminas.',
      'EVITE ingredientes que não são comuns na culinária brasileira diária.',
      'Estrutura fixa por dia (NÃO criar lanche da manhã nem ceia): 1) Café da Manhã, 2) Almoço, 3) Lanche da Tarde, 4) '+jantarSlot+'.',
      'REGRA DE PROGRESSÃO: Após o almoço, as refeições devem ficar PROGRESSIVAMENTE mais leves em volume e densidade calórica. Lanche da tarde deve ser moderado e '+jantarSlot+' muito leve.',
      `Objetivo: ${goalLabel}.`,
      `Período: ${days} dia(s).`,
      `Tipo solicitado: ${mealTypeLabel}.`,
      `Restrições obrigatórias: ${restrictionLabels.length?restrictionLabels.join(', '):'nenhuma'}.`,
      `Preferências extras: ${preferences||'nenhuma'}.`,
      'Cada refeição deve conter: nome da receita brasileira, ingredientes com quantidades, modo de preparo passo a passo, e kcal aproximadas.',
      'EXEMPLOS DE RECEITAS: "Frango com mandioca cozida", "Arroz com feijão e bife grelhado", "Tapioca com queijo e frango desfiado", "Sopa de legumes brasileiros", "Vitamina de frutas com aveia", "Omelete de queijo com tomate", "Salada mista com azeite".',
      'Retorne SOMENTE JSON válido sem markdown, no formato:',
      '{"meal_plan":[{"day":1,"meals":[{"name":"Café da Manhã","time":"07:00","recipe_name":"Tapioca com queijo","ingredients":["2 colheres de tapioca","100g de queijo minas","1 colher de manteiga"],"preparation":"Hidrate a tapioca, amasse e misture com queijo. Leve à frigideira até dourar.","items":["Tapioca com queijo minas"],"kcal":280}]}],"shopping_list":[{"item":"Tapioca","qty":"200g"},{"item":"Queijo minas","qty":"500g"}],"tips":["Use queijo minas frescal para melhor sabor"],"notes":"Refeições balanceadas para objetivo"}',
      'A lista de compras deve conter itens consolidados para todo o período com quantidades realistas.'
    ].join('\n');
  } else {
    // Refeição específica - gera apenas aquele tipo
    return [
      'Você é nutricionista e chef especializado em culinária brasileira. Responda em português do Brasil.',
      `IMPORTANTE: Gere APENAS ${days} receita(s) de ${mealTypeLabel}. EXATAMENTE ${days} dia(s).`,
      `NÃO gere outros tipos de refeição. NÃO gere almoço se pedir café. NÃO gere jantar se pedir lanche.`,
      'Use APENAS RECEITAS BRASILEIRAS REAIS E COESAS. NUNCA sugira ingredientes soltos.',
      'Use PREPARAÇÕES COMUNS NO BRASIL: arroz, feijão, peixes, ovos, tapioca, pão de queijo, mandioca, batata doce, legumes, saladas, iogurte, frutas, sucos, sopas, vitaminas.',
      `Tipo de refeição solicitado: ${mealTypeLabel}.`,
      `Objetivo: ${goalLabel}.`,
      `Restrições obrigatórias: ${restrictionLabels.length?restrictionLabels.join(', '):'nenhuma'}.`,
      `Preferências extras: ${preferences||'nenhuma'}.`,
      `GERE EXATAMENTE ${days} RECEITA(S) - UMA PARA CADA DIA: Dia 1, Dia ${days > 1 ? '2' : ''}${days > 2 ? ', Dia 3' : ''}${days > 3 ? ', Dia 4' : ''}${days > 4 ? ', Dia 5' : ''}${days > 5 ? ', Dia 6' : ''}${days > 6 ? ', Dia 7' : ''}.`,
      'ATENÇÃO ABSOLUTA ÀS RESTRIÇÕES - VIOLAÇÃO RESULTARÁ EM PLANO INVÁLIDO:',
      restrictionLabels.includes('Vegano') ? '- VEGANO: PROIBIDO TOTAL - NENHUM alimento de origem animal. ABSOLUTAMENTE NUNCA use: carnes (bovina, suína, aves), peixes, frutos do mar, embutidos, ovos, leite, queijos, manteiga, iogurtes, mel, gelatinas, corante carmim. Substitua com: tofu, legumes, grãos, frutas, leites vegetais.' : '',
      restrictionLabels.includes('Ovolactovegetariano') ? '- OVOLACTOVEGETARIANO: PROIBIDO - NENHUMA CARNE. NUNCA use: carne bovina, vitela, carneiro, porco, frango, peru, pato, peixes, camarão, lagosta, caranguejo, lula, polvo, banha de porco. PERMITIDO: ovos, leite, queijos, iogurtes.' : '',
      restrictionLabels.includes('Lactovegetariano') ? '- LACTOVEGETARIANO: PROIBIDO - carnes E ovos. NUNCA use: qualquer carne + ovos (nem em bolos, massas, molhos). PERMITIDO: leite, queijos, iogurtes.' : '',
      restrictionLabels.includes('Ovovegetariano') ? '- OVOVEGETARIANO: PROIBIDO - carnes E laticínios. NUNCA use: qualquer carne + leite, queijos, requeijão, creme de leite, manteiga, iogurtes, soro de leite. PERMITIDO: ovos.' : '',
      restrictionLabels.includes('Pescetariano') ? '- PESCETARIANO: PROIBIDO - carnes bovinas, suínas, aves. NUNCA use: bife, frango, peru, porco, embutidos. PERMITIDO: peixes, ovos, laticínios.' : '',
      restrictionLabels.includes('Pescetariano (sem frutos do mar)') ? '- PESCETARIANO SEM FRUTOS DO MAR: PROIBIDO - carnes, aves, crustáceos, moluscos. NUNCA use: bife, frango, camarão, lagosta, ostras, lula. PERMITIDO APENAS: peixes (tilápia, sardinha, salmão).' : '',
      restrictionLabels.includes('Low Carb') ? '- LOW CARB: PROIBIDO - carboidratos altos. NUNCA use: açúcar, farinha de trigo, arroz branco, massas, pães, batata inglesa, mandioca, mel, doces. Use: folhas, carnes, queijos, ovos.' : '',
      restrictionLabels.includes('Dieta Líquida') ? '- DIETA LÍQUIDA: PROIBIDO - sólidos. NUNCA use: carnes sólidas, vegetais crus, grãos inteiros, pães. Use: sopas batidas, vitaminas, sucos, iogurtes líquidos.' : '',
      restrictionLabels.includes('Celíaco') ? '- CELÍACO: PROIBIDO - glúten. NUNCA use: trigo, centeio, cevada, malte, pão, massa, cerveja. Use: arroz, milho, mandioca, quinoa.' : '',
      restrictionLabels.includes('Intolerante à Lactose') ? '- INTOLERANTE À LACTOSE: PROIBIDO - lactose. NUNCA use: leite, queijos frescos, creme de leite, leite condensado. Use: leites vegetais, queijos maturados, iogurtes sem lactose.' : '',
      restrictionLabels.includes('Alérgico Severo (Oleaginosas)') ? '- ALÉRGICO OLEAGINOSAS: PROIBIDO - oleaginosas. NUNCA use: amendoim, castanhas, nozes, amêndoas, avelãs, pistache, macadâmias, óleos de nuts. ATENÇÃO: risco de anafilaxia.' : '',
      'VERIFICAÇÃO OBRIGATÓRIA: Antes de gerar cada receita, confirme que NENHUM ingrediente viola as restrições acima.',
      'Cada receita deve ter: nome brasileiro, ingredientes com quantidades, modo de preparo, e kcal.',
      'EXEMPLOS para Café da Manhã: "Tapioca com queijo", "Pão de queijo com café", "Vitamina de frutas", "Omelete de queijo"',
      'EXEMPLOS para Almoço: "Feijão com arroz e bife", "Frango grelhado com salada", "Sopa de legumes"',
      'EXEMPLOS para Lanche: "Iogurte com granola", "Frutas frescas", "Tapioca simples"',
      'EXEMPLOS para Jantar: "Sopa leve", "Omelete simples", "Salada completa"',
      'ESTRUTURA OBRIGATÓRIA: meal_plan deve conter exatamente ${days} objetos, cada um com "day": 1, 2, 3... até ${days}.',
      'Retorne UM ÚNICO JSON válido sem markdown, no formato:',
      `{"meal_plan":[${days > 1 ? '{"day":1,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 1","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 2 ? ',{"day":2,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 2","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 3 ? ',{"day":3,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 3","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 4 ? ',{"day":4,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 4","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 5 ? ',{"day":5,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 5","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 6 ? ',{"day":6,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 6","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}${days > 7 ? ',{"day":7,"meals":[{"name":"${mealTypeLabel}","time":"08:00","recipe_name":"Receita Dia 7","ingredients":["ing1","ing2"],"preparation":"Modo de preparo","items":["Prato pronto"],"kcal":250}]}' : ''}],"shopping_list":[{"item":"ingrediente","qty":"quantidade"}],"tips":["dica relevante"],"notes":"observações"}`,
      'A lista de compras deve conter itens para todas as receitas geradas.'
    ].filter(line => line.trim() !== '').join('\n');
  }
};
window.normalizeMealSlotName=function(name='', goal='diaadia'){
  const n=String(name||'').toLowerCase();
  if(n.includes('café')||n.includes('cafe')) return 'Café da Manhã';
  if(n.includes('almoço')||n.includes('almoco')) return 'Almoço';
  if(n.includes('lanche') && (n.includes('tarde')||n.includes('pm'))) return 'Lanche da Tarde';
  if(goal==='perda' && (n.includes('jantar')||n.includes('ceia')||n.includes('noite')||n.includes('lanche'))) return 'Lanche leve noturno';
  if(n.includes('jantar')||n.includes('ceia')||n.includes('noite')) return 'Jantar leve';
  return '';
};
window.validateMealProgression=function(meals, goal='diaadia'){
  if(!Array.isArray(meals) || meals.length < 3) return meals;
  
  const cafeManha = meals.find(m => m.name === 'Café da Manhã') || {kcal: 400};
  const almoco = meals.find(m => m.name === 'Almoço') || {kcal: 600};
  const lancheTarde = meals.find(m => m.name === 'Lanche da Tarde') || {kcal: 250};
  const jantar = meals.find(m => m.name === 'Jantar leve' || m.name === 'Lanche leve noturno') || {kcal: 200};
  
  // Regras de progressão: após o almoço, as refeições devem diminuir
  const maxLancheTarde = Math.min(almoco.kcal * 0.6, 400); // Máximo 60% do almoço
  const maxJantar = Math.min(lancheTarde.kcal * 0.8, 300); // Máximo 80% do lanche
  
  // Ajustar se necessário
  if(lancheTarde.kcal > maxLancheTarde) {
    lancheTarde.kcal = Math.round(maxLancheTarde);
    lancheTarde.items.push('(Porção ajustada para progressão leve)');
  }
  
  if(jantar.kcal > maxJantar) {
    jantar.kcal = Math.round(maxJantar);
    jantar.items.push('(Refeição leve noturna ajustada)');
  }
  
  return meals;
};
window.normalizeMealPlanStructure=function(mealPlan, goal='diaadia', mealTypeLabel=''){
  // Se for refeição específica (não plano completo), não forçar todos os slots
  const isPlanoCompleto = mealTypeLabel.includes('Completo') || mealTypeLabel.includes('completo');
  
  // Slots padrão apenas para plano completo
  const defaultSlots=goal==='perda' ? ['Café da Manhã','Almoço','Lanche da Tarde','Lanche leve noturno'] : ['Café da Manhã','Almoço','Lanche da Tarde','Jantar leve'];
  
  return (Array.isArray(mealPlan)?mealPlan:[]).map((d,idx)=>{
    const meals=Array.isArray(d?.meals)?d.meals:[];
    const mapped={};
    meals.forEach((m)=>{ const slot=window.normalizeMealSlotName(m?.name||m?.meal||'', goal); if(slot && !mapped[slot]) mapped[slot]=m; });
    
    let normalizedMeals;
    
    if (isPlanoCompleto) {
      // Plano completo: mostrar todos os slots padrão
      normalizedMeals=defaultSlots.map((slot)=>{
        const src=mapped[slot]||{};
        const recipeName=String(src.recipe_name||src.title||src.name||slot).trim();
        const ingredients=Array.isArray(src.ingredients)?src.ingredients.filter(Boolean):[];
        const items=Array.isArray(src.items)?src.items.filter(Boolean):[];
        const prep=String(src.preparation||src.preparo||'Preparo simples com ingredientes frescos e porção adequada ao objetivo.').trim();
        const safeItems=items.length?items:ingredients.length?ingredients:['Receita não detalhada pela IA.'];
        return {name:slot,time:String(src.time||'').trim(),recipe_name:recipeName,ingredients,preparation:prep,items:safeItems,kcal:Number(src.kcal)||0};
      });
      // Aplicar validação de progressão para refeições mais leves após o almoço
      normalizedMeals = window.validateMealProgression(normalizedMeals, goal);
    } else {
      // Refeição específica: mostrar apenas as refeições que foram realmente geradas
      normalizedMeals = meals.map((m) => {
        const slot = window.normalizeMealSlotName(m?.name || m?.meal || '', goal) || m?.name || 'Refeição';
        const src = m;
        const recipeName = String(src.recipe_name || src.title || src.name || slot).trim();
        const ingredients = Array.isArray(src.ingredients) ? src.ingredients.filter(Boolean) : [];
        const items = Array.isArray(src.items) ? src.items.filter(Boolean) : [];
        const prep = String(src.preparation || src.preparo || 'Preparo simples com ingredientes frescos.').trim();
        const safeItems = items.length ? items : ingredients.length ? ingredients : ['Receita não detalhada.'];
        return {name: slot, time: String(src.time || '').trim(), recipe_name: recipeName, ingredients, preparation: prep, items: safeItems, kcal: Number(src.kcal) || 0};
      }).filter(m => m.recipe_name && m.recipe_name !== 'Receita não detalhada.' && m.recipe_name !== m.name);
    }
    
    return {day:Number(d?.day)||idx+1, meals:normalizedMeals};
  });
};
window.extractJsonObject=function(text=''){
  const raw=String(text||'').trim();
  const fenced=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate=fenced?fenced[1].trim():raw;
  
  try{ 
    return JSON.parse(candidate); 
  }catch(_err){
    // Tentar encontrar e combinar múltiplos objetos JSON
    const jsonObjects = [];
    // Regex melhorado para capturar objetos JSON completos (compatível com JavaScript)
    const regex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\})*\})*\}))*\}/g;
    let match;
    
    // Tentativa 1: Usar regex melhorado
    while ((match = regex.exec(candidate)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        jsonObjects.push(parsed);
      } catch (e) {
        // Ignorar objetos inválidos
      }
    }
    
    // Tentativa 2: Se não funcionou, tentar abordagem manual
    if (jsonObjects.length === 0) {
      const lines = candidate.split('\n').filter(line => line.trim().startsWith('{'));
      for (const line of lines) {
        try {
          // Encontrar o objeto completo correspondente
          const startIndex = candidate.indexOf(line);
          if (startIndex !== -1) {
            let braceCount = 0;
            let endIndex = startIndex;
            
            for (let i = startIndex; i < candidate.length; i++) {
              if (candidate[i] === '{') braceCount++;
              if (candidate[i] === '}') braceCount--;
              if (braceCount === 0) {
                endIndex = i;
                break;
              }
            }
            
            if (braceCount === 0 && endIndex > startIndex) {
              const jsonStr = candidate.substring(startIndex, endIndex + 1);
              const parsed = JSON.parse(jsonStr);
              jsonObjects.push(parsed);
            }
          }
        } catch (e) {
          // Ignorar objetos inválidos
        }
      }
    }
    
    if (jsonObjects.length > 0) {
      // Combinar múltiplos objetos em um único
      const combined = {
        meal_plan: [],
        shopping_list: [],
        tips: [],
        notes: ""
      };
      
      jsonObjects.forEach(obj => {
        if (obj.meal_plan && Array.isArray(obj.meal_plan)) {
          combined.meal_plan = combined.meal_plan.concat(obj.meal_plan);
        }
        if (obj.shopping_list && Array.isArray(obj.shopping_list)) {
          combined.shopping_list = combined.shopping_list.concat(obj.shopping_list);
        }
        if (obj.tips && Array.isArray(obj.tips)) {
          combined.tips = combined.tips.concat(obj.tips);
        }
        if (obj.notes && typeof obj.notes === 'string') {
          combined.notes += (combined.notes ? ' ' : '') + obj.notes;
        }
      });
      
      return combined;
    }
    
    // Fallback para método original
    const start=candidate.indexOf('{'); const end=candidate.lastIndexOf('}');
    if(start===-1||end===-1||end<=start) return null;
    try{ return JSON.parse(candidate.slice(start,end+1)); }catch(_e){ return null; }
  }
};
window.renderCaloricNeed=function(){
  const resultEl=document.getElementById('calorie-need-result');
  if(!resultEl) return;
  
  const s=window.userDataCache?.saude||{};
  const weight=parseFloat(s.weight)||0;
  const height=parseFloat(s.height)||0;
  const imc=parseFloat(s.imc)||0;
  const age=window.getUserAge()||40;
  const gender=window.getUserGender()||'masculino';
  const biotype=s.biotype?.result||'mesomorfo';
  
  if(!weight || !height){
    resultEl.innerText='-- kcal/dia';
    return;
  }
  
  // Cálculo da taxa metabólica basal (TMB) usando fórmula de Harris-Benedict revisada
  let tmb;
  if(gender==='masculino'){
    // 66,5 + (13,75 × peso) + (5,003 × altura) - (6,75 × idade)
    tmb = 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
  } else {
    // 655,1 + (9,563 × peso) + (1,85 × altura) - (4,676 × idade)
    tmb = 655.1 + (9.563 * weight) + (1.85 * height) - (4.676 * age);
  }
  
  // Aplicar Fator de Atividade Física
  // Sedentário: 1,2 | Moderado: 1,55 | Ativo: 1,725 | Atleta: 1,9
  let activityFactor;
  const activityLevel = s.activityProfile?.level || 'sedentario';
  if(activityLevel === 'sedentario') activityFactor = 1.2;
  else if(activityLevel === 'moderado') activityFactor = 1.55;
  else if(activityLevel === 'ativo') activityFactor = 1.725;
  else if(activityLevel === 'atleta') activityFactor = 1.9;
  else activityFactor = 1.2; // padrão
  
  // Calcular gasto total com atividade
  const gastoComAtividade = tmb * activityFactor;
  
  // Aplicar ajuste baseado no biotipo
  // Ectomorfo: +10% | Mesomorfo: mantém | Endomorfo: -10%
  let calorieNeed;
  if(biotype === 'ectomorfo'){
    // Adicionar 10% devido à ineficiência metabólica e alta termogênese
    calorieNeed = gastoComAtividade * 1.10;
  } else if(biotype === 'mesomorfo'){
    // Manter inalterado por representar equilíbrio genético
    calorieNeed = gastoComAtividade;
  } else if(biotype === 'endomorfo'){
    // Subtrair 10% devido à elevada eficiência metabólica
    calorieNeed = gastoComAtividade * 0.90;
  } else {
    // Padrão caso biotipo não definido
    calorieNeed = gastoComAtividade;
  }
  
  // Resultado final: Necessidade Calórica Estimada em quilocalorias diárias
  calorieNeed = Math.round(calorieNeed);
  
  // Armazenar para uso em outras funções
  window.userDataCache.saude.calorieNeed = calorieNeed;
  
  // Exibir resultado
  resultEl.innerText=`${calorieNeed.toLocaleString('pt-BR')} kcal/dia`;
  
  // Adicionar descrição informativa
  const descEl=document.getElementById('calorie-need-description');
  if(descEl){
    const activityName=s.activityProfile?.name||'Não definido';
    const biotypeName=window.BIOTYPE_PROFILES[biotype]?.name||'Não definido';
    descEl.innerHTML=`Baseado em: ${age} anos, ${gender}, ${biotypeName}, ${activityName}`;
  }
};
window.getUserAge=function(){
  if(/^\d{8}$/.test((window.userDataCache?.pass||'').trim())){
    const d=parseInt(window.userDataCache.pass.slice(0,2),10);
    const m=parseInt(window.userDataCache.pass.slice(2,4),10)-1;
    const y=parseInt(window.userDataCache.pass.slice(4),10);
    const born=new Date(y,m,d);
    if(!Number.isNaN(born.getTime())){
      const now=new Date();
      let age=now.getFullYear()-born.getFullYear();
      const md=now.getMonth()-born.getMonth();
      if(md<0 || (md===0 && now.getDate()<born.getDate())) age--;
      return age;
    }
  }
  return 40; // padrão se não conseguir calcular
};
window.getUserGender=function(){
  // Tentar obter do cache ou de algum campo
  return window.userDataCache?.profile?.gender || 
         document.getElementById('user-gender')?.value || 
         'masculino'; // padrão
};
window.computeGoalCalorieTarget=function(goal){
  const strategy=window.balancedGoalCalorieStrategies[goal]||window.balancedGoalCalorieStrategies.diaadia; return {multiplier:strategy.mult,description:strategy.desc};
};
window.renderExerciseProgress=function(){
  window.ensureHealthStructures(); const ex=window.userDataCache.saude.exercise;

  const total=Math.round(ex.total||0), goal=ex.goal||20, pct=Math.min(100, Math.round((total/goal)*100));

  const goalEl=document.getElementById('exercise-goal-text'), leftEl=document.getElementById('ex-left-text'), bar=document.getElementById('ex-progress-bar');

  if(goalEl) goalEl.innerText=`Meta diária: ${goal} min`;

  if(leftEl) leftEl.innerText = total>=goal ? 'Meta diária concluída' : `Faltam ${goal-total} min`;

  if(bar) bar.style.width = `${pct}%`;

};
window.renderAnxietyDailyState=function(){
  window.ensureHealthStructures(); const a=window.userDataCache.saude.anxietyDaily; const bar=document.getElementById('ansio-bar'); if(!bar) return;

  const score=(a.day===window.getTodayStr() && a.score!=null)?a.score:0;

  bar.style.width=score+'%';

  if(score<=25) bar.className='bg-blue-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.8)]';

  else if(score<=50) bar.className='bg-green-500 h-full transition-all duration-700 shadow-[0_0_10px_rgba(34,197,94,0.8)]';

  else if(score<=75) bar.className='bg-yellow-400 h-full transition-all duration-700 shadow-[0_0_10px_rgba(250,204,21,0.8)]';

  else bar.className='bg-red-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(220,38,38,0.8)]';

};
window.addExercise=async function(){
  window.ensureHealthStructures(); const sport=document.getElementById('health-sport')?.value; const mins=parseInt(document.getElementById('health-sport-time')?.value,10);
  if(!sport||!mins||mins<=0) return alert('Informe exercício e duração válida.');
  const ex=window.userDataCache.saude.exercise; ex.logs.unshift({sport, mins, at:Date.now()}); ex.logs=ex.logs.slice(0,30); ex.total=Math.max(0,(ex.total||0)+mins);
  document.getElementById('health-sport-time').value='';
  window.renderExerciseProgress();
  if(db) await db.ref('users/'+window.clientId+'/saude/exercise').set(ex);
};
window.parseQtyForShopping=function(qty=''){
  const txt=String(qty||'').trim().toLowerCase(); const m=txt.match(/^(\d+(?:[\.,]\d+)?)\s*(.*)$/); if(!m) return null;
  const value=parseFloat(m[1].replace(',','.')); if(Number.isNaN(value)) return null; let unit=(m[2]||'').trim()||'unidades';
  if(unit.includes('kg')) return {value:value*1000,unit:'g'}; if(unit.includes('l') && !unit.includes('ml')) return {value:value*1000,unit:'ml'}; return {value,unit};
};
window.formatShoppingQty=function(sum){
  if(sum.unit.includes('g') && sum.value>=1000) return `${(sum.value/1000).toFixed(1).replace('.',',')} kg`;
  if(sum.unit.includes('ml') && sum.value>=1000) return `${(sum.value/1000).toFixed(1).replace('.',',')} L`;
  return `${Number.isInteger(sum.value)?Math.floor(sum.value):sum.value.toFixed(1).replace('.',',')} ${sum.unit}`;
};
window.generateBalancedMealPlan=async function(){
  const goal=document.getElementById('balancedMealGoal')?.value||'diaadia'; const mealType=document.getElementById('balancedMealType')?.value||'completo'; const days=Math.max(1,Math.min(7,parseInt(document.getElementById('balancedMealDays')?.value||'1',10))); const preferences=(document.getElementById('balancedMealPreferences')?.value||'').trim(); const out=document.getElementById('balancedMealResult'); const planGoalDisplay=window.balancedGoalDisplay[goal]||window.balancedGoalDisplay.diaadia; const restrictionData=window.getSelectedMealRestrictions();
  const mealTypeLabel=(document.getElementById('balancedMealType')?.selectedOptions?.[0]?.textContent||mealType).trim();
  const goalLabel=(document.getElementById('balancedMealGoal')?.selectedOptions?.[0]?.textContent||planGoalDisplay).trim();
  out.classList.remove('hidden'); 
  const loadingMessages = ['... Elaborando Refeições...', '... Preparando seus pratos...'];
  let messageIndex = 0;
  const loadingInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % loadingMessages.length;
    const loadingElement = out.querySelector('.loading-message');
    if (loadingElement) {
      loadingElement.textContent = loadingMessages[messageIndex];
    }
  }, 2000);
  out.innerHTML = `<div class="text-xs text-sky-400 font-bold mb-4"><i class="fas fa-spinner fa-spin mr-2"></i><span class="loading-message">${loadingMessages[0]}</span></div>`;
  
  setTimeout(() => {
    clearInterval(loadingInterval);
  }, 10000);
  const promptIA=window.buildBalancedPlanPrompt({goal,goalLabel,days,mealTypeLabel,restrictionLabels:restrictionData.labels,preferences});
  const aiResponse=await window.consultarIA(promptIA);
  const aiText=aiResponse?.text||'';
  const providerName=aiResponse?.provider||'Provedor IA';
  const aiData=window.extractJsonObject(aiText)||{};
  const shoppingList=Array.isArray(aiData.shopping_list)?aiData.shopping_list.map((item)=>({item:String(item?.item||'').trim(),qty:String(item?.qty||'quantidade a gosto').trim()})).filter((entry)=>entry.item):[];
  const rawMealPlan=Array.isArray(aiData.meal_plan)?aiData.meal_plan:[];
  const mealPlan=window.normalizeMealPlanStructure(rawMealPlan, goal, mealTypeLabel);
  const tips=Array.isArray(aiData.tips)?aiData.tips.filter(Boolean):[];
  const notes=String(aiData.notes||'').trim();
  window.currentBalancedPlan={goalDisplay:planGoalDisplay,days,shoppingList,aiText,mealPlan,tips,notes};
  if(out){
    const mealCards=mealPlan.length?mealPlan.map((d,idx)=>{
      const meals=Array.isArray(d?.meals)?d.meals:[];
      if(!meals.length) return `<div style="margin-bottom:10px;"><b>📅 Dia ${d?.day||idx+1}</b><br><span>Sem refeições detalhadas.</span></div>`;
      const items=meals.map((m)=>{
        const mealItems=Array.isArray(m?.items)?m.items.map((it)=>`<li>${it}</li>`).join(''):'<li>Sem itens.</li>';
        const ingredients=Array.isArray(m?.ingredients)&&m.ingredients.length?`<div style="margin-top:4px;font-size:10px;color:#cbd5e1;"><b>Ingredientes:</b> ${m.ingredients.join(', ')}</div>`:'';
        const prep=m?.preparation?`<div style="margin-top:4px;font-size:10px;color:#94a3b8;"><b>Preparo:</b> ${m.preparation}</div>`:'';
        return `<div style="margin-top:8px;padding:8px;border:1px solid #334155;border-radius:8px;"><b>${m?.time?`${m.time} • `:''}${m?.name||'Refeição'} — ${m?.recipe_name||'Receita'}</b>${m?.kcal?` <span style="color:#67e8f9;">(${m.kcal} kcal)</span>`:''}<ul style="margin-left:16px;">${mealItems}</ul>${ingredients}${prep}</div>`;
      }).join('');
      return `<div style="margin-bottom:10px;"><b>📅 Dia ${d?.day||idx+1}</b>${items}</div>`;
    }).join(''):'';
    const shoppingHtml=shoppingList.length ? shoppingList.map((item)=>`<li><b>${item.item}</b>: ${item.qty}</li>`).join('') : '<li>A IA não retornou itens de compra.</li>';
    const fallbackRaw=!mealPlan.length && aiText ? `<hr style="margin:10px 0;border-color:#334155;"/><div style="font-size:11px;color:#cbd5e1;white-space:pre-line;"><b>Saída textual da IA</b><br>${aiText}</div>`:'';
    const fixedRestrictions=restrictionData.labels.length?restrictionData.labels.join(', '):'Nenhuma';
    const tipsHtml=tips.length?`<hr style="margin:10px 0;border-color:#334155;"/><div><b>💡 Dicas da Cozinha</b><ul style="margin-top:6px;margin-left:16px;">${tips.map((tip)=>`<li>${tip}</li>`).join('')}</ul></div>`:'';
    const notesHtml=notes?`<div style="margin-top:8px;font-size:10px;color:#94a3b8;"><b>Observação:</b> ${notes}</div>`:'';
    out.innerHTML=`<div style="font-size:12px;"><b>🎯 Objetivo:</b> ${planGoalDisplay}<br><b>🧩 Restrições fixas:</b> ${fixedRestrictions}</div><hr style="margin:10px 0;border-color:#334155;"/><div><b>🍽️ Cardápio gerado por IA</b></div><div>${mealCards||'Sem cardápio estruturado retornado pela IA.'}</div><hr style="margin:10px 0;border-color:#334155;"/><div><b>🛒 Sua Lista de Compras</b><ul style="margin-top:6px;margin-left:16px;">${shoppingHtml}</ul>${notesHtml}</div>${tipsHtml}${fallbackRaw}`;
  }
  const dBtn=document.getElementById('downloadShoppingBtn'); 
  const sBtn=document.getElementById('shareShoppingBtn');
  const buttonsContainer=document.getElementById('shoppingButtons');
  if(buttonsContainer) buttonsContainer.classList.toggle('hidden', !shoppingList.length);
  if(dBtn) dBtn.classList.toggle('hidden', !shoppingList.length);
  if(sBtn) sBtn.classList.toggle('hidden', !shoppingList.length);
};
window.downloadShoppingListPng=function(){
  if(!window.currentBalancedPlan?.shoppingList?.length) return alert('Gere uma lista antes de baixar.');
  const items=window.currentBalancedPlan.shoppingList; const canvas=document.createElement('canvas'); const ctx=canvas.getContext('2d'); canvas.width=720; canvas.height=Math.max(540,220+(items.length*58));
  ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#0284c7'; ctx.fillRect(0,0,canvas.width,140);
  ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.font='bold 34px Arial'; ctx.fillText('🛒 LISTA DE COMPRAS',canvas.width/2,74); ctx.font='18px Arial'; ctx.fillText(`${window.currentBalancedPlan.days} dia(s) • ${window.currentBalancedPlan.goalDisplay}`,canvas.width/2,108);
  ctx.textAlign='left'; let y=182;
  items.forEach((entry,idx)=>{
    if(idx%2===0){ ctx.fillStyle='#1e293b'; ctx.fillRect(20,y-24,canvas.width-40,50); }
    ctx.fillStyle='#38bdf8'; ctx.font='bold 24px Arial'; ctx.fillText(entry.item,42,y); ctx.fillStyle='#94a3b8'; ctx.font='20px Arial'; ctx.fillText(entry.qty,42,y+24); y+=58;
  });
  const link=document.createElement('a'); link.download=`lista-compras-${Date.now()}.png`; link.href=canvas.toDataURL('image/png'); link.click();
};
window.shareShoppingList=function(){
  if(!window.currentBalancedPlan?.shoppingList?.length) return alert('Gere uma lista antes de compartilhar.');
  
  const items=window.currentBalancedPlan.shoppingList;
  const text=`🛒 Lista de Compras\n${window.currentBalancedPlan.days} dia(s) • ${window.currentBalancedPlan.goalDisplay}\n\n${items.map(item=>`• ${item.item}: ${item.qty}`).join('\n')}`;
  
  if(navigator.share) {
    navigator.share({
      title: 'Lista de Compras - Completamente',
      text: text
    }).catch(err => console.log('Erro ao compartilhar:', err));
  } else {
    // Fallback: copiar para área de transferência
    navigator.clipboard.writeText(text).then(() => {
      alert('Lista copiada para a área de transferência!');
    }).catch(() => {
      // Fallback final: mostrar texto para copiar manualmente
      const textarea=document.createElement('textarea');
      textarea.value=text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Lista copiada para a área de transferência!');
    });
  }
};
window.renderWaterHistory=function(){
  const el=document.getElementById('water-history'); if(!el) return; window.ensureHealthStructures(); const h=window.userDataCache.saude.water.history;
  el.innerHTML=h.length?h.slice().reverse().map((i,rev)=>`<div class="text-[10px] bg-slate-900 border border-slate-700 rounded-lg p-2 flex justify-between"><span>${new Date(i.at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - ${i.label} ${i.amount}ml (${i.valid>0?'+':''}${i.valid})</span><button class="text-red-400" onclick="window.removeWaterHistoryItem(${h.length-1-rev})">x</button></div>`).join(''):'<p class="text-[10px] text-slate-500">Sem registros de água hoje.</p>';
};
window.renderHealthGoalsLog=function(){
  const el=document.getElementById('health-goals-log'); if(!el) return; window.ensureHealthStructures(); const e=window.userDataCache.saude.healthGoalLog.entries;
  el.innerHTML=e.length?e.map(i=>`<div class="bg-slate-900 border border-slate-700 rounded p-2">✅ ${i.text}</div>`).join(''):'<p class="text-slate-500">Sem metas de saúde cumpridas no mês.</p>';
};
window.removeWaterHistoryItem=async function(idx){
  window.ensureHealthStructures(); const w=window.userDataCache.saude.water; const item=w.history[idx]; if(!item) return;
  w.total=Math.max(0,(w.total||0)-item.valid); w.history.splice(idx,1); w.lastEntry=w.history[w.history.length-1]||null;
  window.renderHydration(); if(db) await db.ref('users/'+window.clientId+'/saude/water').set(w);
};
window.toggleWaterReminder=function(){
  const b=document.getElementById('water-reminder-btn');
  if(window.waterReminderInterval || window.waterReminderTimeout){
    clearInterval(window.waterReminderInterval); clearTimeout(window.waterReminderTimeout); window.waterReminderInterval=null; window.waterReminderTimeout=null; if(b)b.innerHTML='<i class="fas fa-bell"></i> Lembrete'; return;
  }
  const mins=parseInt(document.getElementById('water-reminder-min')?.value); if(!mins||mins<10) return alert('Informe intervalo válido (mínimo 10 min).');
  if(Notification.permission==='default') Notification.requestPermission();
  const runTick=()=>{
    const total=Math.round(window.userDataCache?.saude?.water?.total||0); const goal=window.getHydrationGoal();
    if(total>=goal){
      clearInterval(window.waterReminderInterval); clearTimeout(window.waterReminderTimeout); window.waterReminderInterval=null; window.waterReminderTimeout=null; if(b)b.innerHTML='<i class="fas fa-bell"></i> Lembrete';
      if(Notification.permission==='granted') new Notification('Meta diária atingida ✅',{body:'Parabéns! O lembrete foi pausado automaticamente.'}); return;
    }
    if(Notification.permission==='granted') new Notification('Lembrete de hidratação 💧',{body:`Hora de beber líquidos. Intervalo ativo: ${mins} min.`});
  };
  alert(`Intervalo programado em ${mins} minutos. A contagem começa agora e seguirá até sua meta diária.`);
  window.waterReminderTimeout=setTimeout(()=>{ runTick(); window.waterReminderInterval=setInterval(runTick, mins*60000); }, mins*60000); if(b)b.innerHTML='<i class="fas fa-bell-slash"></i> Pausar';
};
window.initSaudeTab=async function(){
  window.showSaudeSubTab('sd-perfil'); window.ensureHealthStructures(); await window.resetWaterIfNewDay();
  const s=window.userDataCache.saude;
  if(s.weight) document.getElementById('health-weight').value=s.weight;
  if(s.height) document.getElementById('health-height').value=s.height;
  if(s.imc) document.getElementById('imc-result').innerText=`IMC: ${s.imc} (${s.imcCategory})`;
  window.renderBiotypeOptions();
  if(s.biotype?.locked){
    document.querySelectorAll('.biotype-opt').forEach((el)=>{el.disabled=true;}); const p=window.BIOTYPE_PROFILES[s.biotype.result]; const out=document.getElementById('biotype-result');
    if(p&&out){ out.classList.remove('hidden'); out.innerHTML=`<p class="font-black text-rose-300">Seu biotipo predominante: ${p.emoji} ${p.name}</p><p class="mt-1 text-slate-200">${p.summary}</p>`; }
  }
  const activitySel=document.getElementById('activity-level-select'); if(activitySel && !activitySel.dataset.bound){ activitySel.addEventListener('change', window.renderActivityProfileState); activitySel.dataset.bound='1'; }
  window.renderActivityProfileState(); window.renderBalancedMealRestrictions(); window.renderCaloricNeed(); window.renderExerciseProgress(); window.renderAnxietyDailyState(); window.renderHydration(); window.renderHealthGoalsLog(); window.renderNutriHistory(); window.initHomeFitTool?.();
};
window.doNutriAnalysis=async function(){
  const input=document.getElementById('mealInput'); const qty=parseInt(document.getElementById('mealQty')?.value||'100', 10); const unit=document.getElementById('mealUnit')?.value||'G'; const mealType=document.getElementById('mealType')?.value||'Refeição'; const text=(input?.value||'').trim();
  if(!text) return alert('Por favor, descreva o que consumiu.');
  const btn=document.querySelector('button[onclick="window.doNutriAnalysis()"]'); const originalBtnText=btn?btn.innerHTML:'';
  if(btn){btn.innerHTML='<i class="fas fa-spinner fa-spin mr-2"></i>Analisando...'; btn.disabled=true;}
  const systemPrompt=`Atue como nutricionista digital. Retorne APENAS JSON {"total_cal":num,"p":num,"c":num,"f":num}. Considere a porção: ${qty}${unit}.`;
  try{
    const response=await fetch(window.AI_PROXY_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:[{role:'system',content:systemPrompt},{role:'user',content:`Analise: ${text}`}], temperature:0.3})});
    const data=await response.json(); const nutri=JSON.parse((data?.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim());
    window.ensureHealthStructures(); window.userDataCache.saude.nutriHistory.unshift({meal:text, mealType, qty, unit, cal:Math.round(Number(nutri.total_cal||0)), p:Math.round(Number(nutri.p||0)), c:Math.round(Number(nutri.c||0)), f:Math.round(Number(nutri.f||0)), date:new Date().toLocaleDateString('pt-BR'), day:window.getTodayStr()});
    if(db) await db.ref('users/'+window.clientId+'/saude/nutriHistory').set(window.userDataCache.saude.nutriHistory);
    window.renderNutriHistory(); input.value='';
  }catch(e){console.error(e); alert('Erro na análise da IA.');}finally{if(btn){btn.innerHTML=originalBtnText; btn.disabled=false;}}
};
window.getExercisePrescriptionProfile=function(){
  const s=window.userDataCache?.saude||{}; const w=parseFloat(s.weight)||0; const imc=parseFloat(s.imc)||0; let age=40;
  if(/^\d{8}$/.test((window.userDataCache?.pass||'').trim())){ const d=parseInt(s.pass?.slice(0,2),10),m=parseInt(s.pass?.slice(2,4),10)-1,y=parseInt(s.pass?.slice(4),10); const born=new Date(y,m,d); if(!Number.isNaN(born.getTime())){ const now=new Date(); age=now.getFullYear()-born.getFullYear(); const md=now.getMonth()-born.getMonth(); if(md<0 || (md===0 && now.getDate()<born.getDate())) age--; } }
  const intensityFactor=age<30?1.2:age<=55?1:0.8; const protocol=imc>30?'baixo impacto':'padrao'; const goalType=imc>=27?'tempo':imc>=22?'repeticoes':'mobilidade'; const calorieNeed=parseFloat(s.calorieNeed)||Math.round((w*24||1600)*(imc<18.5?1.15:imc<25?1:imc<30?0.9:0.82));
  const adjusted=Math.round(Math.max(20, Math.round(calorieNeed/80))*intensityFactor);
  return {age,imc,intensityFactor,protocol,goalType,goal:Math.max(20, Math.min(120, protocol==='baixo impacto'?Math.round(adjusted*0.9):adjusted)),calorieNeed};
};
window.addExercise=async function(){
  window.ensureHealthStructures(); const sport=document.getElementById('health-sport')?.value; const mins=parseInt(document.getElementById('health-sport-time')?.value,10);
  if(!sport||!mins||mins<=0) return alert('Informe exercício e duração válida.');
  const ex=window.userDataCache.saude.exercise; ex.logs.unshift({sport, mins, at:Date.now()}); ex.logs=ex.logs.slice(0,30); ex.total=Math.max(0,(ex.total||0)+mins);
  document.getElementById('health-sport-time').value=''; window.renderExerciseProgress();
  if(db) await db.ref('users/'+window.clientId+'/saude/exercise').set(ex);
};
window.saveGoals=async function(){
  const week=(document.getElementById('rt-goal-week')?.value||'').trim(); const month=(document.getElementById('rt-goal-month')?.value||'').trim();
  if(!window.userDataCache) return; window.userDataCache.goals={week,month}; if(db) await db.ref('users/'+window.clientId+'/goals').set(window.userDataCache.goals);
};
window.renderTasks=function(){
  const todo=document.getElementById('tasks-todo'), done=document.getElementById('tasks-done'); if(!todo||!done) return;
  todo.innerHTML='<div class="text-xs text-slate-500">Cadastre tarefas para visualizar sua rotina diária.</div>'; done.innerHTML=''; document.getElementById('area-todo').classList.remove('hidden'); document.getElementById('area-done').classList.add('hidden');
};
window.renderFinances=function(){
  const container=document.getElementById('finances-container'); if(!container) return;
  if(!window.userDataCache.financas) window.userDataCache.financas={transactions:[]};
  const transactions=window.userDataCache.financas.transactions||[];
  container.innerHTML=transactions.length?transactions.map(t=>`<div class="p-2 border border-slate-700 rounded mb-2"><div class="flex justify-between"><span class="text-white">${t.description}</span><span class="text-${t.amount>=0?'emerald':'rose'}-400">R$ ${t.amount.toFixed(2)}</span></div></div>`).join(''):'<p class="text-slate-500">Nenhuma transação registrada.</p>';
};
window.renderNutriHistory=function(){
  const container=document.getElementById('nutriHistory'); if(!container) return;
  window.ensureHealthStructures(); const history=window.userDataCache.saude.nutriHistory||[];
  const today=window.getTodayStr(); const todayItems=history.filter((h)=>h.day===today);
  const totalCal=todayItems.reduce((a,b)=>a+(Number(b.cal)||0),0);
  const totalP=todayItems.reduce((a,b)=>a+(Number(b.p)||0),0);
  const totalC=todayItems.reduce((a,b)=>a+(Number(b.c)||0),0);
  const totalF=todayItems.reduce((a,b)=>a+(Number(b.f)||0),0);
  const pane=document.getElementById('nutriResultPane'); if(pane && totalCal>0) pane.classList.remove('hidden');
  const elCal=document.getElementById('nutriTotalCal'); if(elCal) elCal.innerText=Math.round(totalCal);
  const elP=document.getElementById('nutriProt'); if(elP) elP.innerText=Math.round(totalP)+'g';
  const elC=document.getElementById('nutriCarb'); if(elC) elC.innerText=Math.round(totalC)+'g';
  const elF=document.getElementById('nutriGord'); if(elF) elF.innerText=Math.round(totalF)+'g';
  container.innerHTML=history.slice(0,10).map((h,idx)=>`<div class="nutri-hist-item p-3 rounded-xl flex justify-between items-center animate-fade-in gap-2"><div class="flex flex-col min-w-0"><span class="text-[10px] text-white font-bold truncate uppercase">${h.meal}</span><span class="text-[8px] text-slate-500 font-bold">${h.qty||''}${h.unit||''} • ${h.date}</span></div><div class="flex items-center gap-2"><span class="text-xs font-black text-emerald-400 whitespace-nowrap">${h.cal} kcal</span><button onclick="window.deleteNutriEntry(${idx})" class="text-[10px] px-2 py-1 rounded bg-rose-900/40 border border-rose-500/40 text-rose-300">Excluir</button></div></div>`).join('')||'<p class="text-[9px] text-slate-600 text-center py-4">Nenhuma análise registrada.</p>';
};
window.deleteNutriEntry=async function(idx){
  if(!window.userDataCache?.saude?.nutriHistory) return;
  window.userDataCache.saude.nutriHistory.splice(idx,1);
  if(db) await db.ref('users/'+window.clientId+'/saude/nutriHistory').set(window.userDataCache.saude.nutriHistory);
  const today=window.getTodayStr();
  const todayItems=(window.userDataCache.saude.nutriHistory||[]).filter((h)=>h.day===today);
  const totalCal=todayItems.reduce((a,b)=>a+(Number(b.cal)||0),0);
  const totalP=todayItems.reduce((a,b)=>a+(Number(b.p)||0),0);
  const totalC=todayItems.reduce((a,b)=>a+(Number(b.c)||0),0);
  const totalF=todayItems.reduce((a,b)=>a+(Number(b.f)||0),0);
  document.getElementById('nutriTotalCal').innerText=Math.round(totalCal);
  document.getElementById('nutriProt').innerText=Math.round(totalP)+'g';
  document.getElementById('nutriCarb').innerText=Math.round(totalC)+'g';
  document.getElementById('nutriGord').innerText=Math.round(totalF)+'g';
  window.renderNutriHistory();
};
window.openTaskModal=function(){document.getElementById('task-modal')?.classList.remove('hidden');}; window.closeTaskModal=function(){document.getElementById('task-modal')?.classList.add('hidden');}; window.saveNewTask=function(){alert('Em breve.'); window.closeTaskModal();};
const WORKOUT_DB={cardio:[{n:'Polichinelos',d:'Ritmo constante.',type:'time',val:45},{n:'Corrida',d:'Eleve joelhos.',type:'time',val:60},{n:'Burpees',d:'Completo.',type:'unit',val:12}],forca:[{n:'Agachamento',d:'Coluna neutra.',type:'unit',val:20},{n:'Flexão',d:'A 45 graus.',type:'unit',val:15},{n:'Prancha',d:'Core.',type:'time',val:40}]};
window.workoutState={active:false,mode:null,currentIdx:0,list:[],totalMins:0,prepIv:null,exIv:null,exStartAt:null,elapsedSec:0};
window.startWorkoutSession=function(mode){
  const duration=parseInt(document.getElementById('ex-total-duration')?.value||'20',10); const list=(WORKOUT_DB[mode]||[]).map(i=>({...i})); if(!list.length) return;
  window.workoutState.mode=mode; window.workoutState.list=list; window.workoutState.currentIdx=0; window.workoutState.totalMins=duration; window.workoutState.active=true;
  document.getElementById('ex-setup-panel')?.classList.add('hidden'); document.getElementById('ex-finish-area')?.classList.add('hidden'); document.getElementById('ex-active-session')?.classList.remove('hidden'); window.runPreparation();
};
window.runPreparation=function(){
  clearInterval(window.workoutState.prepIv); clearInterval(window.workoutState.exIv); let timeLeft=20;
  const display=document.getElementById('ex-prep-timer'); const overlay=document.getElementById('ex-prep-overlay'); const card=document.getElementById('ex-current-card'); const nextEx=window.workoutState.list[window.workoutState.currentIdx];
  if(display) display.innerText=timeLeft; if(nextEx) document.getElementById('ex-next-name').innerText=`Próximo: ${nextEx.n}`;
  overlay?.classList.remove('hidden'); card?.classList.add('hidden');
  window.workoutState.prepIv=setInterval(()=>{ timeLeft--; if(display) display.innerText=timeLeft; if(timeLeft<=0){ clearInterval(window.workoutState.prepIv); overlay?.classList.add('hidden'); window.startCurrentExercise(); } },1000);
};
window.startCurrentExercise=function(){
  clearInterval(window.workoutState.exIv); const ex=window.workoutState.list[window.workoutState.currentIdx]; if(!ex) return window.finishWorkout();
  const card=document.getElementById('ex-current-card'); const title=document.getElementById('ex-title'); const desc=document.getElementById('ex-desc'); const badge=document.getElementById('ex-type-badge'); const counter=document.getElementById('ex-main-counter');
  card?.classList.remove('hidden'); if(title) title.innerText=ex.n; if(desc) desc.innerText=ex.d;
  if(ex.type==='time'){
    let sec=ex.val; if(badge) badge.innerText=`Tempo: ${sec}s`; if(counter) counter.innerText=sec;
    window.workoutState.exIv=setInterval(()=>{ sec--; if(counter) counter.innerText=Math.max(0,sec); if(sec<=0){ clearInterval(window.workoutState.exIv); window.playBipe(); window.nextWorkoutStep(); } },1000);
  } else { if(badge) badge.innerText=`Fazer: ${ex.val} un`; if(counter) counter.innerText=ex.val; }
};
window.nextWorkoutStep=function(){ clearInterval(window.workoutState.exIv); window.workoutState.currentIdx++; if(window.workoutState.currentIdx<window.workoutState.list.length) window.runPreparation(); else window.finishWorkout(); };
window.finishWorkout=async function(){
  clearInterval(window.workoutState.prepIv); clearInterval(window.workoutState.exIv); window.workoutState.active=false; document.getElementById('ex-active-session')?.classList.add('hidden'); document.getElementById('ex-finish-area')?.classList.remove('hidden'); document.getElementById('cert-summary').innerText=`Você completou ${window.workoutState.totalMins} minutos.`;
  window.ensureHealthStructures(); const ex=window.userDataCache.saude.exercise; ex.total=Math.max(0,(ex.total||0)+window.workoutState.totalMins); ex.logs.unshift({sport:`Sessão guiada (${window.workoutState.mode||'treino'})`, mins:window.workoutState.totalMins, at:Date.now()}); ex.logs=ex.logs.slice(0,30); window.renderExerciseProgress();
  if(db) await db.ref('users/'+window.clientId+'/saude/exercise').set(ex);
};
window.resetWorkoutSession=function(showSetup=true){
  clearInterval(window.workoutState?.prepIv); clearInterval(window.workoutState?.exIv); window.workoutState={ active:false, mode:null, currentIdx:0, list:[], totalMins:0, prepIv:null, exIv:null, exStartAt:null, elapsedSec:0 };
  if(showSetup) document.getElementById('ex-setup-panel')?.classList.remove('hidden'); document.getElementById('ex-active-session')?.classList.add('hidden'); document.getElementById('ex-finish-area')?.classList.add('hidden');
};
window.playBipe=function(){ try{ const ctx=new(window.AudioContext||window.webkitAudioContext)(); const osc=ctx.createOscillator(); osc.connect(ctx.destination); osc.frequency.value=600; osc.start(); setTimeout(()=>osc.stop(),500);}catch(e){} };
window.downloadWorkoutCert=function(){ const target=document.getElementById('ex-certificate'); if(!target) return; html2canvas(target).then(canvas=>{ const link=document.createElement('a'); link.download=`Treino-WR-${window.clientName||'Usuario'}.png`; link.href=canvas.toDataURL('image/png'); link.click(); }); };

window.initHomeFitTool=function(){
  const root=document.getElementById('sd-exercicio'); if(!root||root.dataset.hfInit==='1') return; root.dataset.hfInit='1';
  const $=id=>document.getElementById(id); const pad=n=>String(n).padStart(2,'0'); const uid=()=>Math.random().toString(16).slice(2,8);
  const BODIES={peito:'Peito',costas:'Costas',ombros:'Ombros',bracos:'Braços',abdomen:'Abdômen/Core',gluteos:'Glúteos',pernas:'Pernas','corpo-todo':'Corpo todo',mobilidade:'Mobilidade/Postura'}; const INT={iniciante:'Iniciante',intermediario:'Intermediário',avancado:'Avançado'};
  window.homeFitState={intensity:'iniciante',mode:'texto',targetType:'reps',perExerciseSec:60,sessionMinutes:20,current:null,history:[],completedCount:0,totalActiveSeconds:0,timerPhase:'idle',remainingPrep:20,remainingWork:60,timerId:null,voicesSupported:false,voiceObj:null,tutorialDone:false};
  const st=window.homeFitState;
  const setSeg=(id,val)=>{ document.querySelectorAll('#'+id+' .hf-seg').forEach(b=>{ const on=b.dataset.val===val; b.classList.toggle('active',on); b.classList.toggle('bg-emerald-900/30',on); b.classList.toggle('text-emerald-300',on); b.classList.toggle('border-emerald-500/40',on); b.classList.toggle('bg-slate-800',!on); b.classList.toggle('text-slate-300',!on); b.classList.add('rounded','border','border-slate-700','py-1','font-black'); }); };
  const refreshInfo=()=>{ const minDone=Math.round(st.totalActiveSeconds/60); $('hf-session-info').innerText=`Sessão alvo: ${st.sessionMinutes} min • ${st.completedCount} exercícios concluídos • ~${minDone} min ativos`; };
  const updateDisplay=()=>{ const sec=Math.max(0, st.timerPhase==='prep'?st.remainingPrep:st.remainingWork); $('hf-timer-display').innerText='00:'+pad(sec); };
  const setPhase=(txt)=>$('hf-phase-badge').innerText=txt;
  const speak=(t)=>{ if(!st.voicesSupported || !$('hf-voice-check').checked || st.mode!=='voz') return; try{ const u=new SpeechSynthesisUtterance(t); u.lang='pt-BR'; if(st.voiceObj) u.voice=st.voiceObj; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);}catch(e){} };
  const speakSequence=async(lines=[])=>{ if(!st.voicesSupported || !$('hf-voice-check').checked || st.mode!=='voz' || !('speechSynthesis' in window)) return; for(const line of lines){ await new Promise((resolve)=>{ try{ const u=new SpeechSynthesisUtterance(String(line||'')); u.lang='pt-BR'; if(st.voiceObj) u.voice=st.voiceObj; u.onend=()=>resolve(); u.onerror=()=>resolve(); window.speechSynthesis.speak(u); }catch(e){ resolve(); } }); } };
  const beep=(long=false)=>{ try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; const c=new C(); const o=c.createOscillator(); const g=c.createGain(); o.connect(g); g.connect(c.destination); o.frequency.value=long?680:880; const d=long?0.45:0.18; const n=c.currentTime; g.gain.setValueAtTime(0.001,n); g.gain.exponentialRampToValueAtTime(0.35,n+0.01); g.gain.exponentialRampToValueAtTime(0.001,n+d); o.start(n); o.stop(n+d+0.05); setTimeout(()=>c.close(),700);}catch(e){} };
  const autoTime=()=>{ if(st.targetType==='reps') return; const b=st.intensity==='iniciante'?60:st.intensity==='intermediario'?75:90; $('hf-duration').value=b; st.perExerciseSec=b; st.remainingWork=b; $('hf-duration-label').innerText=b; updateDisplay(); };
  const toEmbed=(url='')=>{ const safe=String(url||'').trim(); const m=safe.match(/(?:v=|shorts\/|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/); const id=m?m[1]:''; return id?`https://www.youtube.com/embed/${id}?autoplay=0&controls=1&rel=0`:''; };
  const VIDEO_DB={ peito:{ iniciante:[ {version:'V1',name:'Wall Push-ups',video:'https://www.youtube.com/shorts/q_JCNgDZqIo',steps:['Fique de pé de frente para uma parede, mãos na altura dos ombros.','Mantenha o corpo reto como prancha, com núcleo ativo.','Dobre os cotovelos e aproxime o peito da parede.','Mantenha os cotovelos próximos ao corpo.','Empurre a parede e retorne com controle.']}], intermediario:[ {version:'V1',name:'Standard Push-ups',video:'https://www.youtube.com/watch?v=AAcODQoJi2A',steps:['Inicie em prancha alta com mãos um pouco mais largas que os ombros.','Contraia core e glúteos para manter alinhamento.','Desça o peito até quase tocar o chão.','Mantenha os cotovelos a 45 graus do tronco.','Empurre o chão e retorne à prancha.']} ]}, costas:{ iniciante:[ {version:'V1',name:'Superman',video:'https://www.youtube.com/watch?v=z6PJMT2y8GQ',steps:['Deite de bruços com braços estendidos.','Contraia núcleo e glúteos.','Levante braços e pernas simultaneamente.','Segure por alguns segundos.','Desça lentamente.']} ]} };
  const getCatalogExercise=(bodyKey,intensity)=>{ const pool=VIDEO_DB?.[bodyKey]?.[intensity]||VIDEO_DB?.['peito']?.iniciante||[]; return pool[Math.floor(Math.random()*pool.length)]||null; };
  const generateLocal=(bodyKey,intensity,targetType,perSec,reps)=>{ const base=getCatalogExercise(bodyKey,intensity)||{name:'Exercício funcional',steps:['Posicione-se com segurança.','Ative o abdômen.','Execute com controle.','Respire continuamente.'],video:''}; const musclesMap={peito:['peitorais'],costas:['dorsais']}; return {id:uid(),bodyKey,intensity,targetType,perExerciseSec:Math.max(60,perSec),targetReps:targetType==='reps'?reps:null,name:base.name,version:base.version||'V1',videoUrl:base.video,videoEmbed:toEmbed(base.video),emoji:'🏋️',muscles:musclesMap[bodyKey]||['grupo alvo'],focusDesc:'Execução guiada para casa com segurança articular.',intensityDesc:intensity==='iniciante'?'Ritmo confortável e técnico.':'Alta exigência.',targetDesc:targetType==='reps'?`${reps} repetições.`:`${Math.max(60,perSec)}s contínuos.`,steps:base.steps,preExecutionGuide:['Base estável: pés e mãos firmes no apoio.','Postura: mantenha coluna neutra.'],breathing:'Solte o ar no esforço e inspire no retorno.',posture:'Se sentir dor, reduza amplitude.',progression:'Aumente gradualmente volume.',restNote:'Repouso de 1 minuto.',createdAt:new Date(),voiceScriptPrep:`Prepare-se para ${base.name}. Vinte segundos para posicionar.`,voiceScriptStart:'Início da execução.'}; };
  const askExerciseAI=async(bodyKey,intensity,targetType,perSec,reps)=>{
    const base=getCatalogExercise(bodyKey,intensity); if(!base) return generateLocal(bodyKey,intensity,targetType,perSec,reps);
    const proxy=window.CHAT_AI_PROXY_URL; if(!proxy) return generateLocal(bodyKey,intensity,targetType,perSec,reps);
    const userPrompt=`Reescreva explicações para o exercício ${base.name}. JSON válido com: focusDesc, intensityDesc, targetDesc, preExecutionGuide(array 5), steps(array 5), breathing, posture, progression, restNote.`;
    const messages=[ {role:'system',content:'Especialista em prescrição caseira.'}, {role:'user',content:userPrompt} ];
    const res=await fetch(proxy,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages,temperature:0.4,max_tokens:500})});
    const data=await res.json(); const raw=(data?.choices?.[0]?.message?.content||'{}').replace(/```json|```/g,'').trim();
    let parsed=JSON.parse(raw); const ex=generateLocal(bodyKey,intensity,targetType,perSec,reps);
    ex.name=base.name; ex.videoEmbed=toEmbed(base.video); ex.focusDesc=parsed.focusDesc||ex.focusDesc; ex.steps=parsed.steps||base.steps; return ex;
  };
  const renderEx=(ex)=>{
    if(!ex){ $('hf-exercise-container').innerHTML='Configure e clique em Gerar exercício.'; return; }
    st.tutorialDone=false; $('hf-btn-start').disabled=true; $('hf-badge').innerText=`${BODIES[ex.bodyKey]} · ${INT[ex.intensity]} · ${ex.targetType==='reps'?ex.targetReps+' reps':ex.perExerciseSec+'s'}`;
    $('hf-exercise-container').innerHTML=`<div class="space-y-2"><div class="text-sm font-black text-white">${ex.name}</div><div class="text-[11px] text-slate-400">Músculos: ${ex.muscles.join(', ')}</div><div class="text-[11px] text-slate-300 border border-slate-700 p-2"><ol class="list-decimal pl-4 mt-1">${ex.steps.map(i=>`<li>${i}</li>`).join('')}</ol></div>${ex.videoEmbed?`<iframe class="w-full aspect-video" src="${ex.videoEmbed}"></iframe><button id="hf-finish-tutorial" class="w-full bg-emerald-600 text-white text-[10px] py-2 mt-2">Fim de tutorial</button>`:''}`;
    const fin=$('hf-finish-tutorial'); if(fin) fin.onclick=()=>{ st.tutorialDone=true; $('hf-btn-start').disabled=false; $('hf-timer-status').innerText='Pronto para iniciar'; };
  };
  const renderHistory=()=>{ const h=$('hf-history'); if(!st.history.length){ h.innerText='Nenhum exercício concluído.'; return; } h.innerHTML=st.history.slice().reverse().map((x,i)=>`<div class="p-2 border border-slate-700 bg-slate-900/70" data-id="${x.id}"><div class="text-white text-xs">${x.name}</div></div>`).join(''); };
  const updateCounter=()=>$('hf-counter-label').innerText=`${st.history.length} exercícios na sessão`;
  const stopTimer=()=>{ if(st.timerId){ clearInterval(st.timerId); st.timerId=null; } };
  const resetTimer=()=>{ stopTimer(); st.timerPhase='idle'; st.remainingPrep=20; st.remainingWork=st.perExerciseSec; $('hf-timer-status').innerText='Pronto'; setPhase('Fase: parada'); updateDisplay(); };
  const markComplete=async()=>{ if(!st.current) return; const clone=JSON.parse(JSON.stringify(st.current)); clone.id=uid(); clone.createdAt=new Date(); st.history.push(clone); st.completedCount++; renderHistory(); updateCounter(); refreshInfo(); window.ensureHealthStructures(); window.userDataCache.saude.exercise.total++; window.renderExerciseProgress(); if(db) await db.ref('users/'+window.clientId+'/saude/exercise').set(window.userDataCache.saude.exercise); alert("Parabéns!"); };
  const beginPrepCountdown=()=>{ stopTimer(); st.remainingPrep=20; st.remainingWork=st.perExerciseSec; st.timerPhase='prep'; $('hf-timer-status').innerText='Preparação (20s)'; setPhase('Fase: preparação'); updateDisplay(); beep(); st.timerId=setInterval(async()=>{ if(st.timerPhase==='prep'){ st.remainingPrep--; updateDisplay(); if(st.remainingPrep<=0){ beep(true); st.timerPhase='work'; $('hf-timer-status').innerText='Executando'; speak(st.current.voiceScriptStart);} } else if(st.timerPhase==='work'){ st.remainingWork--; st.totalActiveSeconds++; refreshInfo(); updateDisplay(); if(st.remainingWork<=0){ beep(true); stopTimer(); st.timerPhase='idle'; $('hf-timer-status').innerText='Concluído'; await markComplete(); st.remainingPrep=20; st.remainingWork=st.perExerciseSec; } } },1000); };
  const startTimer=async()=>{ if(!st.current) return alert('Gere um exercício.'); if(!st.tutorialDone) return alert('Assista ao tutorial antes.'); beginPrepCountdown(); };
  $('hf-generate').onclick=async()=>{ const btn=$('hf-generate'); btn.disabled=true; $('hf-badge').innerText='Gerando...'; try{ st.current=await askExerciseAI($('hf-body').value||'corpo-todo',st.intensity,st.targetType,st.perExerciseSec,Number($('hf-reps').value)||15); }catch(e){ st.current=generateLocal($('hf-body').value,st.intensity,st.targetType,st.perExerciseSec,15); } btn.disabled=false; renderEx(st.current); resetTimer(); };
  $('hf-btn-start').onclick=startTimer; $('hf-btn-pause').onclick=()=>{stopTimer();$('hf-timer-status').innerText='Pausado';}; $('hf-btn-reset').onclick=resetTimer;
  const musicFrame=$('hf-music-frame'); $('hf-open-music').onclick=()=>{ $('hf-music-bg')?.classList.remove('hidden'); if(musicFrame) musicFrame.src='https://www.youtube.com/embed/t37DTadb3Po?autoplay=1'; };
  $('hf-generate-card').onclick=()=>{ alert("Recurso de geração de cartão acionado!"); };
  if('speechSynthesis' in window){ st.voicesSupported=true; }
  setSeg('hf-intensity','iniciante'); setSeg('hf-target-type','reps'); setSeg('hf-mode','texto'); refreshInfo(); updateDisplay(); renderHistory();
};
window.initSaudeTab=function(){
  window.ensureHealthStructures();
  // Inicializar variáveis críticas para o gerador de refeições
  window.selectedMealRestrictionIds=window.selectedMealRestrictionIds||[];
  window.currentBalancedPlan=null;
  window.renderHydration();
  window.renderCaloricNeed();
  window.renderExerciseProgress();
  window.renderAnxietyDailyState();
  window.renderHealthGoalsLog();
  window.renderNutriHistory();
  window.renderBiotypeOptions();
  window.renderActivityProfileState();
  window.renderBalancedMealRestrictions();
};
