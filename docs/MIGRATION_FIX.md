# Database Migration Fix

## Issue Fixed: "ERROR: role 'root' does not exist"

### Problem:
PostgreSQL was trying to use a user that doesn't exist. On macOS with Homebrew PostgreSQL, the default user is your **macOS username**, not "postgres" or "root".

### Solution Applied:

1. **Updated `.env` file**:
   ```env
   DB_USER=stefankuburovic  # Changed from 'postgres'
   DB_PASSWORD=             # Empty (no password for Homebrew PostgreSQL)
   ```

2. **Updated `database.config.js`**:
   - Now automatically detects macOS username as default
   - Falls back to 'postgres' if username can't be detected

### Verify Your Setup:

Check your `.env` file has:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_manager
DB_USER=stefankuburovic  # Your macOS username
DB_PASSWORD=             # Empty
```

### Now Run Migrations:

```bash
cd warranty-app-backend
npm run db:migrate
```

### If You Still Get Errors:

1. **Check PostgreSQL is running**:
   ```bash
   brew services list | grep postgresql
   ```

2. **Start PostgreSQL if needed**:
   ```bash
   brew services start postgresql@15
   ```

3. **Verify database exists**:
   ```bash
   psql -l | grep warranty_manager
   ```

4. **Test connection manually**:
   ```bash
   psql -U stefankuburovic -d warranty_manager -c "SELECT 1;"
   ```

### Common PostgreSQL Users:

- **Homebrew (macOS)**: Your macOS username (e.g., `stefankuburovic`)
- **Linux**: Usually `postgres`
- **Docker**: Usually `postgres`
- **Windows**: Usually `postgres`

### Find Your PostgreSQL User:

```bash
# Check who owns the databases
psql -l

# Or check current user
psql -c "SELECT current_user;"
```

