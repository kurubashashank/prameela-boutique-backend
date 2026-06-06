const express = require('express');
const EdgeDesign = require('../models/EdgeDesign');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/edgeDesigns - Get all edge designs (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, designType, material, color, trending, featured, minPrice, maxPrice } = req.query;

    const filter = {};
    if (designType) filter.designType = designType;
    if (material) filter.material = material;
    if (color) filter.colorVariants = { $in: [color] };
    if (trending === 'true') filter.trending = true;
    if (featured === 'true') filter.featured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const edgeDesigns = await EdgeDesign.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await EdgeDesign.countDocuments(filter);

    res.json({
      edgeDesigns,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching edge designs:', error);
    res.status(500).json({ error: 'Failed to fetch edge designs' });
  }
});

// GET /api/edgeDesigns/:id - Get single edge design (public)
router.get('/:id', async (req, res) => {
  try {
    const edgeDesign = await EdgeDesign.findById(req.params.id);
    if (!edgeDesign) return res.status(404).json({ error: 'Edge design not found' });

    // Increment view count
    edgeDesign.viewCount = (edgeDesign.viewCount || 0) + 1;
    await edgeDesign.save();

    res.json(edgeDesign);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch edge design' });
  }
});

// POST /api/edgeDesigns - Create edge design (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const edgeDesign = new EdgeDesign(req.body);
    await edgeDesign.save();
    res.status(201).json(edgeDesign);
  } catch (error) {
    console.error('Error creating edge design:', error);
    res.status(400).json({ error: 'Failed to create edge design' });
  }
});

// PUT /api/edgeDesigns/:id - Update edge design (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const edgeDesign = await EdgeDesign.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!edgeDesign) return res.status(404).json({ error: 'Edge design not found' });
    res.json(edgeDesign);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update edge design' });
  }
});

// DELETE /api/edgeDesigns/:id - Delete edge design (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const edgeDesign = await EdgeDesign.findByIdAndDelete(req.params.id);
    if (!edgeDesign) return res.status(404).json({ error: 'Edge design not found' });
    res.json({ message: 'Edge design deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete edge design' });
  }
});

module.exports = router;
