package com.ringo.PersonalRoute.Conrollers;

import com.ringo.PersonalRoute.Services.ai.ChatTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatClient chatClient;
    private final ChatTools chatTools;

    @Value("classpath:prompts/cat-assistant.txt")
    private Resource systemPromptResource;



    public ChatController(ChatClient.Builder chatClientBuilder, ChatTools chatTools) {
        this.chatClient = chatClientBuilder.build();
        this.chatTools = chatTools;
    }

    @PostMapping("/chat/stream")
    public Map<String, String> chatStream(@RequestBody Map<String, String> body) throws IOException {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            return Map.of("reply", "Напиши, что тебя беспокоит — я помогу разобраться.");
        }
        String systemPrompt = new String(systemPromptResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        try {
            String reply = chatClient.prompt()
                    .system(systemPrompt)
                    .user(message)
                    .tools(chatTools)
                    .call()
                    .content();
            return Map.of("reply", reply != null ? reply : "Пустой ответ от модели.");
        } catch (Exception e) {
            System.err.println("Ошибка генерации: " + e.getMessage());
            return Map.of("reply", "Ошибка генерации: " + e.getMessage());
        }
    }
}