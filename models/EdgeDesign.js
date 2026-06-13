const mongoose = require('mongoose');

const edgeDesignSchema = new mongoose.Schema({
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
  default: '',
},
  designType: {
    type: String,
    enum: ['Tassel', 'Lace Work', 'Bead Work', 'Border Styling', 'Edge Finishing', 'Mixed'],
    required: true,
  },
  colorVariants: [{
    type: String,
  }],
  material: {
    type: String,
    enum: ['Silk Thread', 'Synthetic Thread', 'Beads', 'Pearls', 'Lace', 'Mixed'],
    required: true,
  },
  images: [{
    url: String,
    altText: String,
    closeupUrl: String,
    enhancedUrl: String,
    caption: String,
  }],
  customizationDetails: {
    type: String,
  },
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
edgeDesignSchema.index({ createdAt: -1 });

module.exports = mongoose.model(
  'EdgeDesign',
  edgeDesignSchema
);