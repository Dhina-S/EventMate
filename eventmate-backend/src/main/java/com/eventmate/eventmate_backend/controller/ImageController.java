package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageUploadService imageUploadService;

    // ✅ FIX: Only ADMIN/ORGANIZER can upload images to prevent quota abuse
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ORGANIZER')")
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageUploadService.uploadImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            log.error("Image upload failed: {}", e.getMessage());
            return ResponseEntity.status(500).body("Image upload failed: " + e.getMessage());
        }
    }
}