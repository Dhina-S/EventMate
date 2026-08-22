package com.eventmate.eventmate_backend.scheduler;

import com.eventmate.eventmate_backend.model.Booking;
import com.eventmate.eventmate_backend.repository.BookingRepository;
import com.eventmate.eventmate_backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@EnableScheduling
public class BookingCleanupScheduler {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    // Run every 60 seconds (1 minute)
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredBookings() {
        // Expiry time: 10 minutes ago
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);

        // Find all bookings that are PENDING and created BEFORE the expiry time
        List<Booking> expiredBookings = bookingRepository.findByStatusAndBookingDateBefore("PENDING", expiryTime);

        if (!expiredBookings.isEmpty()) {
            System.out.println("🧹 Scheduler: Found " + expiredBookings.size() + " expired bookings. Cancelling...");
            
            for (Booking booking : expiredBookings) {
                try {
                    // Reuse the existing cancellation logic (which restores seats)
                    bookingService.cancelBooking(booking.getId());
                    System.out.println("   -> Auto-cancelled Booking ID: " + booking.getId());
                } catch (Exception e) {
                    System.err.println("   -> Failed to cancel Booking ID: " + booking.getId());
                }
            }
        }
    }
}