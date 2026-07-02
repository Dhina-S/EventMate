package com.eventmate.eventmate_backend.service;

import com.eventmate.eventmate_backend.dto.ReviewRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.Review;
import com.eventmate.eventmate_backend.model.User;
import com.eventmate.eventmate_backend.repository.BookingRepository; // Import this
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.ReviewRepository;
import com.eventmate.eventmate_backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private BookingRepository bookingRepository; // Inject Booking Repo

    public Review addReview(String userEmail, ReviewRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // ✅ SECURITY CHECK: Has the user actually booked this event?
        boolean hasBooking = bookingRepository.existsByUserIdAndEventIdAndStatus(
        user.getId(),
        event.getId(),
        "CONFIRMED"
        );

        if (!hasBooking) {
            throw new RuntimeException("You can only review events you have booked and confirmed!");
        }

        Review review = new Review();
        review.setUser(user);
        review.setEvent(event);
        review.setRating(request.getRating());
        review.setContent(request.getContent());

        // Simple AI Sentiment Logic
        String text = request.getContent().toLowerCase();

        if (text.contains("good") || text.contains("great") || text.contains("love") || text.contains("amazing")) {
            review.setSentiment("Positive");
        } else if (text.contains("bad") || text.contains("hate") || text.contains("worst") || text.contains("poor")) {
            review.setSentiment("Negative");
        } else {
            review.setSentiment("Neutral");
        }

        return reviewRepository.save(review);
    }

    public List<Review> getEventReviews(Long eventId) {
        return reviewRepository.findByEventId(eventId);
    }
}