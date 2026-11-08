package com.ringo.PersonalRoute.Services.ai;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatTools {

    public record Button(String text, String value) {}

    @Tool(description = "Используй этот инструмент, если хочешь задать пользователю уточняющий вопрос и предложить ему варианты ответов в виде кнопок. " +
            "text — сам вопрос, buttons — список кнопок. В каждой кнопке text — что написано на кнопке, value — что отправится в чат при нажатии.")
    public String askWithButtons(String text, List<Button> buttons) {
        return "Вопрос с кнопками успешно сформирован.";
    }
}