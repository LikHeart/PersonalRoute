package com.ringo.PersonalRoute.Conrollers;

import com.ringo.PersonalRoute.Services.ai.ChatTools;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatClient chatClient;
    private final ChatTools chatTools;

    private static final String SYSTEM_PROMPT = """
            Ты — «Кот-помощник», дружелюбный ИИ-ассистент для студентов ТПУ.
            Твоя задача — помогать с учебой: разбивать задачи на шаги, подсказывать сроки и составлять планы.
            
            СТРОГИЕ ПРАВИЛА:
            1. Если тебе не хватает информации (нет цели, сроков или навыков), ты ОБЯЗАН вызвать инструмент `askWithButtons`.
               КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО писать варианты ответов текстом в виде списков (1, 2, 3 или -).
            2. Пиши кратко, дружелюбно, на «ты».
            3. КОГДА ТЫ ГОТОВ СОСТАВИТЬ ПЛАН (у тебя есть цель, срок и навыки), ты ОБЯЗАН СДЕЛАТЬ ДВЕ ВЕЩИ:
               - В САМОМ НАЧАЛЕ своего ответа (до текста плана) напиши скрытый тег с данными цели в формате:
                 [GOAL]{"title":"Краткое название цели","description":"Краткое описание","totalWeeks":24}[/GOAL]
                 (где 24 — это количество недель в твоем плане).
               - Сразу после этого тега напиши подробный план по неделям с использованием HTML-тегов <ul> и <li>.
            4. Если пользователь просит ДОБАВИТЬ ЗАДАЧУ:
   - Проверь, есть ли в тексте НАЗВАНИЕ задачи и КОНКРЕТНЫЙ ДЕДЛАЙН (дата и время).
   - Если дедлайна нет, или задача непонятна — ОБЯЗАТЕЛЬНО используй инструмент `askWithButtons`, чтобы уточнить недостающее (например, предложи кнопки "Сегодня", "Завтра", "На следующей неделе").
   - Если всё есть — ОБЯЗАТЕЛЬНО вызови инструмент `addTask`.
""";

    @PostMapping("/chat/stream")
    public Map<String, String> chatStream(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        if (authentication == null) {
            return Map.of("reply", "Ошибка авторизации. Пожалуйста, войдите в аккаунт заново.");
        }

        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            return Map.of("reply", "Напиши, что тебя беспокоит — я помогу разобраться.");
        }

        String conversationId = "user:" + authentication.getName();

        try {
            String reply = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(message)
                    .tools(chatTools)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();

            if (reply == null) reply = "";

            // --- ЧИСТКА ОТВЕТА ---
            reply = reply.trim();
            if (reply.startsWith("\"") && reply.endsWith("\"")) {
                reply = reply.substring(1, reply.length() - 1);
            }
            reply = reply.replace("\\\"", "\"").replace("\\n", "\n");

            // --- ХИТРЫЙ ПАРСЕР ---
            // Если модель написала план, но забыла тег [GOAL], мы добавим его сами
            if (reply.contains("<ul>") && !reply.contains("[GOAL]")) {
                // Пытаемся вытащить название цели из первого тега <b> или <strong>
                String title = "Мой план обучения";
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("<(?:b|strong)>(.*?)</(?:b|strong)>").matcher(reply);
                if (m.find()) {
                    title = m.group(1).replaceAll("<[^>]*>", "").trim(); // Убираем вложенные теги
                    if (title.length() > 50) title = title.substring(0, 47) + "...";
                }

                // Считаем количество недель (ищем слово "недел" и числа рядом)
                int weeks = 12; // По умолчанию
                java.util.regex.Matcher wm = java.util.regex.Pattern.compile("(\\d+)\\s*(?:недел|месяц)").matcher(reply.toLowerCase());
                if (wm.find()) {
                    try {
                        int num = Integer.parseInt(wm.group(1));
                        weeks = wm.group(0).contains("месяц") ? num * 4 : num;
                    } catch (Exception ignored) {}
                }

                String fakeGoal = String.format("[GOAL]{\"title\":\"%s\",\"description\":\"Персональный план обучения\",\"totalWeeks\":%d}[/GOAL]\n", title, weeks);
                reply = fakeGoal + reply;
            }

            System.out.println("=== ОТВЕТ МОДЕЛИ ===");
            System.out.println(reply);
            System.out.println("====================");

            if (reply.isBlank()) {
                return Map.of("reply", "Кот задумался... Попробуй ещё раз или напиши свой ответ текстом. 🐾");
            }

            return Map.of("reply", reply.trim());

        } catch (Exception e) {
            log.error("Chat generation failed", e);
            return Map.of("reply", "Не удалось получить ответ. Попробуйте позже.");
        }
    }
}