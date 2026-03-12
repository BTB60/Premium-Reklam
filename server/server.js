require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Premium Reklam API işləyir",
      time: result.rows[0],
      status: "OK"
    });
  } catch (error) {
    res.status(500).json({ error: "Database bağlantı xətası" });
  }
});

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, full_name, username, phone, email, role, level, created_at FROM users");
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
app.post("/api/users", async (req, res) => {
  try {
    const { fullName, username, phone, email, password, role } = req.body;
    const result = await pool.query(
      "INSERT INTO users (full_name, username, phone, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, username, phone, email, role, level, created_at",
      [fullName, username, phone, email || "", password, role || "DECORATOR"]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/api/auth", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      "SELECT id, full_name, username, phone, email, role, level FROM users WHERE username = $1 AND password_hash = $2",
      [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "İstifadəçi adı və ya şifrə yanlışdır" });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all orders
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    res.json({ orders: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, customerName, customerPhone, productType, width, height, quantity, totalAmount, finalTotal } = req.body;
    const result = await pool.query(
      "INSERT INTO orders (user_id, customer_name, customer_phone, product_type, width, height, quantity, total_amount, final_total, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [userId, customerName, customerPhone, productType, width, height, quantity, totalAmount, finalTotal, "pending"]
    );
    res.status(201).json({ order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda işləyir`);
});
