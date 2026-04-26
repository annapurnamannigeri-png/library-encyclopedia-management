const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fix() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'shelfsense'
    });
    // Let's generate a proper bcrypt hash for password123
    const hash = await bcrypt.hash('password123', 10);
    console.log('Generated hash:', hash);
    await conn.execute("UPDATE users SET password = ? WHERE email = 'aamnahonwad164@gmail.com'", [hash]);
    await conn.execute("UPDATE users SET password = ? WHERE usn = '333cs21002'", [hash]);
    console.log('Fixed DB Hash for both Admin and Student!');
    process.exit(0);
}
fix();
