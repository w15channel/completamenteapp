/**
 * WR TERAPIA - Motor de Humanização Orgânica
 * v2.1 - Diretrizes comportamentais dos atendentes
 */

window.submitChat = async function (t, isAudio = false) {
    if (!t || window.isWaiting) return;

    const chatId = `${window.clientId}_${window.activeTherapist.id}`;
    const chatInput = document.getElementById('chat-input');
    const typingBox = document.getElementById('typing-box');
    const submitBtn = document.getElementById('submit-btn');
    const micBtn = document.getElementById('mic-btn');

    if (chatInput) chatInput.value = '';

    window.isWaiting = true;
    if (submitBtn) submitBtn.disabled = true;
    if (micBtn) micBtn.disabled = true;

    const userWordCount = t.trim().split(/\s+/).length;
    let h = [];

    if (db) {
        const snap = await db.ref(`chats/${chatId}`).once('value');
        h = snap.val() || [];
        h.push({ role: 'user', content: t, isAudio });
        await db.ref(`chats/${chatId}`).set(h);
    } else {
        h = window.getLocalHistory(window.activeTherapist.id);
        h.push({ role: 'user', content: t, isAudio });
        localStorage.setItem(`chat_${chatId}`, JSON.stringify(h));
        window.refreshChatDisplay(h);
    }

    if (window.isBotPaused) {
        typingBox.classList.remove('hidden');
        typingBox.innerHTML = '<i class="fas fa-user-md mr-1"></i> Equipe humana está acompanhando...';
        return;
    }

    const startTimestamp = Date.now();

    try {
        const userMessages = h.filter((message) => message.role === 'user').map((message) => message.content || '');
        const assistantCount = h.filter((message) => message.role === 'assistant').length;
        const totalUserWords = userMessages.join(' ').trim().split(/\s+/).filter(Boolean).length;

        const punctuationRate = /[!?]/.test(t) ? 'usa interrogação/exclamação com frequência' : 'pouco uso de exclamação e interrogação';
        const upperCaseRate = (t.match(/[A-ZÀ-Ú]/g) || []).length >= 5 ? 'gosta de ênfase em maiúsculas' : 'ênfase mais sutil';
        const emojiRate = /[\u{1F300}-\u{1FAFF}]/u.test(t) ? 'usa emojis' : 'não usa emojis';
        const colloquialMarkers = /\b(tô|ta|pq|vc|cê|tipo|né|mano|cara|vamo|tbm)\b/i.test(t)
            ? 'linguagem mais coloquial'
            : 'linguagem mais neutra';

        let volumeInstruction = '';
        if (assistantCount === 0) {
            volumeInstruction = 'Primeira resposta do dia: no máximo 300 caracteres, até 2 frases curtas e acolhimento equilibrado.';
        } else if (userWordCount <= 6) {
            volumeInstruction = 'Paciente foi objetivo. Responda com até 220 caracteres, 1 ou 2 frases curtas.';
        } else if (userWordCount > 30 || totalUserWords > 140) {
            volumeInstruction = 'Paciente abriu espaço e trouxe mais detalhes. Responda com profundidade proporcional, até 900 caracteres.';
        } else {
            volumeInstruction = 'Mantenha conversa natural e progressiva, entre 220 e 450 caracteres, sem blocos longos.';
        }

        const syntacticMirroringInstruction = [
            'Espelhamento sintático obrigatório (espelhar forma, não conteúdo):',
            `- Perfil observado do paciente: ${punctuationRate}; ${upperCaseRate}; ${emojiRate}; ${colloquialMarkers}.`,
            '- Replique ritmo, tamanho médio de frase e nível de formalidade do paciente.',
            '- Reutilize de forma natural expressões e conectivos recorrentes do paciente quando fizer sentido.',
            '- Nunca copie frases literalmente e nunca mude o assunto para espelhar contexto.'
        ].join('\n');

        const attendantLanguageInstruction = [
            `Você é ${window.activeTherapist.name}, profissional de saúde mental e atendente virtual principal.`,
            'Diretrizes de comportamento (não alterar estrutura do sistema, apenas a comunicação):',
            '- Seja acolhedor no início para criar vínculo e, depois, investigativo para entender a queixa.',
            '- Não encaminhe o paciente para outro profissional durante a conversa.',
            '- Comunicação natural, humana e não formal.',
            '- Estruture frases com frequência usando padrão: preposição + pronome + verbo no infinitivo.',
            '- Exemplos de estilo: "para eu entender", "por você falar", "sem ele perceber", "até nós descobrirmos", "para eu ajudar".',
            '- Fale em segunda pessoa (você) e mantenha foco no tema trazido pelo paciente.',
            '- Evite jargão técnico desnecessário e respostas mecânicas.',
            '- Após investigar o contexto, apresente possibilidade diagnóstica em percentual de compatibilidade.',
            '- Em seguida, explique didaticamente o significado da possibilidade diagnóstica em linguagem simples.',
            '- Não use o termo "não posso diagnosticar"; use sempre "possibilidade diagnóstica" com percentual.'
        ].join('\n');

        const hasAssistantMessages = h.some((message) => message.role === 'assistant');
        const firstInteractionInstruction = hasAssistantMessages
            ? 'Não é a primeira interação; manter continuidade natural do atendimento.'
            : 'É a primeira interação; iniciar com saudação receptiva e acolhedora.';

        const messagesForAI = h.map((m, idx) => {
            if (idx === h.length - 1) {
                return {
                    role: m.role,
                    content: `${m.content}\n\n[SISTEMA: ${volumeInstruction}]\n[SISTEMA: ${firstInteractionInstruction}]\n[SISTEMA: ${syntacticMirroringInstruction}]\n[SISTEMA: ${attendantLanguageInstruction}]`
                };
            }
            return { role: m.role, content: m.content };
        });

        const res = await fetch(window.AI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesForAI,
                temperature: 0.8,
                max_tokens: assistantCount === 0 ? 160 : (userWordCount < 7 ? 140 : (userWordCount > 30 ? 420 : 260))
            })
        });

        if (!res.ok) throw new Error('Falha na comunicação.');
        const data = await res.json();
        const rt = data.choices[0].message.content;

        const apiDuration = Date.now() - startTimestamp;
        let readWait = userWordCount < 6 ? 2500 : 8500;
        readWait = Math.max(readWait - apiDuration, 500);

        const responseWordCount = rt.split(/\s+/).length;
        let typeWait = Math.round((responseWordCount / 130) * 60000);
        if (typeWait > 14000) typeWait = 14000;
        if (typeWait < 2000) typeWait = 2000;

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

                const mc = document.getElementById('chat-messages');
                if (mc) mc.scrollTop = mc.scrollHeight;
            }, typeWait);
        }, readWait);
    } catch (err) {
        console.error('Erro na geração orgânica:', err);
        typingBox.classList.add('hidden');
        window.isWaiting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (micBtn) micBtn.disabled = false;
    }
};

console.log('🚀 Método de Linguagem Orgânica WR-TEC Ativado.');
