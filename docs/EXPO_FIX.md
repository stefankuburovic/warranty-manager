# Fix Expo "Too Many Open Files" Error

## Error: EMFILE: too many open files

This is a macOS system limit issue. Metro bundler needs to watch many files.

## Quick Fix:

### Option 1: Increase File Limit (Temporary)

```bash
ulimit -n 4096
cd warranty-app
npm start
```

### Option 2: Increase File Limit Permanently

Add to your `~/.zshrc`:

```bash
# Increase file descriptor limit for Node.js/Expo
ulimit -n 4096
```

Then:
```bash
source ~/.zshrc
cd warranty-app
npm start
```

### Option 3: Use watchman (Recommended)

Install watchman (better file watcher):

```bash
brew install watchman
```

Then restart Expo:
```bash
cd warranty-app
npm start
```

## Fix Dependency Versions

The warnings about incompatible versions can be fixed:

```bash
cd warranty-app
npx expo install --fix
```

This will update packages to match your Expo SDK version.

## Complete Fix Script

Run this once:

```bash
# Install watchman (better file watcher)
brew install watchman

# Fix dependency versions
cd warranty-app
npx expo install --fix

# Increase file limit
ulimit -n 4096

# Start Expo
npm start
```

## Why This Happens

macOS has a default limit of 256 open files per process. Metro bundler watches many files, so it can exceed this limit. Increasing the limit or using watchman solves this.

