const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDB() {
  try {
    // Connect to MySQL server without database first to create the db
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server.');

    // Create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' checked/created.`);

    // Switch to the database
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE DEFAULT NULL,
        usn VARCHAR(255) UNIQUE DEFAULT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'student') DEFAULT 'student',
        borrow_limit INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table checked/created.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        short_description TEXT,
        total_quantity INT DEFAULT 1,
        issued_quantity INT DEFAULT 0,
        available_quantity INT GENERATED ALWAYS AS (total_quantity - issued_quantity) VIRTUAL,
        \`floor\` VARCHAR(50),
        \`row\` VARCHAR(50),
        \`rack\` VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Books table checked/created.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id INT NOT NULL,
        issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        return_date DATETIME NOT NULL,
        actual_return_date DATETIME DEFAULT NULL,
        fine_amount DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('issued', 'returned', 'overdue') DEFAULT 'issued',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);
    console.log('Issues table checked/created.');

    await connection.query(`
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
    `);
    console.log('Requests table checked/created.');

    await connection.query(`
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
    `);
    console.log('Reservations table checked/created.');

    console.log('Database initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDB();
