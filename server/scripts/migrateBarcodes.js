require('dotenv').config({ path: './server/.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shelfsense'
});

async function migrate() {
  try {
    console.log('Starting barcode migration...');
    
    // Add column if not exists (in case schema.sql wasn't run)
    try {
      await pool.query('ALTER TABLE books ADD COLUMN barcode VARCHAR(100) UNIQUE DEFAULT NULL AFTER id;');
      console.log('Added barcode column to books table.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Barcode column already exists.');
      } else {
        throw err;
      }
    }

    // Get all books that don't have a barcode
    const [books] = await pool.query('SELECT id FROM books WHERE barcode IS NULL');
    console.log(`Found ${books.length} books without barcodes.`);

    for (const book of books) {
      // Generate unique alphanumeric barcode (e.g., BK-1-1681234567)
      const barcode = `BK-${book.id}-${Date.now()}`;
      await pool.query('UPDATE books SET barcode = ? WHERE id = ?', [barcode, book.id]);
      console.log(`Assigned barcode ${barcode} to book ID ${book.id}`);
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
