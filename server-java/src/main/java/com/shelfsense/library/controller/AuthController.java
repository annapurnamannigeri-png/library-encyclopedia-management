package com.shelfsense.library.controller;

import com.shelfsense.library.config.JwtUtil;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String role = request.get("role");
        String password = request.get("password");
        String identifier = "admin".equals(role) ? request.get("email") : request.get("usn");
        
        System.out.println("Processing login attempt for: " + identifier + " (Role: " + role + ")");
        System.out.println("DEBUG: Password received length: " + (password != null ? password.length() : "NULL"));

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(identifier, password));

            User user = userService.getAllUsers().stream()
                    .filter(u -> identifier.equalsIgnoreCase(u.getEmail()) || identifier.equalsIgnoreCase(u.getUsn()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("User not found after authentication"));

            Map<String, Object> claims = new HashMap<>();
            claims.put("id", user.getId());
            claims.put("role", user.getRole().name());
            claims.put("name", user.getName());

            String token = jwtUtil.generateToken(identifier, claims);

            // Nuclear Fix: Clean DTO to avoid circular references and serialization issues
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("usn", user.getUsn());
            userData.put("role", user.getRole().name());
            userData.put("borrow_limit", user.getBorrowLimit());

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Logged in successfully");
            response.put("token", token);
            response.put("user", userData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User savedUser = userService.saveUser(user);
            return ResponseEntity.status(201).body(Map.of(
                "message", "User registered successfully",
                "userId", savedUser.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }
}
