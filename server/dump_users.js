const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    const [rows] = await conn.execute('SELECT usn, email, password, role FROM users');
    console.log(JSON.stringify(rows, null, 2));
    await conn.end();
}
run();
