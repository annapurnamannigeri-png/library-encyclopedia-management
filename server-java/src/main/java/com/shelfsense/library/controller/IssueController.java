package com.shelfsense.library.controller;

import com.shelfsense.library.entity.Issue;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.UserRepository;
import com.shelfsense.library.service.IssueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    @Autowired
    private IssueService issueService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsn(username).orElseThrow());
        
        return ResponseEntity.ok(issueService.getHistory(currentUser));
    }

    @PostMapping
    public ResponseEntity<?> handleIssue(@RequestBody Map<String, Object> request) {
        String action = (String) request.get("action");
        
        if ("issue".equals(action)) {
            Long userId = Long.valueOf(request.get("user_id").toString());
            Long bookId = Long.valueOf(request.get("book_id").toString());
            LocalDate returnDate = request.get("return_date") != null ? 
                                 LocalDate.parse(request.get("return_date").toString()) : null;
                                 
            Issue issue = issueService.issueBook(userId, bookId, returnDate);
            return ResponseEntity.status(201).body(issue);
        } else if ("return".equals(action)) {
            Long issueId = Long.valueOf(request.get("issue_id").toString());
            Issue returnedIssue = issueService.returnBook(issueId);
            return ResponseEntity.ok(returnedIssue);
        }
        
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid action"));
    }

    @PostMapping("/issue")
    public ResponseEntity<?> handleCatalogIssue(@RequestBody Map<String, Object> request) {
        try {
            Long bookId = Long.valueOf(request.get("book_id").toString());
            
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByEmail(username)
                    .orElseGet(() -> userRepository.findByUsn(username).orElseThrow());
                    
            Issue issue = issueService.issueBook(currentUser.getId(), bookId, null);
            return ResponseEntity.status(201).body(Map.of(
                "message", "Book issued successfully",
                "returnDate", issue.getReturnDate()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/barcode-issue")
    public ResponseEntity<?> handleBarcodeIssue(@RequestBody Map<String, String> request) {
        try {
            String barcode = request.get("barcode");
            if (barcode == null) return ResponseEntity.badRequest().body(Map.of("message", "Barcode is required"));
            
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByEmail(username)
                    .orElseGet(() -> userRepository.findByUsn(username).orElseThrow());
                    
            Map<String, Object> result = issueService.issueBookByBarcode(barcode, currentUser.getId());
            return ResponseEntity.status(201).body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/barcode-return")
    public ResponseEntity<?> handleBarcodeReturn(@RequestBody Map<String, String> request) {
        try {
            String barcode = request.get("barcode");
            if (barcode == null) return ResponseEntity.badRequest().body(Map.of("message", "Barcode is required"));
            
            Map<String, Object> result = issueService.returnBookByBarcode(barcode);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
