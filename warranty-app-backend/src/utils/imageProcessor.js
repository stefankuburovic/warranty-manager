const sharp = require('sharp');

// Generate thumbnail from image
const generateThumbnail = async (imageBuffer, maxWidth = 300, maxHeight = 300) => {
  try {
    const thumbnail = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return thumbnail;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
};

// Optimize image before upload
const optimizeImage = async (imageBuffer, quality = 85) => {
  try {
    const optimized = await sharp(imageBuffer)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
    
    return optimized;
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
};

module.exports = {
  generateThumbnail,
  optimizeImage
};

