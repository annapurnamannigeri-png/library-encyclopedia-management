package com.shelfsense.library.service;

import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // We search by email or USN depending on the login input (frontend sends both)
        User user = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsn(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with identifier: " + username)));

        return new org.springframework.security.core.userdetails.User(
                username,
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name().toUpperCase()))
        );
    }
}
