
CREATE DATABASE IF NOT EXISTS pos_system;

USE pos_system;

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  barcode VARCHAR(50) NOT NULL UNIQUE,
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
  payment_method ENUM('cash', 'card', 'other') NOT NULL,
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
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL
);

-- Store info table
CREATE TABLE IF NOT EXISTS store_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  notes TEXT NULL
);

-- Insert default store info
INSERT INTO store_info (name, whatsapp, address, notes)
VALUES ('Coffee Corner', '+6281234567890', 'Jl. Sudirman No. 123, Jakarta', 'Open daily from 8 AM to 10 PM');

-- Insert some sample products
INSERT INTO products (name, barcode, price, stock, category) VALUES
('Coffee Cup', '8991234567890', 25000, 50, 'Drinks'),
('Sandwich', '8991234567891', 35000, 20, 'Food'),
('French Fries', '8991234567892', 20000, 40, 'Food'),
('Iced Tea', '8991234567893', 15000, 60, 'Drinks'),
('Chocolate Cake', '8991234567894', 40000, 15, 'Dessert');
