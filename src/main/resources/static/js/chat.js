document.addEventListener('DOMContentLoaded', () => {
    const sendBtn      = document.getElementById('send-btn');
    const chatInput    = document.getElementById('chat-input');
    const chatMessages = document.querySelector('.chat-messages');

    if (!sendBtn || !chatInput || !chatMessages) return;

    // ================= ИДЕНТИФИКАТОР РАЗГОВОРА =================
    let conversationId = localStorage.getItem('chatConversationId');
    if (!conversationId) {
        conversationId = 'chat-' + Math.random().toString(36).slice(2) + Date.now();
        localStorage.setItem('chatConversationId', conversationId);
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatText(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/&lt;b&gt;/g, "<b>").replace(/&lt;\/b&gt;/g, "</b>")
            .replace(/&lt;ul&gt;/g, "<ul>").replace(/&lt;\/ul&gt;/g, "</ul>")
            .replace(/&lt;li&gt;/g, "<li>").replace(/&lt;\/li&gt;/g, "</li>")
            .replace(/&lt;a href="([^"]+)"&gt;/g, '<a href="$1" target="_blank" style="color: #14B8A6; text-decoration: underline;">')
            .replace(/&lt;\/a&gt;/g, "</a>");
    }

    function appendUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'message-row user';
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = text;
        div.appendChild(bubble);
        chatMessages.appendChild(div);
        scrollToBottom();
    }

    async function sendMessage(customText = null) {
        const text = customText || chatInput.value.trim();
        if (!text) return;

        appendUserMessage(text);
        if (!customText) chatInput.value = '';
        sendBtn.disabled = true;

        const replyDiv = document.createElement('div');
        replyDiv.className = 'message-row bot';
        const replyBubble = document.createElement('div');
        replyBubble.className = 'msg-bubble';
        replyBubble.textContent = 'Думает...';
        replyDiv.appendChild(replyBubble);
        chatMessages.appendChild(replyDiv);
        scrollToBottom();

        try {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationId: conversationId
                })
            });

            if (!response.ok) throw new Error('HTTP ' + response.status);

            const data = await response.json();
            replyBubble.textContent = '';

            let i = 0;
            const fullText = data.reply;

            function type() {
                if (i < fullText.length) {
                    replyBubble.innerHTML = formatText(fullText.substring(0, i + 2));
                    i += 2;
                    scrollToBottom();
                    setTimeout(type, 10);
                } else {
                    renderBotResponse(replyBubble, fullText);
                }
            }
            type();

        } catch (e) {
            console.error(e);
            replyBubble.textContent = 'Ошибка связи с сервером.';
        } finally {
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    function renderBotResponse(container, fullText) {
        // 1. Обработка [SUGGESTIONS]
        const suggestionsRegex = /\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/;
        const matchSug = fullText.match(suggestionsRegex);
        if (matchSug) {
            const suggestionsText = matchSug[1].trim();
            fullText = fullText.replace(suggestionsRegex, '').trim();
            const suggestions = suggestionsText.split('\n').map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(s => s.length > 0);
            updateQuickReplies(suggestions);
        }

        // 2. Обработка [GOAL]
        const goalRegex = /\[GOAL\]([\s\S]*?)\[\/GOAL\]/;
        const matchGoal = fullText.match(goalRegex);
        let goalHtml = "";
        if (matchGoal) {
            try {
                const goalData = JSON.parse(matchGoal[1].trim());
                goalHtml = `
                    <div class="goal-card" style="margin-top: 16px; margin-bottom: 0; text-align: left; background: #fff; border: 1px solid #E3EBE8; padding: 15px; border-radius: 12px; display: flex; align-items: center;">
                        <div class="goal-icon" style="width: 40px; height: 40px; background: #DDF6F1; color: #0F8F82; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-weight: bold; margin-right: 15px;">&lt;/&gt;</div>
                        <div class="goal-info" style="flex-grow: 1;">
                            <h4 style="font-size: 8px; color: #8C9996; margin-bottom: 2px; text-transform: uppercase;">МОЯ НОВАЯ ЦЕЛЬ</h4>
                            <h3 style="font-size: 16px; margin-bottom: 4px; color: #172522;">${goalData.title}</h3>
                            <p style="font-size: 10px; color: #74817E; margin: 0;">${goalData.description}</p>
                        </div>
                        <div style="font-size: 12px; font-weight: bold; color: #14B8A6; margin-left: 10px;">
                            ${goalData.totalWeeks} нед.
                        </div>
                    </div>
                `;
                fullText = fullText.replace(goalRegex, '').trim();
            } catch (e) {
                console.error("Ошибка парсинга цели", e);
            }
        }

        // 3. Обработка [BUTTONS]
        const buttonsRegex = /\[BUTTONS\]([\s\S]*?)\[\/BUTTONS\]/;
        const matchButtons = fullText.match(buttonsRegex);
        let buttonsHtml = "";
        if (matchButtons) {
            try {
                const data = JSON.parse(matchButtons[1].trim());
                buttonsHtml = `<div style="margin-top: 10px; font-weight: 600;">${data.text}</div><div class="chat-buttons">`;
                data.buttons.forEach(btn => {
                    const safeValue = btn.value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    buttonsHtml += `<button class="chat-btn" onclick="window.handleQuickReply('${safeValue}')">${btn.text}</button>`;
                });
                buttonsHtml += '</div>';
                fullText = fullText.replace(buttonsRegex, '').trim();
            } catch (e) {
                console.error("Ошибка парсинга кнопок", e);
            }
        }

        // 4. Очистка Markdown-заголовков (на случай если модель их выдала)
        let cleanText = fullText.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/^##.*$/gm, '');

        // Собираем итоговый HTML: сначала карточка цели (если есть), потом текст, потом кнопки
        container.innerHTML = goalHtml + formatText(cleanText) + buttonsHtml;
    }

    function updateQuickReplies(suggestions) {
        const container = document.querySelector('.quick-replies');
        if (!container) return;

        container.innerHTML = '';

        suggestions.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'quick-reply';
            btn.textContent = text;
            btn.addEventListener('click', () => {
                if (sendBtn.disabled) return;
                sendMessage(text);
            });
            container.appendChild(btn);
        });
    }

    window.handleQuickReply = function(value) {
        document.querySelectorAll('.chat-buttons').forEach(el => el.remove());
        sendMessage(value);
    };

    sendBtn.addEventListener('click', () => sendMessage());

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    document.querySelectorAll('.quick-reply').forEach(el => {
        el.addEventListener('click', () => {
            if (sendBtn.disabled) return;
            sendMessage(el.textContent.trim());
        });
    });
});