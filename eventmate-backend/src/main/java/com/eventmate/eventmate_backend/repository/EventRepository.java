package com.eventmate.eventmate_backend.repository;

import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EventRepository extends JpaRepository<Event, Long> {
    
    // Standard Basic Filters
    List<Event> findByCategory(String category);
    List<Event> findByTitleContainingIgnoreCase(String keyword);
    
    // Organizer Filters
    List<Event> findByOrganizer(User organizer);
    long countByOrganizer(User organizer);

    // Legacy Search (Preserved to avoid breaking old references if any)
    List<Event> findByTitleContainingIgnoreCaseOrLocationContainingIgnoreCase(String title, String location);

    // ✅ AI-POWERED SMART SEARCH 
    @Query("SELECT e FROM Event e WHERE " +
            "LOWER(e.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.location) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.category) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Event> searchEvents(@Param("keyword") String keyword);

    // ✅ RECOMMENDATIONS
    List<Event> findTop4ByCategoryIgnoreCaseAndIdNot(String category, Long id);

    // ✅ NEW: Filter by Event Type (MOVIE vs NORMAL)
    List<Event> findByEventType(Event.EventType eventType);

    // ✅ FIX: Atomic seat decrement — prevents race conditions during concurrent bookings.
    // Returns 1 if update succeeded (enough seats), 0 if sold out (nothing updated).
    @Modifying
    @Query("UPDATE Event e SET e.availableSeats = e.availableSeats - :count " +
           "WHERE e.id = :id AND e.availableSeats >= :count")
    int decrementAvailableSeats(@Param("id") Long id, @Param("count") int count);
}