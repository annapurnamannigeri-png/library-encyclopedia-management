package com.shelfsense.library.service;

import com.shelfsense.library.entity.Book;
import com.shelfsense.library.repository.BookRepository;
import com.shelfsense.library.repository.LibraryJdbcRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private LibraryJdbcRepository jdbcRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findById(id);
    }

    public Optional<Book> getBookByBarcode(String barcode) {
        return bookRepository.findByBarcode(barcode);
    }

    public Book saveBook(Book book) {
        if (book.getBarcode() == null) {
            book.setBarcode("BK-" + System.currentTimeMillis() + "-" + (int)(Math.random()*1000));
        }
        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }
}
