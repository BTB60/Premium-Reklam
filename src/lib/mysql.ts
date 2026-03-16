import mysql from 'mysql2/promise';

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'premium_reklam',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize database tables
export async function initMySQL() {
  try {
    const connection = await pool.getConnection();

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'DECORATOR',
        level INT DEFAULT 1,
        total_orders INT DEFAULT 0,
        bonus_points INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'PENDING',
        total_price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Check if admin exists
    const [adminRows] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      ['admin']
    );

    if (Array.isArray(adminRows) && adminRows.length === 0) {
      await connection.execute(
        `INSERT INTO users (full_name, username, phone, email, password_hash, role, level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['Admin', 'admin', '+994507988177', 'premiumreklam@bk.ru', 'admin123', 'ADMIN', 100]
      );
    }

    connection.release();
    console.log('MySQL initialized successfully');
  } catch (error) {
    console.error('MySQL initialization error:', error);
    throw error;
  }
}

export { pool };
