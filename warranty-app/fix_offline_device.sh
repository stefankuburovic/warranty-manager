#!/bin/bash
# Fix for Expo Android emulator connection issue
echo "Fixing offline emulator issue..."

# Kill all processes
pkill -9 -f qemu-system 2>/dev/null
pkill -9 -f adb 2>/dev/null
pkill -9 -f emulator 2>/dev/null

# Clean ADB
rm -rf ~/.android/adbkey* 2>/dev/null
adb kill-server 2>/dev/null

# Wait a bit
sleep 2

# Restart ADB
adb start-server
sleep 2

# Show devices
echo ""
echo "Current devices:"
adb devices

echo ""
echo "If emulator-5562 is still showing as offline:"
echo "1. Close Android Studio completely"
echo "2. Open Android Studio > Tools > Device Manager"
echo "3. Delete any emulator that might be causing issues"
echo "4. Start only ONE emulator"
echo "5. Then run: npx expo start"
