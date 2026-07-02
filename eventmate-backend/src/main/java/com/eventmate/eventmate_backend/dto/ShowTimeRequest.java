package com.eventmate.eventmate_backend.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ShowTimeRequest {
    private Long eventId;
    private Long hallId;
    private LocalDate showDate;
    private LocalTime showTime;
    private Double price; // Optional: dynamic pricing per showtime
}