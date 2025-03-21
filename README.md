
# POS System Application

A simple POS (Point of Sale) system with MySQL database integration.

## Setup Instructions

### Backend Setup on cPanel:

1. Upload the server folder to your cPanel hosting.

2. Create a MySQL database in cPanel if you don't already have one.

3. Create the database schema by importing `server/database_schema.sql` using phpMyAdmin in cPanel.

4. Set up the environment variables for the backend server:
   Create or update the server/.env file with your MySQL credentials:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_cpanel_db_username
   DB_PASSWORD=your_cpanel_db_password
   DB_NAME=your_cpanel_db_name
   ```

5. Set up the backend server on cPanel:
   - Make sure Node.js is available on your cPanel hosting
   - Use SSH access or cPanel's terminal to navigate to the server folder
   - Run `npm install` to install dependencies
   - Set up a Node.js app or use a tool like PM2 to keep your app running

### Frontend Setup for Mobile APK:

1. Update the API URL in src/.env to point to your cPanel domain:
   ```
   VITE_API_URL=https://your-cpanel-domain.com/api
   ```

2. Build the APK as described below.

### Alternative: Running Both Frontend and Backend Locally:

If you want to test locally first:

1. Set the API URL to localhost:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. Run the backend server locally:
   ```
   cd server
   npm install
   npm start
   ```

3. Run the frontend locally:
   ```
   npm install
   npm run dev
   ```

### Build APK for Android:

1. Build the web app:
   ```
   npm run build
   ```

2. Add Android platform (if not already added):
   ```
   npx cap add android
   ```

3. Update Android native project with latest web build:
   ```
   npx cap sync android
   ```

4. Open in Android Studio to build the APK:
   ```
   npx cap open android
   ```

5. In Android Studio:
   - Wait for Gradle sync to finish
   - From the menu, select Build > Build Bundle(s) / APK(s) > Build APK(s)
   - The APK will be generated in android/app/build/outputs/apk/debug/

6. To install directly on a connected device:
   ```
   npx cap run android
   ```

## Connecting APK to cPanel Database

Your deployed app will connect to the MySQL database on your cPanel hosting through the Node.js API server which should also be deployed on your cPanel hosting. Make sure that:

1. Your cPanel hosting allows external connections to its Node.js applications (check that the port is open and accessible)
2. The API_URL in your app correctly points to your cPanel domain
3. The Node.js server is properly connecting to your MySQL database

## Features

- Real-time inventory management with MySQL database
- Sales and transaction tracking
- Dashboard with analytics
- Receipt printing via Bluetooth
- Mobile application support

## API Endpoints

The backend provides the following API endpoints:

- `/api/products` - Manage products
- `/api/transactions` - Record and retrieve transactions
- `/api/store` - Store information
- `/api/dashboard` - Dashboard analytics data

## Database Structure

The MySQL database includes the following tables:

- `products` - Product inventory
- `transactions` - Sales transactions
- `transaction_items` - Items in each transaction
- `store_info` - Store information

