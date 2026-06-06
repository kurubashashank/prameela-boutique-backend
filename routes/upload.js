const express = require('express');
const authMiddleware = require('../middleware/auth');
const { enhanceImage } = require('../utils/imageOptimizer');

const router = express.Router();

// POST /api/upload/enhance-image - Enhance image to 4K
router.post('/enhance-image', authMiddleware, async (req, res) => {
  try {
    const { imageBuffer } = req.body;

    if (!imageBuffer) {
      return res.status(400).json({ error: 'Image buffer required' });
    }

    // Convert base64 to buffer if needed
    const buffer = Buffer.isBuffer(imageBuffer)
      ? imageBuffer
      : Buffer.from(imageBuffer, 'base64');

    const enhancedBuffer = await enhanceImage(buffer);
    const enhancedBase64 = enhancedBuffer.toString('base64');

    res.json({
      success: true,
      enhancedImage: `data:image/jpeg;base64,${enhancedBase64}`,
    });
  } catch (error) {
    console.error('Image enhancement error:', error);
    res.status(500).json({ error: 'Failed to enhance image' });
  }
});

// POST /api/upload - Handle file upload (admin only)
// Note: In production, integrate with Cloudinary
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { file } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File required' });
    }

    // TODO: Integrate with Cloudinary for actual upload
    // For now, return placeholder
    res.json({
      success: true,
      url: 'https://via.placeholder.com/600x400',
      publicId: 'placeholder_' + Date.now(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

module.exports = router;
