package com.eventmate.eventmate_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "events")
@Data
public class Event implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    
    @Column(length = 1000)
    private String description;
    
    private String category; 
    private String location;
    private Double price;
    private String imageUrl;
    
    private LocalDate date;
    private LocalTime time;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private User organizer;

    // ✅ FIX: Restore this field so BookingService works
    private Integer availableSeats;

    // ---------------- NEW FIELDS (From previous step) ----------------
    private boolean isSeated; // true = Cinema, false = Concert
    
    private Integer totalRows; 
    private Integer totalCols;
    
    @Column(length = 1000)
    private String seatConfig; // "1-3:300:Third Class..."

    private Integer totalCapacity; 

    // ✅ NEW: Event Type Logic (Phase 1)
    // Default is NORMAL so old events don't break
    @Enumerated(EnumType.STRING)
    private EventType eventType = EventType.NORMAL;

    public enum EventType {
        NORMAL, // Concerts, Workshops (Old logic)
        MOVIE   // Movies (New logic with Halls)
    }
}