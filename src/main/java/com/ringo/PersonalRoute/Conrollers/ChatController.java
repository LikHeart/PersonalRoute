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
            2. Если ты уже знаешь всё, что нужно — составь подробный план по неделям. Используй HTML-теги <ul> и <li>. Выделяй важное тегом <b>.
            3. Пиши кратко, дружелюбно, на «ты».
            4. КОГДА ТЫ ГОТОВ СОСТАВИТЬ ПЛАН, ты ОБЯЗАН сначала вызвать инструмент `setGoal`, чтобы сохранить цель. И только после этого написать текст плана.
            5. Если ты вызвал `setGoal`, ты ОБЯЗАН написать текст плана в этом же ответе.
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

            // --- АГРЕССИВНАЯ ЧИСТКА ОТВЕТА ---
            // Модели иногда оборачивают весь ответ в кавычки, как будто это JSON-строка
            reply = reply.trim();
            if (reply.startsWith("\"") && reply.endsWith("\"")) {
                reply = reply.substring(1, reply.length() - 1);
            }
            reply = reply.replace("\\\"", "\"");
            reply = reply.replace("\\n", "\n");

            // Логируем для отладки
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