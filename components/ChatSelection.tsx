// ChatSelection.tsx - Componente Seleção de Terapeutas
export function renderChatSelection() {
  return `
    <section id="chat-selection" class="tab-content">
      <div class="glass-card p-6 h-full overflow-y-auto">
        <div class="flex items-center gap-3 mb-4">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <h2 class="font-black text-sky-400 text-xl tracking-tight">Nossa Equipe</h2>
        </div>
        <div id="therapist-list" class="space-y-4 pb-20"></div>
      </div>
    </section>
  `;
}
