# Google OAuth Error 400: invalid_request - Complete Fix Checklist

## ⚠️ Error: "Access blocked: Authorization Error - Error 400: invalid_request"

This error means your OAuth consent screen is missing **REQUIRED** fields. Follow this checklist step-by-step.

---

## ✅ Step-by-Step Fix (15 minutes)

### Step 1: Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**

---

### Step 2: Complete App Information (REQUIRED)

**Click "EDIT APP" if you see it, or fill out the form:**

#### Required Fields (MUST fill all):

1. **App name**: `Warranty Manager`
2. **User support email**: Your email (e.g., `wowerstari@gmail.com`)
3. **App logo**: (Optional - can skip for now)
4. **Application home page**: 
   ```
   http://localhost:19000
   ```
5. **Application privacy policy link**: ⚠️ **REQUIRED**
   - Use this temporary URL for testing:
   ```
   https://www.termsfeed.com/privacy-policy/
   ```
   - OR create your own (see Step 6 below)
6. **Application terms of service link**: ⚠️ **REQUIRED**
   - Use this temporary URL for testing:
   ```
   https://www.termsfeed.com/terms-conditions/
   ```
   - OR create your own (see Step 6 below)
7. **Authorized domains**: 
   - Click **"+ ADD DOMAIN"**
   - Add: `localhost`
8. **Developer contact information**: Your email (e.g., `wowerstari@gmail.com`)

**Click "SAVE AND CONTINUE"**

---

### Step 3: Add Scopes (REQUIRED)

1. Click **"+ ADD OR REMOVE SCOPES"**
2. Search and add these scopes one by one:
   - ✅ `https://www.googleapis.com/auth/userinfo.email`
   - ✅ `https://www.googleapis.com/auth/userinfo.profile`
   - ✅ `openid`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

---

### Step 4: Add Test Users (CRITICAL!)

**If your app is in "Testing" mode, you MUST add test users:**

1. Click **"+ ADD USERS"**
2. Enter your email: `wowerstari@gmail.com`
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

**⚠️ IMPORTANT:** Only test users can sign in when app is in Testing mode!

---

### Step 5: Verify App Status

1. Look at the top of the OAuth consent screen
2. It should say **"Testing"** (not "In production")
3. If it says "In production" and you haven't verified, switch back to Testing mode

---

### Step 6: Add Redirect URIs

1. Go to **APIs & Services** → **Credentials**
2. Click on your **Web application** OAuth client (the one matching `GOOGLE_WEB_CLIENT_ID`)
3. Scroll to **"Authorized redirect URIs"**
4. Click **"+ ADD URI"** and add ALL of these:
   ```
   https://auth.expo.io
   exp://localhost:8081
   http://localhost:19006
   ```
5. Scroll to **"Authorized JavaScript origins"**
6. Click **"+ ADD URI"** and add:
   ```
   https://auth.expo.io
   http://localhost:19000
   http://localhost:19006
   ```
7. Click **"SAVE"** at the bottom

---

### Step 7: Create Privacy Policy & Terms (If Using Temporary URLs)

**Option A: Use Temporary URLs (Quick - for testing)**
- Already added in Step 2 above
- These work temporarily but you should create your own later

**Option B: Create Your Own (Recommended)**

1. Go to [TermsFeed Privacy Policy Generator](https://www.termsfeed.com/live/privacy-policy-generator)
2. Fill in:
   - App name: Warranty Manager
   - Your email
   - What data you collect (email, product info, receipts)
3. Generate and copy the URL
4. Repeat for Terms of Service
5. Update URLs in OAuth consent screen

---

### Step 8: Wait and Test

1. **Wait 5-10 minutes** (Google needs time to update)
2. **Restart Expo**:
   ```bash
   cd warranty-app
   npx expo start -c
   ```
3. **Try signing in again**

---

## 🔍 Verification Checklist

Before testing, verify ALL of these:

- [ ] **OAuth consent screen** → App name is filled
- [ ] **OAuth consent screen** → User support email is filled
- [ ] **OAuth consent screen** → Privacy policy URL is filled (REQUIRED)
- [ ] **OAuth consent screen** → Terms of service URL is filled (REQUIRED)
- [ ] **OAuth consent screen** → Developer contact email is filled
- [ ] **OAuth consent screen** → Scopes include: email, profile, openid
- [ ] **OAuth consent screen** → Test users includes: `wowerstari@gmail.com`
- [ ] **OAuth consent screen** → Status is "Testing" (not "In production")
- [ ] **Credentials** → Web client has `https://auth.expo.io` in redirect URIs
- [ ] **Credentials** → Web client has `https://auth.expo.io` in JavaScript origins
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleared Expo cache (`npx expo start -c`)

---

## 🚨 Most Common Issues

### Issue 1: "Privacy policy URL is invalid"
**Fix:**
- Make sure URL starts with `https://`
- Test URL in incognito browser (must be publicly accessible)
- Use the TermsFeed URLs provided above if you don't have your own

### Issue 2: "User is not a test user"
**Fix:**
- Go to OAuth consent screen → Test users
- Add `wowerstari@gmail.com`
- Wait 1-2 minutes
- Try again

### Issue 3: "Redirect URI mismatch"
**Fix:**
- Check Expo terminal for the exact redirect URI being used
- Add that exact URI to Google Console
- Make sure `https://auth.expo.io` is added (this is the most reliable)

### Issue 4: "App is in production but not verified"
**Fix:**
- Go to OAuth consent screen
- If it says "In production", you need to either:
  - Switch back to "Testing" mode (for development)
  - OR complete Google's verification process (takes days/weeks)

---

## 📞 Still Not Working?

1. **Check the exact error message** - Look for specific details
2. **Check Google Cloud Console** - Look for red warnings at the top
3. **Check Expo logs** - Look for the exact redirect URI being used
4. **Try a different OAuth client** - Create a new Web application client and try again

---

## ✅ Success Indicators

When it's working, you should see:
- Google sign-in page loads
- You can select your account
- App redirects back successfully
- You're logged in!

Good luck! 🚀

