package com.ringo.PersonalRoute.Services.ai;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Slf4j
@Service
public class WebTools {

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");
    private static final int MAX_BODY_BYTES = 1_000_000; // 1 MB
    private static final int MAX_TEXT_CHARS = 8_000;

    @Tool(description = "Извлекает и возвращает чистый текстовый контент с веб-страницы по указанному URL.")
    public String fetchPageContent(String url) {
        try {
            validateUrl(url);
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (compatible; SpringAIBot/1.0)")
                    .timeout(10_000)
                    .maxBodySize(MAX_BODY_BYTES)
                    .get();
            doc.select("script, style, nav, header, footer, iframe").remove();
            String text = doc.body().text();
            return text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text;
        } catch (SecurityException e) {
            log.warn("Blocked URL: {} ({})", url, e.getMessage());
            return "URL отклонён политикой безопасности: " + e.getMessage();
        } catch (Exception e) {
            log.warn("Failed to fetch {}: {}", url, e.getMessage());
            return "Не удалось загрузить страницу " + url + ": " + e.getMessage();
        }
    }

    @Tool(description = "Выполняет поиск в интернете и возвращает список релевантных результатов с заголовками и ссылками.")
    public String searchWeb(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            // URL фиксирован — SSRF не применим
            String searchUrl = "https://html.duckduckgo.com/html/?q=" + encodedQuery;
            Document doc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0")
                    .timeout(10_000)
                    .maxBodySize(MAX_BODY_BYTES)
                    .get();
            var results = doc.select("a.result__a");
            StringBuilder sb = new StringBuilder("Результаты поиска:\n");
            int count = 0;
            for (var result : results) {
                if (count++ >= 5) break;
                String title = result.text();
                String href = result.attr("href");
                sb.append("- ").append(title).append("\n  URL: ").append(href).append("\n");
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Search failed for '{}': {}", query, e.getMessage());
            return "Ошибка поиска: " + e.getMessage();
        }
    }

    /**
     * Блокирует SSRF: private/loopback/link-local/metadata-адреса.
     * Разрешает только http/https.
     */
    private void validateUrl(String url) throws Exception {
        if (url == null || url.isBlank()) {
            throw new SecurityException("empty URL");
        }
        URI uri = URI.create(url);

        if (!ALLOWED_SCHEMES.contains(uri.getScheme())) {
            throw new SecurityException("scheme '" + uri.getScheme() + "' not allowed");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new SecurityException("host is missing");
        }

        InetAddress addr = InetAddress.getByName(uri.getHost());
        if (addr.isLoopbackAddress())   throw new SecurityException("loopback address blocked");
        if (addr.isSiteLocalAddress())  throw new SecurityException("site-local address blocked");
        if (addr.isLinkLocalAddress())  throw new SecurityException("link-local address blocked");
        if (addr.isAnyLocalAddress())   throw new SecurityException("any-local address blocked");
        if (addr.isMulticastAddress())  throw new SecurityException("multicast address blocked");
    }
}