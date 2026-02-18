/**
 * WR TERAPIA - Motor de Humanização Orgânica
 * v2.0 - Foco em Proporcionalidade e Imperceptibilidade
 */

window.submitChat = async function(t, isAudio = false) {
    if (!t || window.isWaiting) return;

    const chatId = `${window.clientId}_${window.activeTherapist.id}`;
    const chatInput = document.getElementById('chat-input');
    const typingBox = document.getElementById('typing-box');
    const submitBtn = document.getElementById('submit-btn');
    const micBtn = document.getElementById('mic-btn');

    // Limpeza imediata do input para feedback visual de envio
    if (chatInput) chatInput.value = '';
    
    window.isWaiting = true;
    if (submitBtn) submitBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;

    // --- 1. ANÁLISE DE PROPORÇÃO (Métrica Humana) ---
    const userMessageLength = t.trim().length; // Caracteres
    const userWordCount = t.trim().split(/\s+/).length; // Palavras
    let h = [];

    // Persistência da mensagem do usuário
    if (db) {
        const snap = await db.ref(`chats/${chatId}`).once('value');
        h = snap.val() || [];
        h.push({ role: 'user', content: t, isAudio: isAudio });
        await db.ref(`chats/${chatId}`).set(h);
    } else {
        h = window.getLocalHistory(window.activeTherapist.id);
        h.push({ role: 'user', content: t, isAudio: isAudio });
        localStorage.setItem(`chat_${chatId}`, JSON.stringify(h));
        window.refreshChatDisplay(h);
    }

    // Se o bot estiver pausado (atendimento humano assumido)
    if (window.isBotPaused) {
        typingBox.classList.remove('hidden');
        typingBox.innerHTML = '<i class="fas fa-user-md mr-1"></i> William está acompanhando...';
        return;
    }

    const startTimestamp = Date.now();

    try {
        // --- 2. REGRA DE OURO: Instrução de Volume Dinâmico ---
        // Aqui dizemos à IA como se comportar baseada no tamanho da pergunta
        let volumeInstruction = "";
        if (userWordCount <= 4) {
            volumeInstruction = "O paciente foi breve (saudação ou frase curta). Responda com no máximo 2 frases. Seja direto e acolhedor.";
        } else if (userWordCount > 25) {
            volumeInstruction = "O paciente desabafou. Ofereça uma escuta profunda, valide os sentimentos e responda com um volume de texto similar ao dele.";
        } else {
            volumeInstruction = "Mantenha um tom de conversa natural. Não use listas e nem textos excessivamente longos.";
        }

        const attendantLanguageInstruction = [
            "Regra obrigatória para todos os atendentes:",
            "- Produzir frases curtas (máximo de 200 caracteres por frase).",
            "- Manter linguagem ligada a problemas pessoais trazidos pelo paciente.",
            "- Usar tom pessoal, informal e acolhedor.",
            "- Preferir verbos no infinitivo pessoal quando possível.",
            "- Falar diretamente com o paciente em segunda pessoa do singular (você).",
            "- Avaliar o tom e a urgência emocional do paciente antes de responder.",
            "- Seguir a sequência de interação e reiniciar o ciclo ao final:",
            "  1) mensagem direta;",
            "  2) mensagem com pergunta;",
            "  3) reforço da resposta;",
            "  4) outro reforço da resposta;",
            "  5) reforço com pergunta;",
            "  6) novo reforço da resposta;",
            "  7) mensagem de preocupação;",
            "  8) avaliar novamente o tom da necessidade do paciente e repetir o padrão."
        ].join("\n");

        const messagesForAI = h.map((m, idx) => {
            if (idx === h.length - 1) {
                return {
                    role: m.role,
                    content: `${m.content}\n\n[SISTEMA: ${volumeInstruction}]\n[SISTEMA: ${attendantLanguageInstruction}]`
                };
            }
            return { role: m.role, content: m.content };
        });

        // Chamada para a API
        const res = await fetch(window.AI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                messages: messagesForAI, 
                temperature: 0.8, // Mais criatividade/humanidade
                max_tokens: userWordCount < 5 ? 120 : 500 
            })
        });

        if (!res.ok) throw new Error("Falha na comunicação.");
        const data = await res.json();
        const rt = data.choices[0].message.content;
        
        const apiDuration = Date.now() - startTimestamp;

        // --- 3. LÓGICA DE TEMPO REALÍSTICO ---
        
        // A) Delay de Leitura (O tempo que o terapeuta leva para ler o que o paciente mandou)
        // Se a mensagem for curta: 2s. Se for longa: até 9s.
        let readWait = userWordCount < 6 ? 2500 : 8500;
        readWait = Math.max(readWait - apiDuration, 500);

        // B) Delay de Escrita (Simulando a digitação humana)
        // Média de 130 palavras por minuto.
        const responseWordCount = rt.split(/\s+/).length;
        let typeWait = Math.round((responseWordCount / 130) * 60000);
        
        // Limitadores para não frustrar o usuário (máximo 14 segundos de "digitando")
        if (typeWait > 14000) typeWait = 14000;
        if (typeWait < 2000) typeWait = 2000;

        // Execução da sequência humana
        setTimeout(() => {
            if (window.isBotPaused) return;
            
            typingBox.innerHTML = 'Digitando <span class="animate-pulse">...</span>';
            typingBox.classList.remove('hidden');

            setTimeout(async () => {
                if (window.isBotPaused) return;

                h.push({ role: 'assistant', content: rt });

                if (db) {
                    await db.ref(`chats/${chatId}`).set(h);
                } else {
                    localStorage.setItem(`chat_${chatId}`, JSON.stringify(h));
                    window.refreshChatDisplay(h);
                }

                typingBox.classList.add('hidden');
                window.isWaiting = false;
                if (submitBtn) submitBtn.disabled = false;
                if (micBtn) micBtn.disabled = false;

                // Scroll para a última mensagem
                const mc = document.getElementById('chat-messages');
                if (mc) mc.scrollTop = mc.scrollHeight;

            }, typeWait);
        }, readWait);

    } catch (err) {
        console.error("Erro na geração orgânica:", err);
        typingBox.classList.add('hidden');
        window.isWaiting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (micBtn) micBtn.disabled = false;
    }
};

// Log de Inicialização no console para controle do Admin
console.log("🚀 Método de Linguagem Orgânica WR-TEC Ativado.");
