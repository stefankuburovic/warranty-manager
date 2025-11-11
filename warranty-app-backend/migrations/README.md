# Database Migrations

This directory contains Sequelize migrations for the Warranty Manager database schema.

## Running Migrations

### Setup
1. Make sure your `.env` file is configured with database credentials
2. Ensure PostgreSQL is running and the database exists

### Run all migrations
```bash
npm run db:migrate
# or
npx sequelize-cli db:migrate
```

### Rollback last migration
```bash
npx sequelize-cli db:migrate:undo
```

### Rollback all migrations
```bash
npx sequelize-cli db:migrate:undo:all
```

### Check migration status
```bash
npx sequelize-cli db:migrate:status
```

## Migration Files

1. **20241110000001-create-users.js** - Creates users table with Google OAuth support
2. **20241110000002-create-stores.js** - Creates stores table
3. **20241110000003-create-categories.js** - Creates categories table
4. **20241110000004-create-products.js** - Creates products table with foreign keys
5. **20241110000005-create-documents.js** - Creates documents table with OCR fields
6. **20241110000006-create-warranty-alerts.js** - Creates warranty_alerts table
7. **20241110000007-create-notification-logs.js** - Creates notification_logs table

## Database Schema

The migrations create the following tables:
- `users` - User accounts (Google OAuth)
- `stores` - Store information
- `categories` - Product categories
- `products` - Products with warranties
- `documents` - Receipts and warranty documents
- `warranty_alerts` - Warranty expiration alerts
- `notification_logs` - Push notification history

All foreign key relationships are properly configured with CASCADE or SET NULL actions.

