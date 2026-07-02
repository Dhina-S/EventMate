package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.BookingRequest;
import com.eventmate.eventmate_backend.model.Booking;
import com.eventmate.eventmate_backend.service.BookingService;
import com.eventmate.eventmate_backend.repository.BookingRepository; // Inject Repository directly for read-only seat logic
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository; // Direct access for seat fetching

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            return ResponseEntity.ok(bookingService.createBooking(request, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my-bookings")
    public ResponseEntity<List<Booking>> getMyBookings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return ResponseEntity.ok(bookingService.getUserBookings(email));
    }

    // ✅ UPDATED: Cancel Endpoint for Users
    @PutMapping("/cancel/{id}")
    public ResponseEntity<String> cancelBooking(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            
            // Pass email to service to verify ownership
            bookingService.cancelBooking(id, email);
            
            return ResponseEntity.ok("Booking cancelled successfully. Seats have been restored.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/confirm/{id}")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }
}