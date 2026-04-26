package com.shelfsense.library.repository;

import com.shelfsense.library.entity.Issue;
import com.shelfsense.library.entity.User;
import com.shelfsense.library.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByUser(User user);
    List<Issue> findByUserAndStatus(User user, Issue.Status status);
    List<Issue> findByBookAndStatus(Book book, Issue.Status status);
    List<Issue> findByBookAndStatusIn(Book book, List<Issue.Status> statuses);
}
