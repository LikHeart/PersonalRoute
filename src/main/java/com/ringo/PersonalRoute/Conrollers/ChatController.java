package com.ringo.PersonalRoute.Conrollers;

import com.ringo.PersonalRoute.Services.ai.ChatTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatClient chatClient;
    private final ChatTools chatTools;

    private static final String SYSTEM_PROMPT = """
            Ты — «Кот-помощник», дружелюбный ИИ-ассистент для студентов ТПУ.
            Твоя задача — помогать с учебой: разбивать задачи на шаги, подсказывать сроки и составлять планы.
            Тебе нужны - цель, срок, первоначальные навыки, интересы.
            
            СТРОГИЕ ПРАВИЛА:
            1. Если пользователь не назвал что-то — ты ОБЯЗАН использовать инструмент `askWithButtons`, чтобы задать вопрос и показать кнопки. Причем ТОЛЬКО ОДИН вопрос за раз.
            2. Если ты уже знаешь всё, что нужно — составь подробный план по неделям. Используй HTML-теги <ul> и <li>. Выделяй важное тегом <b>.
            3. Пиши кратко, дружелюбно, на «ты».
            4. КОГДА ТЫ СОСТАВЛЯЕШЬ ИТОГОВЫЙ ПЛАН, ты ОБЯЗАН сначала вызвать инструмент `setGoal`, чтобы сохранить цель. И только после этого писать текст плана.
            5. В САМОМ КОНЦЕ каждого своего ответа, (после всего текста) ты ОБЯЗАН написать блок с подсказками для пользователя в формате:
               [SUGGESTIONS]
               - Подсказка 1 (от 2 до 5 слов)
               - Подсказка 2 (от 2 до 5 слов)
               - Подсказка 3 (от 2 до 5 слов)
               [/SUGGESTIONS]
            """;

    public ChatController(ChatClient chatClient, ChatTools chatTools) {
        this.chatClient = chatClient;
        this.chatTools = chatTools;
    }

    @PostMapping("/chat/stream")
    public Map<String, String> chatStream(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            return Map.of("reply", "Напиши, что тебя беспокоит — я помогу разобраться.");
        }
        String conversationId = "user:" + authentication.getName();
        ChatTools.LAST_BUTTONS.remove();
        ChatTools.LAST_GOAL.remove();
        try {
            String reply = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(message)
                    .tools(chatTools)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();
            return Map.of("reply", reply != null ? reply.trim() : "Пустой ответ от модели.");
        } catch (Exception e) {
            return Map.of("reply", "Не удалось получить ответ. Попробуйте позже.");
        } finally {
            ChatTools.LAST_BUTTONS.remove();
            ChatTools.LAST_GOAL.remove();
        }
    }
}