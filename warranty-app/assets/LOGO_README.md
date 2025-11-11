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

## Generating PNG from SVG

If you need PNG versions, you can use:

1. **Online tools**: Convert SVG to PNG using tools like CloudConvert, SVG2PNG
2. **Command line** (if you have ImageMagick):
   ```bash
   convert logo-wm.svg -resize 1024x1024 logo-wm-1024.png
   ```
3. **Design tools**: Open SVG in Figma, Sketch, or Adobe Illustrator and export as PNG

