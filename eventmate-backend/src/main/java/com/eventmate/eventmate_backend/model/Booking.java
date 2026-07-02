package com.eventmate.eventmate_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // ✅ NEW: Link Booking to a specific Showtime (Nullable for standard events)
    @ManyToOne
    @JoinColumn(name = "showtime_id", nullable = true)
    private ShowTime showTime;

    private int ticketsCount;
    private Double totalPrice;
    
    private String status; // "CONFIRMED", "PENDING", "CANCELLED"

    private String seats;

    private LocalDateTime bookingDate;

    // Unique string for QR code generation
    @Column(unique = true)
    private String ticketNumber;

    //Track when cancellation happened
    private LocalDateTime cancellationTime;

    @PrePersist
    protected void onCreate() {
        bookingDate = LocalDateTime.now();
    }
}