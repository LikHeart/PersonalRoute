package com.ringo.PersonalRoute.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    private static final int MAX_ATTEMPTS = 5;
    private static final int CODE_TTL_MINUTES = 10;

    private final Map<String, CodeData> codes = new ConcurrentHashMap<>();

    // Добавили поле attempts для защиты от перебора
    private record CodeData(String code, LocalDateTime expiresAt, int attempts) {}

    public void sendCode(String email) {
        String code = String.format("%05d", ThreadLocalRandom.current().nextInt(100_000));
        codes.put(email, new CodeData(code, LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES), 0));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("Код подтверждения — ТПУ Мой маршрут");
            helper.setText(buildHtmlEmail(code), true);
            mailSender.send(message);
            log.info("Verification code sent to {}", email);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", email, e);
            throw new RuntimeException("Ошибка при формировании письма", e);
        }
    }

    public boolean verifyCode(String email, String inputCode) {
        CodeData data = codes.get(email);
        if (data == null) return false;

        if (LocalDateTime.now().isAfter(data.expiresAt())) {
            codes.remove(email);
            return false;
        }

        if (data.attempts() >= MAX_ATTEMPTS) {
            codes.remove(email);
            log.warn("Too many attempts for {}", email);
            return false;
        }

        // Constant-time сравнение
        boolean matches = MessageDigest.isEqual(
                data.code().getBytes(StandardCharsets.UTF_8),
                inputCode.getBytes(StandardCharsets.UTF_8)
        );

        if (matches) {
            codes.remove(email);
            return true;
        } else {
            // Инкрементируем попытку
            codes.put(email, new CodeData(data.code(), data.expiresAt(), data.attempts() + 1));
            return false;
        }
    }

    // Очистка просроченных кодов каждый час, чтобы не росла память
    @Scheduled(fixedRate = 3_600_000)
    public void cleanupExpiredCodes() {
        LocalDateTime now = LocalDateTime.now();
        codes.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt()));
    }

    private String buildHtmlEmail(String code) {
        return """ 
            <!DOCTYPE html>
                        <html lang="ru">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Код подтверждения</title>
                        </head>
                        <body style="margin: 0; padding: 0; background-color: #F5F6F0; font-family: 'Inter', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F5F6F0; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <!-- Карточка -->
                                        <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(32,55,45,0.06); border: 1px solid #DEE5DA;">
            
                                            <!-- Шапка (зеленая) -->
                                            <tr>
                                                <td align="center" style="background-color: #146C54; padding: 40px 20px;">
                                                    <div style="display: inline-block; width: 48px; height: 48px; background-color: #FFFFFF; color: #146C54; border-radius: 12px; font-size: 24px; font-weight: 800; line-height: 48px; text-align: center; margin-bottom: 16px;">
                                                        M
                                                    </div>
                                                    <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">Мой маршрут · ТПУ</h1>
                                                </td>
                                           </tr>
            
                                            <!-- Контент -->
                                            <tr>
                                                <td style="padding: 40px 32px;">
                                                    <h2 style="margin: 0 0 16px 0; color: #20372D; font-size: 24px; font-weight: 700; text-align: center;">Подтверждение почты</h2>
                                                    <p style="margin: 0 0 32px 0; color: #78877E; font-size: 15px; line-height: 1.6; text-align: center;">
                                                        Вы запросили код для входа в сервис.<br>Введите его на сайте:
                                                    </p>
            
                                                    <!-- Блок с кодом -->
                                                    <div style="background-color: #E0F0DE; border: 2px dashed #146C54; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                                        <span style="font-size: 36px; font-weight: 800; color: #146C54; letter-spacing: 12px; padding-left: 12px;">%s</span>
                                                    </div>
            
                                                    <p style="margin: 0; color: #78877E; font-size: 13px; line-height: 1.5; text-align: center;">
                                                        Код действителен в течение 10 минут.<br>Если вы не запрашивали его — просто проигнорируйте это письмо.
                                                    </p>
                                                </td>
                                            </tr>
            
                                            <!-- Подвал -->
                                            <tr>
                                                <td style="background-color: #F5F6F0; padding: 24px; text-align: center; border-top: 1px solid #DEE5DA;">
                                                    <p style="margin: 0; color: #78877E; font-size: 12px;">
                                                        © 2026 Мой маршрут · ТПУ
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
            
            """.formatted(code);
    }
}


