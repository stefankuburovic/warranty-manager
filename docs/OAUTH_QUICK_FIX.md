# Quick Fix: Google OAuth 2.0 Compliance Error

## ⚠️ Error: "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0"

## 🚀 Quick Fix (5 minutes)

### Step 1: Add Yourself as a Test User

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **"Test users"** section
5. Click **"+ ADD USERS"**
6. Enter your Google account email address
7. Click **"Add"**

**Why?** If your app is in "Testing" mode, only test users can sign in.

### Step 2: Verify Scopes Are Added

1. In **OAuth consent screen**, go to **"Scopes"** tab
2. Make sure these scopes are present:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
3. If missing, click **"+ ADD OR REMOVE SCOPES"** and add them

### Step 3: Add Expo Redirect URIs

1. Go to **APIs & Services** → **Credentials**
2. Click on your **Web application** OAuth client (the one used for `GOOGLE_WEB_CLIENT_ID`)
3. Under **"Authorized redirect URIs"**, click **"+ ADD URI"** and add ALL of these:
   - `https://auth.expo.io` (Expo auth proxy - recommended)
   - `exp://localhost:8081` (Local development)
   - `exp://192.168.55.94:8081` (Your current IP - replace with your actual IP if different)
   - `http://localhost:19006` (Expo web)
4. Under **"Authorized JavaScript origins"**, add:
   - `https://auth.expo.io`
   - `http://localhost:19000`
   - `http://localhost:19006`
5. Click **"Save"**

**Why?** Expo uses these redirect URIs for authentication. The IP-based `exp://` URI changes based on your network, so you may need to update it if your IP changes.

### Step 4: Verify OAuth Consent Screen Status

1. In **OAuth consent screen**, check the status at the top
2. If it says **"Testing"**, that's fine for development
3. Make sure all required fields are filled:
   - ✅ App name
   - ✅ User support email
   - ✅ Developer contact information

### Step 5: Restart Expo

```bash
cd warranty-app
npm start
```

Then try signing in again!

## ✅ Checklist

- [ ] Added your email as a test user
- [ ] Verified scopes (email, profile, openid) are added
- [ ] Added `https://auth.expo.io` to redirect URIs
- [ ] OAuth consent screen has all required fields filled
- [ ] Restarted Expo

## 🔍 Still Not Working?

### Check Your Client IDs

Verify in `warranty-app/src/constants/config.js`:
- `GOOGLE_WEB_CLIENT_ID` should be your **Web application** Client ID
- `GOOGLE_IOS_CLIENT_ID` should be your **iOS** Client ID  
- `GOOGLE_ANDROID_CLIENT_ID` should be your **Android** Client ID

### Check Bundle IDs Match

In `warranty-app/app.json`:
- iOS `bundleIdentifier` must match the Bundle ID in your iOS OAuth client
- Android `package` must match the Package name in your Android OAuth client

### Wait a Few Minutes

Google may cache OAuth settings. Wait 2-5 minutes after making changes before trying again.

## 📚 More Help

See `docs/OAUTH_TROUBLESHOOTING.md` for detailed troubleshooting.

