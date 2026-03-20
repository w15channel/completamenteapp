// Relacional.tsx - Componente Espaço Relacional
export function renderRelacional() {
  return `
    <section id="relacional" class="tab-content">
      <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4 flex-none">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <div>
            <h2 class="font-bold text-rose-400">Espaço Relacional</h2>
            <p class="text-[9px] text-slate-400">Autoconhecimento e Conexão</p>
          </div>
        </div>
        
        <div class="flex gap-2 mb-4 flex-none">
          <button onclick="window.showRelSubTab('rel-pessoal')" id="btn-rel-pessoal" class="rel-nav-btn active">Pessoal</button>
          <button onclick="window.showRelSubTab('rel-parceria')" id="btn-rel-parceria" class="rel-nav-btn">Parceria</button>
          <button onclick="window.showRelSubTab('rel-cupom')" id="btn-rel-cupom" class="rel-nav-btn">Cupom</button>
          <button onclick="window.showRelSubTab('rel-amor')" id="btn-rel-amor" class="rel-nav-btn">Amor</button>
        </div>
        
        <div id="rel-pessoal" class="flex-1 overflow-y-auto space-y-4 pb-20">
          <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <label class="block text-slate-300 text-xs font-bold mb-2">Qual sua idade?</label>
            <div class="flex gap-2">
              <input type="number" id="rel-age-input" placeholder="Idade" class="flex-1 p-2 rounded bg-slate-900 text-sm border border-slate-600 text-white">
              <button onclick="window.saveRelAge()" class="bg-sky-600 text-white px-3 rounded font-bold">Salvar</button>
            </div>
          </div>
          
          <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <label class="block text-slate-300 text-xs font-bold mb-2">Como você se sente hoje?</label>
            <div class="grid grid-cols-5 gap-2 text-center" id="rel-mood-grid"></div>
            <p id="rel-mood-status" class="text-[9px] text-emerald-400 mt-2 text-center hidden font-bold">Humor registrado.</p>
          </div>
          
          <div class="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <label class="block text-slate-300 text-xs font-bold mb-2">Seu Código Pessoal</label>
            <div class="flex items-center gap-2">
              <input type="text" id="rel-share-code" readonly placeholder="Gerando" class="flex-1 p-2 rounded bg-slate-900 text-xs text-center font-bold text-emerald-400 border border-slate-600">
              <button onclick="window.copyRelShareCode()" class="bg-emerald-600 text-white px-4 py-2 rounded">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div id="rel-parceria" class="hidden flex-1 overflow-y-auto pb-20">
          <div id="rel-partner-setup" class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 text-center">
            <h3 class="text-white font-bold mb-2">Vínculo de Parceria</h3>
            <p class="text-[10px] text-slate-400 mb-4 px-2">Se você não inseriu o código no login, insira agora para espelhar os dados.</p>
            <input type="text" id="rel-partner-code" placeholder="CÓDIGO DA PARCERIA" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm text-center font-bold mb-3 tracking-widest uppercase">
            <button onclick="window.linkPartner()" class="w-full bg-rose-600 text-white py-3 rounded-xl font-bold shadow-lg">Conectar</button>
          </div>
        </div>
        
        <div id="rel-cupom" class="hidden flex-1 flex flex-col items-center justify-center p-4">
          <div class="w-24 h-24 bg-rose-900/30 rounded-full flex items-center justify-center mb-6 border-2 border-rose-500/50">
            <i class="fas fa-gift text-4xl text-rose-400"></i>
          </div>
          <h3 class="text-lg font-bold text-white mb-2 text-center">Vale Cupom Casados</h3>
          <button onclick="window.drawCupom()" id="btn-draw-cupom" class="w-full bg-rose-600 text-white py-4 rounded-xl font-bold shadow-lg">Sortear Cupom</button>
        </div>
        
        <div id="rel-amor" class="hidden flex-1 flex flex-col relative h-full pb-16">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-none mb-2">
            <h3 class="font-bold text-rose-400 mb-2">Avaliações Psicológicas</h3>
            <div class="flex gap-2">
              <button onclick="window.startAssessment('love')" class="flex-1 bg-rose-600 text-white py-2 rounded text-xs font-bold">Linguagem do Amor</button>
              <button onclick="window.startAssessment('temp')" class="flex-1 bg-sky-600 text-white py-2 rounded text-xs font-bold">Temperamentos</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
