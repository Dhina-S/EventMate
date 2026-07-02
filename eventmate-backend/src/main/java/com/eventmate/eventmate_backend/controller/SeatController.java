package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.LockRequest;
import com.eventmate.eventmate_backend.model.Booking;
import com.eventmate.eventmate_backend.model.SeatStatus;
import com.eventmate.eventmate_backend.repository.BookingRepository;
import com.eventmate.eventmate_backend.repository.SeatStatusRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/seats")
public class SeatController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SeatStatusRepository seatStatusRepository;

    // ✅ 1. Standard Event: Get occupied seats by Event ID
    @GetMapping("/occupied/{eventId}")
    public List<String> getOccupiedSeats(@PathVariable Long eventId) {
        // Use the robust repository method we added
        List<Booking> bookings = bookingRepository.findByEventIdAndStatusNot(eventId, "CANCELLED");
        return extractSeats(bookings);
    }

    // ✅ 2. Movie Event: Get occupied seats by Showtime ID (NEW LOGIC)
    @GetMapping("/occupied/showtime/{showTimeId}")
    public List<String> getOccupiedSeatsByShowTime(@PathVariable Long showTimeId) {
        List<Booking> bookings = bookingRepository.findByShowTimeIdAndStatusNot(showTimeId, "CANCELLED");
        return extractSeats(bookings);
    }

    // ✅ Helper to parse "A-1, A-2" strings into a single list (With Trim fix)
    private List<String> extractSeats(List<Booking> bookings) {
        List<String> occupiedSeats = new ArrayList<>();
        for (Booking booking : bookings) {
            if (booking.getSeats() != null && !booking.getSeats().isEmpty()) {
                String[] seatsArray = booking.getSeats().split(",");
                for (String s : seatsArray) {
                    occupiedSeats.add(s.trim()); // Removes accidental spaces
                }
            }
        }
        return occupiedSeats;
    }

    // ---------------- OLD FEATURES PRESERVED (Layout & Locking) ----------------

    @GetMapping("/layout/{showTimeId}")
    public List<SeatStatus> getLayout(@PathVariable Long showTimeId) {
        return seatStatusRepository.findByShowTimeId(showTimeId);
    }

    @PostMapping("/lock")
    @Transactional
    public ResponseEntity<?> lockSeats(@RequestBody LockRequest request) {
        List<String> seatsToLock = request.getSeatLabels();
        Long showTimeId = request.getShowTimeId();
        Long userId = request.getUserId();

        for (String label : seatsToLock) {
            SeatStatus seat = seatStatusRepository.findByShowTimeIdAndSeatLabel(showTimeId, label);
            
            if (seat == null) {
                // If seat record doesn't exist yet, we might strictly return error or handle it.
                // Assuming standard behavior is checking existence first.
                return ResponseEntity.badRequest().body("Seat " + label + " does not exist.");
            }

            if (seat.getStatus() != SeatStatus.Status.AVAILABLE) {
                return ResponseEntity.badRequest().body("Seat " + label + " is already taken!");
            }

            seat.setStatus(SeatStatus.Status.LOCKED);
            seat.setLockedByUserId(userId);
            seat.setLockExpiresAt(LocalDateTime.now().plusMinutes(10));
            seatStatusRepository.save(seat);
        }
        return ResponseEntity.ok("Seats Locked");
    }
}