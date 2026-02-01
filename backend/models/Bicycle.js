const mongoose = require('mongoose');

const bicycleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  images: [{
    type: String
  }],
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BicycleType',
    required: true
  },
  // Embedded document for bicycle specifications
  specifications: {
    brand: String,
    frame: {
      material: String, // aluminum, carbon, steel, titanium
      size: String // XS, S, M, L, XL
    },
    wheels: {
      size: String, // 26", 27.5", 29", 700c
      type: String // mountain, road, hybrid
    },
    gears: {
      front: Number, // number of front gears
      rear: Number, // number of rear gears
      total: Number // total number of gears
    },
    brakes: {
      type: String, // disc, rim, hydraulic
      brand: String
    },
    weight: String, // weight in kg
    color: String,
    suspension: {
      front: Boolean,
      rear: Boolean,
      type: String // hardtail, full-suspension, rigid
    }
  },
  // Embedded document for ratings summary
  ratingSummary: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
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

// Compound indexes for common queries
bicycleSchema.index({ type: 1, isActive: 1 });
bicycleSchema.index({ price: 1, isActive: 1 });
bicycleSchema.index({ 'ratingSummary.averageRating': -1 });
bicycleSchema.index({ slug: 1 });
bicycleSchema.index({ 'specifications.brand': 1 });

module.exports = mongoose.model('Bicycle', bicycleSchema);

