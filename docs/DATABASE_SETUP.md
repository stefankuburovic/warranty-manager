# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Warranty Manager application.

## Prerequisites

1. PostgreSQL installed and running
2. Node.js and npm installed
3. Environment variables configured (see `.env.example`)

## Step 1: Create Database

### Using psql (Command Line)
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE warranty_manager;

# Create user (optional, if using different user)
CREATE USER warranty_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE warranty_manager TO warranty_user;

# Exit psql
\q
```

### Using pgAdmin
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name: `warranty_manager`
5. Click "Save"

## Step 2: Configure Environment Variables

Make sure your `.env` file has the correct database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_manager
DB_USER=postgres
DB_PASSWORD=your_password
```

## Step 3: Run Migrations

Run all migrations to create the database schema:

```bash
cd warranty-app-backend
npm run db:migrate
```

This will create all tables:
- ✅ users
- ✅ stores
- ✅ categories
- ✅ products
- ✅ documents
- ✅ warranty_alerts
- ✅ notification_logs

## Step 4: Seed Initial Data (Optional)

Seed the database with initial categories and stores:

```bash
npm run db:seed
```

## Step 5: Verify Database

### Check Tables
```bash
psql -U postgres -d warranty_manager -c "\dt"
```

You should see all 7 tables listed.

### Check Table Structure
```bash
psql -U postgres -d warranty_manager -c "\d users"
psql -U postgres -d warranty_manager -c "\d products"
```

## Migration Commands

### Run Migrations
```bash
npm run db:migrate
# or
npx sequelize-cli db:migrate
```

### Check Migration Status
```bash
npx sequelize-cli db:migrate:status
```

### Rollback Last Migration
```bash
npx sequelize-cli db:migrate:undo
```

### Rollback All Migrations
```bash
npx sequelize-cli db:migrate:undo:all
```

### Create New Migration
```bash
npx sequelize-cli migration:generate --name migration-name
```

## Database Schema Overview

### Tables and Relationships

```
users (1) ──< (many) products
stores (1) ──< (many) products
categories (1) ──< (many) products
products (1) ──< (many) documents
products (1) ──< (many) warranty_alerts
users (1) ──< (many) notification_logs
products (1) ──< (many) notification_logs
```

### Key Features

- **Foreign Keys**: All relationships properly defined with CASCADE or SET NULL
- **Indexes**: Optimized indexes on frequently queried columns
- **Constraints**: Unique constraints on email, google_id, category_name
- **Enums**: Document types and alert types use ENUM for data integrity
- **Timestamps**: Automatic created_at/updated_at tracking

## Troubleshooting

### Migration Fails
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -U postgres -l`
- Check credentials in `.env`
- Check connection: `psql -U postgres -d warranty_manager`

### Permission Errors
```bash
# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE warranty_manager TO your_user;"
```

### Connection Refused
- Check PostgreSQL is running: `sudo service postgresql status`
- Check port: Default is 5432
- Check firewall settings

### Migration Already Run
If migrations show as already executed but tables don't exist:
```bash
# Check SequelizeMeta table
psql -U postgres -d warranty_manager -c "SELECT * FROM \"SequelizeMeta\";"

# If needed, manually delete entries and re-run
```

## Production Setup

For production, use a managed PostgreSQL service:

1. **Railway**: https://railway.app
2. **Render**: https://render.com
3. **DigitalOcean**: https://www.digitalocean.com
4. **AWS RDS**: https://aws.amazon.com/rds

Update `.env` with production database credentials and run migrations.

## Backup and Restore

### Backup Database
```bash
pg_dump -U postgres warranty_manager > backup.sql
```

### Restore Database
```bash
psql -U postgres warranty_manager < backup.sql
```

## Next Steps

After database setup:
1. ✅ Run migrations
2. ✅ Seed initial data (optional)
3. ✅ Start backend server: `npm start`
4. ✅ Test API endpoints
5. ✅ Configure mobile app to connect

