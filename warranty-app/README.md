# Warranty Manager Mobile App

React Native mobile application built with Expo for managing product warranties.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Edit `src/constants/config.js` and update:
- `API_URL` - Your backend API URL (use your local IP for development)
- Google OAuth Client IDs for iOS, Android, and Web

### 3. Update app.json

Update the following in `app.json`:
- `bundleIdentifier` (iOS)
- `package` (Android)
- Google Sign-In configuration

### 4. Start the Development Server

```bash
npm start
# or
npx expo start
```

### 5. Run on Device

- **iOS**: Press `i` in the terminal or scan QR code with Camera app
- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` in the terminal

## Project Structure

```
warranty-app/
├── src/
│   ├── api/             # API client and endpoints
│   ├── components/      # Reusable components
│   ├── screens/         # Screen components
│   ├── navigation/      # Navigation setup
│   ├── context/         # React Context providers
│   ├── utils/           # Utility functions
│   └── constants/       # App constants
├── App.js               # Root component
└── app.json             # Expo configuration
```

## Features

- Google Sign-In authentication
- Product warranty tracking
- Document upload (receipts, warranty cards)
- Warranty expiry alerts
- Product management (CRUD operations)

## Development

### Running on iOS Simulator
```bash
npx expo run:ios
```

### Running on Android Emulator
```bash
npx expo run:android
```

## Configuration

### Google Sign-In Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth 2.0 credentials for:
   - Web application
   - iOS application
   - Android application
4. Add the Client IDs to `src/constants/config.js`
5. For Android: Add SHA-1 fingerprint to Firebase
6. Download `google-services.json` (Android) and add to project root

### Backend Connection

Make sure your backend server is running and accessible. Update `API_URL` in `src/constants/config.js` with your backend URL.

For local development, use your computer's local IP address:
```javascript
export const API_URL = 'http://192.168.1.100:3000/api/v1';
```

## Troubleshooting

- **Connection issues**: Make sure your mobile device and computer are on the same network
- **Google Sign-In not working**: Verify Client IDs are correct and SHA-1 fingerprint is added (Android)
- **API errors**: Check that backend server is running and CORS is configured correctly

