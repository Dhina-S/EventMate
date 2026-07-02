package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.model.Booking;
import com.eventmate.eventmate_backend.model.SeatStatus;
import com.eventmate.eventmate_backend.model.ShowTime;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.BookingRepository;
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import com.eventmate.eventmate_backend.service.UserService; // ✅ Added Import
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.eventmate.eventmate_backend.dto.ShowTimeRequest;
import com.eventmate.eventmate_backend.repository.ShowTimeRepository;
import com.eventmate.eventmate_backend.repository.SeatStatusRepository;
import com.eventmate.eventmate_backend.model.Event;
import org.springframework.data.domain.PageRequest; 

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired private UserRepository userRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private ShowTimeRepository showTimeRepository;
    @Autowired private SeatStatusRepository seatStatusRepository;
    @Autowired private UserService userService; // ✅ Added Service Injection

    private User getCurrentAdmin() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    // 1. Get Dashboard Stats (ISOLATED)
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        User admin = getCurrentAdmin();
        Map<String, Object> stats = new HashMap<>();

        long totalEvents = eventRepository.countByOrganizer(admin);
        List<Booking> myEventBookings = bookingRepository.findByEvent_Organizer(admin);
        
        long totalBookings = myEventBookings.stream()
                // Case insensitive safety check
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .count();
                
        // ✅ CRASH FIX: Checks for NULL price before calculating
        double totalRevenue = myEventBookings.stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();
        
        // Count customers specific to this organizer
        long totalCustomers = userRepository.findCustomersByOrganizerId(admin.getId()).size();

        stats.put("totalUsers", totalCustomers);
        stats.put("totalEvents", totalEvents);
        stats.put("totalBookings", totalBookings);
        stats.put("totalRevenue", totalRevenue);

        return ResponseEntity.ok(stats);
    }

    // 2. Get Recent Bookings (Strictly Top 5)
    @GetMapping("/bookings-recent")
    public ResponseEntity<List<Booking>> getRecentBookings() {
        User admin = getCurrentAdmin();
        // Uses strict repository method to prevent data mixing
        return ResponseEntity.ok(
            bookingRepository.findRecentBookingsByOrganizer(admin, PageRequest.of(0, 5))
        );
    }

    // 3. Get All Bookings
    @GetMapping("/bookings")
    public ResponseEntity<List<Booking>> getAdminBookings() {
        User admin = getCurrentAdmin();
        return ResponseEntity.ok(bookingRepository.findByEvent_Organizer(admin));
    }
    
    // 4. Get Users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getMyCustomers() {
         User admin = getCurrentAdmin();
         List<User> customers = userRepository.findCustomersByOrganizerId(admin.getId());
         return ResponseEntity.ok(customers);
    }

    // ✅ 4.5 Block User Endpoint (NEW)
    @PutMapping("/users/{id}/block")
    public ResponseEntity<String> blockUser(@PathVariable Long id) {
        userService.blockUser(id);
        return ResponseEntity.ok("User has been blocked successfully.");
    }

    // 5. Create Showtime
    @PostMapping("/showtime/create")
    public ResponseEntity<String> createShowTime(@RequestBody ShowTimeRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User admin = getCurrentAdmin();
        // Security check: Ensure admin owns the event
        if (!event.getOrganizer().getId().equals(admin.getId())) {
             return ResponseEntity.status(403).body("Unauthorized: You do not own this event");
        }

        ShowTime showTime = new ShowTime();
        showTime.setEvent(event);
        showTime.setShowDate(request.getShowDate());
        showTime.setShowTime(request.getShowTime());
        showTime.setSeated(event.isSeated());
        
        if (!event.isSeated()) {
            showTime.setAvailableGeneralTickets(event.getTotalCapacity());
        }

        ShowTime savedShow = showTimeRepository.save(showTime);

        if (event.isSeated()) {
            List<SeatStatus> seats = new ArrayList<>();
            for (int row = 1; row <= event.getTotalRows(); row++) {
                char rowLabel = (char) ('A' + row - 1);
                for (int col = 1; col <= event.getTotalCols(); col++) {
                    SeatStatus seat = new SeatStatus();
                    seat.setShowTime(savedShow);
                    seat.setSeatLabel(rowLabel + "" + col);
                    seat.setStatus(SeatStatus.Status.AVAILABLE);
                    seats.add(seat);
                }
            }
            seatStatusRepository.saveAll(seats);
        }

        return ResponseEntity.ok("Showtime & Seats Created!");
    }

    // ✅ 6. Event Performance Insights (FIXED COMPILATION ERROR)
    @GetMapping("/event-insights")
    public ResponseEntity<List<Map<String, Object>>> getEventInsights() {
        User admin = getCurrentAdmin();
        List<Event> events = eventRepository.findByOrganizer(admin);
        List<Map<String, Object>> insights = new ArrayList<>();

        for (Event event : events) {
            // ✅ STRICT ISOLATION: Fetch bookings ONLY for this event AND this organizer
            List<Booking> bookings = bookingRepository.findByEventIdAndOrganizer(event.getId(), admin);

            // Debugging Log
            System.out.println("Event: " + event.getTitle() + " | bookings=" + (bookings == null ? 0 : bookings.size()));

            long ticketsSold = 0;
            double revenue = 0.0;

            if (bookings != null && !bookings.isEmpty()) {
                ticketsSold = bookings.stream()
                        .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                        // ✅ FIX: Removed '!= null' check because getTicketsCount() returns primitive int
                        .mapToInt(Booking::getTicketsCount)
                        .sum();

                revenue = bookings.stream()
                        .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                        // ✅ FIX: Kept '!= null' for Price because it is likely Double (Wrapper)
                        .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                        .sum();
            }

            // Safe Unboxing for Integers
            int rows = event.getTotalRows() != null ? event.getTotalRows() : 0;
            int cols = event.getTotalCols() != null ? event.getTotalCols() : 0;
            int totalCap = event.getTotalCapacity() != null ? event.getTotalCapacity() : 0;

            int capacity = event.isSeated() ? (rows * cols) : totalCap;
            double occupancy = (capacity > 0) ? ((double)ticketsSold * 100.0) / capacity : 0.0;

            Map<String, Object> data = new HashMap<>();
            data.put("id", event.getId());
            data.put("title", event.getTitle());
            data.put("date", event.getDate());
            data.put("ticketsSold", ticketsSold);
            data.put("revenue", revenue);
            data.put("capacity", capacity);
            data.put("occupancy", occupancy);

            insights.add(data);
        }
        
        // ✅ SAFETY CHECK: Safe Sort using getOrDefault
        insights.sort((a, b) -> Double.compare(
            ((Number) b.getOrDefault("revenue", 0.0)).doubleValue(), 
            ((Number) a.getOrDefault("revenue", 0.0)).doubleValue()
        ));
        
        return ResponseEntity.ok(insights);
    }

    // ✅ NEW: Unblock Endpoint
    @PutMapping("/users/{id}/unblock")
    public ResponseEntity<String> unblockUser(@PathVariable Long id) {
        userService.unblockUser(id);
        return ResponseEntity.ok("User has been unblocked successfully.");
    }
}