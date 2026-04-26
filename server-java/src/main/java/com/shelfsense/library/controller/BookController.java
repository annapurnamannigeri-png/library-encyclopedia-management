package com.shelfsense.library.controller;

import com.shelfsense.library.entity.Book;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.UserRepository;
import com.shelfsense.library.service.BookService;
import com.shelfsense.library.repository.LibraryJdbcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LibraryJdbcRepository jdbcRepository;

    @GetMapping
    public ResponseEntity<?> getAllBooks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category) {
            
        // Use JDBC exactly like Node.js so that available_quantity is included
        return ResponseEntity.ok(jdbcRepository.searchBooksWithCategory(search, category));
    }

    @PostMapping
    public ResponseEntity<?> addBook(@RequestBody Book book) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(username)
                .orElseGet(() -> userRepository.findByUsn(username).orElse(null));
        
        if (book.getCategory() == null) book.setCategory("General");
        book.setAddedBy(currentUser);
        Book savedBook = bookService.saveBook(book);
        
        return ResponseEntity.status(201).body(Map.of(
            "message", "Book added successfully",
            "book_id", savedBook.getId(),
            "barcode", savedBook.getBarcode()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        Book book = bookService.getBookById(id).orElseThrow();
        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setCategory(bookDetails.getCategory() != null ? bookDetails.getCategory() : book.getCategory());
        book.setTotalQuantity(bookDetails.getTotalQuantity());
        book.setFloor(bookDetails.getFloor());
        book.setRow(bookDetails.getRow());
        book.setRack(bookDetails.getRack());
        
        bookService.saveBook(book);
        return ResponseEntity.ok(Map.of("message", "Book updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBook(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ResponseEntity.ok(Map.of("message", "Book deleted successfully"));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<?> getBookByBarcode(@PathVariable String barcode) {
        Book book = bookService.getBookByBarcode(barcode).orElseThrow();
        return ResponseEntity.ok(book);
    }
}
