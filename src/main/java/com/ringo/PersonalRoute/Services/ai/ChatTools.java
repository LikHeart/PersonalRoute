package com.ringo.PersonalRoute.Services.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatTools {

    private final ObjectMapper objectMapper;

    public record Button(String text, String value) {}
    public record Goal(String title, String description, int totalWeeks) {}
    private record ButtonsPayload(String text, List<Button> buttons) {}

    @Tool(description = "Используй этот инструмент, если хочешь задать пользователю уточняющий вопрос",
            returnDirect = true)
    public String askWithButtons(String text, List<Button> buttons) {
        try {
            String json = objectMapper.writeValueAsString(new ButtonsPayload(text, buttons));
            return "[BUTTONS]" + json + "[/BUTTONS]";
        } catch (Exception e) {
            log.error("Ошибка кнопок", e);
            return "Ошибка кнопок";
        }
    }


    @Tool(description = "Используй этот инструмент, когда ты собрал всю информацию и готов составить план...")
    public String setGoal(String title, String description, int totalWeeks) {
        try {
            Goal goal = new Goal(title, description, totalWeeks);
            String json = objectMapper.writeValueAsString(goal);
            return "[GOAL]" + json + "[/GOAL]";
        } catch (Exception e) {
            log.error("Ошибка цели", e);
            return "Ошибка цели";
        }
    }
}