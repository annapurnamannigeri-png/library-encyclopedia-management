package com.shelfsense.library.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

@Repository
public class LibraryJdbcRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> searchBooksWithCategory(String search, String category) {
        StringBuilder sql = new StringBuilder("SELECT b.*, (b.total_quantity - b.issued_quantity) as available_quantity FROM books b WHERE 1=1 ");
        List<Object> params = new java.util.ArrayList<>();
        
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (LOWER(b.title) LIKE ? OR LOWER(b.author) LIKE ? OR LOWER(b.category) LIKE ? OR LOWER(b.barcode) LIKE ?) ");
            String searchPattern = "%" + search.trim().toLowerCase() + "%";
            params.add(searchPattern);
            params.add(searchPattern);
            params.add(searchPattern);
            params.add(searchPattern);
        }
        
        if (category != null && !category.trim().isEmpty()) {
            sql.append("AND b.category = ? ");
            params.add(category);
        }
        
        return jdbcTemplate.queryForList(sql.toString(), params.toArray());
    }

    public List<Map<String, Object>> getDashboardStats() {
        String sql = "SELECT b.id, b.title, b.author, b.category, b.total_quantity, " +
                     "COUNT(i.id) as issued_count, " +
                     "(b.total_quantity - COUNT(i.id)) as available_quantity " +
                     "FROM books b " +
                     "LEFT JOIN issues i ON b.id = i.book_id AND i.status = 'ISSUED' " +
                     "GROUP BY b.id";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAdminIssues() {
        String sql = "SELECT i.*, b.title as book_title, u.name as user_name, " +
                     "COALESCE(u.usn, u.email) as usn_or_email " +
                     "FROM issues i " +
                     "JOIN books b ON i.book_id = b.id " +
                     "JOIN users u ON i.user_id = u.id " +
                     "ORDER BY i.issue_date DESC";
        return jdbcTemplate.queryForList(sql);
    }
    
    public long getOverdueCount() {
        String sql = "SELECT COUNT(*) FROM issues WHERE status = 'OVERDUE' OR (status = 'ISSUED' AND return_date < CURRENT_DATE)";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    public List<Map<String, Object>> getTopBooks() {
        String sql = "SELECT b.title, COUNT(i.id) as borrow_count " +
                     "FROM books b " +
                     "JOIN issues i ON b.id = i.book_id " +
                     "GROUP BY b.id, b.title " +
                     "ORDER BY borrow_count DESC LIMIT 5";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getAdminAddedBooks(String type, Long adminId) {
        String sql;
        if ("issued".equals(type)) {
            sql = "SELECT b.*, (b.total_quantity - b.issued_quantity) as available_quantity " +
                  "FROM books b WHERE b.issued_quantity > 0";
        } else if ("overdue".equals(type)) {
            sql = "SELECT DISTINCT b.*, (b.total_quantity - b.issued_quantity) as available_quantity " +
                  "FROM books b JOIN issues i ON b.id = i.book_id " +
                  "WHERE i.status = 'OVERDUE' OR (i.status = 'ISSUED' AND i.return_date < CURRENT_DATE)";
        } else {
            sql = "SELECT b.*, (b.total_quantity - b.issued_quantity) as available_quantity FROM books b limit 50";
        }
        return jdbcTemplate.queryForList(sql);
    }
}
