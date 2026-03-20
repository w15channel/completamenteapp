// Financas.tsx - Componente Controle Financeiro
export function renderFinancas() {
  return `
    <section id="financas" class="tab-content">
      <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4 flex-none">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <div>
            <h2 class="font-bold text-emerald-400">Controle Financeiro</h2>
          </div>
        </div>
        
        <div class="fin-card mb-4 flex-none">
          <p class="text-[10px] font-bold uppercase tracking-widest text-sky-100 mb-1">Saldo Líquido Estimado</p>
          <h3 class="text-3xl font-bold" id="fin-balance">R$ 0,00</h3>
          <div class="flex justify-between mt-4 text-xs">
            <div class="flex flex-col">
              <span class="text-emerald-300">Receitas</span>
              <span class="font-bold" id="fin-total-in">R$ 0,00</span>
            </div>
            <div class="flex flex-col text-right">
              <span class="text-rose-300">Despesas</span>
              <span class="font-bold" id="fin-total-out">R$ 0,00</span>
            </div>
          </div>
        </div>
        
        <div class="flex gap-2 mb-4 flex-none">
          <button onclick="window.openFinModal('in')" class="flex-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 py-2 rounded-lg font-bold text-xs">
            <i class="fas fa-plus mr-1"></i> Receita
          </button>
          <button onclick="window.openFinModal('out')" class="flex-1 bg-rose-600/20 text-rose-400 border border-rose-500/50 py-2 rounded-lg font-bold text-xs">
            <i class="fas fa-minus mr-1"></i> Despesa
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto bg-slate-800/50 rounded-xl border border-slate-700 p-2">
          <h4 class="text-xs font-bold text-slate-400 mb-2 uppercase px-2">Movimentações</h4>
          <div id="fin-list" class="space-y-2 pb-16"></div>
        </div>
      </div>
      
      <div id="fin-modal" class="hidden absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-slate-800 border border-slate-700 p-5 rounded-2xl w-full max-w-sm">
          <h3 class="font-bold text-white mb-4" id="fin-modal-title">Novo Lançamento</h3>
          <input type="hidden" id="fin-type">
          <input type="text" id="fin-desc" placeholder="Descrição" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm mb-3 text-white outline-none">
          <div class="flex gap-2 mb-4">
            <input type="number" id="fin-val" placeholder="0.00" class="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm text-white outline-none">
            <select id="fin-category" class="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm text-white outline-none">
              <option value="Fixo">Fixo</option>
              <option value="Variável">Variável</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button onclick="window.closeFinModal()" class="flex-1 p-3 rounded-xl font-bold bg-slate-700 text-slate-300">Cancelar</button>
            <button onclick="window.saveFinTransaction()" class="flex-1 p-3 rounded-xl font-bold bg-sky-600 text-white">Salvar</button>
          </div>
        </div>
      </div>
    </section>
  `;
}
