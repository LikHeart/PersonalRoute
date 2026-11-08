package com.ringo.PersonalRoute.Services.ai;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;

@Service
public class WebTools {



    @Tool(description = "Извлекает и возвращает чистый текстовый контент с веб-страницы по указанному URL.")
    public String fetchPageContent(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (compatible; SpringAIBot/1.0)")
                    .timeout(10_000)
                    .get();
            doc.select("script, style, nav, header, footer, iframe").remove();
            String text = doc.body().text();
            return text.length() > 8000 ? text.substring(0, 8000) : text;
        } catch (Exception e) {
            return "Не удалось загрузить страницу " + url + ": " + e.getMessage();
        }
    }

    @Tool(description = "Выполняет поиск в интернете и возвращает список релевантных результатов с заголовками и ссылками.")
    public String searchWeb(String query) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String searchUrl = "https://html.duckduckgo.com/html/?q=" + encodedQuery;
            Document doc = Jsoup.connect(searchUrl)
                    .userAgent("Mozilla/5.0")
                    .timeout(10_000)
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
            return "Ошибка поиска: " + e.getMessage();
        }
    }
}