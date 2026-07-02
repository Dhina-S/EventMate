package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.model.Notification;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.UserRepository;
import com.eventmate.eventmate_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository userRepository;

    @GetMapping("/my")
    public ResponseEntity<List<Notification>> getMyNotifications() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }
}