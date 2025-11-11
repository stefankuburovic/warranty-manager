# Quick Start: Get Google Client ID

## 🚀 Fastest Way (5 minutes)

### Step 1: Go to Google Cloud Console
👉 https://console.cloud.google.com/

### Step 2: Create Project
1. Click project dropdown → **"New Project"**
2. Name: `Warranty Manager`
3. Click **"Create"**

### Step 3: Enable API
1. Go to **"APIs & Services"** → **"Library"**
2. Search **"People API"** → Click **"Enable"**

### Step 4: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** → **"Create"**
3. Fill required fields:
   - App name: `Warranty Manager`
   - User support email: Your email
   - Developer email: Your email
4. Click **"Save and Continue"** through all steps

### Step 5: Create Credentials

#### For Backend (Required):
1. **"APIs & Services"** → **"Credentials"**
2. **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Name: `Backend`
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/v1/auth/google/callback
   ```
6. Click **"Create"**
7. **Copy the Client ID** → This is your `GOOGLE_CLIENT_ID`

#### For Mobile App (iOS):
1. **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Select **"iOS"**
3. Bundle ID: `com.yourcompany.warrantyapp` (from app.json)
4. Click **"Create"**
5. **Copy the Client ID** → This is your `GOOGLE_IOS_CLIENT_ID`

#### For Mobile App (Android):
1. **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Select **"Android"**
3. Package name: `com.yourcompany.warrantyapp` (from app.json)
4. SHA-1: Get from:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   Copy the SHA-1 fingerprint
5. Click **"Create"**
6. **Copy the Client ID** → This is your `GOOGLE_ANDROID_CLIENT_ID`

## 📝 Update Your Files

### Backend `.env`:
```env
GOOGLE_CLIENT_ID=your-backend-client-id.apps.googleusercontent.com
```

### Mobile App `src/constants/config.js`:
```javascript
export const GOOGLE_WEB_CLIENT_ID = 'your-web-client-id.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'your-ios-client-id.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'your-android-client-id.apps.googleusercontent.com';
```

## ✅ That's It!

Your Client IDs will look like:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## 🔍 Need More Details?

See full guide: `docs/GOOGLE_OAUTH_SETUP.md`

