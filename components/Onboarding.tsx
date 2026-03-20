// Onboarding.tsx - Tela de Login/Cadastro
export function renderOnboarding() {
  return `
    <section id="onboarding" class="tab-content active">
      <div class="h-full flex flex-col items-center justify-center p-4 relative">
        <div class="glass-card p-8 text-center w-full shadow-[0_0_40px_rgba(14,165,233,0.1)]">
          <div class="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 mx-auto ring-2 ring-sky-500/50 shadow-[0_0_25px_rgba(14,165,233,0.4)]">
            <i class="fas fa-fingerprint text-sky-400 text-4xl"></i>
          </div>
          <h2 class="text-2xl font-black text-white mb-2 heading-font tracking-tight">Acesso Seguro</h2>
          <p class="text-[10px] text-emerald-400 font-bold mb-8 uppercase tracking-widest">
            <i class="fas fa-shield-alt mr-1"></i>Ambiente Criptografado
          </p>
          <div class="w-full mb-6 space-y-4">
            <select id="user-gender" class="w-full p-4 rounded-xl outline-none text-sm font-bold tracking-wide">
              <option value="" disabled selected>SELECIONE SEU GÊNERO</option>
              <option value="M">Mulher</option>
              <option value="H">Homem</option>
            </select>
            <input type="text" id="user-name-input" oninput="this.value=this.value.toUpperCase()" placeholder="PRIMEIRO E SEGUNDO NOME" class="w-full p-4 rounded-xl text-center uppercase font-bold outline-none text-sm tracking-wide">
            <input type="password" id="user-pass-input" placeholder="SENHA (DDMMAAAA)" maxlength="8" class="w-full p-4 rounded-xl text-center font-bold outline-none tracking-widest text-sm">
            <input type="text" id="partner-code-input" placeholder="CÓDIGO DA PARCERIA (OPCIONAL)" class="w-full p-4 rounded-xl text-center font-bold outline-none tracking-widest text-sm border border-rose-500/50 focus:border-rose-500 uppercase bg-rose-900/10 text-rose-300 placeholder-rose-300/50">
            <label class="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2 cursor-pointer font-medium">
              <input type="checkbox" id="remember-me" class="w-4 h-4 rounded bg-slate-700 accent-sky-500"> Mantenha-me conectado
            </label>
          </div>
          <button onclick="window.login(false)" class="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:from-sky-500 hover:to-blue-500 transition-all text-sm uppercase tracking-wider">Entrar / Cadastrar</button>
        </div>
      </div>
    </section>
  `;
}
