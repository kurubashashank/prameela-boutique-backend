const mongoose = require('mongoose');

const sareeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  fabric: {
    type: String,
    enum: ['Silk', 'Cotton Silk', 'Banarasi', 'Chiffon', 'Georgette', 'Tussar'],
    required: true,
  },
  colors: [{
    type: String,
  }],
  occasion: {
    type: String,
    enum: ['Wedding', 'Festival', 'Casual', 'Traditional', 'Party', 'Formal'],
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  images: [{
    url: String,
    altText: String,
    enhancedUrl: String,
  }],
  trending: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Saree', sareeSchema);
