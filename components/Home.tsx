// Home.tsx - Dashboard Principal
export function renderHome() {
  return `
    <section id="home" class="tab-content relative">
      <div class="glass-card p-6 mb-4 relative">
        <p class="text-xs text-slate-400 font-medium tracking-wide">Muito bom te ver aqui,</p>
        <h2 class="text-2xl font-black text-white heading-font mb-6 client-name tracking-tight">Aguardando</h2>
        <div class="grid grid-cols-2 gap-3">
          <button onclick="window.triggerChatSelection()" class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-sm">
            <i class="fas fa-comment-medical text-3xl text-sky-400 drop-shadow-md"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Conversar</span>
          </button>
          <button onclick="window.showTab('saude')" class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-sm">
            <i class="fas fa-heartbeat text-3xl text-rose-500 drop-shadow-md"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Saúde & Corpo</span>
          </button>
          <button onclick="window.showTab('routines')" class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-sm">
            <i class="fas fa-check-circle text-3xl text-emerald-400 drop-shadow-md"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Minha Rotina</span>
          </button>
          <button onclick="window.showTab('relacional')" class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-sm">
            <i class="fas fa-heart text-3xl text-rose-400 drop-shadow-md"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Relacional</span>
          </button>
          <button onclick="window.showTab('financas')" class="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center gap-3 hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-sm">
            <i class="fas fa-wallet text-3xl text-emerald-500 drop-shadow-md"></i>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-300">Finanças</span>
          </button>
          <button onclick="window.showTab('relaxation')" class="col-span-2 p-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl border border-purple-700/50 flex flex-col items-center gap-3 hover:from-purple-800/60 hover:to-indigo-800/60 transition-all shadow-md">
            <i class="fas fa-spa text-3xl text-purple-400 drop-shadow-lg"></i>
            <span class="text-[11px] font-black uppercase tracking-widest text-purple-200">Central de Relaxamento & Foco</span>
          </button>
        </div>
        
        <!-- Botão de Acesso Administrativo (escondido, visível apenas com permissão) -->
        <div id="admin-access" class="hidden mt-4">
          <button onclick="window.showTab('admin')" class="w-full p-3 bg-amber-900/50 border border-amber-500/50 text-amber-300 rounded-xl font-bold text-xs hover:bg-amber-800/60 transition-colors">
            <i class="fas fa-shield-alt mr-2"></i>Acesso Administrativo
          </button>
        </div>
      </div>
      <div class="mt-auto pt-4 pb-4 text-center flex flex-col items-center justify-center gap-2 relative">
        <p class="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Desenvolvido por WR-TECNOLOGIA</p>
        <div class="flex gap-4 relative">
          <button onclick="window.logoutUser()" class="text-xs text-red-500 font-bold hover:text-red-400">
            <i class="fas fa-sign-out-alt"></i> Sair
          </button>
          <i class="fas fa-lock text-[10px] text-white/10 absolute -right-6 top-1 cursor-pointer hover:text-white/30" title="Acesso ADM" onclick="window.checkAdminAccess()"></i>
        </div>
      </div>
    </section>
  `;
}
