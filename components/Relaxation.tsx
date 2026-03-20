// Relaxation.tsx - Componente Relaxamento & Foco
export function renderRelaxation() {
  return `
    <section id="relaxation" class="tab-content">
      <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4 flex-none">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-slate-600">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <h2 class="font-black text-purple-400 text-xl tracking-tight leading-tight">Relaxamento <br>& Foco</h2>
        </div>
        
        <div class="flex gap-2 mb-4 flex-none overflow-x-auto pb-2 scrollbar-hide shrink-0 snap-x">
          <button onclick="window.showRelaxSubTab('rx-video')" id="btn-rx-video" class="rel-nav-btn shrink-0 active snap-start">Climatizar</button>
          <button onclick="window.showRelaxSubTab('rx-cinema')" id="btn-rx-cinema" class="rel-nav-btn shrink-0 snap-start">Cinema</button>
          <button onclick="window.showRelaxSubTab('rx-arte')" id="btn-rx-arte" class="rel-nav-btn shrink-0 snap-start">Obra de Arte</button>
          <button onclick="window.showRelaxSubTab('rx-mural')" id="btn-rx-mural" class="rel-nav-btn shrink-0 snap-start">Mural</button>
          <button onclick="window.showRelaxSubTab('rx-biblioteca')" id="btn-rx-biblioteca" class="rel-nav-btn shrink-0 snap-start">Biblioteca</button>
          <button onclick="window.showRelaxSubTab('rx-caixinha')" id="btn-rx-caixinha" class="rel-nav-btn shrink-0 snap-start">Caixinha</button>
          <button onclick="window.showRelaxSubTab('rx-jogos')" id="btn-rx-jogos" class="rel-nav-btn shrink-0 bg-rose-900/50 border-rose-500/50 text-rose-200 snap-start">Jogos</button>
        </div>
        
        <div id="rx-video" class="flex-1 overflow-y-auto pb-10">
          <p class="text-[10px] text-slate-300 mb-4 text-justify font-bold bg-slate-800 p-3 rounded border border-slate-700">Este é um espaço climatizador. Dê o play em um dos vídeos e permita que o som e a imagem ambiente continuem rodando ao fundo enquanto você navega pelas outras ferramentas para relaxar.</p>
          <div class="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-slate-600 bg-black mb-4">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/sF80I-TQiW0" frameborder="0" allowfullscreen></iframe>
          </div>
          <div class="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-slate-600 bg-black mb-4">
            <iframe width="100%" height="100%" src="https://www.youtube.com/embed/Cg0dAc4-UCY" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
        
        <div id="rx-cinema" class="hidden flex-1 flex flex-col pb-10">
          <p class="text-[10px] font-bold text-sky-400 mb-2 uppercase tracking-widest text-center">Entretenimento Saudável</p>
          <div class="flex-1 rounded-xl overflow-hidden border border-slate-600 bg-black">
            <iframe src="https://feliz7play.com/pt" width="100%" height="100%" frameborder="0"></iframe>
          </div>
        </div>
        
        <div id="rx-arte" class="hidden flex-1 flex flex-col pb-10 items-center">
          <p class="text-[10px] font-bold text-amber-400 mb-2 uppercase tracking-widest text-center">Pinte para Descomprimir</p>
          <div class="flex gap-2 mb-4 bg-slate-800 p-2 rounded-full border border-slate-700">
            <button class="w-8 h-8 rounded-full bg-red-500 shadow-inner border border-white/20" onclick="window.selColor('#ef4444')"></button>
            <button class="w-8 h-8 rounded-full bg-blue-500 shadow-inner border border-white/20" onclick="window.selColor('#3b82f6')"></button>
            <button class="w-8 h-8 rounded-full bg-green-500 shadow-inner border border-white/20" onclick="window.selColor('#22c55e')"></button>
            <button class="w-8 h-8 rounded-full bg-yellow-400 shadow-inner border border-white/20" onclick="window.selColor('#facc15')"></button>
            <button class="w-8 h-8 rounded-full bg-purple-500 shadow-inner border border-white/20" onclick="window.selColor('#a855f7')"></button>
            <button class="w-8 h-8 rounded-full bg-white shadow-inner border border-slate-300" onclick="window.selColor('#ffffff')"></button>
          </div>
          <div class="flex justify-between w-full mb-2">
            <button onclick="window.prevArt()" class="text-slate-400 hover:text-white">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="text-xs font-bold" id="art-counter">Desenho 1/10</span>
            <button onclick="window.nextArt()" class="text-slate-400 hover:text-white">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div id="art-canvas" class="w-full aspect-square bg-slate-200 rounded-xl border-4 border-slate-600 p-2 flex items-center justify-center overflow-hidden"></div>
        </div>
        
        <div id="rx-mural" class="hidden flex-1 flex flex-col pb-10">
          <div id="mural-list" class="flex-1 overflow-y-auto mb-4 space-y-4 pr-1"></div>
          <div class="mt-auto pt-4 border-t border-slate-700 flex-none bg-slate-800/80 p-3 rounded-2xl">
            <textarea id="mural-input" placeholder="Escreva algo transformador" class="w-full p-3 rounded-xl border border-slate-600 h-20 resize-none text-sm bg-slate-900 mb-3 focus:border-amber-500 outline-none text-white"></textarea>
            <button onclick="window.saveMuralMessage()" class="w-full bg-amber-600 text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg">
              <i class="fas fa-paper-plane mr-2"></i>Publicar
            </button>
          </div>
        </div>
        
        <div id="rx-biblioteca" class="hidden flex-1 flex flex-col">
          <select id="book-theme" class="w-full p-4 rounded-xl text-sm font-bold bg-slate-900 border border-slate-600 mb-3 text-white">
            <option value="Autoconhecimento">Autoconhecimento</option>
            <option value="Resiliência">Resiliência</option>
          </select>
          <button onclick="window.gerarLeitura()" class="w-full bg-indigo-600 text-white font-black uppercase tracking-wider py-4 rounded-xl mb-4">Receber Sabedoria</button>
          <div id="book-container" class="flex-1 overflow-y-auto hidden">
            <div class="book-page">
              <h3 id="book-title" class="text-xl font-black mb-4 text-center"></h3>
              <div id="book-content" class="text-sm text-justify"></div>
            </div>
          </div>
        </div>
        
        <div id="rx-caixinha" class="hidden flex-1 flex flex-col items-center justify-center">
          <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-[var(--gold)] animate-pulse">
            <i class="fas fa-gift text-xl text-[var(--gold)]"></i>
          </div>
          <div id="resultadoBox" class="mb-6 hidden w-full">
            <div class="slide-frame mb-4" id="capture_area">
              <img id="imgBox" src="" class="slide-bg" crossorigin="anonymous">
              <div class="slide-overlay"></div>
              <div class="slide-content">
                <div class="slide-text" id="msgBox">Aguardando</div>
              </div>
            </div>
          </div>
          <button onclick="window.gerarCaixinha()" id="caixinha-btn" class="w-full border-2 border-[#c4a661] text-[#c4a661] uppercase tracking-[3px] font-bold py-4 rounded-full">Gerar Experiência</button>
        </div>
        
        <div id="rx-jogos" class="hidden flex-1 flex flex-col relative">
          <div class="flex items-center justify-between mb-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex-none">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Sequência de<br>Descompressão</span>
            <span class="text-xs font-black uppercase bg-rose-900/80 text-rose-300 px-4 py-2 rounded-full shadow-inner border border-rose-800" id="game-level-display">Nível 1/16</span>
          </div>
          <div id="game-container" class="flex-1 flex flex-col items-center justify-center w-full relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden mb-4 p-2 shadow-inner">
            <div class="text-center p-4">
              <i class="fas fa-gamepad text-5xl text-rose-500 mb-4 animate-bounce"></i>
              <p class="text-xs text-slate-300 mb-4 font-bold">16 Desafios para reconfigurar seu foco.</p>
              <button onclick="window.startDescompressao()" id="start-game-btn" class="bg-rose-600 hover:bg-rose-500 text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider shadow-lg">Iniciar</button>
            </div>
          </div>
          <button id="next-game-btn" onclick="window.nextGame()" class="hidden flex-none bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] w-full">Próximo Desafio <i class="fas fa-arrow-right ml-2"></i></button>
        </div>
      </div>
    </section>
  `;
}
