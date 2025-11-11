# Fix: Error 400: invalid_request - redirect_uri mismatch

## Error Message
```
Error 400: invalid_request
redirect_uri=exp://192.168.55.94:8081
```

## Problem
The redirect URI `exp://192.168.55.94:8081` is not registered in your Google Cloud Console OAuth client configuration.

## Solution: Add Redirect URIs to Google Cloud Console

### Step 1: Find Your Current IP Address

Your Expo dev server shows the IP in the terminal. Look for:
```
Metro waiting on exp://192.168.55.94:8081
```

Or run:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 2: Add Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your **Web application** OAuth client (the one matching `GOOGLE_WEB_CLIENT_ID`)
5. Scroll to **"Authorized redirect URIs"**
6. Click **"+ ADD URI"** and add these URIs one by one:

   **Required URIs:**
   ```
   https://auth.expo.io
   exp://localhost:8081
   exp://192.168.55.94:8081
   http://localhost:19006
   ```

   **Note:** Replace `192.168.55.94` with your actual local IP address if different.

7. Scroll to **"Authorized JavaScript origins"**
8. Click **"+ ADD URI"** and add:
   ```
   https://auth.expo.io
   http://localhost:19000
   http://localhost:19006
   ```

9. Click **"Save"** at the bottom

### Step 3: Wait and Retry

1. Wait 1-2 minutes for Google to update the settings
2. Restart Expo:
   ```bash
   cd warranty-app
   npm start
   ```
3. Try signing in again

## Alternative: Use Expo Auth Proxy (Recommended)

The `https://auth.expo.io` redirect URI is Expo's auth proxy and works regardless of your IP address. Make sure this is added first.

## If Your IP Changes

If your local IP address changes (e.g., you connect to a different WiFi network), you'll need to:

1. Check your new IP from Expo terminal output
2. Add the new `exp://YOUR_NEW_IP:8081` redirect URI to Google Cloud Console
3. You can keep old IPs - they won't hurt, but you can remove them later

## Quick Checklist

- [ ] Added `https://auth.expo.io` to redirect URIs
- [ ] Added `exp://localhost:8081` to redirect URIs  
- [ ] Added `exp://YOUR_IP:8081` to redirect URIs (replace YOUR_IP)
- [ ] Added JavaScript origins
- [ ] Saved changes in Google Cloud Console
- [ ] Waited 1-2 minutes
- [ ] Restarted Expo
- [ ] Tried signing in again

## Still Not Working?

1. **Double-check the exact redirect URI** from the error message
2. **Verify you're editing the correct OAuth client** (the Web application one used for `GOOGLE_WEB_CLIENT_ID`)
3. **Check for typos** - redirect URIs must match exactly (including `exp://` vs `https://`)
4. **Clear Expo cache:**
   ```bash
   cd warranty-app
   npx expo start -c
   ```

## Why This Happens

Expo Go uses IP-based redirect URIs (`exp://IP:PORT`) for local development. These URIs must be registered in Google Cloud Console for OAuth to work. The IP can change when you:
- Connect to a different WiFi network
- Restart your router
- Change network settings

Using `https://auth.expo.io` (Expo's auth proxy) avoids this issue.

