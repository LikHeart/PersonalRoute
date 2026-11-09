package com.ringo.PersonalRoute.Services.ai;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatTools {

    public record Button(String text, String value) {}
    public record Goal(String title, String description, int totalWeeks) {}

    public static final ThreadLocal<String> LAST_BUTTONS = new ThreadLocal<>();
    public static final ThreadLocal<String> LAST_GOAL = new ThreadLocal<>();

    @Tool(description = "Используй этот инструмент, если хочешь задать пользователю уточняющий вопрос и предложить ему варианты ответов в виде кнопок. " +
            "text — сам вопрос, buttons — список кнопок. В каждой кнопке text — что написано на кнопке, value — что отправится в чат при нажатии.")
    public String askWithButtons(String text, List<Button> buttons) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String buttonsJson = mapper.writeValueAsString(buttons);
            LAST_BUTTONS.set("[BUTTONS]" + "{\"text\":\"" + text.replace("\"", "\\\"") + "\", \"buttons\":" + buttonsJson + "}" + "[/BUTTONS]");
        } catch (Exception e) {
            LAST_BUTTONS.set("");
        }
        return "Вопрос с кнопками успешно сформирован.";
    }

    @Tool(description = "Используй этот инструмент, когда ты собрал всю информацию (цель, сроки, навыки) и готов составить итоговый план. " +
            "title — краткое название цели (например, 'Стать Java-разработчиком'), description — краткое описание цели, totalWeeks — примерное количество недель на достижение цели.")
    public String setGoal(String title, String description, int totalWeeks) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Goal goal = new Goal(title, description, totalWeeks);
            String goalJson = mapper.writeValueAsString(goal);
            LAST_GOAL.set("[GOAL]" + goalJson + "[/GOAL]");
        } catch (Exception e) {
            LAST_GOAL.set("");
        }
        return "Цель успешно сохранена.";
    }
}