package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.dto.ShowTimeRequest;
import com.eventmate.eventmate_backend.model.Event;
import com.eventmate.eventmate_backend.model.Hall;
import com.eventmate.eventmate_backend.model.ShowTime;
import com.eventmate.eventmate_backend.repository.EventRepository;
import com.eventmate.eventmate_backend.repository.HallRepository;
import com.eventmate.eventmate_backend.repository.ShowTimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/showtimes")
@RequiredArgsConstructor
@EnableMethodSecurity
public class ShowTimeController {

    private final ShowTimeRepository showTimeRepository;
    private final EventRepository eventRepository;
    private final HallRepository hallRepository;

    // ✅ FIX: Secured — only ADMIN or ORGANIZER can create showtimes
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_ORGANIZER')")
    @PostMapping("/create")
    public ResponseEntity<ShowTime> createShowTime(@RequestBody ShowTimeRequest request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new RuntimeException("Hall not found"));

        ShowTime showTime = new ShowTime();
        showTime.setEvent(event);
        showTime.setHall(hall);
        showTime.setShowDate(request.getShowDate());
        showTime.setShowTime(request.getShowTime());

        // Snapshot the seating config from the Hall at the time of creation
        showTime.setSeated(true);

        // For movies, we use the Hall layout for seating capacity
        showTime.setAvailableGeneralTickets(hall.getTotalCapacity());

        return ResponseEntity.ok(showTimeRepository.save(showTime));
    }

    // 1. Get Single ShowTime by ID (Used by SeatSelectionPage)
    @GetMapping("/{id}")
    public ResponseEntity<ShowTime> getShowTimeById(@PathVariable Long id) {
        return ResponseEntity.ok(showTimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Showtime not found")));
    }

    // 2. Get All ShowTimes for a specific Event (Used by EventDetailsPage)
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<ShowTime>> getShowTimesByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(showTimeRepository.findByEventId(eventId));
    }
}