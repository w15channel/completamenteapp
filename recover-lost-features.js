// Script de Recuperação de Funcionalidades Perdidas
// Execute este código para restaurar as funcionalidades identificadas

console.log("🚀 Iniciando recuperação de funcionalidades perdidas...");

// 1. RESTAURAR SISTEMA DE SONHOS
console.log("📙 Restaurando Sistema de Sonhos...");

// Inicializar array de sonhos se não existir
if (!window.dreamHistory) {
    window.dreamHistory = [];
}

window.saveDream = function() {
    const input = document.getElementById('dream-input');
    if (!input || !input.value.trim()) {
        alert("Por favor, descreva seu sonho antes de salvar.");
        return;
    }
    
    const dream = { 
        text: input.value.trim(), 
        date: new Date().toLocaleString('pt-BR'),
        timestamp: Date.now()
    };
    
    window.dreamHistory.unshift(dream);
    input.value = '';
    
    // Renderizar sonhos
    window.renderDreams();
    
    // Salvar no Firebase se disponível
    if (window.db && window.clientId) {
        try {
            window.db.ref('users/' + window.clientId + '/dreams').set(window.dreamHistory);
            console.log("💭 Sonho salvo no Firebase");
        } catch (error) {
            console.error("❌ Erro ao salvar sonho no Firebase:", error);
        }
    } else {
        // Salvar no localStorage como fallback
        localStorage.setItem('wr_dreams', JSON.stringify(window.dreamHistory));
        console.log("💭 Sonho salvo no localStorage");
    }
    
    // Feedback visual
    window.showNotification("Sonho guardado com sucesso! ✨");
};

window.renderDreams = function() {
    const list = document.getElementById('dream-list');
    if (!list) return;
    
    if (window.dreamHistory.length === 0) {
        list.innerHTML = '<p class="text-slate-500 text-center py-4">Nenhum sonho registrado ainda. Compartilhe seu primeiro sonho! 🌙</p>';
        return;
    }
    
    list.innerHTML = window.dreamHistory.map((dream, index) => `
        <div class="nutri-hist-item p-4 rounded-xl flex justify-between items-start animate-fade-in gap-2 bg-white/5 backdrop-blur-sm border border-white/10">
            <div class="flex-1 min-w-0">
                <p class="text-white text-sm leading-relaxed">${dream.text}</p>
                <p class="text-[8px] text-slate-500 font-bold mt-2">${dream.date}</p>
            </div>
            <button onclick="window.deleteDream(${index})" 
                class="text-[10px] px-2 py-1 rounded bg-rose-900/40 border border-rose-500/40 text-rose-300 hover:bg-rose-800/60 transition-colors">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
};

window.deleteDream = function(index) {
    if (confirm("Tem certeza que deseja excluir este sonho?")) {
        window.dreamHistory.splice(index, 1);
        window.renderDreams();
        
        // Atualizar storage
        if (window.db && window.clientId) {
            window.db.ref('users/' + window.clientId + '/dreams').set(window.dreamHistory);
        } else {
            localStorage.setItem('wr_dreams', JSON.stringify(window.dreamHistory));
        }
        
        window.showNotification("Sonho excluído");
    }
};

window.loadDreams = function() {
    // Tentar carregar do Firebase primeiro
    if (window.db && window.clientId) {
        window.db.ref('users/' + window.clientId + '/dreams').once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (data && Array.isArray(data)) {
                    window.dreamHistory = data;
                    window.renderDreams();
                }
            })
            .catch(error => {
                console.log("Carregando sonhos do localStorage...");
                loadDreamsFromLocalStorage();
            });
    } else {
        loadDreamsFromLocalStorage();
    }
};

function loadDreamsFromLocalStorage() {
    const saved = localStorage.getItem('wr_dreams');
    if (saved) {
        try {
            window.dreamHistory = JSON.parse(saved);
            window.renderDreams();
        } catch (error) {
            console.error("Erro ao carregar sonhos do localStorage:", error);
        }
    }
}

// 2. RESTAURAR SISTEMA DE ESPERANÇA
console.log("✨ Restaurando Sistema de Esperança...");

window.generateHope = async function() {
    const loader = document.getElementById('hope-loader');
    const content = document.getElementById('hope-content');
    const btn = document.getElementById('hope-btn');
    
    if (!loader || !content || !btn) {
        console.warn("Elementos do sistema de esperança não encontrados");
        return;
    }
    
    btn.disabled = true;
    content.classList.add('hidden');
    loader.classList.remove('hidden');
    
    const hopePhrases = [
        "Tudo passa. Você é mais forte do que imagina. 💪",
        "Respire fundo. Este momento também passará. 🌸",
        "Amanhã será melhor. Cada dia é uma nova oportunidade. 🌅",
        "Você é forte. Já superou tanto, vai superar isso também. ⭐",
        "Sua paz é prioridade. Cuide de você primeiro. 🧘",
        "Você não está sozinho(a). Estou aqui com você. 🤗",
        "A escuridão não dura para sempre. O sol vai nascer. ☀️",
        "Você é luz. Brilhe, mesmo com medo. ✨",
        "Dê um passo de cada vez. Pequenas vitórias importam. 🚶",
        "Você merece paz. Permita-se sentir e curar. 🕊️"
    ];
    
    try {
        // Simular tempo de carregamento para experiência melhor
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const selectedPhrase = hopePhrases[Math.floor(Math.random() * hopePhrases.length)];
        const textElement = document.getElementById('hope-text');
        
        if (textElement) {
            textElement.innerText = selectedPhrase;
        }
        
        loader.classList.add('hidden');
        content.classList.remove('hidden');
        
        // Animar entrada
        content.style.opacity = '0';
        content.style.transform = 'scale(0.9)';
        setTimeout(() => {
            content.style.transition = 'all 0.5s ease';
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
        }, 100);
        
        console.log("✨ Mensagem de esperança gerada");
        
    } catch (e) {
        console.error("Erro ao gerar mensagem de esperança:", e);
        const textElement = document.getElementById('hope-text');
        if (textElement) {
            textElement.innerText = "Respire. Você é luz. ✨";
        }
        loader.classList.add('hidden');
        content.classList.remove('hidden');
    } finally { 
        btn.disabled = false; 
    }
};

// 3. RESTAURAR RECONHECIMENTO DE VOZ
console.log("🎤 Restaurando Reconhecimento de Voz...");

window.initSpeechRecognition = function() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.log("❌ Reconhecimento de voz não suportado neste navegador");
        // Mostrar mensagem para o usuário
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.style.display = 'none';
            micBtn.title = "Reconhecimento de voz não suportado";
        }
        return false;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (e) => { 
        const transcript = e.results[0][0].transcript;
        const confidence = e.results[0][0].confidence;
        
        console.log(`🎤 Transcrição: "${transcript}" (confiança: ${confidence})`);
        
        const input = document.getElementById('chat-input');
        if (input) {
            input.value = transcript;
            input.focus();
            
            // Disparar evento de input para atualizar UI
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
        }
        
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.remove('mic-active');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
        
        recognition.stop();
        
        // Feedback visual
        window.showNotification(`🎤 "${transcript}"`);
    };
    
    recognition.onerror = (e) => {
        console.error('❌ Erro no reconhecimento de voz:', e.error);
        
        let errorMessage = "Erro no reconhecimento de voz";
        switch(e.error) {
            case 'no-speech':
                errorMessage = "Nenhum discurso detectado";
                break;
            case 'audio-capture':
                errorMessage = "Não foi possível capturar áudio";
                break;
            case 'not-allowed':
                errorMessage = "Permissão para microfone negada";
                break;
            case 'network':
                errorMessage = "Erro de rede no reconhecimento";
                break;
        }
        
        window.showNotification(errorMessage, "error");
        
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.remove('mic-active');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    };
    
    recognition.onend = () => {
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.remove('mic-active');
            micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    };
    
    window.speechRecognition = recognition;
    console.log("✅ Reconhecimento de voz inicializado");
    return true;
};

window.toggleMic = function() {
    if (!window.speechRecognition) {
        const initialized = window.initSpeechRecognition();
        if (!initialized) return;
    }
    
    const btn = document.getElementById('mic-btn');
    if (!btn) return;
    
    try {
        if (btn.classList.contains('mic-active')) { 
            window.speechRecognition.stop(); 
            btn.classList.remove('mic-active'); 
            btn.innerHTML = '<i class="fas fa-microphone"></i>';
            btn.title = "Clique para falar";
        } else { 
            window.speechRecognition.start(); 
            btn.classList.add('mic-active'); 
            btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
            btn.title = "Gravando... clique para parar";
            
            // Feedback visual
            btn.style.animation = 'pulse 1s infinite';
        }
    } catch (error) {
        console.error("Erro ao controlar microfone:", error);
        window.showNotification("Erro ao acessar microfone", "error");
    }
};

// 4. SISTEMA DE NOTIFICAÇÕES (AUXILIAR)
window.showNotification = function(message, type = "success") {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-medium text-sm animate-fade-in shadow-lg max-w-sm`;
    
    // Definir cor baseada no tipo
    switch(type) {
        case 'error':
            notification.classList.add('bg-rose-600');
            break;
        case 'warning':
            notification.classList.add('bg-amber-600');
            break;
        default:
            notification.classList.add('bg-emerald-600');
    }
    
    notification.textContent = message;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
};

// 5. INICIALIZAÇÃO AUTOMÁTICA
console.log("🔧 Inicializando sistemas recuperados...");

// Inicializar reconhecimento de voz quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.initSpeechRecognition();
        console.log("🎤 Reconhecimento de voz verificado");
    }, 2000);
});

// Carregar sonhos salvos
setTimeout(() => {
    window.loadDreams();
    console.log("💭 Sonhos carregados");
}, 3000);

// Adicionar estilos CSS para animações
const style = document.createElement('style');
style.textContent = `
    .mic-active {
        background: linear-gradient(45deg, #ef4444, #dc2626) !important;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
`;
document.head.appendChild(style);

console.log("✅ Funcionalidades perdidas recuperadas com sucesso!");
console.log("📋 Funcionalidades disponíveis:");
console.log("   - 💭 Sistema de Sonhos (saveDream, renderDreams, loadDreams)");
console.log("   - ✨ Sistema de Esperança (generateHope)");
console.log("   - 🎤 Reconhecimento de Voz (toggleMic, initSpeechRecognition)");
console.log("   - 🔔 Sistema de Notificações (showNotification)");

// Exportar para verificação
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveDream: window.saveDream,
        renderDreams: window.renderDreams,
        generateHope: window.generateHope,
        toggleMic: window.toggleMic,
        initSpeechRecognition: window.initSpeechRecognition,
        showNotification: window.showNotification
    };
}
