package com.shelfsense.library.repository;

import com.shelfsense.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByBarcode(String barcode);
}
