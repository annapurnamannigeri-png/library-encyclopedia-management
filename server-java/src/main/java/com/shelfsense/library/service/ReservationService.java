package com.shelfsense.library.service;

import com.shelfsense.library.entity.Book;
import com.shelfsense.library.entity.Reservation;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.BookRepository;
import com.shelfsense.library.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReservationService {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private BookRepository bookRepository;

    public List<Map<String, Object>> getMyReservations(User user) {
        List<Reservation> reservations = reservationRepository.findByUserAndStatusOrderByCreatedAtDesc(user, Reservation.Status.waiting);
        
        return reservations.stream().map(res -> {
            long queuePos = reservationRepository.countByBookAndStatusAndCreatedAtBefore(res.getBook(), Reservation.Status.waiting, res.getCreatedAt()) + 1;
            
            java.util.LinkedHashMap<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("id", res.getId());
            map.put("title", res.getBook().getTitle());
            map.put("book_id", res.getBook().getId());
            map.put("queue_position", queuePos);
            map.put("created_at", res.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    public void addReservation(User user, Long bookId) {
        Book book = bookRepository.findById(bookId).orElseThrow();
        
        if (reservationRepository.findByUserAndBookAndStatus(user, book, Reservation.Status.waiting).isPresent()) {
            throw new RuntimeException("Already reserved");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(user);
        reservation.setBook(book);
        reservation.setStatus(Reservation.Status.waiting);
        reservation.setReservationDate(java.time.LocalDate.now());
        reservationRepository.save(reservation);
    }
}
