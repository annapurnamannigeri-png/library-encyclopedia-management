package com.shelfsense.library;

import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import java.util.List;

@Component
public class DiagnosticRunner implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- DIAGNOSTIC START ---");
        List<User> users = userRepository.findAll();
        System.out.println("Total users found: " + users.size());
        
        for (User user : users) {
            String identifier = user.getRole().name().equals("admin") ? user.getEmail() : user.getUsn();
            boolean matches = passwordEncoder.matches("password123", user.getPassword());
            System.out.println("User: " + user.getName() + " | Identifier: " + identifier + " | Password Matches 'password123': " + matches);
            
            if (matches && identifier != null) {
                try {
                    Authentication auth = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(identifier, "password123")
                    );
                    System.out.println("  -> AUTHENTICATION SUCCESS for " + identifier);
                } catch (Exception e) {
                    System.out.println("  -> AUTHENTICATION FAILED for " + identifier + ": " + e.getMessage());
                }
            } else if (!matches) {
                System.out.println("  Hash found: " + user.getPassword());
            }
        }
        System.out.println("--- DIAGNOSTIC END ---");
    }
}
