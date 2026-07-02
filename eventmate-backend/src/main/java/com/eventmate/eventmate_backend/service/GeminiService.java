package com.eventmate.eventmate_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.List;
import java.util.HashMap;

@Service
public class GeminiService {

    // ✅ Read from your application.properties
    @Value("${ai.api.key:}")
    private String apiKey;

    @Value("${ai.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent}")
    private String apiUrl;

    /**
     * Shared method to send ANY prompt to Gemini
     */
    private String callGemini(String promptText) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            // Append Key to URL
            String finalUrl = apiUrl + "?key=" + apiKey;

            // Construct JSON Payload
            Map<String, Object> contentPart = new HashMap<>();
            contentPart.put("text", promptText);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(contentPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            // Headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Execute Request
            ResponseEntity<Map> response = restTemplate.postForEntity(finalUrl, entity, Map.class);

            // Parse Response
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "AI could not generate a response.";

        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            return null; // Signals failure to the caller
        }
    }

    // Feature 1: Generate Event Description
    public String generateEventDescription(String title, String category, String keywords) {
        String prompt = String.format(
            "Write an exciting, short event description (max 80 words) for a '%s' event titled '%s'. " +
            "Include these keywords naturally: %s. Use emojis.", 
            category, title, keywords
        );
        
        String result = callGemini(prompt);
        
        // ✨ SMART FALLBACK ✨
        if (result == null || result.contains("Error connecting to AI Service")) {
            return String.format(
                "Welcome to %s! 🎭 Join us for an incredible %s session focusing on %s. " +
                "This event is designed to bring people together for an unforgettable experience. " +
                "Don't miss out on this opportunity to connect and celebrate! ✨ #EventMate",
                title, category, keywords
            );
        }
        return result;
    }

    // Feature 2: Chat / Q&A
    public String chat(String context, String userQuestion) {
        String prompt = context + "\n\nUser Question: " + userQuestion;
        return callGemini(prompt);
    }
}