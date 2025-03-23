
CREATE DATABASE IF NOT EXISTS pos_system;

USE pos_system;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100) NOT NULL,
  image VARCHAR(255) NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'other') NULL,
  payment_status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  status ENUM('completed', 'pending', 'cancelled') NOT NULL,
  receipt BOOLEAN NOT NULL DEFAULT FALSE,
  amount_paid DECIMAL(10, 2) NULL,
  change_amount DECIMAL(10, 2) NULL
);

-- Transaction items table
CREATE TABLE IF NOT EXISTS transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  product_image VARCHAR(255) NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Store info table
CREATE TABLE IF NOT EXISTS store_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT NULL
);

-- Exports table to track export history
CREATE TABLE IF NOT EXISTS exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- Type of export (products, daily_sales, monthly_sales)
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id INT NULL, -- For future user authentication
  parameters TEXT NULL -- Store JSON with export parameters (date range, filters, etc.)
);

-- Images table to store product images
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert default store info
INSERT INTO store_info (name, whatsapp, address, notes)
VALUES ('Coffee Corner', '+6281234567890', 'Jl. Sudirman No. 123, Jakarta', 'Open daily from 8 AM to 10 PM');

-- Insert some sample products
INSERT INTO products (name, price, stock, category) VALUES
('Coffee Cup', 25000, 50, 'Drinks'),
('Sandwich', 35000, 20, 'Food'),
('French Fries', 20000, 40, 'Food'),
('Iced Tea', 15000, 60, 'Drinks'),
('Chocolate Cake', 40000, 15, 'Dessert');
