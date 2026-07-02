package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.service.GeminiService;
import com.eventmate.eventmate_backend.service.RateLimitService;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.repository.EventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private RateLimitService rateLimitService;

    /** Extracts the real client IP, respecting X-Forwarded-For from reverse proxies. */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // 1. Generate Description (For Admin Create Page)
    @PostMapping("/generate-description")
    public ResponseEntity<Map<String, String>> generateDescription(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        String category = payload.get("category");
        String keywords = payload.get("keywords");

        String description = geminiService.generateEventDescription(title, category, keywords);

        return ResponseEntity.ok(Map.of("description", description));
    }

    // 2. Chat with Event (For User Chatbot) — Rate-limited: 10 req/min per IP
    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, Object> payload,
                                                    HttpServletRequest request) {
        // ✅ Rate Limit Check
        String clientIp = getClientIp(request);
        if (!rateLimitService.tryConsume(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("answer", "⚠️ Too many requests! You can ask 10 questions per minute. Please wait a moment and try again."));
        }

        String question = (String) payload.get("question");
        Object eventIdObj = payload.get("eventId");

        if (question == null || question.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("answer", "Please ask a question!"));
        }

        try {
            String context;

            // CASE 1: Specific Event Context (User is on Details Page)
            if (eventIdObj != null && !String.valueOf(eventIdObj).equalsIgnoreCase("null")) {
                Long eventId = Long.parseLong(String.valueOf(eventIdObj));
                Event event = eventRepository.findById(eventId)
                        .orElseThrow(() -> new RuntimeException("Event not found"));

                context = String.format(
                    "You are a helpful assistant for this specific event: '%s'. " +
                    "Details: Category: %s, Location: %s, Date: %s at %s, Price: %s. " +
                    "Description: %s. " +
                    "Answer strictly based on these details. Be brief and helpful.",
                    event.getTitle(), event.getCategory(), event.getLocation(),
                    event.getDate(), event.getTime(), event.getPrice(),
                    event.getDescription()
                );
            } 
            // CASE 2: General Context (User is on Home Page)
            else {
                context = "You are 'EventMate AI', a helpful assistant for an event booking platform. " +
                          "Users can browse events, book tickets, and read reviews. " +
                          "If they ask for event recommendations, tell them to check the 'Recommended for You' section " +
                          "or use the search bar.";
            }

            // Call the shared Service Method
            String answer = geminiService.chat(context, question);
            
            if (answer == null) {
                return ResponseEntity.status(500).body(Map.of("answer", "I'm having trouble connecting to my AI brain right now (API Key or Network Error)."));
            }
            
            return ResponseEntity.ok(Map.of("answer", answer));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("answer", "I'm having trouble thinking right now."));
        }
    }
}