package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.ReviewRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.Review;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.BookingRepository; 
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.ReviewRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import com.eventmate.eventmate_backend.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private BookingRepository bookingRepository; 
    @Autowired private AiService aiService;

    // Helper to get current logged-in user
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 1. Post a Review (Secured & AI Powered)
    @PostMapping("/create")
    public ResponseEntity<?> createReview(@RequestBody ReviewRequest request) {
        try {
            User user = getCurrentUser();
            Event event = eventRepository.findById(request.getEventId())
                    .orElseThrow(() -> new RuntimeException("Event not found"));

            // SECURITY CHECK 1: Did the user book this event?
            boolean hasBooked = bookingRepository.existsByUserIdAndEventIdAndStatus(
                user.getId(), event.getId(), "CONFIRMED"
            );
            
            if (!hasBooked) {
                return ResponseEntity.badRequest().body("You can only review events you have booked and attended!");
            }

            // SECURITY CHECK 2: Did they already review it?
            if (reviewRepository.existsByUserIdAndEventId(user.getId(), event.getId())) {
                return ResponseEntity.badRequest().body("You have already reviewed this event.");
            }

            Review review = new Review();
            review.setUser(user);
            review.setEvent(event);
            review.setContent(request.getContent());
            review.setRating(request.getRating());
            review.setCreatedAt(LocalDateTime.now());

            // AI Sentiment Analysis
            String sentiment = aiService.analyzeSentiment(request.getContent());
            review.setSentiment(sentiment);

            reviewRepository.save(review);

            return ResponseEntity.ok("Review posted successfully! Sentiment detected: " + sentiment);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error posting review: " + e.getMessage());
        }
    }

    // 2. Get Reviews for an Event (Public)
    @GetMapping("/event/{eventId}")
    public List<Review> getEventReviews(@PathVariable Long eventId) {
        return reviewRepository.findByEventId(eventId);
    }

    // ✅ 3. UPDATED: Get Reviews Scoped to Organizer
    // This ensures organizers ONLY see reviews for their own events
    @GetMapping("/all")
    public List<Review> getAllReviews() {
        User currentUser = getCurrentUser();
        // Uses the custom query added to Repository
        return reviewRepository.findByEvent_Organizer(currentUser);
    }

    // 4. Delete Review (Secure)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));
        
        User currentUser = getCurrentUser();

        // ✅ SECURITY FIX: Ensure the organizer owns the event this review is on
        if (!review.getEvent().getOrganizer().getId().equals(currentUser.getId())) {
             return ResponseEntity.status(403).body("Unauthorized: You do not own the event this review belongs to.");
        }

        reviewRepository.deleteById(id);
        return ResponseEntity.ok("Review deleted successfully.");
    }
}