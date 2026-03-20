// Chat.tsx - Componente Interface de Chat
export function renderChat() {
  return `
    <section id="chat" class="tab-content">
      <div class="chat-layout h-full">
        <div class="p-4 border-b border-slate-700 flex items-center gap-3 bg-slate-900/95 flex-none z-10 shadow-md">
          <div id="active-avatar" class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-slate-700"></div>
          <div class="flex-1">
            <p id="active-name" class="font-bold text-white text-sm"></p>
            <div class="flex items-center mt-1">
              <span id="active-status-dot" class="status-dot"></span>
              <span id="active-status-text" class="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Status</span>
            </div>
          </div>
          <button onclick="window.clearChatHistoryInside()" class="w-10 h-10 rounded-full bg-rose-900/50 border border-rose-500 text-rose-300 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors mr-1" title="Apagar Histórico">
            <i class="fas fa-trash"></i>
          </button>
          <button onclick="window.showTab('chat-selection')" class="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div id="chat-messages" class="chat-messages-area space-y-3"></div>
        
        <div class="flex-none bg-slate-900 border-t border-slate-700 pb-2">
          <div id="typing-box" class="px-4 py-2 hidden text-xs text-sky-400 font-bold bg-slate-800/50 uppercase tracking-widest">Escrevendo <span class="animate-pulse">_</span></div>
          <div class="p-3">
            <form id="chat-form" class="flex items-center gap-2">
              <input type="text" id="chat-input" placeholder="Escreva sua mensagem" class="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors">
              <button type="submit" id="submit-btn" class="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-lg hover:scale-105 flex items-center justify-center transition-transform">
                <i class="fas fa-paper-plane text-lg"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  `;
}
