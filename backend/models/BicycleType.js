// models/BicycleType.js
const mongoose = require('mongoose');

const bicycleTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-processing before saving
bicycleTypeSchema.pre('save', function(next) {
  console.log('pre-save hook called, slug:', this.slug, 'name:', this.name); // Add log
  // Automatically generate slug if not specified
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    console.log('Generated slug:', this.slug); // Add log
  }
  next();
});

module.exports = mongoose.model('BicycleType', bicycleTypeSchema);