const mongoose = require('mongoose');

const bicycleTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
bicycleTypeSchema.index({ slug: 1 });
bicycleTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('BicycleType', bicycleTypeSchema);

