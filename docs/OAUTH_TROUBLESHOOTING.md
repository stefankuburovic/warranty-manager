# Google OAuth 2.0 Compliance Error - Troubleshooting Guide

## Error Message
"You can't sign in to this app because it doesn't comply with Google's OAuth 2.0"

## Common Causes & Solutions

### 1. OAuth Consent Screen Not Properly Configured

**Problem:** The OAuth consent screen is missing required information or not published.

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Check the status:
   - **Testing**: Only test users can sign in
   - **In Production**: Anyone can sign in (requires verification)

**Required Steps:**
- ✅ App name is set
- ✅ User support email is set
- ✅ Developer contact information is set
- ✅ Scopes are added:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- ✅ Test users are added (if in Testing mode)

### 2. App is in "Testing" Mode - User Not Added

**Problem:** Your app is in "Testing" mode and your email is not added as a test user.

**Solution:**
1. Go to **OAuth consent screen** → **Test users**
2. Click **"+ ADD USERS"**
3. Add your Google account email address
4. Click **"Add"**
5. Try signing in again

**Note:** You can add up to 100 test users in Testing mode.

### 3. Missing Required Scopes

**Problem:** The required OAuth scopes are not configured.

**Solution:**
1. Go to **OAuth consent screen** → **Scopes**
2. Click **"+ ADD OR REMOVE SCOPES"**
3. Add these scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `openid`
4. Click **"Update"** → **"Save and Continue"**

### 4. Redirect URI Mismatch

**Problem:** The redirect URI used by Expo doesn't match what's configured in Google Console.

**Solution for Web Client (GOOGLE_WEB_CLIENT_ID):**
1. Go to **Credentials** → Select your **Web application** OAuth client
2. Under **Authorized redirect URIs**, add:
   - `http://localhost:19000` (Expo dev server)
   - `http://localhost:19006` (Expo web)
   - `https://auth.expo.io` (Expo auth proxy)
   - `exp://localhost:8081` (Expo dev client)
3. Under **Authorized JavaScript origins**, add:
   - `http://localhost:19000`
   - `http://localhost:19006`
   - `https://auth.expo.io`

### 5. Client ID Configuration Issues

**Problem:** Wrong Client ID is being used for the platform.

**Check your configuration:**
- **iOS**: Use `GOOGLE_IOS_CLIENT_ID` (iOS OAuth client)
- **Android**: Use `GOOGLE_ANDROID_CLIENT_ID` (Android OAuth client)
- **Web/Expo Go**: Use `GOOGLE_WEB_CLIENT_ID` (Web OAuth client)

**Verify in `warranty-app/src/constants/config.js`:**
```javascript
export const GOOGLE_WEB_CLIENT_ID = 'your-web-client-id.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'your-ios-client-id.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'your-android-client-id.apps.googleusercontent.com';
```

### 6. Bundle ID / Package Name Mismatch

**Problem:** Bundle ID (iOS) or Package name (Android) doesn't match Google Console.

**Solution:**
1. Check `warranty-app/app.json`:
   ```json
   {
     "ios": {
       "bundleIdentifier": "com.stefankuburovic.warrantyapp"
     },
     "android": {
       "package": "com.stefankuburovic.warrantyapp"
     }
   }
   ```

2. Verify in Google Console:
   - **iOS OAuth client**: Bundle ID must match exactly
   - **Android OAuth client**: Package name must match exactly

### 7. OAuth Consent Screen Publishing Status

**For Development:**
- Keep app in **"Testing"** mode
- Add test users
- No verification needed

**For Production:**
- Click **"PUBLISH APP"** in OAuth consent screen
- Complete verification process (may take days/weeks)
- App will be available to all Google users

## Step-by-Step Fix Checklist

### Immediate Fix (For Testing):

1. ✅ **Add yourself as a test user:**
   - Google Cloud Console → OAuth consent screen → Test users
   - Add your email address

2. ✅ **Verify scopes are added:**
   - OAuth consent screen → Scopes
   - Ensure `userinfo.email`, `userinfo.profile`, and `openid` are present

3. ✅ **Check redirect URIs:**
   - Credentials → Web application client
   - Add `https://auth.expo.io` to redirect URIs

4. ✅ **Verify Client IDs:**
   - Check `warranty-app/src/constants/config.js`
   - Ensure `GOOGLE_WEB_CLIENT_ID` is set (for Expo Go)

5. ✅ **Restart Expo:**
   ```bash
   cd warranty-app
   npm start
   ```

### For Production:

1. ✅ Complete OAuth consent screen configuration
2. ✅ Add privacy policy URL (required for production)
3. ✅ Add terms of service URL (required for production)
4. ✅ Submit for verification
5. ✅ Wait for Google approval

## Testing the Fix

After making changes:

1. **Clear Expo cache:**
   ```bash
   cd warranty-app
   npx expo start -c
   ```

2. **Try signing in again**

3. **Check browser console** (if using web) for detailed error messages

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [OAuth Consent Screen Guide](https://support.google.com/cloud/answer/10311615)

## Still Having Issues?

If you've completed all steps and still get the error:

1. **Check the exact error message** in the browser/console
2. **Verify all Client IDs** are correct and match the platform
3. **Ensure OAuth consent screen** is saved and published (if needed)
4. **Wait a few minutes** after making changes (Google may cache settings)

