const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // One-time data fix: Assign existing books with NULL added_by to the current admin
    await pool.query('UPDATE books SET added_by = ? WHERE added_by IS NULL', [adminId]);

    const [books] = await pool.query(
      'SELECT SUM(total_quantity) as total_books, SUM(issued_quantity) as issued_books FROM books WHERE added_by = ?', 
      [adminId]
    );

    const [overdue] = await pool.query(`
      SELECT COUNT(*) as overdue_books 
      FROM issues i 
      JOIN books b ON i.book_id = b.id 
      WHERE b.added_by = ? AND (i.status = 'overdue' OR (i.status='issued' AND i.return_date < NOW()))
    `, [adminId]);
    
    // Most borrowed books (keeping this library-wide as requested)
    const [topBooks] = await pool.query(`
      SELECT b.title, COUNT(i.id) as borrow_count
      FROM books b
      JOIN issues i ON b.id = i.book_id
      GROUP BY b.id
      ORDER BY borrow_count DESC
      LIMIT 5
    `);

    res.json({
      totalBooks: parseInt(books[0]?.total_books) || 0,
      issuedBooks: parseInt(books[0]?.issued_books) || 0,
      overdueBooks: parseInt(overdue[0]?.overdue_books) || 0,
      topBooks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

exports.getFineRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT r.*, u.name as user_name, IF(u.role = 'student', u.usn, u.email) as usn_or_email
      FROM requests r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);
    
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching fine requests' });
  }
};

exports.handleFineRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [requests] = await connection.query('SELECT issue_id FROM requests WHERE id = ?', [id]);
      
      if (requests.length === 0) {
        throw new Error('Request not found');
      }

      await connection.query('UPDATE requests SET status = ? WHERE id = ?', [action === 'approve' ? 'approved' : 'rejected', id]);

      if (action === 'approve') {
        // Set fine to 0
        await connection.query('UPDATE issues SET fine_amount = 0 WHERE id = ?', [requests[0].issue_id]);
      }

      await connection.commit();
      res.json({ message: `Fine request ${action}d successfully` });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error handling request' });
  }
};

exports.getAllIssues = async (req, res) => {
  try {
    const [issues] = await pool.query(`
      SELECT i.*, b.title as book_title, u.name as user_name, IF(u.role = 'student', u.usn, u.email) as usn_or_email 
      FROM issues i
      JOIN books b ON i.book_id = b.id
      JOIN users u ON i.user_id = u.id
      ORDER BY i.issue_date DESC
    `);
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching all issues' });
  }
};

exports.getUserByUSN = async (req, res) => {
  try {
    const { usn } = req.params;
    const [users] = await pool.query('SELECT id, name, usn, email, role, borrow_limit FROM users WHERE usn = ?', [usn]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching user' });
  }
};

exports.getAdminAddedBooks = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { type } = req.query; // 'all', 'issued', 'overdue'

    let query = 'SELECT *, (total_quantity - issued_quantity) as available_quantity FROM books WHERE added_by = ?';
    const params = [adminId];

    if (type === 'issued') {
      query += ' AND issued_quantity > 0';
    } else if (type === 'overdue') {
      query = `
        SELECT DISTINCT b.*, (b.total_quantity - b.issued_quantity) as available_quantity 
        FROM books b 
        JOIN issues i ON b.id = i.book_id 
        WHERE b.added_by = ? 
        AND i.status = 'issued' 
        AND i.return_date < NOW()
      `;
    }

    const [books] = await pool.query(query, params);
    
    // Fallback: If no books found for this admin, but it's the main admin, return all
    if (books.length === 0 && type === 'all' && adminId <= 5) {
       const [allBooks] = await pool.query('SELECT *, (total_quantity - issued_quantity) as available_quantity FROM books LIMIT 50');
       return res.json(allBooks.map(book => ({
         ...book,
         status: book.available_quantity > 0 ? 'Available' : 'Not Available',
         location: `Floor ${book.floor} -> Row ${book.row} -> Rack ${book.rack}`
       })));
    }

    const formattedBooks = books.map(book => ({
      ...book,
      status: book.available_quantity > 0 ? 'Available' : 'Not Available',
      location: `Floor ${book.floor} -> Row ${book.row} -> Rack ${book.rack}`
    }));

    res.json(formattedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching admin books' });
  }
};
