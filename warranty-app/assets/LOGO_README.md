# Warranty Manager Logo

## Logo Files

- `logo-wm.svg` - SVG version of the WM logo (scalable, recommended)
- `logo.png` - PNG version (if you need a raster image)

## Usage

The logo component supports multiple modes:

### 1. SVG Logo (Recommended)
```jsx
<Logo size="small" variant="default" useImage={true} />
```

### 2. Text Logo (Default)
```jsx
<Logo size="small" variant="default" />
```

### 3. Custom Image
```jsx
<Logo 
  size="small" 
  imageSource={require('../assets/logo.png')} 
/>
```

## Logo Variants

- `default` - Rounded rectangle with primary color background
- `rounded` - Fully rounded (pill shape)
- `square` - Minimal border radius
- `outlined` - Transparent background with border
- `gradient` - Same as default (can be extended)

## Sizes

- `small` - 32px height
- `medium` - 48px height (default)
- `large` - 80px height
- `xlarge` - 120px height

## Expo App Assets Configuration

For building the app with Expo, the following assets are required:

### App Icon (`icon.png`)
- **Size**: 1024x1024px (square)
- **Format**: PNG
- **Usage**: App icon for iOS and Android
- **Location**: `./assets/icon.png`
- **Note**: Currently 584x584px - should be resized to 1024x1024px for optimal quality

### Splash Screen (`splash.png`)
- **Size**: At least 1242x2436px (portrait orientation)
- **Format**: PNG
- **Usage**: Splash screen shown when app launches
- **Location**: `./assets/splash.png`
- **Note**: Currently 584x584px square - should be resized to portrait format (1242x2436px or larger)

### Web Favicon (`favicon.png`)
- **Size**: 96x96px (or 48x48px minimum)
- **Format**: PNG
- **Usage**: Browser favicon for web version
- **Location**: `./assets/favicon.png`
- **Status**: ✅ Created from icon.png

### Android/iOS Folders
- The `android/` and `ios/` folders in assets are **NOT needed** for Expo
- Expo automatically generates all required platform-specific sizes from `icon.png` and `splash.png`
- These folders can be removed as they're not used by Expo's build process

## Generating PNG from SVG

If you need PNG versions, you can use:

1. **Online tools**: Convert SVG to PNG using tools like CloudConvert, SVG2PNG
2. **Command line** (if you have ImageMagick):
   ```bash
   convert logo-wm.svg -resize 1024x1024 logo-wm-1024.png
   ```
3. **Design tools**: Open SVG in Figma, Sketch, or Adobe Illustrator and export as PNG

## Resizing Assets for Expo

To properly resize assets for Expo builds:

```bash
# Resize icon to 1024x1024px (macOS)
sips -z 1024 1024 logo.png --out icon.png

# Resize splash to portrait (macOS)
sips -z 2436 1242 logo.png --out splash.png

# Create favicon (macOS)
sips -z 96 96 icon.png --out favicon.png
```

