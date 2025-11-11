# Environment Variables Setup Guide

This guide explains how to set up environment variables for both the backend server and mobile app.

## Backend Server (.env)

### Quick Setup

1. Navigate to the backend directory:
   ```bash
   cd warranty-app-backend
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in your actual values:
   ```bash
   # Use your preferred editor
   nano .env
   # or
   code .env
   ```

### Required Variables

#### Database Configuration
- `DB_HOST` - PostgreSQL host (usually `localhost`)
- `DB_PORT` - PostgreSQL port (usually `5432`)
- `DB_NAME` - Database name (e.g., `warranty_manager`)
- `DB_USER` - PostgreSQL username (usually `postgres`)
- `DB_PASSWORD` - PostgreSQL password

#### JWT Secrets
Generate strong secrets using:
```bash
openssl rand -base64 32
```

Set:
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Copy the Client ID to `GOOGLE_CLIENT_ID`

#### AWS S3 (for document storage)
1. Create an AWS account
2. Create an S3 bucket
3. Create IAM user with S3 permissions
4. Generate access keys
5. Set:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (e.g., `eu-central-1`)
   - `AWS_BUCKET_NAME`

#### Optional: Google Cloud Vision (for better OCR)
1. Enable Vision API in Google Cloud Console
2. Create service account
3. Download JSON key file
4. Place it in backend root as `google-vision-key.json`
5. Set `GOOGLE_VISION_KEY_PATH=./google-vision-key.json`

**Note:** If not set, the app will use Tesseract OCR (free, but less accurate).

#### Optional: Firebase (for push notifications)
1. Create Firebase project
2. Download service account JSON
3. Place it in backend root as `firebase-service-account.json`
4. Set `FIREBASE_PROJECT_ID` (optional, can be read from JSON)

### CORS Configuration
Set `ALLOWED_ORIGINS` to comma-separated list of allowed origins:
- Development: `http://localhost:19000,http://192.168.1.100:19000`
- Production: `https://yourdomain.com`

---

## Mobile App Configuration

### Option 1: Manual Configuration (Current)

Edit `warranty-app/src/constants/config.js` directly:

```javascript
export const API_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:3000/api/v1'  // Replace with your local IP
  : 'https://api.warranty-app.com/api/v1';

export const GOOGLE_WEB_CLIENT_ID = 'your-web-client-id';
export const GOOGLE_IOS_CLIENT_ID = 'your-ios-client-id';
export const GOOGLE_ANDROID_CLIENT_ID = 'your-android-client-id';
```

**To find your local IP:**
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4 Address)

### Option 2: Using react-native-config (Recommended)

1. Install the package:
   ```bash
   cd warranty-app
   npm install react-native-config
   ```

2. Copy the example file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your values

4. Update `src/constants/config.js`:
   ```javascript
   import Config from 'react-native-config';
   
   export const API_URL = Config.API_URL || 
     (__DEV__ ? 'http://192.168.1.100:3000/api/v1' : 'https://api.warranty-app.com/api/v1');
   
   export const GOOGLE_WEB_CLIENT_ID = Config.GOOGLE_WEB_CLIENT_ID || 'your-web-client-id';
   export const GOOGLE_IOS_CLIENT_ID = Config.GOOGLE_IOS_CLIENT_ID || 'your-ios-client-id';
   export const GOOGLE_ANDROID_CLIENT_ID = Config.GOOGLE_ANDROID_CLIENT_ID || 'your-android-client-id';
   ```

5. For iOS, run:
   ```bash
   cd ios && pod install && cd ..
   ```

6. Rebuild the app:
   ```bash
   # For iOS
   npx react-native run-ios
   
   # For Android
   npx react-native run-android
   ```

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to version control
- `.env` files are already in `.gitignore`
- Use different values for development and production
- Rotate secrets regularly in production
- Use environment-specific `.env` files (`.env.development`, `.env.production`)

---

## Testing Your Configuration

### Backend
```bash
cd warranty-app-backend
npm start
```

Check console for:
- ✓ Database connection successful
- ✓ Firebase Admin initialized (if configured)
- ✓ Server running on port 3000

### Mobile App
1. Update `API_URL` in `config.js` with your backend URL
2. Run the app
3. Try logging in - if API connection works, you'll see login screen

---

## Troubleshooting

### Backend can't connect to database
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env`
- Check database exists: `psql -U postgres -l`

### Mobile app can't connect to backend
- Verify backend is running
- Check `API_URL` matches backend URL
- Ensure phone/emulator and computer are on same network
- Check firewall isn't blocking port 3000
- For iOS simulator, use `http://localhost:3000/api/v1`
- For Android emulator, use `http://10.0.2.2:3000/api/v1`

### Google OAuth not working
- Verify Client IDs are correct
- Check OAuth consent screen is configured
- Ensure redirect URIs are set correctly

### AWS S3 uploads failing
- Verify IAM user has S3 permissions
- Check bucket name is correct
- Verify region matches bucket region
- Check bucket policy allows uploads

---

## Production Checklist

- [ ] Use strong, unique JWT secrets
- [ ] Set `NODE_ENV=production`
- [ ] Use production database credentials
- [ ] Configure production CORS origins
- [ ] Set up SSL/TLS for API
- [ ] Use production Firebase project
- [ ] Configure production S3 bucket
- [ ] Set up monitoring and logging
- [ ] Review and restrict API rate limits
- [ ] Set up backup strategy for database

