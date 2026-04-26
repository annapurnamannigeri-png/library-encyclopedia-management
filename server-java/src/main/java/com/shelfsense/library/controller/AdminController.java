package com.shelfsense.library.controller;

import com.shelfsense.library.repository.LibraryJdbcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class AdminController {

    @Autowired
    private LibraryJdbcRepository jdbcRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        // JDBC Stats as requested
        return ResponseEntity.ok(jdbcRepository.getDashboardStats());
    }

    @GetMapping("/admin/issues")
    public ResponseEntity<?> getAdminIssues() {
        return ResponseEntity.ok(jdbcRepository.getAdminIssues());
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats() {
        java.util.List<java.util.Map<String, Object>> books = jdbcRepository.getDashboardStats();
        long totalBooks = 0;
        long issuedBooks = 0;
        for (java.util.Map<String, Object> book : books) {
            Object totalQty = book.get("total_quantity");
            if (totalQty instanceof Number) {
                totalBooks += ((Number) totalQty).longValue();
            }
            Object issuedCount = book.get("issued_count");
            if (issuedCount instanceof Number) {
                issuedBooks += ((Number) issuedCount).longValue();
            }
        }
        
        long overdueBooks = jdbcRepository.getOverdueCount();
        java.util.List<java.util.Map<String, Object>> topBooks = jdbcRepository.getTopBooks();
        
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalBooks", totalBooks);
        stats.put("issuedBooks", issuedBooks);
        stats.put("overdueBooks", overdueBooks);
        stats.put("topBooks", topBooks);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin/added-books")
    public ResponseEntity<?> getAdminAddedBooks(@RequestParam(required = false, defaultValue = "all") String type) {
        // We'll ignore adminId since the user wants a full view
        return ResponseEntity.ok(jdbcRepository.getAdminAddedBooks(type, 1L));
    }
}
