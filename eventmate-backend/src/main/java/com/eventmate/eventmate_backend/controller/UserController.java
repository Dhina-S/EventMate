package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.UserProfileRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // Helper to get logged-in email
    private String getCurrentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    // ---------------- PROFILE ENDPOINTS ----------------

    // 1. Get My Profile
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        return ResponseEntity.ok(userService.getUserProfile(getCurrentEmail()));
    }

    // 2. Update My Profile
    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody UserProfileRequest request) {
        return ResponseEntity.ok(userService.updateUserProfile(getCurrentEmail(), request));
    }

    // ---------------- FAVORITES ENDPOINTS ----------------

    // 3. Add to Favorites
    @PostMapping("/favorites/{eventId}")
    public ResponseEntity<String> addFavorite(@PathVariable Long eventId) {
        userService.addFavorite(getCurrentEmail(), eventId);
        return ResponseEntity.ok("Added to favorites");
    }

    // 4. Remove from Favorites
    @DeleteMapping("/favorites/{eventId}")
    public ResponseEntity<String> removeFavorite(@PathVariable Long eventId) {
        userService.removeFavorite(getCurrentEmail(), eventId);
        return ResponseEntity.ok("Removed from favorites");
    }

    // 5. Get All Favorites
    @GetMapping("/favorites")
    public ResponseEntity<Set<Event>> getFavorites() {
        return ResponseEntity.ok(userService.getFavorites(getCurrentEmail()));
    }
}