// admin.js - Funcionalidades Administrativas

// Variáveis globais administrativas
window.isAdmin = false;
window.adminPassword = "wr@2026";
window.trainingHistory = [];
window.metricsConfig = {
  temperature: 0.7,
  maxTokens: 500,
  personality: "empathetic"
};

// Verificar acesso administrativo
window.checkAdminAccess = function() {
  const password = prompt("Digite a senha administrativa:");
  if (password === window.adminPassword) {
    window.isAdmin = true;
    document.getElementById('admin-access').classList.remove('hidden');
    window.showTab('admin');
    window.loadAdminData();
    alert("Acesso administrativo concedido!");
  } else if (password !== null) {
    alert("Senha incorreta!");
  }
};

// Mostrar sub-abas administrativas
window.showAdminSubTab = function(tabId) {
  document.querySelectorAll('[id^="admin-"]').forEach(el => {
    if (el.id.startsWith('admin-') && el.id.includes('-') && !el.id.includes('btn')) {
      el.classList.add('hidden');
    }
  });
  document.getElementById(tabId).classList.remove('hidden');
  
  document.querySelectorAll('[id^="btn-admin-"]').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('btn-' + tabId).classList.add('active');
};

// Carregar dados administrativos
window.loadAdminData = function() {
  window.loadTrainingHistory();
  window.loadMetricsConfig();
  window.refreshLogs();
  window.updateMetricsDisplay();
};

// Enviar treinamento para IA
window.sendTrainingToAI = async function() {
  const trainingType = document.getElementById('training-type').value;
  const instruction = document.getElementById('training-input').value;
  const exampleUser = document.getElementById('example-user').value;
  const exampleIA = document.getElementById('example-ia').value;
  
  if (!instruction.trim()) {
    alert("Por favor, preencha a instrução de treinamento!");
    return;
  }
  
  const trainingData = {
    type: trainingType,
    instruction: instruction,
    exampleUser: exampleUser,
    exampleIA: exampleIA,
    timestamp: new Date().toISOString(),
    status: "pending"
  };
  
  try {
    // Enviar para API de treinamento
    const response = await fetch('/api/train', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Key': window.adminPassword
      },
      body: JSON.stringify(trainingData)
    });
    
    if (response.ok) {
      trainingData.status = "success";
      window.trainingHistory.unshift(trainingData);
      window.saveTrainingHistory();
      window.loadTrainingHistory();
      
      // Limpar formulário
      document.getElementById('training-input').value = '';
      document.getElementById('example-user').value = '';
      document.getElementById('example-ia').value = '';
      
      alert("Treinamento enviado com sucesso!");
    } else {
      throw new Error("Falha no envio");
    }
  } catch (error) {
    console.error("Erro no treinamento:", error);
    trainingData.status = "error";
    window.trainingHistory.unshift(trainingData);
    window.saveTrainingHistory();
    window.loadTrainingHistory();
    alert("Erro ao enviar treinamento. Tente novamente.");
  }
};

// Carregar histórico de treinamento
window.loadTrainingHistory = function() {
  const container = document.getElementById('training-history');
  const saved = localStorage.getItem('admin_training_history');
  
  if (saved) {
    window.trainingHistory = JSON.parse(saved);
  }
  
  if (window.trainingHistory.length === 0) {
    container.innerHTML = '<div class="text-[9px] text-slate-500 text-center py-4">Nenhum treinamento realizado ainda</div>';
    return;
  }
  
  container.innerHTML = window.trainingHistory.map(item => `
    <div class="bg-slate-900 p-3 rounded-lg border border-slate-600">
      <div class="flex justify-between items-center mb-2">
        <span class="text-[9px] font-bold ${item.status === 'success' ? 'text-emerald-400' : item.status === 'error' ? 'text-rose-400' : 'text-amber-400'}">
          ${item.type.toUpperCase()}
        </span>
        <span class="text-[8px] text-slate-500">
          ${new Date(item.timestamp).toLocaleString('pt-BR')}
        </span>
      </div>
      <div class="text-[10px] text-slate-300 mb-2">${item.instruction}</div>
      ${item.exampleUser ? `
        <div class="text-[9px] text-slate-400">
          <div class="text-amber-400">Usuário:</div> ${item.exampleUser}
          <div class="text-emerald-400">IA:</div> ${item.exampleIA}
        </div>
      ` : ''}
    </div>
  `).join('');
};

// Salvar histórico de treinamento
window.saveTrainingHistory = function() {
  localStorage.setItem('admin_training_history', JSON.stringify(window.trainingHistory));
};

// Carregar conteúdo do banco de dados
window.loadDatabaseContent = async function() {
  const textarea = document.getElementById('database-content');
  textarea.value = "Carregando...";
  
  try {
    // Simulação de carregamento do Google Drive
    // Na implementação real, usaria Google Drive API
    setTimeout(() => {
      const saved = localStorage.getItem('admin_database_content');
      textarea.value = saved || '';
    }, 1000);
  } catch (error) {
    console.error("Erro ao carregar banco de dados:", error);
    textarea.value = "Erro ao carregar conteúdo";
  }
};

// Salvar conteúdo do banco de dados
window.saveDatabaseContent = async function() {
  const content = document.getElementById('database-content').value;
  
  try {
    // Simulação de salvamento no Google Drive
    localStorage.setItem('admin_database_content', content);
    alert("Conteúdo salvo com sucesso!");
  } catch (error) {
    console.error("Erro ao salvar banco de dados:", error);
    alert("Erro ao salvar conteúdo");
  }
};

// Limpar conteúdo do banco de dados
window.clearDatabaseContent = function() {
  if (confirm("Tem certeza que deseja limpar todo o conteúdo do banco de dados?")) {
    document.getElementById('database-content').value = '';
    localStorage.removeItem('admin_database_content');
    alert("Conteúdo limpo!");
  }
};

// Executar operação em lote
window.executeBatchOperation = async function() {
  const operation = document.getElementById('batch-operation').value;
  const data = document.getElementById('batch-data').value;
  
  if (!data.trim()) {
    alert("Por favor, preencha os dados para a operação!");
    return;
  }
  
  try {
    const parsedData = JSON.parse(data);
    
    // Simulação de operação
    console.log("Executando operação:", operation, parsedData);
    
    // Na implementação real, enviaria para o backend
    alert(`Operação "${operation}" executada com ${parsedData.length || 1} registros!`);
    
    document.getElementById('batch-data').value = '';
  } catch (error) {
    alert("Erro: Formato JSON inválido!");
  }
};

// Carregar configurações de métricas
window.loadMetricsConfig = function() {
  const saved = localStorage.getItem('admin_metrics_config');
  if (saved) {
    window.metricsConfig = JSON.parse(saved);
  }
  
  // Atualizar UI
  document.getElementById('config-temperature').value = window.metricsConfig.temperature;
  document.getElementById('temp-value').textContent = window.metricsConfig.temperature;
  document.getElementById('config-max-tokens').value = window.metricsConfig.maxTokens;
  document.getElementById('config-personality').value = window.metricsConfig.personality;
  
  // Event listener para temperatura
  document.getElementById('config-temperature').addEventListener('input', function(e) {
    document.getElementById('temp-value').textContent = e.target.value;
    window.metricsConfig.temperature = parseFloat(e.target.value);
  });
};

// Salvar configurações de métricas
window.saveMetricsConfig = function() {
  window.metricsConfig.temperature = parseFloat(document.getElementById('config-temperature').value);
  window.metricsConfig.maxTokens = parseInt(document.getElementById('config-max-tokens').value);
  window.metricsConfig.personality = document.getElementById('config-personality').value;
  
  localStorage.setItem('admin_metrics_config', JSON.stringify(window.metricsConfig));
  alert("Configurações salvas com sucesso!");
};

// Atualizar display de métricas
window.updateMetricsDisplay = function() {
  // Simulação de métricas
  document.getElementById('metric-response-time').textContent = (Math.random() * 2 + 0.5).toFixed(1) + 's';
  document.getElementById('metric-success-rate').textContent = Math.floor(Math.random() * 20 + 80) + '%';
  document.getElementById('metric-conversations').textContent = Math.floor(Math.random() * 50 + 10);
  document.getElementById('metric-satisfaction').textContent = (Math.random() * 2 + 3).toFixed(1);
};

// Atualizar logs
window.refreshLogs = function() {
  const container = document.getElementById('logs-container');
  const logs = [
    `[${new Date().toLocaleTimeString()}] INFO: Sistema inicializado`,
    `[${new Date().toLocaleTimeString()}] INFO: IA Hugging Face conectada`,
    `[${new Date().toLocaleTimeString()}] INFO: Usuário autenticado`,
    `[${new Date().toLocaleTimeString()}] DEBUG: Chat iniciado`,
    `[${new Date().toLocaleTimeString()}] INFO: Treinamento recebido`,
    `[${new Date().toLocaleTimeString()}] WARNING: Alta taxa de requisições`,
    `[${new Date().toLocaleTimeString()}] ERROR: Falha na API - resolvido`
  ];
  
  container.innerHTML = logs.map(log => 
    `<div class="text-[10px] ${log.includes('ERROR') ? 'text-rose-400' : log.includes('WARNING') ? 'text-amber-400' : log.includes('INFO') ? 'text-emerald-400' : 'text-slate-400'}">${log}</div>`
  ).join('');
};

// Limpar logs
window.clearLogs = function() {
  if (confirm("Tem certeza que deseja limpar todos os logs?")) {
    document.getElementById('logs-container').innerHTML = '<div class="text-slate-500">Logs limpos</div>';
  }
};

// Inicialização administrativa
document.addEventListener('DOMContentLoaded', function() {
  // Verificar se já está logado como admin
  if (sessionStorage.getItem('admin_logged_in') === 'true') {
    window.isAdmin = true;
    document.getElementById('admin-access').classList.remove('hidden');
  }
  
  // Atualizar métricas a cada 30 segundos
  setInterval(() => {
    if (window.isAdmin) {
      window.updateMetricsDisplay();
    }
  }, 30000);
});
