# Expo AuthSession Implementation Fix

## Issues Found and Fixed

Based on the [Expo AuthSession documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/), the following issues were identified and fixed:

### ✅ Fixed Issues

1. **Missing `scheme` in app.json**
   - **Problem**: Deep linking requires a scheme for standalone apps
   - **Fix**: Added `"scheme": "warrantyapp"` to `app.json`
   - **Why**: Allows the app to handle redirect URIs properly

2. **Missing explicit redirect URI configuration**
   - **Problem**: Expo generates redirect URIs automatically, but we should be explicit
   - **Fix**: Added `redirectUri` using `AuthSession.makeRedirectUri()` with `useProxy: true`
   - **Why**: Using Expo's auth proxy (`https://auth.expo.io`) is more reliable than IP-based URIs

3. **Missing error handling**
   - **Problem**: Only handling success case, not errors or cancellations
   - **Fix**: Added handling for `error` and `cancel` response types
   - **Why**: Better user experience and debugging

4. **expo-crypto dependency**
   - **Status**: Already installed (required peer dependency)

### 📋 Current Implementation

The implementation now follows Expo's best practices:

```javascript
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'],
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'warrantyapp',
    useProxy: true, // Uses https://auth.expo.io
  }),
});
```

### 🔧 Google Cloud Console Configuration

With `useProxy: true`, you need to add this redirect URI to your **Web application** OAuth client:

**Required Redirect URI:**
```
https://auth.expo.io
```

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your **Web application** OAuth client (the one matching `GOOGLE_WEB_CLIENT_ID`)
4. Under **"Authorized redirect URIs"**, add:
   - `https://auth.expo.io`
5. Under **"Authorized JavaScript origins"**, add:
   - `https://auth.expo.io`
6. Click **"Save"**

### ✅ Benefits of Using Auth Proxy

- **No IP changes**: Works regardless of your network IP
- **More reliable**: Expo handles the redirect properly
- **Easier setup**: Only one redirect URI to configure
- **Works in Expo Go**: Compatible with development workflow

### 🚀 Next Steps

1. **Add redirect URI to Google Console** (see above)
2. **Restart Expo**:
   ```bash
   cd warranty-app
   npm start
   ```
3. **Clear cache if needed**:
   ```bash
   npx expo start -c
   ```
4. **Try signing in again**

### 📚 References

- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- [Google OAuth Setup Guide](./GOOGLE_OAUTH_SETUP.md)

### 🔍 Troubleshooting

If you still get redirect URI errors:

1. **Verify the redirect URI**:
   - Check what redirect URI is being used in the error message
   - Make sure `https://auth.expo.io` is added to Google Console

2. **Check scheme configuration**:
   - Verify `app.json` has `"scheme": "warrantyapp"`
   - Restart Expo after changing `app.json`

3. **Verify Client IDs**:
   - Ensure `GOOGLE_WEB_CLIENT_ID` matches your Web application OAuth client
   - Check that all Client IDs are correct in `src/constants/config.js`

4. **Wait for propagation**:
   - Google may take 1-2 minutes to update OAuth settings
   - Try again after waiting

