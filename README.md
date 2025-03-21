
# POS System Application

A simple POS (Point of Sale) system with MySQL database integration.

## Setup Instructions

### Backend Setup:

1. Make sure you have MySQL installed and running.

2. Create the database schema:
   ```
   mysql -u root -p < server/database_schema.sql
   ```

3. Set up the environment variables for the backend server:
   Update the server/.env file with your MySQL credentials:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=pos_system
   ```

4. Set up the backend server:
   ```
   cd server
   npm install
   npm start
   ```

### Frontend Setup:

1. Set the API URL in src/.env:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start development server:
   ```
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

### Configure Backend for Production:

When deploying the APK, make sure to update the API URL in src/.env to point to your production server:
```
VITE_API_URL=https://your-production-server.com/api
```

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
