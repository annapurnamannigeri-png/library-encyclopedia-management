package com.shelfsense.library.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "issues")
public class Issue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "issue_date", insertable = false, updatable = false)
    private LocalDateTime issueDate;

    @Column(name = "return_date", nullable = false)
    private LocalDate returnDate;

    @Column(name = "actual_return_date")
    private LocalDate actualReturnDate;

    @Column(name = "fine_amount")
    private Double fineAmount = 0.0;

    @Enumerated(EnumType.STRING)
    private Status status = Status.issued;

    public enum Status {
        issued, returned, overdue
    }
}
