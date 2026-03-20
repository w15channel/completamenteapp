// Admin.tsx - Componente Espaço Administrativo
export function renderAdmin() {
  return `
    <section id="admin" class="tab-content">
      <div class="glass-card p-4 h-full flex flex-col">
        <div class="flex items-center gap-3 mb-4 flex-none">
          <button onclick="window.showTab('home')" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <i class="fas fa-arrow-left text-slate-300"></i>
          </button>
          <div>
            <h2 class="font-bold text-amber-400">Espaço Administrativo</h2>
            <p class="text-[9px] text-slate-400">Treinamento IA e Banco de Dados</p>
          </div>
        </div>
        
        <div class="flex gap-2 mb-4 flex-none">
          <button onclick="window.showAdminSubTab('admin-training')" id="btn-admin-training" class="admin-nav-btn active">Treinar IA</button>
          <button onclick="window.showAdminSubTab('admin-database')" id="btn-admin-database" class="admin-nav-btn">Banco Dados</button>
          <button onclick="window.showAdminSubTab('admin-metrics')" id="btn-admin-metrics" class="admin-nav-btn">Métricas</button>
          <button onclick="window.showAdminSubTab('admin-logs')" id="btn-admin-logs" class="admin-nav-btn">Logs</button>
        </div>
        
        <!-- Treinamento IA -->
        <div id="admin-training" class="flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <h3 class="text-sm font-bold text-amber-400 mb-3">
              <i class="fas fa-graduation-cap mr-2"></i>Treinamento da IA Terapêutica
            </h3>
            <p class="text-xs text-slate-300 mb-4">
              Dialogue com a IA para treinar novas respostas e comportamentos. As instruções serão aplicadas a todas as conversas futuras.
            </p>
            
            <div class="space-y-3">
              <div>
                <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Tipo de Treinamento</label>
                <select id="training-type" class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-xs font-bold text-white outline-none">
                  <option value="behavior">Comportamento e Personalidade</option>
                  <option value="responses">Respostas Específicas</option>
                  <option value="protocols">Protocolos Clínicos</option>
                  <option value="crisis">Intervenção em Crise</option>
                  <option value="general">Treinamento Geral</option>
                </select>
              </div>
              
              <div>
                <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Instrução para IA</label>
                <textarea id="training-input" placeholder="Ex: 'Quando usuários expressarem ansiedade, responda com validação e ofereça técnicas de respiração. Use linguagem acolhedora e evite jargões clínicos.'" class="w-full h-32 bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm text-white outline-none resize-none focus:border-amber-500"></textarea>
              </div>
              
              <div>
                <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Exemplo de Interação</label>
                <div class="grid grid-cols-2 gap-2">
                  <input type="text" id="example-user" placeholder="Frase do usuário..." class="p-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white outline-none">
                  <input type="text" id="example-ia" placeholder="Resposta esperada..." class="p-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white outline-none">
                </div>
              </div>
              
              <button onclick="window.sendTrainingToAI()" class="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg transition-all">
                <i class="fas fa-brain mr-2"></i>Enviar Treinamento para IA
              </button>
            </div>
          </div>
          
          <!-- Histórico de Treinamento -->
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 class="text-xs font-bold text-amber-400 mb-3">Histórico de Treinamento</h4>
            <div id="training-history" class="space-y-2 max-h-60 overflow-y-auto">
              <div class="text-[9px] text-slate-500 text-center py-4">Nenhum treinamento realizado ainda</div>
            </div>
          </div>
        </div>
        
        <!-- Banco de Dados -->
        <div id="admin-database" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <h3 class="text-sm font-bold text-amber-400 mb-3">
              <i class="fas fa-database mr-2"></i>Banco de Dados Google Drive
            </h3>
            
            <div class="mb-4">
              <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Link do Banco de Dados</label>
              <input type="text" id="database-url" value="https://drive.google.com/file/d/1mQ7RAHiOBCAYPpoYkvUgZ36yYxyljhrH/view?usp=sharing" readonly class="w-full p-3 rounded-xl bg-slate-900 border border-slate-600 text-xs text-white outline-none">
            </div>
            
            <div class="mb-4">
              <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Conteúdo Atual</label>
              <textarea id="database-content" placeholder="Carregando conteúdo do banco de dados..." class="w-full h-40 bg-slate-900 border border-slate-600 rounded-xl p-3 text-sm text-white outline-none resize-none"></textarea>
            </div>
            
            <div class="flex gap-2">
              <button onclick="window.loadDatabaseContent()" class="flex-1 bg-sky-600 text-white py-2 rounded-lg text-xs font-bold">
                <i class="fas fa-download mr-1"></i>Carregar
              </button>
              <button onclick="window.saveDatabaseContent()" class="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold">
                <i class="fas fa-upload mr-1"></i>Salvar
              </button>
              <button onclick="window.clearDatabaseContent()" class="flex-1 bg-rose-600 text-white py-2 rounded-lg text-xs font-bold">
                <i class="fas fa-trash mr-1"></i>Limpar
              </button>
            </div>
          </div>
          
          <!-- Operações em Lote -->
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h4 class="text-xs font-bold text-amber-400 mb-3">Operações em Lote</h4>
            <div class="space-y-3">
              <div>
                <label class="text-[10px] text-amber-300 font-bold ml-1 uppercase">Tipo de Operação</label>
                <select id="batch-operation" class="w-full p-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white outline-none">
                  <option value="add">Adicionar Registros</option>
                  <option value="update">Atualizar Registros</option>
                  <option value="delete">Excluir Registros</option>
                  <option value="backup">Backup Completo</option>
                </select>
              </div>
              <textarea id="batch-data" placeholder="Dados para operação em lote (JSON)..." class="w-full h-24 bg-slate-900 border border-slate-600 rounded-lg p-2 text-xs text-white outline-none resize-none"></textarea>
              <button onclick="window.executeBatchOperation()" class="w-full bg-purple-600 text-white py-2 rounded-lg text-xs font-bold">
                <i class="fas fa-cogs mr-1"></i>Executar Operação
              </button>
            </div>
          </div>
        </div>
        
        <!-- Métricas -->
        <div id="admin-metrics" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <h3 class="text-sm font-bold text-amber-400 mb-3">
              <i class="fas fa-chart-line mr-2"></i>Métricas e Configurações
            </h3>
            
            <div class="space-y-4">
              <!-- Métricas de Desempenho -->
              <div>
                <h4 class="text-xs font-bold text-amber-300 mb-2">Desempenho da IA</h4>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-slate-900 p-3 rounded-lg">
                    <div class="text-[9px] text-slate-400">Tempo Resposta</div>
                    <div class="text-lg font-bold text-emerald-400" id="metric-response-time">0.0s</div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg">
                    <div class="text-[9px] text-slate-400">Taxa Sucesso</div>
                    <div class="text-lg font-bold text-sky-400" id="metric-success-rate">0%</div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg">
                    <div class="text-[9px] text-slate-400">Conversas/Dia</div>
                    <div class="text-lg font-bold text-amber-400" id="metric-conversations">0</div>
                  </div>
                  <div class="bg-slate-900 p-3 rounded-lg">
                    <div class="text-[9px] text-slate-400">Satisfação</div>
                    <div class="text-lg font-bold text-rose-400" id="metric-satisfaction">0.0</div>
                  </div>
                </div>
              </div>
              
              <!-- Configurações Personalizáveis -->
              <div>
                <h4 class="text-xs font-bold text-amber-300 mb-2">Configurações da IA</h4>
                <div class="space-y-3">
                  <div>
                    <label class="text-[10px] text-slate-400 font-bold ml-1 uppercase">Temperatura (0-1)</label>
                    <input type="range" id="config-temperature" min="0" max="1" step="0.1" value="0.7" class="w-full">
                    <div class="flex justify-between text-[9px] text-slate-500">
                      <span>Conservador</span>
                      <span id="temp-value">0.7</span>
                      <span>Criativo</span>
                    </div>
                  </div>
                  
                  <div>
                    <label class="text-[10px] text-slate-400 font-bold ml-1 uppercase">Max Tokens</label>
                    <input type="number" id="config-max-tokens" value="500" min="100" max="2000" class="w-full p-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white outline-none">
                  </div>
                  
                  <div>
                    <label class="text-[10px] text-slate-400 font-bold ml-1 uppercase">Personalidade Base</label>
                    <select id="config-personality" class="w-full p-2 rounded-lg bg-slate-900 border border-slate-600 text-xs text-white outline-none">
                      <option value="empathetic">Empático e Acolhedor</option>
                      <option value="professional">Profissional e Direto</option>
                      <option value="friendly">Amigável e Casual</option>
                      <option value="clinical">Clínico e Analítico</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <button onclick="window.saveMetricsConfig()" class="w-full bg-amber-600 text-white py-3 rounded-xl font-black uppercase tracking-wider shadow-lg">
                <i class="fas fa-save mr-2"></i>Salvar Configurações
              </button>
            </div>
          </div>
        </div>
        
        <!-- Logs -->
        <div id="admin-logs" class="hidden flex-1 overflow-y-auto pb-20">
          <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-sm font-bold text-amber-400">
                <i class="fas fa-list-alt mr-2"></i>Logs do Sistema
              </h3>
              <div class="flex gap-2">
                <button onclick="window.refreshLogs()" class="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded">
                  <i class="fas fa-sync"></i>
                </button>
                <button onclick="window.clearLogs()" class="text-xs bg-rose-600 text-white px-3 py-1 rounded">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div id="logs-container" class="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
              <div class="text-slate-500">Carregando logs...</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
