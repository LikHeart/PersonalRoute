package com.ringo.PersonalRoute.config;

import com.ringo.PersonalRoute.Services.ai.WebTools;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ChatClientConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder, WebTools webTools) {
        return builder
                .defaultTools(webTools)
                .build();
    }
}