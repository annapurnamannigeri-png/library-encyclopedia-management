const pool = require('../config/db');

// Reserve a book for a student
exports.reserveBook = async (req, res) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // 1. Check if book exists
    const [bookRes] = await pool.query('SELECT title, total_quantity, issued_quantity, available_quantity FROM books WHERE id = ?', [book_id]);
    if (bookRes.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    const book = bookRes[0];

    // 2. Check if student already has this book issued
    const [alreadyIssued] = await pool.query(
      'SELECT id FROM issues WHERE book_id = ? AND user_id = ? AND status IN ("issued", "overdue")',
      [book_id, user_id]
    );
    if (alreadyIssued.length > 0) {
      return res.status(400).json({ message: 'You already have this book issued.' });
    }

    // 3. Check if student already has a pending reservation for this book
    const [alreadyReserved] = await pool.query(
      'SELECT id FROM reservations WHERE book_id = ? AND user_id = ? AND status = "waiting"',
      [book_id, user_id]
    );
    if (alreadyReserved.length > 0) {
      return res.status(400).json({ message: 'You already have a pending reservation for this book.' });
    }

    // 4. SMART RULE: "If only 1 copy is available, add the book to the student's 'Your Reservations' list"
    // In this context, "available" probably means "no copies on shelf" OR "total quantity is 1 and it is issued"
    if (book.available_quantity > 0 && book.total_quantity > 1) {
       return res.status(400).json({ message: 'Copies are currently available on the shelf. Please issue it directly.' });
    }

    // Insert into reservations
    await pool.query(
      'INSERT INTO reservations (user_id, book_id, status) VALUES (?, ?, "waiting")',
      [user_id, book_id]
    );

    res.status(201).json({ message: `Success! ${book.title} has been added to your reservations.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error reserving book' });
  }
};

// Get User's Reservations and Queue Position
exports.getUserReservations = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Get all user reservations that are waiting
    // Also JOIN with issues to get the current borrower's dates (if any)
    const [myReservations] = await pool.query(`
      SELECT 
        r.id, r.book_id, r.created_at, r.status,
        b.title, b.author,
        i.issue_date as current_issue_date,
        i.return_date as current_due_date
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      LEFT JOIN (
        SELECT book_id, MIN(issue_date) as issue_date, MIN(return_date) as return_date
        FROM issues 
        WHERE status IN ('issued', 'overdue')
        GROUP BY book_id
      ) i ON r.book_id = i.book_id
      WHERE r.user_id = ? AND r.status = 'waiting'
    `, [user_id]);

    // Calculate queue position for each
    const processedReservations = await Promise.all(
      myReservations.map(async (resItem) => {
        const [queue] = await pool.query(
          'SELECT COUNT(*) as position FROM reservations WHERE book_id = ? AND status = "waiting" AND created_at <= ?',
          [resItem.book_id, resItem.created_at]
        );
        return {
          ...resItem,
          queuePosition: queue[0].position
        };
      })
    );

    res.json(processedReservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching reservations' });
  }
};

// Cancel Reservation
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query('UPDATE reservations SET status = "cancelled" WHERE id = ? AND user_id = ?', [id, user_id]);
    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling reservation' });
  }
};
