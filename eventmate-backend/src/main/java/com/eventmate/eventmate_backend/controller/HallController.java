package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.model.Hall;
import com.eventmate.eventmate_backend.service.HallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/halls")
public class HallController {

    @Autowired
    private HallService hallService;

    @PostMapping("/create")
    public ResponseEntity<Hall> createHall(@RequestBody Hall hall) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(hallService.createHall(hall, auth.getName()));
    }

    @GetMapping("/my-halls")
    public ResponseEntity<List<Hall>> getMyHalls() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(hallService.getMyHalls(auth.getName()));
    }
}