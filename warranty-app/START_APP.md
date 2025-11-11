# How to Start the Mobile App

## Quick Start

```bash
cd warranty-app

# Increase file limit (if needed)
ulimit -n 4096

# Start Expo
npm start
```

## If You Get "Too Many Open Files" Error

### Option 1: Use watchman (Recommended)
```bash
brew install watchman
npm start
```

### Option 2: Increase file limit
```bash
ulimit -n 4096
npm start
```

### Option 3: Add to ~/.zshrc permanently
```bash
echo "ulimit -n 4096" >> ~/.zshrc
source ~/.zshrc
npm start
```

## Fix Dependency Warnings

If you see version mismatch warnings:
```bash
npx expo install --fix
```

## Running on Device

1. **iOS Simulator**: Press `i` in Expo terminal
2. **Android Emulator**: Press `a` in Expo terminal  
3. **Physical Device**: Scan QR code with Expo Go app

## Troubleshooting

### Metro bundler crashes
- Clear cache: `npx expo start -c`
- Reset: `rm -rf node_modules && npm install`

### Port already in use
- Kill process: `lsof -ti:8081 | xargs kill`
- Or use different port: `npx expo start --port 8082`

### App won't connect to backend
- Check API_URL in `src/constants/config.js`
- Ensure backend is running on correct port
- Check phone and computer are on same network

