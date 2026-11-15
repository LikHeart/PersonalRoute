package com.ringo.PersonalRoute.Conrollers;

import com.ringo.PersonalRoute.Services.JwtService;
import com.ringo.PersonalRoute.Services.MailService;
import com.ringo.PersonalRoute.entity.User;
import com.ringo.PersonalRoute.Services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MailController {

    private final MailService mailService;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // Rate Limit: email -> время последней отправки
    private final Map<String, LocalDateTime> lastSendTimes = new ConcurrentHashMap<>();
    private static final int SEND_COOLDOWN_SECONDS = 60;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Email не указан"));

        // Проверка на @tpu.ru на бэкенде
        if (!email.toLowerCase().endsWith("@tpu.ru"))
            return ResponseEntity.badRequest().body(Map.of("error", "Допустима только корпоративная почта @tpu.ru"));

        // Rate Limiting
        LocalDateTime lastTime = lastSendTimes.get(email);
        if (lastTime != null && lastTime.plusSeconds(SEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            return ResponseEntity.status(429).body(Map.of("error", "Подождите минуту перед повторной отправкой."));
        }

        try {
            mailService.sendCode(email);
            lastSendTimes.put(email, LocalDateTime.now());
            return ResponseEntity.ok(Map.of("message", "Код отправлен"));
        } catch (Exception e) {
            log.error("Send-code error for {}", email, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Не удалось отправить код. Попробуйте позже."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String code = body.get("code");

        if (name == null || email == null || password == null || code == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Все поля обязательны"));

        if (!email.toLowerCase().endsWith("@tpu.ru"))
            return ResponseEntity.badRequest().body(Map.of("error", "Допустима только корпоративная почта @tpu.ru"));

        if (password.length() < 8)
            return ResponseEntity.badRequest().body(Map.of("error", "Пароль должен быть не менее 8 символов"));

        if (userService.isEmailTaken(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь уже существует"));

        if (!mailService.verifyCode(email, code))
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный или истёкший код"));

        String hashedPassword = passwordEncoder.encode(password);
        userService.registerUser(name, email, hashedPassword);

        String token = jwtService.generateToken(email, name);

        return ResponseEntity.ok(Map.of(
                "message", "Аккаунт успешно создан",
                "token", token,
                "name", name
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        // Authentication будет null, если JwtAuthenticationFilter не нашел токен
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("error", "Неавторизован"));
        }

        // Возвращаем данные текущего пользователя
        return ResponseEntity.ok(Map.of(
                "email", authentication.getName(),
                "authenticated", true
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Введите почту и пароль"));

        Optional<User> userOptional = userService.findByEmail(email);

        if (userOptional.isEmpty() || !passwordEncoder.matches(password, userOptional.get().getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверная почта или пароль"));
        }

        User user = userOptional.get();
        String token = jwtService.generateToken(user.getEmail(), user.getName());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "name", user.getName()
        ));
    }
}