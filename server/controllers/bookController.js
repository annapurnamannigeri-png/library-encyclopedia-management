const pool = require('../config/db');

exports.getBooks = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    const [books] = await pool.query(query, params);
    
    // Format response
    const formattedBooks = books.map(book => ({
      ...book,
      status: book.available_quantity > 0 ? 'Available' : 'Not Available',
      location: `Floor ${book.floor} -> Row ${book.row} -> Rack ${book.rack}`
    }));

    res.json(formattedBooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addBook = async (req, res) => {
  try {
    const { title, author, category, total_quantity, floor, row, rack } = req.body;
    
    // Check required fields
    if (!title || !author || !category || !total_quantity) {
      return res.status(400).json({ message: 'Missing required book details' });
    }

    // Generate unique barcode based on timestamp and randomness
    const barcode = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const [result] = await pool.query(
      'INSERT INTO books (barcode, title, author, category, total_quantity, `floor`, `row`, `rack`, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [barcode, title, author, category, total_quantity, floor, row, rack, req.user.id]
    );

    res.status(201).json({ message: 'Book added successfully', bookId: result.insertId, barcode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding book' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, total_quantity, floor, row, rack } = req.body;

    const [result] = await pool.query(
      'UPDATE books SET title=?, author=?, category=?, total_quantity=?, `floor`=?, `row`=?, `rack`=? WHERE id=?',
      [title, author, category, total_quantity, floor, row, rack, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating book' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query('DELETE FROM books WHERE id=?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting book' });
  }
};

exports.getBookByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const [books] = await pool.query('SELECT * FROM books WHERE barcode = ?', [barcode]);
    
    if (books.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = books[0];
    const formattedBook = {
      ...book,
      status: book.available_quantity > 0 ? 'Available' : 'Not Available',
      location: `Floor ${book.floor} -> Row ${book.row} -> Rack ${book.rack}`
    };

    res.json(formattedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching book' });
  }
};
