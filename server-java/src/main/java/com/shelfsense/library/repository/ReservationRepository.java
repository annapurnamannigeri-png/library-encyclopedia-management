package com.shelfsense.library.repository;

import com.shelfsense.library.entity.Reservation;
import com.shelfsense.library.entity.Book;
import com.shelfsense.library.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByBookAndStatusOrderByCreatedAtAsc(Book book, Reservation.Status status);
    List<Reservation> findByUserAndStatusOrderByCreatedAtDesc(User user, Reservation.Status status);
    Optional<Reservation> findByUserAndBookAndStatus(User user, Book book, Reservation.Status status);
    
    long countByBookAndStatusAndCreatedAtBefore(Book book, Reservation.Status status, java.time.LocalDateTime createdAt);
}
