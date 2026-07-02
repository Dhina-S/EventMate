package com.eventmate.eventmate_backend.service.impl;

import com.eventmate.eventmate_backend.dto.RegisterRequest;
import com.eventmate.eventmate_backend.dto.UserProfileRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import com.eventmate.eventmate_backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EventRepository eventRepository;

    @Override
    public User registerUser(RegisterRequest request) {
        // 1. Check if email exists (Old robust check)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already taken!");
        }

        // 2. Create User Entity
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        
        // 3. Handle Role Logic (Whitelist allowed registration roles: USER or ORGANIZER)
        String inputRole = request.getRole() != null ? request.getRole().toUpperCase() : "USER";
        if (!inputRole.startsWith("ROLE_")) {
            inputRole = "ROLE_" + inputRole;
        }
        
        if ("ROLE_ORGANIZER".equals(inputRole)) {
            user.setRole("ROLE_ORGANIZER");
        } else {
            user.setRole("ROLE_USER"); // Default fallback
        }

        // 4. Validate & Encrypt Password
        validatePasswordStrength(request.getPassword());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // 5. Save
        return userRepository.save(user);
    }

    @Override
    public User getUserProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ UPDATED: Handles Profile Info + Password Change
    @Override
    public User updateUserProfile(String email, UserProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Update Basic Info (if provided)
        if (request.getName() != null && !request.getName().isEmpty()) user.setName(request.getName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfileImage() != null) user.setProfileImage(request.getProfileImage());

        // 2. ✅ NEW: Handle Password Change (Securely)
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            // Verify current password
            if (request.getCurrentPassword() == null || 
                !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Invalid current password");
            }
            // Set new password
            validatePasswordStrength(request.getNewPassword());
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        return userRepository.save(user);
    }

    @Override
    public void addFavorite(String email, Long eventId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        user.getFavorites().add(event);
        userRepository.save(user);
    }

    @Override
    public void removeFavorite(String email, Long eventId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        user.getFavorites().remove(event);
        userRepository.save(user);
    }

    @Override
    public Set<Event> getFavorites(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFavorites();
    }

    // ✅ NEW FEATURE: Block User Logic
    // Note: Ensure your UserService Interface includes: void blockUser(Long userId);
    @Override
    public void blockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Change role to BLOCKED to restrict access
        user.setRole("ROLE_BLOCKED");
        userRepository.save(user);
    }

    // ✅ NEW: Unblock User Logic
    @Override
    public void unblockUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Restore access by setting role back to USER
        user.setRole("ROLE_USER");
        userRepository.save(user);
    }

    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long.");
        }
        boolean hasDigit = false;
        boolean hasLetter = false;
        for (char c : password.toCharArray()) {
            if (Character.isDigit(c)) {
                hasDigit = true;
            } else if (Character.isLetter(c)) {
                hasLetter = true;
            }
        }
        if (!hasDigit || !hasLetter) {
            throw new RuntimeException("Password must contain both letters and digits.");
        }
    }
}