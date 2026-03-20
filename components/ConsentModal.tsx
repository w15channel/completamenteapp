// ConsentModal.tsx - Modal de Consentimento
export function renderConsentModal() {
  return `
    <div id="consent-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm">
      <div class="glass-card p-6 w-full max-w-sm animate-fade-in border border-sky-500/30">
        <div class="w-16 h-16 bg-sky-900/50 rounded-full flex items-center justify-center mb-4 mx-auto text-sky-400">
          <i class="fas fa-hand-holding-heart text-3xl animate-pulse"></i>
        </div>
        <h3 class="text-xl font-bold text-center text-white mb-4 heading-font">Seu acolhimento em primeiro lugar</h3>
        <div class="text-xs text-slate-300 space-y-3 mb-6 text-justify leading-relaxed">
          <p>"Para garantir que você nunca fique sem amparo, utilizamos um sistema de <b>Atendimento Híbrido</b>. Sempre que nossos profissionais estiverem ocupados, acionamos nossa IA de suporte. Ela oferece escuta e conforto imediatos, sempre supervisionada."</p>
        </div>
        <div class="flex flex-col gap-3">
          <button onclick="window.acceptTerms()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg transition-all">Aceito os termos</button>
          <button onclick="window.declineTerms()" class="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-3 rounded-xl font-bold transition-all">Não aceito (Voltar)</button>
        </div>
      </div>
    </div>
  `;
}
