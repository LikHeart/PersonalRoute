package com.ringo.PersonalRoute.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Stateless API на заголовке Authorization — CSRF не применим.
                // Если перейдёте на cookie — включите обратно.
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Публичные страницы и статика
                        .requestMatchers(
                                "/", "/auth",
                                "/css/**", "/js/**", "/images/**",
                                "/error", "/favicon.ico"
                        ).permitAll()
                        // Регистрация / вход — публичные
                        .requestMatchers(
                                "/api/auth/send-code",
                                "/api/auth/register",
                                "/api/auth/login"
                        ).permitAll()
                        // Чат: разрешаем гостям, но с ограничением по rate limit (см. Этап 5)
                        // Пока — требуем аутентификации. Если нужен гостевой режим —
                        // вынесите в отдельный эндпоинт /api/chat/guest с лимитом.
                        .requestMatchers("/api/chat/**").authenticated()
                        // Всё остальное — только с токеном
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}