package com.eventmate.eventmate_backend.controller;

import com.eventmate.eventmate_backend.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-payment-intent")
    public ResponseEntity<Map<String, String>> createPaymentIntent(@RequestBody Map<String, Object> request) {
        try {
            // Log the incoming request
            System.out.println("💰 Init Payment Request: " + request);
            
            Double amount = Double.parseDouble(request.get("amount").toString());
            Map<String, String> response = paymentService.createPaymentIntent(amount, "inr");
            
            System.out.println("✅ Payment Intent Created: " + response.get("clientSecret").substring(0, 10) + "...");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // ❌ THIS PRINTS THE REAL ERROR TO YOUR CONSOLE
            System.err.println("❌ STRIPE ERROR: " + e.getMessage());
            e.printStackTrace(); 
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}