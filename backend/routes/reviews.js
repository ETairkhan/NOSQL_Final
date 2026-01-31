const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get reviews (optionally filtered by product)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.product) {
      query.product = req.query.product;
    }

    const reviews = await Review.find(query)
      .populate('user', 'username')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get single review
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username profile')
      .populate('product', 'name slug images');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticate, [
  body('product').isMongoId().withMessage('Valid product ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product, rating, title, comment, order } = req.body;

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: req.user._id, product });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    // Verify order if provided (mark review as verified)
    let isVerified = false;
    if (order) {
      const orderExists = await Order.findOne({
        _id: order,
        user: req.user._id,
        status: 'delivered',
        'items.product': product
      });
      isVerified = !!orderExists;
    }

    const review = new Review({
      user: req.user._id,
      product,
      order: order || null,
      rating,
      title,
      comment,
      isVerified
    });

    await review.save();

    // Update product rating summary (aggregation)
    await updateProductRatingSummary(product);

    await review.populate('user', 'username');
    await review.populate('product', 'name slug');

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/reviews/:id/helpful
// @desc    Mark review as helpful (Advanced update with $inc)
// @access  Private
router.patch('/:id/helpful', authenticate, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Update helpful count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (own review only)
router.put('/:id', authenticate, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or access denied' });
    }

    const updateData = req.body;
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('user', 'username').populate('product', 'name slug');

    // Update product rating summary if rating changed
    if (updateData.rating && updateData.rating !== review.rating) {
      await updateProductRatingSummary(review.product);
    }

    res.json(updatedReview);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (own review only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found or access denied' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Update product rating summary
    await updateProductRatingSummary(productId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update product rating summary
const updateProductRatingSummary = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      $set: {
        'ratingSummary.averageRating': Math.round(stats[0].averageRating * 10) / 10,
        'ratingSummary.totalReviews': stats[0].totalReviews
      }
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      $set: {
        'ratingSummary.averageRating': 0,
        'ratingSummary.totalReviews': 0
      }
    });
  }
};

module.exports = router;

