
# POS System Application

A simple POS (Point of Sale) system with MySQL database integration.

## Setup Instructions

### Backend Setup:

1. Install MySQL and create a database:
   ```
   mysql -u root -p < server/database_schema.sql
   ```

2. Set up the backend server:
   ```
   cd server
   npm install
   npm start
   ```

### Frontend Setup:

1. Install dependencies:
   ```
   npm install
   ```

2. Start development server:
   ```
   npm run dev
   ```

### Build for Android/iOS:

1. Build the web app:
   ```
   npm run build
   ```

2. Add Android platform:
   ```
   npx cap add android
   ```

3. Build the Android app:
   ```
   npx cap sync
   npx cap open android
   ```

4. For iOS (requires macOS):
   ```
   npx cap add ios
   npx cap sync
   npx cap open ios
   ```

## Features

- Real-time inventory management
- Sales and transaction tracking
- Expense management
- Dashboard with analytics
- Receipt printing via Bluetooth
- Mobile application support
