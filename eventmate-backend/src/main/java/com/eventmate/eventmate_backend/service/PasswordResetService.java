package com.eventmate.eventmate_backend.service;

import com.eventmate.eventmate_backend.model.PasswordResetToken;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.PasswordResetTokenRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url}")
    private String frontendUrl;

    // Step 1: Process Forgot Password Request
    @Transactional
    public void processForgotPassword(String email) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // Security: Do NOT reveal if email exists or not.
            // Just return silently or log internally.
            System.out.println("Reset requested for non-existent email: " + email);
            return;
        }

        User user = userOptional.get();

        // 1. Delete any existing tokens for this user to keep DB clean
        tokenRepository.deleteByUser_Id(user.getId());

        // 2. Generate new random token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user);
        tokenRepository.save(resetToken);

        // 3. Send Email (or print to console if email fails)
        sendResetEmail(user.getEmail(), token);
    }

    // Step 2: Validate Token & Reset Password
    @Transactional
    public String resetPassword(String token, String newPassword) {
        Optional<PasswordResetToken> tokenOptional = tokenRepository.findByToken(token);

        if (tokenOptional.isEmpty()) {
            return "Invalid token.";
        }

        PasswordResetToken resetToken = tokenOptional.get();

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            return "Token has expired. Please request a new one.";
        }

        // Token is valid. Validate new password.
        try {
            validatePasswordStrength(newPassword);
        } catch (RuntimeException e) {
            return e.getMessage();
        }

        // Update password.
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clean up used token
        tokenRepository.delete(resetToken);

        return "Success";
    }

    private void sendResetEmail(String toEmail, String token) {
        // This link points to your React Frontend Reset Page
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("EventMate Password Reset Request");
            message.setText("To reset your password, click the link below:\n\n" + resetLink + "\n\nThis link expires in 15 minutes.");
            
            mailSender.send(message);
            System.out.println("✅ Email sent to " + toEmail);
        } catch (Exception e) {
            // FALLBACK: If email config is wrong, print the link here so you can test it!
            System.err.println("⚠️ Email failed to send (Check application.properties).");
            System.out.println("👉 TEST MODE - Click this link to reset: " + resetLink);
        }
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