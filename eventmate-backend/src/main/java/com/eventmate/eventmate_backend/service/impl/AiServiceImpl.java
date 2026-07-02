package com.eventmate.eventmate_backend.service.impl;

import com.eventmate.eventmate_backend.service.AiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiServiceImpl implements AiService {

@Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent}")
    private String apiUrl;

    @Value("${ai.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // Helper to check config
    private boolean isConfigInvalid() {
        return apiKey == null || apiKey.trim().isEmpty() || apiKey.contains("YOUR_ACTUAL_GEMINI_KEY");
    }

    // ----------------------------------------------------------------
    // 1. GENERATE DESCRIPTION (Admin Feature)
    // ----------------------------------------------------------------
    @Override
    public String generateDescription(String title, String category, String keywords) {
        if (isConfigInvalid()) return "AI Configuration Missing.";

        String prompt = String.format(
            "Write a concise, exciting event description for a '%s' event named '%s'. " +
            "Keywords: %s. Keep it under 150 words. No markdown.",
            category, title, keywords
        );
        
        String result = callGeminiApi(prompt);
        return result != null ? result : "AI returned no content. Try again.";
    }

    // ----------------------------------------------------------------
    // 2. ANALYZE SENTIMENT (Review Feature)
    // ----------------------------------------------------------------
    @Override
    public String analyzeSentiment(String reviewText) {
        if (isConfigInvalid()) return "NEUTRAL"; 

        String prompt = String.format(
            "Analyze the sentiment of this review. Respond with exactly one word: POSITIVE, NEUTRAL, or NEGATIVE. Text: \"%s\"",
            reviewText
        );
        
        String result = callGeminiApi(prompt);
        
        if (result != null) {
            String cleanResult = result.trim().toUpperCase();
            if (cleanResult.contains("POSITIVE")) return "POSITIVE";
            if (cleanResult.contains("NEGATIVE")) return "NEGATIVE";
        }
        return "NEUTRAL"; 
    }

    // ----------------------------------------------------------------
    // 3. CHAT ASSISTANT (Chatbot Feature)
    // ----------------------------------------------------------------
    @Override
    public String chat(String eventContext, String userQuestion) {
        if (isConfigInvalid()) return "I'm sorry, I can't answer right now (Server Config Error).";

        String prompt = String.format(
            "You are a helpful assistant for an event. " +
            "Here are the details: [%s]. " +
            "User Question: \"%s\" " +
            "Answer based ONLY on the details provided. Keep it short and friendly.",
            eventContext,
            userQuestion
        );
        
        String result = callGeminiApi(prompt);
        return result != null ? result : "I'm having trouble thinking right now. Please try again.";
    }

    // ----------------------------------------------------------------
    // SHARED API CALLER (Robust with Retry Logic)
    // ----------------------------------------------------------------
    private String callGeminiApi(String promptText) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> part = new HashMap<>();
            part.put("text", promptText);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));
            
            Map<String, Object> body = new HashMap<>();
            body.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            // Clean URL and Key
            String safeUrl = apiUrl != null ? apiUrl.trim() : "";
            String safeKey = apiKey != null ? apiKey.trim() : "";
            String finalUrl = safeUrl + "?key=" + safeKey;

            // Retry Loop (3 times)
            int maxRetries = 3;
            for (int i = 0; i < maxRetries; i++) {
                try {
                    ResponseEntity<Map> response = restTemplate.postForEntity(finalUrl, entity, Map.class);
                    
                    Map<String, Object> responseBody = response.getBody();
                    if (responseBody != null && responseBody.containsKey("candidates")) {
                        List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                        if (!candidates.isEmpty()) {
                            Map<String, Object> contentObj = (Map<String, Object>) candidates.get(0).get("content");
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
                            if (!parts.isEmpty()) {
                                return (String) parts.get(0).get("text");
                            }
                        }
                    }
                    return null; 

                } catch (HttpServerErrorException.ServiceUnavailable e) {
                    System.err.println("⚠️ AI Overloaded. Retrying... (" + (i + 1) + ")");
                    if (i == maxRetries - 1) return null;
                    try { Thread.sleep(2000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); }
                } catch (HttpClientErrorException e) {
                    System.err.println("❌ AI Client Error: " + e.getResponseBodyAsString());
                    return null; 
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}