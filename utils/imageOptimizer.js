const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const enhanceImage = async (inputBuffer) => {
  try {
    const metadata = await sharp(inputBuffer).metadata();

    // Calculate 4K dimensions (3840x2160) while maintaining aspect ratio
    let width = 3840;
    let height = 2160;

    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > (3840 / 2160)) {
        height = Math.round(3840 / aspectRatio);
      } else {
        width = Math.round(2160 * aspectRatio);
      }
    }

    // Enhance image
    const enhancedBuffer = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0.0 },
        withoutEnlargement: false,
      })
      .sharpen({
        sigma: 1.5, // Enhance tassel, lace, and bead details
      })
      .modulate({
        saturation: 1.1, // Preserve thread and material colors
      })
      .blur(0.3) // Denoise
      .sharpen({
        sigma: 1.2, // Re-sharpen for edge clarity
      })
      .jpeg({
        quality: 85,
        progressive: true,
        chromaSubsampling: '4:4:4',
      })
      .toBuffer();

    return enhancedBuffer;
  } catch (error) {
    console.error('Image enhancement error:', error);
    throw error;
  }
};

module.exports = { enhanceImage };
