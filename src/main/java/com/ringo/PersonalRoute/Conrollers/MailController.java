package com.ringo.PersonalRoute.Conrollers;

import com.ringo.PersonalRoute.Services.JwtService;
import com.ringo.PersonalRoute.Services.MailService;
import com.ringo.PersonalRoute.entity.User;
import com.ringo.PersonalRoute.Services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MailController {

    private final MailService mailService;
    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Email не указан"));
        try {
            mailService.sendCode(email);
            return ResponseEntity.ok(Map.of("message", "Код отправлен"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Ошибка отправки: " + e.getMessage()));
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

        if (!mailService.verifyCode(email, code))
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный или истёкший код"));

        if (userService.isEmailTaken(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь уже существует"));

        String hashedPassword = passwordEncoder.encode(password);
        userService.registerUser(name, email, hashedPassword);

        String token = jwtService.generateToken(email, name);

        return ResponseEntity.ok(Map.of(
                "message", "Аккаунт успешно создан",
                "token", token,
                "name", name
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Введите почту и пароль"));

        Optional<User> userOptional = userService.findByEmail(email);
        if (userOptional.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "Пользователь не найден"));

        User user = userOptional.get();

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Неверный пароль"));
        }

        String token = jwtService.generateToken(user.getEmail(), user.getName());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "name", user.getName()
        ));
    }
}