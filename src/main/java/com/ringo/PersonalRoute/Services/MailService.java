package com.ringo.PersonalRoute.Services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    private final Map<String, CodeData> codes = new ConcurrentHashMap<>();

    private record CodeData(String code, LocalDateTime expiresAt) {}

    public void sendCode(String email) {
        String code = String.format("%05d", ThreadLocalRandom.current().nextInt(100_000));

        codes.put(email, new CodeData(code, LocalDateTime.now().plusMinutes(10)));

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("Код подтверждения — ТПУ Мой маршрут");
            helper.setText(buildHtmlEmail(code), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Ошибка при формировании письма", e);
        }
    }

    public boolean verifyCode(String email, String inputCode) {
        CodeData data = codes.get(email);
        if (data == null) return false;

        // Проверяем время
        if (LocalDateTime.now().isAfter(data.expiresAt())) {
            codes.remove(email);
            return false;
        }

        // Проверяем сам код
        if (data.code().equals(inputCode)) {
            codes.remove(email); // Код одноразовый
            return true;
        }
        return false;
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
            <body style="margin: 0; padding: 0; background-color: #F6F8F8; font-family: 'Inter', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F8F8; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <!-- Карточка -->
                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.04);">
                                
                                <!-- Шапка (зеленая) -->
                                <tr>
                                    <td align="center" style="background-color: #157F6A; padding: 40px 20px;">
                                        <div style="display: inline-block; width: 48px; height: 48px; background-color: #FFFFFF; color: #157F6A; border-radius: 12px; font-size: 24px; font-weight: 700; line-height: 48px; text-align: center; margin-bottom: 16px;">
                                            T
                                        </div>
                                        <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 600;">ТПУ Мой маршрут</h1>
                                    </td>
                                </tr>

                                <!-- Контент -->
                                <tr>
                                    <td style="padding: 40px 32px;">
                                        <h2 style="margin: 0 0 16px 0; color: #172522; font-size: 24px; font-weight: 700; text-align: center;">Подтверждение почты</h2>
                                        <p style="margin: 0 0 32px 0; color: #74817E; font-size: 15px; line-height: 1.6; text-align: center;">
                                            Вы запросили код для входа в сервис.<br>Введите его на сайте:
                                        </p>

                                        <!-- Блок с кодом -->
                                        <div style="background-color: #E9FAF7; border: 2px dashed #14B8A6; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                            <span style="font-size: 36px; font-weight: 700; color: #0F8F82; letter-spacing: 12px; padding-left: 12px;">%s</span>
                                        </div>

                                        <p style="margin: 0; color: #9AA5A2; font-size: 13px; line-height: 1.5; text-align: center;">
                                            Код действителен в течение 10 минут.<br>Если вы не запрашивали его — просто проигнорируйте это письмо.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Подвал -->
                                <tr>
                                    <td style="background-color: #F8FAFC; padding: 24px; text-align: center; border-top: 1px solid #E3EBE8;">
                                        <p style="margin: 0; color: #96A29F; font-size: 12px;">
                                            © 2026 ТПУ. Персональный маршрут.
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