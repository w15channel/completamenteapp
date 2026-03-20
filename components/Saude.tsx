// Saude.tsx - Componente Saúde & Corpo
export function renderSaude() {
  return `
    <section id="saude" class="tab-content">
      <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4 flex-none">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <div>
            <h2 class="font-bold text-rose-400">Saúde & Corpo</h2>
          </div>
        </div>
        <div class="flex gap-2 mb-4 flex-none flex-wrap">
          <button onclick="window.showSaudeSubTab('sd-perfil')" id="btn-sd-perfil" class="rel-nav-btn active">Perfil</button>
          <button onclick="window.showSaudeSubTab('sd-agua')" id="btn-sd-agua" class="rel-nav-btn">Água</button>
          <button onclick="window.showSaudeSubTab('sd-nutricao')" id="btn-sd-nutricao" class="rel-nav-btn">Nutr.</button>
          <button onclick="window.showSaudeSubTab('sd-exercicio')" id="btn-sd-exercicio" class="rel-nav-btn">Exerc.</button>
          <button onclick="window.showSaudeSubTab('sd-cardio')" id="btn-sd-cardio" class="rel-nav-btn">Cardio</button>
          <button onclick="window.showSaudeSubTab('sd-ansiedade')" id="btn-sd-ansiedade" class="rel-nav-btn">Ansied.</button>
        </div>
        
        <div id="sd-perfil" class="flex-1 overflow-y-auto pb-20">
          <div class="health-card relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 opacity-10">
              <i class="fas fa-weight scale-x-[-1] text-9xl"></i>
            </div>
            <div class="relative z-10">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-sm font-black text-white uppercase tracking-wider">Perfil Biológico</h3>
                <span id="imc-result" class="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white shadow-inner">IMC: --</span>
              </div>
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="text-[10px] text-rose-100 font-bold ml-1 uppercase">Peso (kg)</label>
                  <input type="number" id="health-weight" placeholder="Ex: 75" class="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-sm outline-none text-white text-center font-bold placeholder-white/40">
                </div>
                <div class="flex-1">
                  <label class="text-[10px] text-rose-100 font-bold ml-1 uppercase">Altura (m)</label>
                  <input type="number" id="health-height" placeholder="Ex: 1.75" step="0.01" class="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-sm outline-none text-white text-center font-bold placeholder-white/40">
                </div>
              </div>
              <button onclick="window.calcIMC()" class="w-full mt-4 bg-white text-rose-600 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg">Atualizar Medidas</button>
            </div>
          </div>
        </div>
        
        <div id="sd-agua" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-bold text-white">
                <i class="fas fa-tint text-blue-400 mr-2"></i>Hidratação
              </h3>
              <div class="text-right">
                <span class="block text-xs font-black text-blue-400" id="water-total">0 ml</span>
                <span class="block text-[9px] text-slate-400 font-bold uppercase" id="water-goal-text">Meta: -- ml</span>
              </div>
            </div>
            <div class="w-full bg-slate-900 rounded-full h-4 mb-4 border border-slate-700 overflow-hidden">
              <div id="water-progress-bar" class="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
            </div>
            <div class="flex gap-3 mb-4">
              <button onclick="window.removeWater()" class="flex-1 bg-slate-700 text-slate-300 py-3 rounded-xl text-lg font-bold border border-slate-600">
                <i class="fas fa-minus"></i>
              </button>
              <button onclick="window.addWater()" class="flex-[2] bg-blue-600 text-white py-3 rounded-xl text-sm font-black uppercase tracking-wider">
                <i class="fas fa-plus mr-2"></i>Adicionar
              </button>
            </div>
          </div>
        </div>

        <div id="sd-nutricao" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <div class="glass-card p-4 border-emerald-500/20">
              <label class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 block">Descreva sua Refeição</label>
              <textarea id="mealInput" placeholder="Ex: frango grelhado, arroz integral e suco de laranja" class="w-full h-24 bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500 transition-all resize-none"></textarea>
              <button onclick="window.doNutriAnalysis()" class="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all">
                <i class="fas fa-search-pie mr-2"></i>Analisar Nutrição
              </button>
            </div>
          </div>
        </div>

        <div id="sd-exercicio" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <h3 class="text-sm font-bold text-white mb-3">
              <i class="fas fa-running text-amber-400 mr-2"></i>Carga de Exercício
            </h3>
            <select id="health-sport" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-xs mb-3 font-bold text-white outline-none">
              <option value="Caminhada">Caminhada</option>
              <option value="Corrida">Corrida</option>
              <option value="Musculação">Musculação</option>
              <option value="Yoga">Yoga</option>
            </select>
            <div class="flex gap-2">
              <input type="number" id="health-sport-time" placeholder="Duração (min)" class="flex-1 p-3 rounded-xl bg-slate-900 border border-slate-600 text-sm outline-none text-white text-center font-bold">
              <button onclick="window.addExercise()" class="bg-amber-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider">Lançar</button>
            </div>
          </div>
        </div>

        <div id="sd-cardio" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-5 rounded-xl border border-slate-700 text-center">
            <h3 class="text-sm font-bold text-white mb-2">
              <i class="fas fa-heartbeat text-rose-500 mr-2"></i>Monitor Cardíaco
            </h3>
            <button onclick="window.startCardioTimer()" id="cardio-btn" class="w-32 h-32 rounded-full bg-slate-900 border-4 border-rose-500 flex items-center justify-center mx-auto mb-4 text-rose-500 hover:bg-rose-900/30 transition-colors shadow-[0_0_20px_rgba(225,29,72,0.3)]">
              <i class="fas fa-play text-4xl ml-2"></i>
            </button>
          </div>
        </div>

        <div id="sd-ansiedade" class="hidden flex-1 flex flex-col relative h-full pb-16">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-none mb-2">
            <h3 class="font-bold text-sky-400 mb-2">Controle de Ansiedade</h3>
            <button onclick="window.startAnxietyCheck()" class="w-full bg-sky-600 text-white py-2 rounded text-xs font-bold hover:bg-sky-500">Iniciar Avaliação Investigativa</button>
          </div>
        </div>
      </div>
    </section>
  `;
}
