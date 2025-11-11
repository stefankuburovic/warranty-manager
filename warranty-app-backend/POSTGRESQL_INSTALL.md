# PostgreSQL Installation Guide for macOS

## Option 1: Install via Homebrew (Recommended)

### Step 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install PostgreSQL
```bash
brew install postgresql@15
```

### Step 3: Start PostgreSQL Service
```bash
# Start PostgreSQL service
brew services start postgresql@15

# Or run manually (without background service)
pg_ctl -D /opt/homebrew/var/postgresql@15 start
```

### Step 4: Add to PATH (if needed)
Add to your `~/.zshrc`:
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 5: Verify Installation
```bash
psql --version
```

---

## Option 2: Install via Postgres.app (Easiest for beginners)

### Step 1: Download Postgres.app
1. Visit: https://postgresapp.com/
2. Download and install the app
3. Open Postgres.app from Applications

### Step 2: Add to PATH
Add to your `~/.zshrc`:
```bash
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Verify
```bash
psql --version
```

---

## Option 3: Install via MacPorts

```bash
sudo port install postgresql15 +universal
```

---

## After Installation: Create Database

### Using psql Command Line
```bash
# Connect to PostgreSQL (default user is your macOS username)
psql postgres

# Or if that doesn't work, try:
psql -U postgres

# Create database
CREATE DATABASE warranty_manager;

# Exit psql
\q
```

### Using Postgres.app GUI
1. Open Postgres.app
2. Click "Initialize" if prompted
3. Double-click on "postgres" to open psql
4. Run: `CREATE DATABASE warranty_manager;`
5. Type `\q` to exit

---

## Alternative: Use Docker (No Installation Needed)

If you have Docker installed:

### Step 1: Run PostgreSQL Container
```bash
docker run --name warranty-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=warranty_manager \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Connect to Database
```bash
# Using docker exec
docker exec -it warranty-postgres psql -U postgres -d warranty_manager

# Or using psql from host (if installed)
psql -h localhost -U postgres -d warranty_manager
```

### Step 3: Update .env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_manager
DB_USER=postgres
DB_PASSWORD=postgres
```

### Useful Docker Commands
```bash
# Stop container
docker stop warranty-postgres

# Start container
docker start warranty-postgres

# Remove container
docker rm warranty-postgres
```

---

## Troubleshooting

### "psql: command not found"
- Make sure PostgreSQL is installed
- Add PostgreSQL bin directory to PATH
- Restart terminal after adding to PATH

### "Connection refused"
- Check if PostgreSQL is running: `brew services list` (for Homebrew)
- Check Postgres.app is running (for Postgres.app)
- Check Docker container is running: `docker ps` (for Docker)

### "Password authentication failed"
- Default user is your macOS username (for Homebrew)
- Default user is "postgres" (for Postgres.app and Docker)
- Try: `psql -U $(whoami)` for Homebrew
- Try: `psql -U postgres` for Postgres.app/Docker

### "Database does not exist"
- Create it: `CREATE DATABASE warranty_manager;`
- Or use: `createdb warranty_manager`

---

## Quick Setup Script

Save this as `setup-db.sh` and run: `chmod +x setup-db.sh && ./setup-db.sh`

```bash
#!/bin/bash

echo "Setting up Warranty Manager database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL not found. Installing via Homebrew..."
    brew install postgresql@15
    brew services start postgresql@15
    sleep 2
fi

# Create database
echo "Creating database..."
createdb warranty_manager 2>/dev/null || psql -U postgres -c "CREATE DATABASE warranty_manager;" 2>/dev/null || psql -c "CREATE DATABASE warranty_manager;"

if [ $? -eq 0 ]; then
    echo "✅ Database 'warranty_manager' created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with database credentials"
    echo "2. Run migrations: npm run db:migrate"
else
    echo "❌ Failed to create database. Please check PostgreSQL is running."
    echo "Try: brew services start postgresql@15"
fi
```

---

## Recommended: Use Docker

If you want to avoid installation, Docker is the easiest option:

```bash
# One command to start PostgreSQL
docker run --name warranty-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=warranty_manager \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps

# Connect and verify database exists
docker exec -it warranty-postgres psql -U postgres -c "\l"
```

Then update your `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_manager
DB_USER=postgres
DB_PASSWORD=postgres
```

