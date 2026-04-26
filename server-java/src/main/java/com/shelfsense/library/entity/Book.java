package com.shelfsense.library.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Formula;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String barcode;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String category = "General";

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "total_quantity")
    private Integer totalQuantity = 1;

    @Column(name = "issued_quantity")
    private Integer issuedQuantity = 0;

    @Formula("total_quantity - issued_quantity")
    private Integer availableQuantity;

    private String floor;
    @Column(name = "`row`")
    private String row;
    private String rack;

    @ManyToOne
    @JoinColumn(name = "added_by")
    private User addedBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
