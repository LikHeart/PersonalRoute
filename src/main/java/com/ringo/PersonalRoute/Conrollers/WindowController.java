package com.ringo.PersonalRoute.Conrollers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WindowController {

    @GetMapping("/")
    public String landing() {
        return "main";
    }

    @GetMapping("/auth")
    public String auth() {
        return "auth";
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("pageTitle", "Главная · ТПУ");
        model.addAttribute("pageCss", "dashboard.css");
        model.addAttribute("pageJs", "dashboard.js");
        model.addAttribute("activeNav", "dashboard");
        model.addAttribute("crumb", "Главная");
        model.addAttribute("content", "pages/dashboard");
        return "layout";
    }

    @GetMapping("/events")
    public String events(Model model) {
        model.addAttribute("pageTitle", "События · ТПУ");
        model.addAttribute("pageCss", "events.css");
        model.addAttribute("pageJs", null);
        model.addAttribute("activeNav", "events");
        model.addAttribute("crumb", "События");
        model.addAttribute("content", "pages/events");
        return "layout";
    }

    @GetMapping("/chat")
    public String chat(Model model) {
        model.addAttribute("pageTitle", "ИИ-Помощник · ТПУ");
        model.addAttribute("pageCss", "chat.css");
        model.addAttribute("pageJs", "chat.js");
        model.addAttribute("activeNav", "chat");
        model.addAttribute("crumb", "ИИ-Помощник");
        model.addAttribute("content", "pages/chat");
        return "layout";
    }

    @GetMapping("/profile")
    public String profile(Model model) {
        model.addAttribute("pageTitle", "Профиль · ТПУ");
        model.addAttribute("pageCss", "profile.css");
        model.addAttribute("pageJs", null);
        model.addAttribute("activeNav", "profile");
        model.addAttribute("crumb", "Профиль");
        model.addAttribute("content", "pages/profile");
        return "layout";
    }
}