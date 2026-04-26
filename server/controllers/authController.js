const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, usn, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'student';

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and Password are required' });
    }

    if (userRole === 'admin') {
      if (!email) return res.status(400).json({ message: 'Admin requires an email' });
      const [admins] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      if (admins[0].count >= 1) {
        return res.status(403).json({ message: 'An admin already exists. Only one admin allowed.' });
      }
      const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) return res.status(400).json({ message: 'Email already exists' });
    } else {
      if (!usn) return res.status(400).json({ message: 'Student requires a USN' });
      const [existing] = await pool.query('SELECT * FROM users WHERE usn = ?', [usn]);
      if (existing.length > 0) return res.status(400).json({ message: 'USN already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, usn, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, userRole === 'admin' ? email : null, userRole === 'student' ? usn : null, hashedPassword, userRole]
    );

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, usn, password, role } = req.body;
    const userRole = role === 'admin' ? 'admin' : 'student';

    if (userRole === 'admin' && !email) return res.status(400).json({ message: 'Please provide email and password' });
    if (userRole === 'student' && !usn) return res.status(400).json({ message: 'Please provide USN and password' });
    if (!password) return res.status(400).json({ message: 'Password is required' });

    let users;
    if (userRole === 'admin') {
      [users] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);
    } else {
      [users] = await pool.query('SELECT * FROM users WHERE usn = ? AND role = "student"', [usn]);
    }

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found or role mismatch' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        usn: user.usn,
        borrow_limit: user.borrow_limit
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
