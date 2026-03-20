// Routines.tsx - Componente Minha Rotina
export function renderRoutines() {
  return `
    <section id="routines" class="tab-content">
      <div class="h-full flex flex-col relative">
        <div class="flex items-center gap-3 mb-4 flex-none px-2">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <div class="flex-1">
            <h2 class="font-black text-emerald-400 text-xl tracking-tight">Minha Rotina</h2>
            <div class="w-full bg-slate-900 rounded-full h-3 mt-2 border border-slate-700 overflow-hidden relative shadow-inner">
              <div id="rt-progress-bar" class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style="width: 0%"></div>
            </div>
            <p id="rt-progress-text" class="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-widest">0% CONCLUÍDO HOJE</p>
          </div>
        </div>
        
        <div class="px-2 mb-4 flex-none">
          <div class="glass-card p-4">
            <input type="text" id="rt-goal-week" placeholder="🎯 Meta Principal da Semana" class="w-full bg-transparent border-b border-slate-600 mb-3 pb-2 text-sm font-bold outline-none text-emerald-100 placeholder-slate-500 focus:border-emerald-500" onblur="window.saveGoals()">
            <input type="text" id="rt-goal-month" placeholder="🏆 Grande Objetivo do Mês" class="w-full bg-transparent text-sm font-bold outline-none text-teal-100 placeholder-slate-500 focus:border-teal-500" onblur="window.saveGoals()">
          </div>
        </div>
        
        <div id="task-list-container" class="flex-1 overflow-y-auto px-2 pb-24 space-y-6">
          <div id="area-todo" class="hidden">
            <h3 class="text-[10px] font-black text-emerald-400 mb-3 uppercase tracking-[0.2em] px-1">
              <i class="fas fa-bolt mr-2 text-yellow-400"></i> Foco Atual
            </h3>
            <div id="tasks-todo" class="space-y-3"></div>
          </div>
          
          <div id="area-done" class="hidden">
            <h3 class="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-[0.2em] px-1">
              <i class="fas fa-check-double mr-2"></i> Vitórias do Dia
            </h3>
            <div id="tasks-done" class="space-y-3 opacity-60"></div>
          </div>
        </div>
        
        <button onclick="window.openTaskModal()" class="absolute bottom-6 right-4 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-[0_8px_25px_rgba(16,185,129,0.5)] flex items-center justify-center text-2xl z-30">
          <i class="fas fa-plus"></i>
        </button>
        
        <div id="task-modal" class="hidden absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div class="glass-card p-6 w-full max-w-sm border-t border-emerald-500/30">
            <h3 class="font-black text-white text-lg mb-5">
              <i class="fas fa-edit text-emerald-400 mr-2"></i>Nova Tarefa
            </h3>
            <input type="text" id="task-name" placeholder="Título da Tarefa" class="w-full p-4 rounded-xl bg-slate-900 border border-slate-600 text-sm mb-4 outline-none text-white font-bold">
            <div class="flex gap-3 mb-5">
              <div class="flex-1">
                <label class="text-[10px] text-slate-400 font-bold ml-1 uppercase">Horário</label>
                <input type="time" id="task-time" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm outline-none text-white font-bold">
              </div>
              <div class="flex-1">
                <label class="text-[10px] text-slate-400 font-bold ml-1 uppercase">Repetição</label>
                <select id="task-freq" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm outline-none text-white font-bold">
                  <option value="daily">Todo dia</option>
                  <option value="weekdays">Dias úteis</option>
                  <option value="once">Só hoje</option>
                </select>
              </div>
            </div>
            <div class="flex gap-3">
              <button onclick="window.closeTaskModal()" class="flex-1 p-3 rounded-xl font-bold text-slate-400 bg-slate-800">Cancelar</button>
              <button onclick="window.saveNewTask()" class="flex-[2] p-3 rounded-xl font-black text-white bg-emerald-600">Salvar Tarefa</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
