# Fix: Google OAuth 2.0 Compliance Error (Error 400: invalid_request)

## Error Message
"You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure."

## Root Cause

This error typically occurs when:
1. **OAuth consent screen is incomplete** - Missing required fields
2. **App is in restricted/testing mode** - Not properly configured for external users
3. **Missing privacy policy/terms of service** - Required for OAuth compliance
4. **Redirect URI mismatch** - Still not properly configured
5. **Scopes not properly configured** - Missing or incorrect scopes

## Complete Fix Guide

### Step 1: Complete OAuth Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Complete ALL required fields:

#### App Information (Step 1)
- ✅ **App name**: `Warranty Manager` (or your app name)
- ✅ **User support email**: Your email address
- ✅ **App logo**: Upload a logo (optional but recommended)
- ✅ **Application home page**: 
  - Development: `http://localhost:19000`
  - Production: Your app URL
- ✅ **Application privacy policy link**: 
  - **REQUIRED** - Create a simple privacy policy page or use:
  - `https://www.termsfeed.com/live/privacy-policy-generator` (free generator)
  - Or host a simple HTML page with privacy policy
- ✅ **Application terms of service link**: 
  - **REQUIRED** - Similar to privacy policy
- ✅ **Authorized domains**: 
  - Add: `localhost` (for development)
  - Add your production domain if you have one
- ✅ **Developer contact information**: Your email address

#### Scopes (Step 2)
- ✅ Click **"+ ADD OR REMOVE SCOPES"**
- ✅ Add these scopes:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `openid`
- ✅ Click **"Update"** → **"Save and Continue"**

#### Test Users (Step 3) - IMPORTANT
- ✅ Click **"+ ADD USERS"**
- ✅ Add your Google account email: `wowerstari@gmail.com`
- ✅ Add any other test users
- ✅ Click **"Save and Continue"**

#### Summary (Step 4)
- ✅ Review all information
- ✅ Click **"Back to Dashboard"**

### Step 2: Verify Redirect URIs

1. Go to **APIs & Services** → **Credentials**
2. Click on your **Web application** OAuth client (matching `GOOGLE_WEB_CLIENT_ID`)
3. Under **"Authorized redirect URIs"**, ensure you have:
   ```
   https://auth.expo.io
   ```
4. Under **"Authorized JavaScript origins"**, ensure you have:
   ```
   https://auth.expo.io
   ```
5. Click **"Save"**

### Step 3: Check App Publishing Status

**For Development/Testing:**
- App should be in **"Testing"** mode
- Only test users can sign in
- No verification needed

**To check:**
1. Go to **OAuth consent screen**
2. Look at the top - it should say **"Testing"**
3. If it says **"In production"**, you may need to verify the app (takes days/weeks)

### Step 4: Create Privacy Policy & Terms of Service

**Quick Solution - Use a free generator:**

1. Go to [TermsFeed Privacy Policy Generator](https://www.termsfeed.com/live/privacy-policy-generator)
2. Fill in your app details
3. Generate and host the privacy policy (you can use GitHub Pages, Netlify, or similar)
4. Copy the URL and add it to OAuth consent screen

**Or create a simple HTML page:**

Create `privacy-policy.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Warranty Manager - Privacy Policy</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>Last updated: [Date]</p>
    <h2>Information We Collect</h2>
    <p>We collect information you provide directly to us, including:</p>
    <ul>
        <li>Email address (for authentication)</li>
        <li>Product warranty information</li>
        <li>Receipt images (for OCR processing)</li>
    </ul>
    <h2>How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
        <li>Provide warranty management services</li>
        <li>Send warranty expiration notifications</li>
        <li>Process receipt images for warranty information</li>
    </ul>
    <h2>Contact Us</h2>
    <p>If you have questions, contact us at: [your-email]</p>
</body>
</html>
```

Host it somewhere (GitHub Pages, Netlify, etc.) and use the URL in OAuth consent screen.

### Step 5: Verify Client IDs Match

Check `warranty-app/src/constants/config.js`:
- `GOOGLE_WEB_CLIENT_ID` should match your **Web application** OAuth client
- `GOOGLE_IOS_CLIENT_ID` should match your **iOS** OAuth client
- `GOOGLE_ANDROID_CLIENT_ID` should match your **Android** OAuth client

### Step 6: Wait and Retry

1. **Wait 5-10 minutes** after making changes (Google needs time to propagate)
2. **Clear Expo cache**:
   ```bash
   cd warranty-app
   npx expo start -c
   ```
3. **Try signing in again**

## Common Issues

### Issue: "App is in production but not verified"
**Solution**: Switch back to "Testing" mode:
1. Go to OAuth consent screen
2. Click **"PUBLISH APP"** → **"Cancel"** or switch to Testing mode
3. Add test users

### Issue: "Privacy policy URL is invalid"
**Solution**: 
- Make sure the URL is publicly accessible
- Use `https://` not `http://`
- Test the URL in an incognito browser

### Issue: "Redirect URI still not working"
**Solution**:
- Double-check `https://auth.expo.io` is added exactly (no trailing slash)
- Verify you're editing the correct OAuth client (Web application)
- Wait 5-10 minutes after saving

## Quick Checklist

- [ ] OAuth consent screen has all required fields filled
- [ ] Privacy policy URL is added and accessible
- [ ] Terms of service URL is added and accessible
- [ ] Your email (`wowerstari@gmail.com`) is added as a test user
- [ ] Scopes are properly configured (email, profile, openid)
- [ ] `https://auth.expo.io` is added to redirect URIs
- [ ] App is in "Testing" mode (not "In production")
- [ ] Client IDs match in config.js
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleared Expo cache and restarted

## Still Not Working?

1. **Check the exact error** in Google Cloud Console:
   - Go to **APIs & Services** → **OAuth consent screen**
   - Look for any warnings or errors at the top

2. **Verify the redirect URI being used**:
   - Check Expo logs when signing in
   - Look for the exact redirect URI in the error

3. **Try using a different OAuth client**:
   - Create a new Web application OAuth client
   - Update `GOOGLE_WEB_CLIENT_ID` in config.js
   - Add `https://auth.expo.io` to the new client

4. **Contact Google Support**:
   - If all else fails, the error details link in the error message may provide more specific information


