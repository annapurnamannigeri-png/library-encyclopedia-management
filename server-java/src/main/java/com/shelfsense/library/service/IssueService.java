package com.shelfsense.library.service;

import com.shelfsense.library.entity.Book;
import com.shelfsense.library.entity.Issue;
import com.shelfsense.library.entity.Reservation;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.repository.BookRepository;
import com.shelfsense.library.repository.IssueRepository;
import com.shelfsense.library.repository.ReservationRepository;
import com.shelfsense.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class IssueService {

    @Autowired
    private IssueRepository issueRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Transactional
    public Issue issueBook(Long userId, Long bookId, LocalDate returnDate) {
        User user = userRepository.findById(userId).orElseThrow();
        Book book = bookRepository.findById(bookId).orElseThrow();

        if (book.getAvailableQuantity() <= 0) {
            throw new RuntimeException("Book not available");
        }

        // Check active issues count (issued or overdue)
        long activeCount = issueRepository.findByUserAndStatus(user, Issue.Status.issued).size() +
                           issueRepository.findByUserAndStatus(user, Issue.Status.overdue).size();
                           
        if (activeCount >= user.getBorrowLimit()) {
            throw new RuntimeException("Borrow limit reached");
        }

        Issue issue = new Issue();
        issue.setUser(user);
        issue.setBook(book);
        // Default to +2 days if not provided
        issue.setReturnDate(returnDate != null ? returnDate : LocalDate.now().plusDays(2));
        issue.setStatus(Issue.Status.issued);

        book.setIssuedQuantity(book.getIssuedQuantity() + 1);
        bookRepository.save(book);

        return issueRepository.save(issue);
    }

    @Transactional
    public Issue returnBook(Long issueId) {
        Issue issue = issueRepository.findById(issueId).orElseThrow();
        if (issue.getStatus() == Issue.Status.returned) {
            return issue;
        }

        LocalDate today = LocalDate.now();
        issue.setActualReturnDate(today);
        issue.setStatus(Issue.Status.returned);

        // Fine Logic: ₹10 per day late
        if (today.isAfter(issue.getReturnDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(issue.getReturnDate(), today);
            issue.setFineAmount(daysOverdue * 10.0);
        }

        Book book = issue.getBook();
        
        // --- SMART RESERVATION LOGIC: FIFO ---
        List<Reservation> waiting = reservationRepository.findByBookAndStatusOrderByCreatedAtAsc(book, Reservation.Status.waiting);
        
        if (!waiting.isEmpty()) {
            Reservation nextRes = waiting.get(0);
            
            // Auto-issue to the next student
            Issue newIssue = new Issue();
            newIssue.setUser(nextRes.getUser());
            newIssue.setBook(book);
            newIssue.setReturnDate(LocalDate.now().plusDays(2));
            newIssue.setStatus(Issue.Status.issued);
            issueRepository.save(newIssue);

            // Update reservation status
            nextRes.setStatus(Reservation.Status.fulfilled);
            reservationRepository.save(nextRes);
            
            // Note: Availability (issued_quantity) stays the same because it was returned then immediately issued
        } else {
            // Normal return: decrease issued count
            book.setIssuedQuantity(Math.max(0, book.getIssuedQuantity() - 1));
            bookRepository.save(book);
        }

        return issueRepository.save(issue);
    }

    public List<Issue> getHistory(User user) {
        return issueRepository.findByUser(user);
    }

    public List<Issue> getAllIssues() {
        return issueRepository.findAll();
    }

    @Transactional
    public java.util.Map<String, Object> issueBookByBarcode(String barcode, Long userId) {
        Book book = bookRepository.findByBarcode(barcode).orElseThrow(() -> new RuntimeException("Book not found"));
        User user = userRepository.findById(userId).orElseThrow();

        // Check if student already has this book issued
        long alreadyHandled = issueRepository.findByUserAndStatus(user, Issue.Status.issued).stream()
                .filter(i -> i.getBook().getId().equals(book.getId())).count() +
                issueRepository.findByUserAndStatus(user, Issue.Status.overdue).stream()
                .filter(i -> i.getBook().getId().equals(book.getId())).count();
                
        if (alreadyHandled > 0) {
            throw new RuntimeException("Student already has this book issued.");
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();

        if (book.getAvailableQuantity() > 0) {
            Issue issue = issueBook(userId, book.getId(), null); // Throws if borrow limit reached
            response.put("type", "issue");
            response.put("message", "Book issued successfully.");
            response.put("returnDate", issue.getReturnDate());
        } else {
            // Smart Reserve
            boolean alreadyReserved = reservationRepository.findByUserAndStatusOrderByCreatedAtDesc(user, Reservation.Status.waiting).stream()
                    .anyMatch(r -> r.getBook().getId().equals(book.getId()));
            if (alreadyReserved) {
                throw new RuntimeException("Student already has a pending reservation for this book.");
            }

            Reservation reservation = new Reservation();
            reservation.setUser(user);
            reservation.setBook(book);
            reservation.setStatus(Reservation.Status.waiting);
            reservation.setReservationDate(LocalDate.now().plusDays(2));
            reservationRepository.save(reservation);

            response.put("type", "reservation");
            response.put("message", "No copies left. Added to waitlist/reservations successfully.");
        }
        return response;
    }

    @Transactional
    public java.util.Map<String, Object> returnBookByBarcode(String barcode) {
        Book book = bookRepository.findByBarcode(barcode).orElseThrow(() -> new RuntimeException("Book not found"));
        
        List<Issue> activeIssues = issueRepository.findByBookAndStatusIn(book, java.util.Arrays.asList(Issue.Status.issued, Issue.Status.overdue));
        if (activeIssues.isEmpty()) {
            throw new RuntimeException("No active issue found for this book. It might already be on the shelf.");
        }
        
        Issue issueToReturn = activeIssues.get(0);
        String userName = issueToReturn.getUser().getName();
        
        Issue returned = returnBook(issueToReturn.getId());
        
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "Book returned by " + userName + " successfully.");
        double fine = returned.getFineAmount() != null ? returned.getFineAmount() : 0;
        response.put("fine", fine);
        response.put("details", fine > 0 ? "Fines incurred: ₹" + fine : "Return processed successfully (No fines).");
        return response;
    }
}
