# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Warranty Manager app.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `Warranty Manager` (or any name you prefer)
5. Click **"Create"**
6. Wait for the project to be created and select it

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on **"Google+ API"** (or **"People API"**)
4. Click **"Enable"**

**Note:** Google+ API is deprecated, but you can also use:
- **People API** (recommended)
- **Identity Platform API**

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**

### Fill in the required information:

- **App name**: `Warranty Manager`
- **User support email**: Your email address
- **Developer contact information**: Your email address
- **App logo**: (Optional) Upload your app logo
- **App domain**: (Optional) Your domain if you have one
- **Authorized domains**: (Optional) Add your domain

4. Click **"Save and Continue"**

### Scopes (Step 2):
- Click **"Add or Remove Scopes"**
- Select these scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click **"Update"** → **"Save and Continue"**

### Test users (Step 3):
- If your app is in "Testing" mode, add test user emails
- Click **"Save and Continue"**

### Summary (Step 4):
- Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

### For Web Application (Backend):

1. Select **"Web application"**
2. Name: `Warranty Manager Backend`
3. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://your-api-domain.com` (for production)
4. **Authorized redirect URIs**:
   - `http://localhost:3000/api/v1/auth/google/callback` (for development)
   - `https://your-api-domain.com/api/v1/auth/google/callback` (for production)
5. Click **"Create"**
6. **Copy the Client ID** - this is your `GOOGLE_CLIENT_ID` for backend

### For iOS Application:

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"** again
2. Select **"iOS"**
3. Name: `cwar`
4. **Bundle ID**: Your iOS app bundle ID (e.g., `com.yourcompany.warrantymanager`)
   - Find this in `warranty-app/app.json` → `ios.bundleIdentifier`
5. Click **"Create"**
6. **Copy the Client ID** - this is your `GOOGLE_IOS_CLIENT_ID`

### For Android Application:

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"** again
2. Select **"Android"**
3. Name: `Warranty Manager Android`
4. **Package name**: Your Android package name (e.g., `com.yourcompany.warrantymanager`)
   - Find this in `warranty-app/app.json` → `android.package`
5. **SHA-1 certificate fingerprint**: 
   - For development: Get from `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android`
   - For production: Get from your release keystore
6. Click **"Create"**
7. **Copy the Client ID** - this is your `GOOGLE_ANDROID_CLIENT_ID`

### For Web Application (Mobile Web):

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"** again
2. Select **"Web application"**
3. Name: `Warranty Manager Web`
4. **Authorized JavaScript origins**:
   - `http://localhost:19000` (Expo dev server)
   - `https://your-app-domain.com` (production)
5. **Authorized redirect URIs**:
   - `http://localhost:19000` (Expo dev server)
   - `https://your-app-domain.com` (production)
6. Click **"Create"**
7. **Copy the Client ID** - this is your `GOOGLE_WEB_CLIENT_ID` for mobile

## Step 5: Update Environment Variables

### Backend (.env):

```env
GOOGLE_CLIENT_ID=your-backend-client-id.apps.googleusercontent.com
```

### Mobile App (src/constants/config.js or .env):

```javascript
export const GOOGLE_WEB_CLIENT_ID = 'your-web-client-id.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = 'your-ios-client-id.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = 'your-android-client-id.apps.googleusercontent.com';
```

## Step 6: Update app.json (Mobile App)

Make sure your `app.json` has the correct bundle IDs:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.warrantymanager"
    },
    "android": {
      "package": "com.yourcompany.warrantymanager"
    }
  }
}
```

## Important Notes

### Development vs Production

- **Development**: Use `localhost` URLs
- **Production**: Replace with your actual domain URLs

### OAuth Consent Screen Status

- **Testing**: Only test users can sign in
- **In Production**: Anyone with a Google account can sign in
- To publish: Complete verification process (may take days/weeks)

### Security

- **Never commit** Client IDs/Secrets to version control
- Use environment variables
- Keep Client Secrets secure (backend only)

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Check that redirect URI in Google Console matches exactly
- Include protocol (`http://` or `https://`)
- Include port number if using localhost
- No trailing slashes

### "Error 403: access_denied"
- App is in "Testing" mode and user is not a test user
- Add user email to test users in OAuth consent screen

### "Invalid client"
- Check Client ID is correct
- Verify Client ID matches the platform (iOS/Android/Web)
- Check bundle ID/package name matches

### iOS: "The operation couldn't be completed"
- Verify bundle ID matches in app.json and Google Console
- Check iOS Client ID is correct

### Android: "DEVELOPER_ERROR"
- Verify package name matches
- Check SHA-1 fingerprint is correct
- Verify Android Client ID is correct

## Quick Checklist

- [ ] Google Cloud project created
- [ ] Google+ API or People API enabled
- [ ] OAuth consent screen configured
- [ ] Backend OAuth client created
- [ ] iOS OAuth client created (if needed)
- [ ] Android OAuth client created (if needed)
- [ ] Web OAuth client created (for mobile)
- [ ] Client IDs added to environment variables
- [ ] Bundle IDs/Package names match in app.json and Google Console
- [ ] Redirect URIs configured correctly

## Example Client IDs Format

Your Client IDs will look like this:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

They're long strings ending with `.apps.googleusercontent.com`

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo Google Authentication](https://docs.expo.dev/guides/authentication/#google)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)

