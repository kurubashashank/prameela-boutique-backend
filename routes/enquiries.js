const express = require('express');
const Enquiry = require('../models/Enquiry');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/enquiries - Create enquiry (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, sareeId } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const enquiry = new Enquiry({
      name,
      email,
      phone,
      message,
      sareeId,
    });

    await enquiry.save();
    res.status(201).json({ success: true, enquiry });
  } catch (error) {
    console.error('Error creating enquiry:', error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// GET /api/enquiries - Get all enquiries (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate('sareeId')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// PUT /api/enquiries/:id - Mark as read (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// DELETE /api/enquiries/:id - Delete enquiry (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ message: 'Enquiry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

module.exports = router;
