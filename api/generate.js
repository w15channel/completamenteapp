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

    const buildUserStyleProfile = (userTexts = []) => {
        const joined = userTexts.join(' ').trim();
        const sample = joined || t;
        const punctuationHits = (sample.match(/[!?]/g) || []).length;
        const uppercaseHits = (sample.match(/[A-ZÀ-Ú]/g) || []).length;
        const emojiHits = (sample.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length;
        const colloquialHits = (sample.match(/\b(tô|ta|pq|vc|cê|tipo|né|mano|cara|vamo|tbm)\b/gi) || []).length;

        const sentences = sample.split(/[.!?]+/).map((chunk) => chunk.trim()).filter(Boolean);
        const totalWords = sample.split(/\s+/).filter(Boolean).length;
        const avgWordsPerSentence = sentences.length
            ? Math.round(totalWords / sentences.length)
            : Math.max(totalWords, userWordCount);

        const expressionBank = ['acho', 'sinto', 'preciso', 'quero', 'talvez', 'porque', 'então', 'assim', 'na real', 'de boa', 'tipo', 'né'];
        const recurringExpressions = expressionBank
            .filter((exp) => new RegExp(`\\b${exp.replace(/\s+/g, '\\s+')}\\b`, 'i').test(sample))
            .slice(0, 4);

        return {
            punctuationStyle: punctuationHits >= Math.max(2, userTexts.length) ? 'usa interrogação/exclamação com frequência' : 'pouco uso de exclamação e interrogação',
            emphasisStyle: uppercaseHits >= 6 ? 'gosta de ênfase em maiúsculas' : 'ênfase mais sutil',
            emojiStyle: emojiHits > 0 ? 'usa emojis' : 'não usa emojis',
            formalityStyle: colloquialHits >= 2 ? 'linguagem mais coloquial' : 'linguagem mais neutra',
            avgWordsPerSentence: Math.min(Math.max(avgWordsPerSentence, 4), 24),
            recurringExpressions
        };
    };

    const trimToCharacterLimit = (text, maxChars) => {
        if (!maxChars || text.length <= maxChars) return text;

        const safeText = text.slice(0, maxChars + 1);
        const lastPunctuation = Math.max(safeText.lastIndexOf('.'), safeText.lastIndexOf('!'), safeText.lastIndexOf('?'));
        if (lastPunctuation >= Math.floor(maxChars * 0.6)) {
            return safeText.slice(0, lastPunctuation + 1).trim();
        }

        const lastSpace = safeText.lastIndexOf(' ');
        return (lastSpace > 0 ? safeText.slice(0, lastSpace) : safeText.slice(0, maxChars)).trim();
    };
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

        const userStyleProfile = buildUserStyleProfile(userMessages);

        let maxResponseChars = 420;

        let volumeInstruction = '';
        if (assistantCount === 0) {
            maxResponseChars = 300;
            volumeInstruction = 'Primeira resposta do dia: no máximo 300 caracteres, até 2 frases curtas e acolhimento equilibrado.';
        } else if (userWordCount <= 8) {
            maxResponseChars = 240;
            volumeInstruction = 'Paciente foi objetivo. Responda com até 240 caracteres, 1 ou 2 frases curtas.';
        } else if (userWordCount > 35 || totalUserWords > 180) {
            maxResponseChars = 780;
            volumeInstruction = 'Paciente abriu espaço e trouxe mais detalhes. Aprofunde gradualmente, até 780 caracteres.';
        } else {
            maxResponseChars = 460;
            volumeInstruction = 'Mantenha conversa natural e progressiva, entre 220 e 460 caracteres, sem blocos longos.';
        }

        const syntacticMirroringInstruction = [
            'Espelhamento sintático obrigatório (espelhar forma, não conteúdo):',
            `- Perfil observado do paciente: ${userStyleProfile.punctuationStyle}; ${userStyleProfile.emphasisStyle}; ${userStyleProfile.emojiStyle}; ${userStyleProfile.formalityStyle}.`,
            `- Mantenha frases com média próxima de ${userStyleProfile.avgWordsPerSentence} palavras para acompanhar o ritmo do paciente.`,
            userStyleProfile.recurringExpressions.length
                ? `- Expressões recorrentes identificadas: ${userStyleProfile.recurringExpressions.join(', ')}. Use de forma natural quando fizer sentido.`
                : '- Poucas expressões recorrentes ainda; observe o padrão e ajuste gradualmente.',
            '- Nunca copie frases literalmente e nunca mude o assunto para espelhar contexto.'
        ].join('\n');

        const attendantLanguageInstruction = [
            `Você é ${window.activeTherapist.name}, profissional de saúde mental e atendente virtual principal.`,
            'Diretrizes de comportamento (não alterar estrutura do sistema, apenas a comunicação):',
            '- Use linguagem nativa no estilo Grok: fluida, direta, natural e calor humano, sem robotização.',
            '- Priorize sempre 3 bases de cuidado: (1) acolher a dor, (2) demonstrar preocupação genuína com a pessoa, (3) validar a importância do que ela sente.',
            '- Seja acolhedor no início para criar vínculo e, depois, investigativo para entender a queixa.',
            '- Não encaminhe o paciente para outro profissional durante a conversa.',
            '- Comunicação natural, humana e não formal.',
            '- Estruture frases com frequência usando padrão: preposição + pronome + verbo no infinitivo.',
            '- Exemplos de estilo: "para eu entender", "por você falar", "sem ele perceber", "até nós descobrirmos", "para eu ajudar".',
            '- Fale em segunda pessoa (você) e mantenha foco no tema trazido pelo paciente.',
            '- Evite jargão técnico desnecessário e respostas mecânicas.',
            '- Desenvolva uma linha de comunicação natural, adequada ao contexto emocional e progressiva na investigação.',
            '- Quando houver sinais de condição atípica/patológica, use DSM-5, CSBI-13 e PATHOS como referência avaliativa de apoio.',
            '- Após investigar o contexto, apresente possibilidade diagnóstica em percentual de compatibilidade.',
            '- Em seguida, explique didaticamente o significado da possibilidade diagnóstica em linguagem simples.',
            '- Trate possibilidade diagnóstica como uma avaliação clínica inicial da IA para orientar compreensão do quadro.',
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
                max_tokens: assistantCount === 0 ? 140 : (userWordCount <= 8 ? 130 : (userWordCount > 35 ? 360 : 240))
            })
        });

        if (!res.ok) throw new Error('Falha na comunicação.');
        const data = await res.json();
        const rt = trimToCharacterLimit(data.choices[0].message.content, maxResponseChars);

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
