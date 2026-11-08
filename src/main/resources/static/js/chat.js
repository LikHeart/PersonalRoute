document.addEventListener('DOMContentLoaded', () => {
    const sendBtn      = document.getElementById('send-btn');
    const chatInput    = document.getElementById('chat-input');
    const chatMessages = document.querySelector('.chat-messages');

    if (!sendBtn || !chatInput || !chatMessages) return;

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
                body: JSON.stringify({ message: text })
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
        const suggestionsRegex = /\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/;
        const matchSug = fullText.match(suggestionsRegex);

        if (matchSug) {
            const suggestionsText = matchSug[1].trim();
            fullText = fullText.replace(suggestionsRegex, '').trim();

            const suggestions = suggestionsText
                .split('\n')
                .map(s => s.replace(/^[-•*]\s*/, '').trim())
                .filter(s => s.length > 0);

            updateQuickReplies(suggestions);
        }

        let cleanText = fullText.replace(/<!\[CDATA\[|\]\]>/g, '');
        const xmlRegex = /<askWithButtons\s+text="([^"]+)"\s+buttons=(?:"([^"]+)"|(\[.*?\]))\s*\/?>/g;

        let match;
        let lastIndex = 0;
        let htmlResult = "";

        while ((match = xmlRegex.exec(cleanText)) !== null) {
            htmlResult += formatText(cleanText.substring(lastIndex, match.index));

            const questionText = match[1];
            const buttonsJsonStr = match[2] || match[3];

            let buttonsHtml = `<div style="margin-top: 10px; font-weight: 600;">${questionText}</div><div class="chat-buttons">`;
            try {
                const cleanJson = buttonsJsonStr.replace(/&quot;/g, '"');
                const buttonsData = JSON.parse(cleanJson);
                buttonsData.forEach(btn => {
                    const safeValue = btn.value.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    buttonsHtml += `<button class="chat-btn" onclick="window.handleQuickReply('${safeValue}')">${btn.text}</button>`;
                });
            } catch (e) { console.error("Ошибка парсинга кнопок", e); }
            buttonsHtml += '</div>';

            htmlResult += buttonsHtml;
            lastIndex = xmlRegex.lastIndex;
        }

        htmlResult += formatText(cleanText.substring(lastIndex));
        container.innerHTML = htmlResult;
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