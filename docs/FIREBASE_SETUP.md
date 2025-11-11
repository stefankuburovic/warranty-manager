# Firebase Setup Guide (Optional)

Firebase is used for push notifications. This is **optional** - your app works fine without it.

## When You See This Warning:

```
⚠ Firebase service account file not found. Notifications will be disabled.
⚠ Create firebase-service-account.json in backend root to enable notifications.
```

**This is normal** if you haven't set up Firebase yet. The app will work fine, you just won't have push notifications.

## Quick Setup (If You Want Push Notifications)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Project name: `Warranty Manager`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Cloud Messaging

1. In Firebase Console → **"Build"** → **"Cloud Messaging"**
2. Click **"Get started"** (if not already enabled)

### Step 3: Get Service Account Key

1. Click the **gear icon** (⚙️) → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the dialog
5. A JSON file will download

### Step 4: Place Service Account File

1. Rename the downloaded file to `firebase-service-account.json`
2. Place it in `warranty-app-backend/` root directory:
   ```
   warranty-app-backend/
     ├── firebase-service-account.json  ← Place here
     ├── server.js
     ├── package.json
     └── ...
   ```

### Step 5: Update .env (Optional)

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
```

You can find this in Firebase Console → Project Settings → General

### Step 6: Add to .gitignore

Make sure `firebase-service-account.json` is in `.gitignore`:

```gitignore
firebase-service-account.json
```

### Step 7: Restart Server

```bash
npm start
```

You should now see:
```
✓ Firebase Admin initialized
```

Instead of the warning.

## Mobile App Setup

### For iOS:

1. In Firebase Console → **"Add app"** → **iOS**
2. Bundle ID: `com.yourcompany.warrantyapp` (from app.json)
3. Download `GoogleService-Info.plist`
4. Place in `warranty-app/ios/` directory

### For Android:

1. In Firebase Console → **"Add app"** → **Android**
2. Package name: `com.yourcompany.warrantyapp` (from app.json)
3. Download `google-services.json`
4. Place in `warranty-app/` root directory

## Testing Push Notifications

Once Firebase is set up, you can test notifications:

1. User logs in and registers FCM token
2. Backend sends test notification
3. Check notification logs in database

## If You Don't Need Push Notifications

You can safely ignore the Firebase warning. The app works perfectly without it. You can:
- Add products
- Upload documents
- Manage warranties
- Use all features except push notifications

Add Firebase later when you're ready for notifications.

## Troubleshooting

### "Firebase Admin initialization failed"
- Check `firebase-service-account.json` is in backend root
- Verify JSON file is valid (not corrupted)
- Check file permissions

### "Invalid service account"
- Re-download service account key from Firebase
- Make sure you downloaded the correct project's key

### Notifications not working
- Verify FCM token is saved in database
- Check Firebase project ID matches
- Verify service account has correct permissions

