package com.ringo.PersonalRoute.Services;

import com.ringo.PersonalRoute.entity.Task;
import com.ringo.PersonalRoute.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskService {
    private final TaskRepository taskRepository;

    public Task saveTask(Task task) {
        return taskRepository.save(task);
    }
}