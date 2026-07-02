package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @GetMapping
    public List<Event> getMyRecommendations() {
        // Get currently logged-in user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return recommendationService.getRecommendations(email);
    }
}