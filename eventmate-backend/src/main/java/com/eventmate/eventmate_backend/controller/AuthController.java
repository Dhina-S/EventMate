package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.AuthResponse;
import com.eventmate.eventmate_backend.dto.LoginRequest;
import com.eventmate.eventmate_backend.dto.RegisterRequest;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.UserRepository;
import com.eventmate.eventmate_backend.service.JwtService;
import com.eventmate.eventmate_backend.service.UserService;
import com.eventmate.eventmate_backend.service.PasswordResetService; // ✅ Import new service
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetService passwordResetService; // ✅ Inject Service

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User newUser = userService.registerUser(request);
            return ResponseEntity.ok("User registered successfully! Role: " + newUser.getRole());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            String token = jwtService.generateToken(request.getEmail());
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            return ResponseEntity.ok(new AuthResponse(
                token, user.getName(), user.getEmail(), user.getRole()
            ));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    // ✅ NEW: Forgot Password Endpoint
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        passwordResetService.processForgotPassword(email);
        // Always return OK for security (prevents email enumeration)
        return ResponseEntity.ok("If an account exists with this email, a reset link has been sent.");
    }

    //  NEW: Reset Password Endpoint
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");
        
        String result = passwordResetService.resetPassword(token, newPassword);
        
        if ("Success".equals(result)) {
            return ResponseEntity.ok("Password updated successfully.");
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
}