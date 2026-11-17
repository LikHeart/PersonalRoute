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
            .replace(/&lt;\/a&gt;/g, "</a>")
            .replace(/&lt;br\s*\/?&gt;/g, "<br>")
            .replace(/\\n/g, "<br>")
            .replace(/\n/g, "<br>");
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

        const token = localStorage.getItem('jwtToken');

        if (!token) {
            appendUserMessage(text);
            const div = document.createElement('div');
            div.className = 'message-row bot';
            div.innerHTML = '<div class="msg-bubble" style="color: #EF746D;">Для общения с помощником необходимо <a href="/auth" style="color: #EF746D; text-decoration: underline;">войти в аккаунт</a>.</div>';
            chatMessages.appendChild(div);
            scrollToBottom();
            return;
        }

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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            replyBubble.textContent = e.message;
        } finally {
            sendBtn.disabled = false;
            chatInput.focus();
        }
    }

    function renderBotResponse(container, fullText) {
        // 1. Обработка [GOAL]
        const goalRegex = /\[GOAL\]([\s\S]*?)\[\/GOAL\]/;
        const matchGoal = fullText.match(goalRegex);
        let goalHtml = "";
        if (matchGoal) {
            try {
                let goalStr = matchGoal[1].trim();
                if (goalStr.startsWith('"') && goalStr.endsWith('"')) {
                    goalStr = goalStr.slice(1, -1).replace(/\\"/g, '"');
                }
                goalStr = goalStr.replace(/\n/g, '\\n'); // Фикс переносов
                const goalData = JSON.parse(goalStr);
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
            } catch (e) { console.error("Ошибка парсинга цели", e); }
        }

        // 2. Обработка [BUTTONS]
        let buttonsHtml = "";
        let jsonToParse = null;

        const buttonsRegex = /\[BUTTONS\]([\s\S]*?)\[\/BUTTONS\]/;
        const matchButtons = fullText.match(buttonsRegex);

        if (matchButtons) {
            jsonToParse = matchButtons[1].trim();
            fullText = fullText.replace(buttonsRegex, '').trim();
        } else {
            const rawArrayRegex = /\[\s*\{\s*"text"[\s\S]*?\}\s*\]/;
            const matchRaw = fullText.match(rawArrayRegex);
            if (matchRaw) {
                jsonToParse = matchRaw[0];
                fullText = fullText.replace(rawArrayRegex, '').trim();
            }
        }

        if (jsonToParse) {
            try {
                if (jsonToParse.startsWith('"') && jsonToParse.endsWith('"')) {
                    jsonToParse = jsonToParse.slice(1, -1);
                }
                jsonToParse = jsonToParse.replace(/\\"/g, '"');

                if (jsonToParse.startsWith('[')) {
                    jsonToParse = `{"text":"Выберите вариант:", "buttons":${jsonToParse}}`;
                }

                // 🚨 ГЛАВНЫЙ ФИКС: Заменяем сырые переносы строк и одиночные слэши на безопасные
                jsonToParse = jsonToParse.replace(/\\\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '');

                const data = JSON.parse(jsonToParse);

                const questionText = data.text ? data.text.replace(/\\n/g, '<br>').replace(/\n/g, '<br>') : '';

                buttonsHtml = `<div style="margin-top: 10px; font-weight: 600;">${questionText}</div><div class="chat-buttons">`;
                data.buttons.forEach(btn => {
                    buttonsHtml += `<button class="chat-btn" data-value="${btn.value.replace(/"/g, '&quot;')}">${btn.text}</button>`;
                });
                buttonsHtml += '</div>';

            } catch (e) {
                console.error("Ошибка парсинга кнопок:", e, jsonToParse);
            }
        }

        // 3. Очищаем от остатков [SUGGESTIONS]
        let cleanText = fullText.replace(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/g, '').trim();

        container.innerHTML = goalHtml + formatText(cleanText) + buttonsHtml;

        container.querySelectorAll('.chat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chat-buttons').forEach(el => el.remove());
                sendMessage(btn.getAttribute('data-value'));
            });
        });
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