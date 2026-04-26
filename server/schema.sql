-- ShelfSense Database Schema & Mock Data
-- Import this file into MySQL to setup the project database

CREATE DATABASE IF NOT EXISTS shelfsense;
USE shelfsense;

-- Users Table (Students & Admins)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE DEFAULT NULL,
    usn VARCHAR(100) UNIQUE DEFAULT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') DEFAULT 'student',
    borrow_limit INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books Catalog Table
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    short_description TEXT,
    total_quantity INT DEFAULT 1,
    issued_quantity INT DEFAULT 0,
    available_quantity INT GENERATED ALWAYS AS (total_quantity - issued_quantity) VIRTUAL,
    floor VARCHAR(50),
    row VARCHAR(50),
    rack VARCHAR(50),
    added_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Issues Table (Transactions)
CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date DATE NOT NULL,
    actual_return_date DATE,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('issued', 'returned') DEFAULT 'issued',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Requests Table (Fine Waivers)
CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    issue_id INT NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

-- Reservations Table (Date-Specific Queue)
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    status ENUM('waiting', 'fulfilled', 'cancelled') DEFAULT 'waiting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);


-- ==========================================
-- MOCK DATA INSERTS
-- ==========================================

-- 1. Insert Admins & Students (Passwords are all 'password' hashed with bcrypt 10 rounds)
INSERT INTO users (name, email, usn, password, role, borrow_limit) VALUES 
('Librarian Sarah', 'admin@library', NULL, '$2a$10$wT.fB.fB.fB.fB.fB.fB.fOtzK/wT.fB.fB.fB.fB.fB.fB.fB.fB', 'admin', 99),
('Student John', NULL, '1RV21CS001', '$2a$10$wT.fB.fB.fB.fB.fB.fB.fOtzK/wT.fB.fB.fB.fB.fB.fB.fB.fB', 'student', 3),
('Student Emma', NULL, '1RV21CS002', '$2a$10$wT.fB.fB.fB.fB.fB.fB.fOtzK/wT.fB.fB.fB.fB.fB.fB.fB.fB', 'student', 5);

-- 2. Insert Books 
INSERT INTO books (title, author, category, short_description, total_quantity, issued_quantity, floor, row, rack) VALUES
('Introduction to AI', 'Stuart Russell', 'AI', 'A beginner-friendly book on Artificial Intelligence concepts and algorithms.', 5, 2, '1', 'A', '1'),
('Python for Data Science', 'Jake VanderPlas', 'Programming', 'Covers Python programming basics and data science libraries like Pandas, NumPy, and Matplotlib.', 6, 1, '1', 'A', '2'),
('Modern Web Development', 'Brad Frost', 'Programming', 'Guide to modern web development, including responsive design, CSS Grid, and React basics.', 4, 0, '1', 'B', '1'),
('Machine Learning Basics', 'Tom Mitchell', 'AI', 'Fundamentals of machine learning algorithms, supervised and unsupervised learning.', 3, 1, '1', 'B', '2'),
('History of India', 'Romila Thapar', 'History', 'Overview of Indian history from ancient times to the modern era.', 5, 0, '2', 'A', '1'),
('World War II Chronicles', 'Antony Beevor', 'History', 'A detailed account of World War II events and strategies.', 3, 2, '2', 'A', '2'),
('Java Programming Essentials', 'Herbert Schildt', 'Programming', 'Complete guide to Java programming with practical examples and exercises.', 6, 3, '1', 'C', '1'),
('Deep Learning Illustrated', 'Jon Krohn', 'AI', 'Easy-to-follow illustrations to understand deep learning concepts.', 4, 1, '1', 'C', '2'),
('Operating Systems Concepts', 'Abraham Silberschatz', 'Programming', 'Explains operating system principles, processes, and memory management.', 5, 2, '1', 'D', '1'),
('Ancient Civilizations', 'Charles Freeman', 'History', 'Explores the rise and fall of ancient civilizations worldwide.', 4, 1, '2', 'B', '1'),
('Data Structures & Algorithms', 'Robert Lafore', 'Programming', 'Core concepts of data structures and algorithms for beginners and intermediate learners.', 5, 0, '1', 'D', '2'),
('Natural Language Processing', 'Daniel Jurafsky', 'AI', 'Introduces NLP techniques and their applications in AI.', 3, 1, '1', 'E', '1'),
('Medieval Europe', 'Norman Cantor', 'History', 'A detailed account of European history in the medieval period.', 3, 0, '2', 'B', '2'),
('C++ Primer', 'Stanley B. Lippman', 'Programming', 'Beginner to advanced C++ concepts explained with examples.', 4, 1, '1', 'F', '1'),
('Reinforcement Learning', 'Richard Sutton', 'AI', 'Covers reinforcement learning concepts, including agents, rewards, and policy optimization.', 3, 1, '1', 'F', '2');

-- 3. Insert Active & Overdue Issues
-- ('Introduction to Algorithms' issued normally to Student John)
INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES 
(2, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 9 DAY), 'issued');

-- ('Design Patterns' issued to Emma and is Overdue by 4 days)
INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES 
(3, 3, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 'issued');

-- ('Discrete Mathematics' issued to John, returned late and has fine of 20 rupees)
INSERT INTO issues (user_id, book_id, issue_date, return_date, actual_return_date, fine_amount, status) VALUES 
(2, 4, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 16 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), 20.00, 'returned');

-- 4. Insert Mock Fine Requests (Emma requests waiver for the next scan return)
INSERT INTO requests (user_id, issue_id, reason, status) VALUES 
(3, 2, 'I was sick and could not commute to the library to return the book.', 'pending');

-- 5. Insert Mock Reservation (John reserves Clean Coder)
INSERT INTO reservations (user_id, book_id, reservation_date, status) VALUES 
(2, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), 'waiting');
