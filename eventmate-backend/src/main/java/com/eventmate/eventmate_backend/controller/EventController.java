package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.EventRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.BookingRepository;
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.ShowTimeRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository; // Inject

    @Autowired
    private ShowTimeRepository showTimeRepository; // Inject

    // ✅ Helper: Get currently logged-in user
    private User getLoggedInUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 1. Get All Events (Public) — Cached in Redis for 5 minutes
    @GetMapping
    @Cacheable(value = "events", unless = "#result.isEmpty()")
    public List<Event> getAllEvents() {
        System.out.println("[CACHE MISS] Fetching events from database...");
        return eventRepository.findAll();
    }

    // 2. Get "My Events" (Protected - For Admin Dashboard)
    @GetMapping("/my-events")
    public ResponseEntity<List<Event>> getMyEvents() {
        User organizer = getLoggedInUser();
        // ✅ CRITICAL: Strictly fetches events owned by the logged-in user
        List<Event> myEvents = eventRepository.findByOrganizer(organizer);
        return ResponseEntity.ok(myEvents);
    }

    // 3. Get Single Event (Public)
    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    // 4. ✅ UPDATED: Smart Search
    @GetMapping("/search")
    public List<Event> searchEvents(@RequestParam String query) {
        if(query == null || query.trim().isEmpty()) {
            return eventRepository.findAll();
        }
        return eventRepository.searchEvents(query);
    }

    // 5. ✅ RECOMMENDATIONS ENDPOINT
    @GetMapping("/recommendations/{id}")
    public List<Event> getRecommendations(@PathVariable Long id) {
        Event currentEvent = eventRepository.findById(id).orElse(null);
        if (currentEvent == null) return List.of();
        
        // 1. Try to find events in the same category (Case Insensitive)
        List<Event> recommendations = eventRepository.findTop4ByCategoryIgnoreCaseAndIdNot(currentEvent.getCategory(), id);
        
        // 2. Fallback: If no matches found in that category, return Top 4 Recent Events
        if (recommendations.isEmpty()) {
            return eventRepository.findAll().stream()
                .filter(e -> !e.getId().equals(id)) 
                .sorted((a, b) -> {
                    if (a.getDate() == null || b.getDate() == null) return 0;
                    return b.getDate().compareTo(a.getDate()); 
                })
                .limit(4)
                .collect(Collectors.toList());
        }
        
        Collections.shuffle(recommendations);
        return recommendations;
    }

    // 6. Create Event (Protected)
    @PostMapping("/create")
    @CacheEvict(value = "events", allEntries = true)
    public ResponseEntity<String> createEvent(@RequestBody EventRequest request) {
        User organizer = getLoggedInUser();
        
        Event event = new Event();
        // ✅ SECURITY LOCK: Automatically assign the logged-in user as organizer
        event.setOrganizer(organizer);
        
        mapRequestToEvent(event, request); 
        eventRepository.save(event);
        return ResponseEntity.ok("Event created successfully");
    }

    // 7. Update Event (Protected)
    @PutMapping("/{id}")
    @CacheEvict(value = "events", allEntries = true)
    public ResponseEntity<String> updateEvent(@PathVariable Long id, @RequestBody EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User currentUser = getLoggedInUser();
        
        // ✅ SECURITY CHECK: Ensure user owns the event before editing
        if (!event.getOrganizer().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("You are not authorized to edit this event");
        }

        mapRequestToEvent(event, request);
        eventRepository.save(event);
        return ResponseEntity.ok("Event updated successfully");
    }
    
    // 8. Delete Event (Protected)
    // ✅ FIX: Delete children first (Cascade logic manually implemented for safety)
    @DeleteMapping("/{id}")
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public ResponseEntity<String> deleteEvent(@PathVariable Long id) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found"));

        // 1. Delete all bookings for this event (or its showtimes)
        // Note: JPA usually handles this if CascadeType.ALL is set, but explicit delete is safer for complex relations
        List<com.eventmate.eventmate_backend.model.Booking> bookings = bookingRepository.findByEventId(id);
        bookingRepository.deleteAll(bookings);

        // 2. Delete all showtimes for this event
        List<com.eventmate.eventmate_backend.model.ShowTime> showTimes = showTimeRepository.findByEventId(id);
        showTimeRepository.deleteAll(showTimes);

        // 3. Finally delete the event
        eventRepository.deleteById(id);
        return ResponseEntity.ok("Event deleted successfully");
    }

    // 🔥 Helper Method: Maps DTO to Entity
    private void mapRequestToEvent(Event event, EventRequest request) {
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory());
        event.setLocation(request.getLocation());
        event.setImageUrl(request.getImageUrl());
        
        // ✅ NEW: Handle Event Type (Default to NORMAL if missing)
        if (request.getEventType() != null) {
             try {
                 event.setEventType(Event.EventType.valueOf(request.getEventType().toUpperCase()));
             } catch (IllegalArgumentException e) {
                 event.setEventType(Event.EventType.NORMAL);
             }
        } else {
             // Keep existing type if not provided during update
             if(event.getEventType() == null) event.setEventType(Event.EventType.NORMAL);
        }

        // ✅ LOGIC SPLIT:
        if (event.getEventType() == Event.EventType.MOVIE) {
             // Movie Logic: These are handled by Showtimes, so they are null/zero here
             event.setDate(null);
             event.setTime(null);
             event.setPrice(0.0); 
             event.setSeated(true); 
             event.setTotalCapacity(0); 
             
             // Allow editing seat config
             event.setTotalRows(request.getTotalRows());
             event.setTotalCols(request.getTotalCols());
             event.setSeatConfig(request.getSeatConfig());
             
        } else {
             // STANDARD EVENT LOGIC (Old Logic Preserved)
             event.setPrice(request.getPrice());
             event.setDate(request.getDate());
             event.setTime(request.getTime());
             
             event.setSeated(request.isSeated());
             
             if (request.isSeated()) {
                 event.setTotalRows(request.getTotalRows());
                 event.setTotalCols(request.getTotalCols());
                 event.setSeatConfig(request.getSeatConfig());
                 
                 if (request.getTotalRows() != null && request.getTotalCols() != null) {
                     event.setAvailableSeats(request.getTotalRows() * request.getTotalCols());
                 }
             } else {
                 event.setTotalCapacity(request.getTotalCapacity());
                 event.setAvailableSeats(request.getTotalCapacity());
             }
        }
    }
}