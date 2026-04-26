const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Validating columns for users table...');
    
    // Add columns email and usn, nullable to allow transpose
    await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE DEFAULT NULL AFTER name');
    console.log('Added email column...');

    await connection.query('ALTER TABLE users ADD COLUMN usn VARCHAR(100) UNIQUE DEFAULT NULL AFTER email');
    console.log('Added usn column...');

    // Migrate values from old usn_or_email to the new columns
    await connection.query('UPDATE users SET email = usn_or_email WHERE role = "admin"');
    console.log('Migrated admin emails...');

    await connection.query('UPDATE users SET usn = usn_or_email WHERE role = "student"');
    console.log('Migrated student USNs...');

    // Drop the obsolete column usn_or_email
    await connection.query('ALTER TABLE users DROP COLUMN usn_or_email');
    console.log('Dropped legacy usn_or_email column.');

    console.log('Database schema successfully migrated!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns likely already migrated (ignoring DUP_FIELDNAME error).');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
