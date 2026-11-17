package com.ringo.PersonalRoute.Services.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;
import com.ringo.PersonalRoute.Services.TaskService;
import com.ringo.PersonalRoute.entity.Task;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDateTime;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatTools {

    private final ObjectMapper objectMapper;

    public record Button(String text, String value) {}
    public record Goal(String title, String description, int totalWeeks) {}
    private record ButtonsPayload(String text, List<Button> buttons) {}

    @Tool(description = "Используй этот инструмент, если хочешь задать пользователю уточняющий вопрос и показать варианты ответов в виде кнопок.")
    public String askWithButtons(String text, List<Button> buttons) {
        try {
            String json = objectMapper.writeValueAsString(new ButtonsPayload(text, buttons));
            return "[BUTTONS]" + json + "[/BUTTONS]";
        } catch (Exception e) {
            log.error("Ошибка кнопок", e);
            return "Ошибка кнопок";
        }
    }

    @Tool(description = "ОБЯЗАТЕЛЬНО вызови этот инструмент, когда соберешь всю информацию (уровень, время, цель). " +
            "title — краткое название цели (например, 'Стать Java-разработчиком'), " +
            "description — краткое описание цели, " +
            "totalWeeks — сколько всего недель займет план.")
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
    private final TaskService taskService;

    @Tool(description = "Создай задачу, если пользователь четко указал, ЧТО нужно сделать и КОГДА (дедлайн). " +
            "Если не хватает данных, верни ошибку. " +
            "status должен быть 'urgent' (если дедлайн сегодня/завтра), 'week' (если на этой неделе) или 'process' (если позже).")
    public String addTask(String title, String description, String deadlineIso) {
        try {
            // Получаем email текущего пользователя
            String email = SecurityContextHolder.getContext().getAuthentication().getName();

            LocalDateTime deadline = LocalDateTime.parse(deadlineIso);

            Task task = new Task();
            task.setTitle(title);
            task.setDescription(description);
            task.setDeadline(deadline);
            task.setUserEmail(email);

            // Логика распределения по колонкам
            LocalDateTime now = LocalDateTime.now();
            long daysUntil = java.time.Duration.between(now, deadline).toDays();

            if (daysUntil <= 2) task.setStatus("urgent");
            else if (daysUntil <= 7) task.setStatus("week");
            else task.setStatus("process");

            taskService.saveTask(task);

            return "Задача успешно создана!";
        } catch (Exception e) {
            return "Ошибка создания задачи: " + e.getMessage();
        }
    }
}