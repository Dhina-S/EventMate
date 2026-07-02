package com.eventmate.eventmate_backend.service;

import com.eventmate.eventmate_backend.dto.BookingRequest;
import com.eventmate.eventmate_backend.model.Booking;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.ShowTime;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.BookingRepository;
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.ShowTimeRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShowTimeRepository showTimeRepository; // ✅ NEW: Inject Repo

    @Autowired
    private EmailService emailService;

    // Maximum tickets allowed per booking to prevent hoarding
    private static final int MAX_TICKETS_PER_BOOKING = 10;

    @Transactional
    public Booking createBooking(BookingRequest request, String userEmail) {
        // 1. Find User
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ NEW SECURITY CHECK: Prevent Blocked Users from Booking
        if ("ROLE_BLOCKED".equals(user.getRole())) {
             throw new RuntimeException("Your account is blocked by the organizer. You cannot book tickets.");
        }

        // 2. Security Check: Prevent Multiple Unpaid Bookings
        long pendingCount = bookingRepository.countByUserAndStatus(user, "PENDING");
        if (pendingCount > 0) {
            throw new RuntimeException("You already have a pending booking. Please complete payment or cancel it first.");
        }

        // 3. Find Event
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // ✅ NEW: Fetch ShowTime if provided (For Movies)
        ShowTime showTime = null;
        if (request.getShowTimeId() != null) {
            showTime = showTimeRepository.findById(request.getShowTimeId())
                    .orElseThrow(() -> new RuntimeException("ShowTime not found"));
        }

        // 4. Determine Ticket Count
        int finalCount = request.getTicketsCount();
        
        // Logic: Calculate count if not explicitly provided (e.g. via seat selection)
        if (finalCount == 0 && request.getSeats() != null && !request.getSeats().isEmpty()) {
            finalCount = request.getSeats().split(",").length;
        }
        // Logic: Derive from Price
        if (finalCount == 0 && request.getTotalPrice() != null && request.getTotalPrice() > 0 && event.getPrice() > 0) {
            finalCount = (int) (request.getTotalPrice() / event.getPrice());
        }
        // Fallback
        if (finalCount == 0) finalCount = 1;

        // 5. Security Check: Bulk Booking Limit
        if (finalCount > MAX_TICKETS_PER_BOOKING) {
            throw new RuntimeException("Cannot book more than " + MAX_TICKETS_PER_BOOKING + " tickets at once.");
        }

        // 6. Check Availability & Atomically Decrement Seats
        // ✅ FIX: Uses DB-level atomic update to prevent race conditions (overselling)
        // Two concurrent requests both passing a Java check would cause overselling.
        if (showTime == null) {
            int updated = eventRepository.decrementAvailableSeats(event.getId(), finalCount);
            if (updated == 0) {
                throw new RuntimeException("Sold Out! Not enough seats available.");
            }
            // Reload the event to get the updated seat count
            event = eventRepository.findById(event.getId())
                    .orElseThrow(() -> new RuntimeException("Event not found"));
        }

        // 7. Generate Seat IDs (if general admission)
        String finalSeats = request.getSeats();
        if (finalSeats == null || finalSeats.trim().isEmpty()) {
            // Logic for Standard General Admission Events
            int totalCapacity = event.getTotalCapacity() != null ? event.getTotalCapacity() : (event.getAvailableSeats() + 1000); 
            int currentAvailable = event.getAvailableSeats();
            int startId = (totalCapacity - currentAvailable) + 1;

            StringBuilder generatedIds = new StringBuilder();
            for (int i = 0; i < finalCount; i++) {
                if (i > 0) generatedIds.append(",");
                generatedIds.append("GEN-").append(startId + i);
            }
            finalSeats = generatedIds.toString();
        }

        // 8. Create and Save Booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEvent(event);
        booking.setShowTime(showTime); // ✅ NEW: Save Showtime to Booking
        booking.setTicketsCount(finalCount);
        booking.setSeats(finalSeats); 
        booking.setStatus("PENDING"); 
        booking.setTicketNumber(java.util.UUID.randomUUID().toString()); // ✅ NEW: Set unique ticket number 

        if (request.getTotalPrice() != null && request.getTotalPrice() > 0) {
            booking.setTotalPrice(request.getTotalPrice());
        } else {
            booking.setTotalPrice(event.getPrice() * finalCount);
        }

        // 9. Update Event Capacity (already done atomically above for standard events)
        // ✅ FIX: Movies handle capacity via Seats/Showtimes — no event-level update needed

        Booking savedBooking = bookingRepository.save(booking);

        // 10. Send Email (Async/Safe)
        try {
            emailService.sendBookingConfirmation(
                user.getEmail(),
                user.getName(),
                event.getTitle(),
                savedBooking.getId().toString(),
                finalCount,
                savedBooking.getTotalPrice(),
                savedBooking.getTicketNumber()
            );
        } catch (Exception e) {
            log.error("Failed to send booking confirmation email to {}: {}", user.getEmail(), e.getMessage());
        }

        return savedBooking;
    }

    public List<Booking> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserId(user.getId());
    }

    /**
     * ✅ UPDATED: Secure Cancel Logic for Users
     * - Checks ownership
     * - Checks status
     * - Restores seats
     */
    @Transactional
    public void cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 1. Security: Check Ownership (if email is provided)
        // If userEmail is null, it's an Admin/System call, so we skip this check.
        if (userEmail != null && !booking.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You do not own this booking.");
        }

        // 2. Logic: Check if already cancelled
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is already cancelled.");
        }

        // 3. Logic: Update Status & Time
        booking.setStatus("CANCELLED");
        booking.setCancellationTime(LocalDateTime.now());
        bookingRepository.save(booking);

        // 4. Logic: Restore Seats
        // ✅ FIX: Only restore Event capacity for Standard Events
        if (booking.getShowTime() == null) {
            Event event = booking.getEvent();
            event.setAvailableSeats(event.getAvailableSeats() + booking.getTicketsCount());
            eventRepository.save(event);
        }
    }

    /**
     * ✅ Overloaded Method for Scheduler & Admins
     * Calls the main cancel method with null email (bypassing ownership check)
     */
    @Transactional
    public void cancelBooking(Long bookingId) {
        cancelBooking(bookingId, null);
    }

    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            return booking;
        }

        booking.setStatus("CONFIRMED");
        return bookingRepository.save(booking);
    }
}