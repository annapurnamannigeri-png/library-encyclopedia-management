const pool = require('../config/db');

// Issue Book
exports.issueBook = async (req, res) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // 1. Check if user exceeded borrow limit
    const [user] = await pool.query('SELECT borrow_limit FROM users WHERE id = ?', [user_id]);
    const [activeIssues] = await pool.query('SELECT COUNT(*) as count FROM issues WHERE user_id = ? AND status IN ("issued", "overdue")', [user_id]);
    
    if (activeIssues[0].count >= user[0].borrow_limit) {
      return res.status(400).json({ message: 'Borrow limit reached. Please return books to borrow new ones.' });
    }

    // 2. Check if book is available
    const [book] = await pool.query('SELECT available_quantity FROM books WHERE id = ?', [book_id]);
    if (!book || book.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book[0].available_quantity <= 0) {
      return res.status(400).json({ message: 'Book is currently not available' });
    }

    // 3. Create issue record
    // Default return date is 14 days from issue
    const issueDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(issueDate.getDate() + 2);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES (?, ?, ?, ?, ?)',
        [user_id, book_id, issueDate, returnDate, 'issued']
      );

      // 4. Update book issued_quantity
      await connection.query(
        'UPDATE books SET issued_quantity = issued_quantity + 1 WHERE id = ?',
        [book_id]
      );

      await connection.commit();
      res.status(201).json({ message: 'Book issued successfully', returnDate });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error issuing book' });
  }
};

// Return Book
exports.returnBook = async (req, res) => {
  try {
    const { issue_id } = req.body;
    
    const [issues] = await pool.query('SELECT * FROM issues WHERE id = ?', [issue_id]);
    if (issues.length === 0) {
      return res.status(404).json({ message: 'Issue record not found' });
    }

    const issue = issues[0];
    if (issue.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    const actualReturnDate = new Date();
    const returnDate = new Date(issue.return_date);
    let fine = 0;

    // Calculate fine: 10 per day late
    if (actualReturnDate > returnDate) {
      const diffTime = Math.abs(actualReturnDate - returnDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      fine = diffDays * 10;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(
        'UPDATE issues SET actual_return_date = ?, fine_amount = ?, status = ? WHERE id = ?',
        [actualReturnDate, fine, 'returned', issue_id]
      );

      await connection.query(
        'UPDATE books SET issued_quantity = issued_quantity - 1 WHERE id = ?',
        [issue.book_id]
      );

      // --- SMART RESERVATION LOGIC ---
      // Check for the next person in line
      const [reservations] = await connection.query(
        'SELECT * FROM reservations WHERE book_id = ? AND status = "waiting" ORDER BY created_at ASC LIMIT 1',
        [issue.book_id]
      );

      if (reservations.length > 0) {
        const nextRes = reservations[0];
        const resIssueDate = new Date();
        const resReturnDate = new Date();
        resReturnDate.setDate(resIssueDate.getDate() + 2);

        // Auto-issue to the next student
        await connection.query(
          'INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES (?, ?, ?, ?, "issued")',
          [nextRes.user_id, issue.book_id, resIssueDate, resReturnDate]
        );

        // Update book issued_quantity back up
        await connection.query(
          'UPDATE books SET issued_quantity = issued_quantity + 1 WHERE id = ?',
          [issue.book_id]
        );

        // Mark reservation fulfilled
        await connection.query(
          'UPDATE reservations SET status = "fulfilled" WHERE id = ?',
          [nextRes.id]
        );
      }
      // -------------------------------

      await connection.commit();
      res.json({ 
        message: 'Book returned successfully', 
        fine,
        autoIssued: reservations.length > 0 
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error returning book' });
  }
};

// Get User's Issue History
exports.getUserHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [history] = await pool.query(`
      SELECT i.*, b.title, b.author 
      FROM issues i 
      JOIN books b ON i.book_id = b.id 
      WHERE i.user_id = ?
      ORDER BY i.issue_date DESC
    `, [user_id]);

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// Fine Request
exports.submitFineRequest = async (req, res) => {
  try {
    const { issue_id, reason } = req.body;
    const user_id = req.user.id;
    
    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const [issue] = await pool.query('SELECT fine_amount FROM issues WHERE id=? AND user_id=?', [issue_id, user_id]);
    
    if (issue.length === 0 || issue[0].fine_amount <= 0) {
      return res.status(400).json({ message: 'No fine associated with this issue' });
    }

    await pool.query(
      'INSERT INTO requests (user_id, issue_id, reason, status) VALUES (?, ?, ?, ?)',
      [user_id, issue_id, reason, 'pending']
    );

    res.status(201).json({ message: 'Fine waiver request submitted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting request' });
  }
};

// Issue Book by Barcode (Smart Issue/Reserve)
exports.issueBookByBarcode = async (req, res) => {
  try {
    const { barcode, usn } = req.body;
    let user_id = req.user.id;

    if (!barcode) return res.status(400).json({ message: 'Barcode is required' });

    // 1. If USN is provided (Librarian scanning for student), find that user
    if (usn) {
      const [users] = await pool.query('SELECT id FROM users WHERE usn = ?', [usn]);
      if (users.length === 0) {
        return res.status(404).json({ message: `Student with USN ${usn} not found.` });
      }
      user_id = users[0].id;
    }

    // 2. Find the book
    const [books] = await pool.query('SELECT id, title, available_quantity FROM books WHERE barcode = ?', [barcode]);
    if (books.length === 0) {
       return res.status(404).json({ message: 'Book not found with this barcode' });
    }
    const book = books[0];

    // 3. Check if they already have it
    const [alreadyHandled] = await pool.query(
      'SELECT id FROM issues WHERE book_id = ? AND user_id = ? AND status IN ("issued", "overdue")',
      [book.id, user_id]
    );
    if (alreadyHandled.length > 0) {
      return res.status(400).json({ message: `Student already has "${book.title}" issued.` });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      if (book.available_quantity > 0) {
        // --- CASE A: ISSUE BOOK ---
        // Check borrow limit
        const [user] = await pool.query('SELECT borrow_limit FROM users WHERE id = ?', [user_id]);
        const [activeIssues] = await pool.query('SELECT COUNT(*) as count FROM issues WHERE user_id = ? AND status IN ("issued", "overdue")', [user_id]);
        
        if (activeIssues[0].count >= user[0].borrow_limit) {
          throw new Error('Borrow limit reached for this student.');
        }

        const issueDate = new Date();
        const returnDate = new Date();
        returnDate.setDate(issueDate.getDate() + 2);

        await connection.query(
          'INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES (?, ?, ?, ?, ?)',
          [user_id, book.id, issueDate, returnDate, 'issued']
        );

        await connection.query(
          'UPDATE books SET issued_quantity = issued_quantity + 1 WHERE id = ?',
          [book.id]
        );

        await connection.commit();
        res.status(201).json({ 
          type: 'issue',
          message: `"${book.title}" issued successfully.`, 
          returnDate 
        });
      } else {
        // --- CASE B: RESERVE BOOK (WAITING) ---
        // Check if already reserved
        const [alreadyReserved] = await connection.query(
          'SELECT id FROM reservations WHERE book_id = ? AND user_id = ? AND status = "waiting"',
          [book.id, user_id]
        );
        
        if (alreadyReserved.length > 0) {
          throw new Error(`Student already has a pending reservation for "${book.title}".`);
        }

        await connection.query(
          'INSERT INTO reservations (user_id, book_id, status) VALUES (?, ?, "waiting")',
          [user_id, book.id]
        );

        await connection.commit();
        res.status(201).json({ 
          type: 'reservation',
          message: `No copies of "${book.title}" left. Added to waitlist/reservations successfully.`
        });
      }
    } catch (err) {
      await connection.rollback();
      res.status(400).json({ message: err.message });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during smart issue/reserve.' });
  }
};

// Return Book by Barcode (Smart Return)
exports.returnBookByBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) return res.status(400).json({ message: 'Barcode is required' });

    // 1. Find the book
    const [books] = await pool.query('SELECT id, title FROM books WHERE barcode = ?', [barcode]);
    if (books.length === 0) {
       return res.status(404).json({ message: 'Book not found with this barcode' });
    }
    const book = books[0];

    // 2. Get the ACTIVE issue for this book (whoever has it)
    const [issues] = await pool.query(
      'SELECT i.*, u.name as user_name FROM issues i JOIN users u ON i.user_id = u.id WHERE i.book_id = ? AND i.status IN ("issued", "overdue") LIMIT 1',
      [book.id]
    );

    if (issues.length === 0) {
      return res.status(404).json({ message: `No active issue found for "${book.title}". It might already be on the shelf.` });
    }
    
    const issue = issues[0];
    const actualReturnDate = new Date();
    const returnDate = new Date(issue.return_date);
    let fine = 0;

    // Calculate fine (₹10 per day late)
    if (actualReturnDate > returnDate) {
      const diffTime = Math.abs(actualReturnDate - returnDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      fine = diffDays * 10;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 3. Mark the issue as returned
      await connection.query(
        'UPDATE issues SET actual_return_date = ?, fine_amount = ?, status = ? WHERE id = ?',
        [actualReturnDate, fine, 'returned', issue.id]
      );

      // 4. Update book issued_quantity (temporarily decrease)
      await connection.query(
        'UPDATE books SET issued_quantity = issued_quantity - 1 WHERE id = ?',
        [book.id]
      );

      // 5. --- SMART RESERVATION LOGIC: AUTO-FULFILL ---
      const [reservations] = await connection.query(
        'SELECT r.*, u.name as student_name FROM reservations r JOIN users u ON r.user_id = u.id WHERE r.book_id = ? AND r.status = "waiting" ORDER BY r.created_at ASC LIMIT 1',
        [book.id]
      );

      let autoIssuedTo = null;
      if (reservations.length > 0) {
        const nextRes = reservations[0];
        autoIssuedTo = nextRes.student_name;
        
        const resIssueDate = new Date();
        const resReturnDate = new Date();
        resReturnDate.setDate(resIssueDate.getDate() + 2);

        // Auto-issue to the next student
        await connection.query(
          'INSERT INTO issues (user_id, book_id, issue_date, return_date, status) VALUES (?, ?, ?, ?, "issued")',
          [nextRes.user_id, book.id, resIssueDate, resReturnDate]
        );

        // Re-increase issued_quantity
        await connection.query(
          'UPDATE books SET issued_quantity = issued_quantity + 1 WHERE id = ?',
          [book.id]
        );

        // Mark reservation fulfilled
        await connection.query(
          'UPDATE reservations SET status = "fulfilled" WHERE id = ?',
          [nextRes.id]
        );
      }

      await connection.commit();
      res.json({ 
        message: `"${book.title}" returned by ${issue.user_name} successfully.`, 
        fine,
        autoIssuedTo,
        details: autoIssuedTo ? `Book has been automatically issued to ${autoIssuedTo} (next in queue).` : "Book is now back on the shelf."
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during smart return.' });
  }
};
