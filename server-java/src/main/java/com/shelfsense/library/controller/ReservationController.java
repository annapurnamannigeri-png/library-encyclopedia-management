package com.shelfsense.library.controller;

import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.UserRepository;
import com.shelfsense.library.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/my-reservations")
    public ResponseEntity<?> getMyReservations() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsn(username).orElseThrow());
                
        return ResponseEntity.ok(reservationService.getMyReservations(currentUser));
    }

    @PostMapping("/reserve")
    public ResponseEntity<?> reserveBook(@RequestBody Map<String, Object> request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsn(username).orElseThrow());
                
        Long bookId = Long.valueOf(request.get("book_id").toString());
        reservationService.addReservation(currentUser, bookId);
        
        return ResponseEntity.ok(Map.of("message", "Book reserved successfully. You are in the queue."));
    }
}
