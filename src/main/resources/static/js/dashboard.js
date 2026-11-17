document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('quick-task-input');
    const btn = document.getElementById('quick-task-btn');

    if (!btn) return;

    btn.addEventListener('click', async () => {
        const text = input.value.trim();
        if (!text) return;

        // Блокируем кнопку на время запроса
        btn.disabled = true;
        btn.textContent = 'Думает...';

        try {
            const token = localStorage.getItem('jwtToken');
            // Отправляем запрос в чат (наш ИИ)
            const res = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: `Добавь задачу: ${text}`,
                    conversationId: 'user:' + localStorage.getItem('userName') // Временный ID
                })
            });

            const data = await res.json();

            // Если ИИ ответил, что задача создана (или задал вопрос)
            alert(data.reply); // Показываем ответ ИИ (успех или вопрос)

            // Если задача создана успешно, перезагружаем страницу, чтобы обновить доску
            if (data.reply.includes("успешно создана") || data.reply.includes("[TASK_CREATED]")) {
                window.location.reload(); // Простой способ перерисовать доску
            }

        } catch (e) {
            console.error(e);
            alert('Ошибка связи с ИИ');
        } finally {
            btn.disabled = false;
            btn.textContent = '＋ Добавить';
            input.value = '';
        }
    });
});