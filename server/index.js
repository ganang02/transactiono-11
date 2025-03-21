
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pos_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/ping', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ message: 'Database connected successfully!' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API Routes
// Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, barcode, stock, category } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, price, barcode, stock, category) VALUES (?, ?, ?, ?, ?)',
      [name, price, barcode, stock, category]
    );
    
    const [newProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, price, barcode, stock, category } = req.body;
    const productId = req.params.id;
    
    await pool.query(
      'UPDATE products SET name = ?, price = ?, barcode = ?, stock = ?, category = ? WHERE id = ?',
      [name, price, barcode, stock, category, productId]
    );
    
    const [updatedProduct] = await pool.query('SELECT * FROM products WHERE id = ?', [productId]);
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const [transactions] = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    
    // For each transaction, get its items
    for (let i = 0; i < transactions.length; i++) {
      const [items] = await pool.query(
        'SELECT * FROM transaction_items WHERE transaction_id = ?', 
        [transactions[i].id]
      );
      transactions[i].items = items;
    }
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { items, subtotal, tax, total, paymentMethod, status, receipt, amountPaid, change } = req.body;
    
    // Insert transaction
    const [resultTransaction] = await connection.query(
      'INSERT INTO transactions (date, total, subtotal, tax, payment_method, status, receipt, amount_paid, change_amount) VALUES (NOW(), ?, ?, ?, ?, ?, ?, ?, ?)',
      [total, subtotal, tax, paymentMethod, status, receipt ? 1 : 0, amountPaid || null, change || null]
    );
    
    const transactionId = resultTransaction.insertId;
    
    // Insert transaction items and update product stock
    for (const item of items) {
      await connection.query(
        'INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [transactionId, item.productId, item.productName, item.quantity, item.price, item.subtotal]
      );
      
      // Update product stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }
    
    await connection.commit();
    
    // Get the complete transaction with items
    const [newTransaction] = await connection.query('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    const [transactionItems] = await connection.query('SELECT * FROM transaction_items WHERE transaction_id = ?', [transactionId]);
    
    newTransaction[0].items = transactionItems;
    
    res.status(201).json(newTransaction[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    connection.release();
  }
});

// Store Info
app.get('/api/store', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM store_info LIMIT 1');
    res.json(rows[0] || {});
  } catch (error) {
    console.error('Error fetching store info:', error);
    res.status(500).json({ error: 'Failed to fetch store info' });
  }
});

app.put('/api/store', async (req, res) => {
  try {
    const { name, whatsapp, address, notes } = req.body;
    
    // Check if store info exists
    const [existingStore] = await pool.query('SELECT * FROM store_info LIMIT 1');
    
    if (existingStore.length > 0) {
      await pool.query(
        'UPDATE store_info SET name = ?, whatsapp = ?, address = ?, notes = ? WHERE id = ?',
        [name, whatsapp, address, notes, existingStore[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO store_info (name, whatsapp, address, notes) VALUES (?, ?, ?, ?)',
        [name, whatsapp, address, notes]
      );
    }
    
    const [updatedStore] = await pool.query('SELECT * FROM store_info LIMIT 1');
    res.json(updatedStore[0]);
  } catch (error) {
    console.error('Error updating store info:', error);
    res.status(500).json({ error: 'Failed to update store info' });
  }
});

// Dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Total Revenue
    const [totalRevenueResult] = await pool.query(
      'SELECT SUM(total) as totalRevenue FROM transactions WHERE status = "completed"'
    );
    const totalRevenue = totalRevenueResult[0].totalRevenue || 0;
    
    // Today's Revenue
    const [todayRevenueResult] = await pool.query(
      'SELECT SUM(total) as todayRevenue FROM transactions WHERE status = "completed" AND DATE(date) = CURDATE()'
    );
    const todayRevenue = todayRevenueResult[0].todayRevenue || 0;
    
    // Total number of transactions
    const [totalTransactionsResult] = await pool.query('SELECT COUNT(*) as count FROM transactions');
    const totalTransactions = totalTransactionsResult[0].count;
    
    // Low stock products
    const [lowStockProducts] = await pool.query('SELECT * FROM products WHERE stock < 10');
    
    // Best selling products
    const [bestSellingProducts] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        SUM(ti.quantity) as quantity,
        SUM(ti.subtotal) as revenue
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY quantity DESC
      LIMIT 5
    `);
    
    // Recent transactions
    const [recentTransactions] = await pool.query(`
      SELECT * FROM transactions
      ORDER BY date DESC
      LIMIT 5
    `);
    
    // Transaction stats for chart (last 7 days)
    const [dailyRevenue] = await pool.query(`
      SELECT 
        DATE(date) as date,
        SUM(total) as revenue
      FROM transactions
      WHERE status = "completed" AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(date)
      ORDER BY date
    `);
    
    // Format dates for the chart
    const formattedDailyRevenue = dailyRevenue.map(item => ({
      date: new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
      revenue: item.revenue
    }));
    
    res.json({
      totalRevenue,
      todayRevenue,
      totalTransactions,
      lowStockProducts,
      bestSellingProducts,
      recentTransactions,
      dailyRevenue: formattedDailyRevenue
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, category, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO expenses (date, amount, category, description) VALUES (NOW(), ?, ?, ?)',
      [amount, category, description]
    );
    
    const [newExpense] = await pool.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json(newExpense[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
