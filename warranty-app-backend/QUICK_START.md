# Quick Start Guide

## ✅ PostgreSQL Setup Complete!

PostgreSQL is installed and the database is created. Here's what to do next:

## Step 1: Update Environment Variables

Make sure your `.env` file has the correct database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_manager
DB_USER=stefankuburovic  # Your macOS username
DB_PASSWORD=             # Leave empty (no password by default)
```

**Note:** Homebrew PostgreSQL uses your macOS username as the default database user with no password.

## Step 2: Run Database Migrations

```bash
cd warranty-app-backend
npm run db:migrate
```

This will create all the tables:
- ✅ users
- ✅ stores  
- ✅ categories
- ✅ products
- ✅ documents
- ✅ warranty_alerts
- ✅ notification_logs

## Step 3: Verify Tables Created

```bash
# Using psql
psql warranty_manager -c "\dt"

# Or connect interactively
psql warranty_manager
# Then type: \dt
# Exit with: \q
```

## Step 4: (Optional) Seed Initial Data

```bash
npm run db:seed
```

## Step 5: Start Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

## Troubleshooting

### "psql: command not found"
If you get this error in a new terminal:
```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```
Or restart your terminal (PATH is already added to ~/.zshrc)

### "Connection refused"
Start PostgreSQL service:
```bash
brew services start postgresql@15
```

### "Database does not exist"
Create it:
```bash
createdb warranty_manager
```

### "Password authentication failed"
Homebrew PostgreSQL uses your macOS username with no password. Make sure:
- `DB_USER` matches your macOS username (run `whoami` to check)
- `DB_PASSWORD` is empty in `.env`

## Useful Commands

```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@15

# Stop PostgreSQL
brew services stop postgresql@15

# Connect to database
psql warranty_manager

# List all databases
psql -l

# List tables in database
psql warranty_manager -c "\dt"
```

## Next Steps

1. ✅ PostgreSQL installed
2. ✅ Database created
3. ⏭️ Run migrations: `npm run db:migrate`
4. ⏭️ Start backend: `npm start`
5. ⏭️ Test API endpoints

