# Troubleshooting Common Issues

## AWS SDK v2 Maintenance Mode Warning

### Warning Message:
```
NOTE: The AWS SDK for JavaScript (v2) is in maintenance mode.
SDK releases are limited to address critical bug fixes and security issues only.
```

### What This Means:
- AWS SDK v2 is still functional but in maintenance mode
- AWS recommends migrating to SDK v3
- Your app will continue to work fine
- This is just a warning, not an error

### Solution Options:

#### Option 1: Keep Using v2 (Easiest - Recommended for now)
The warning is harmless. Your code works fine. You can:
- Ignore the warning (it's just informational)
- Suppress the warning by adding to your code:
  ```javascript
  // Suppress AWS SDK v2 warning
  process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
  ```

#### Option 2: Migrate to AWS SDK v3 (Future)
When ready, migrate to `@aws-sdk/client-s3`:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm uninstall aws-sdk multer-s3
```

**Note:** This requires rewriting the storage.js file. Current implementation works fine, so migration can wait.

---

## Firebase Service Account Warning

### Warning Message:
```
⚠ Firebase service account file not found. Notifications will be disabled.
⚠ Create firebase-service-account.json in backend root to enable notifications.
```

### What This Means:
- Push notifications are disabled
- App will work fine without Firebase
- Only affects push notification features

### Solution: Set Up Firebase (Optional)

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name: `Warranty Manager`
4. Follow setup wizard

#### Step 2: Enable Cloud Messaging
1. In Firebase Console → **"Build"** → **"Cloud Messaging"**
2. Click **"Get started"** (if not already enabled)

#### Step 3: Download Service Account Key
1. Go to **Project Settings** (gear icon)
2. **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"**
5. Save the JSON file as `firebase-service-account.json`
6. Place it in `warranty-app-backend/` root directory

#### Step 4: Update .env (Optional)
```env
FIREBASE_PROJECT_ID=your-firebase-project-id
```

#### Step 5: Add to .gitignore
Make sure `firebase-service-account.json` is in `.gitignore`:
```
firebase-service-account.json
```

### If You Don't Need Push Notifications:
- You can ignore this warning
- The app works fine without Firebase
- You can add Firebase later when needed

---

## Other Common Issues

### Database Connection Errors

**Error:** `Connection refused` or `ECONNREFUSED`
- Check PostgreSQL is running: `brew services list | grep postgresql`
- Start PostgreSQL: `brew services start postgresql@15`
- Verify credentials in `.env`

**Error:** `password authentication failed`
- Homebrew PostgreSQL uses your macOS username with no password
- Set `DB_USER` to your macOS username: `whoami`
- Leave `DB_PASSWORD` empty

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`
- Find process using port: `lsof -i :3000`
- Kill process: `kill -9 <PID>`
- Or change port in `.env`: `PORT=3001`

### Module Not Found Errors

**Error:** `Cannot find module 'xxx'`
- Install dependencies: `npm install`
- Check if package is in `package.json`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Migration Errors

**Error:** `SequelizeDatabaseError: relation "users" does not exist`
- Run migrations: `npm run db:migrate`
- Check database exists: `psql -l | grep warranty_manager`
- Verify `.env` database credentials

---

## Quick Fixes

### Restart Everything
```bash
# Stop PostgreSQL
brew services stop postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Restart backend
cd warranty-app-backend
npm start
```

### Reset Database (Development Only)
```bash
# Drop and recreate database
dropdb warranty_manager
createdb warranty_manager

# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### Clear Node Modules
```bash
# Backend
cd warranty-app-backend
rm -rf node_modules package-lock.json
npm install

# Mobile App
cd ../warranty-app
rm -rf node_modules package-lock.json
npm install
```

---

## Getting Help

1. Check error logs in terminal
2. Check browser console (for mobile app)
3. Verify environment variables are set
4. Check database is running
5. Review relevant documentation:
   - `DATABASE_SETUP.md`
   - `ENV_SETUP.md`
   - `QUICK_START.md`

