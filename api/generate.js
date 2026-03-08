/**
 * WR TERAPIA - Chat nativo
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
        const assistantCount = h.filter((message) => message.role === 'assistant').length;
        const maxResponseChars = assistantCount === 0 ? 220 : 320;
        const messagesForAI = h.map((message) => ({ role: message.role, content: message.content }));

        const res = await fetch(window.AI_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesForAI,
                temperature: 0.7,
                max_tokens: assistantCount === 0 ? 160 : 280
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
        console.error('Erro na geração nativa:', err);
        typingBox.classList.add('hidden');
        window.isWaiting = false;
        if (submitBtn) submitBtn.disabled = false;
        if (micBtn) micBtn.disabled = false;
    }
};

console.log('🚀 Chat nativo ativado.');
