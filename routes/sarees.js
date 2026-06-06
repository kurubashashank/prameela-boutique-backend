const express = require('express');
const Saree = require('../models/Saree');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/sarees - Get all sarees (public)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, fabric, occasion, color, trending, featured } = req.query;

    const filter = {};
    if (fabric) filter.fabric = fabric;
    if (occasion) filter.occasion = occasion;
    if (color) filter.colors = { $in: [color] };
    if (trending === 'true') filter.trending = true;
    if (featured === 'true') filter.featured = true;

    const sarees = await Saree.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Saree.countDocuments(filter);

    res.json({
      sarees,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching sarees:', error);
    res.status(500).json({ error: 'Failed to fetch sarees' });
  }
});

// GET /api/sarees/:id - Get single saree (public)
router.get('/:id', async (req, res) => {
  try {
    const saree = await Saree.findById(req.params.id);
    if (!saree) return res.status(404).json({ error: 'Saree not found' });

    // Increment view count
    saree.viewCount = (saree.viewCount || 0) + 1;
    await saree.save();

    res.json(saree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saree' });
  }
});

// POST /api/sarees - Create saree (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const saree = new Saree(req.body);
    await saree.save();
    res.status(201).json(saree);
  } catch (error) {
    console.error('Error creating saree:', error);
    res.status(400).json({ error: 'Failed to create saree' });
  }
});

// PUT /api/sarees/:id - Update saree (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const saree = await Saree.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!saree) return res.status(404).json({ error: 'Saree not found' });
    res.json(saree);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update saree' });
  }
});

// DELETE /api/sarees/:id - Delete saree (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const saree = await Saree.findByIdAndDelete(req.params.id);
    if (!saree) return res.status(404).json({ error: 'Saree not found' });
    res.json({ message: 'Saree deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saree' });
  }
});

module.exports = router;
