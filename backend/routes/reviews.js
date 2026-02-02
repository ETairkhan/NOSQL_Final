const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Bicycle = require('../models/Bicycle');
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Reviews management
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: bicycle
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.bicycle) {
      query.bicycle = req.query.bicycle;
    }

    const reviews = await Review.find(query)
      .populate('user', 'username')
      .populate('bicycle', 'name slug')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review data
 *       404:
 *         description: Review not found
 */
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username profile')
      .populate('bicycle', 'name slug images');

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

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bicycle, rating]
 *             properties:
 *               bicycle:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               comment:
 *                 type: string
 *               order:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created
 */
router.post('/', authenticate, [
  body('bicycle').isMongoId().withMessage('Valid bicycle ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bicycle, rating, title, comment, order } = req.body;

    const bicycleExists = await Bicycle.findById(bicycle);
    if (!bicycleExists) {
      return res.status(404).json({ message: 'Bicycle not found' });
    }

    const existingReview = await Review.findOne({ user: req.user._id, bicycle });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this bicycle' });
    }

    let isVerified = false;
    if (order) {
      const orderExists = await Order.findOne({
        _id: order,
        user: req.user._id,
        status: 'delivered',
        'items.bicycle': bicycle
      });
      isVerified = !!orderExists;
    }

    const review = new Review({
      user: req.user._id,
      bicycle,
      order: order || null,
      rating,
      title,
      comment,
      isVerified
    });

    await review.save();
    await updateBicycleRatingSummary(bicycle);

    await review.populate('user', 'username');
    await review.populate('bicycle', 'name slug');

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/reviews/{id}/helpful:
 *   patch:
 *     summary: Mark review as helpful
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Helpful count incremented
 */
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

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 1000 }),
  body('isVerified').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };

    const review = await Review.findOne(query);
    if (!review) {
      return res.status(404).json({ message: 'Review not found or access denied' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('user', 'username').populate('bicycle', 'name slug');

    if (req.body.rating && req.body.rating !== review.rating) {
      await updateBicycleRatingSummary(review.bicycle);
    }

    res.json(updatedReview);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };

    const review = await Review.findOne(query);
    if (!review) {
      return res.status(404).json({ message: 'Review not found or access denied' });
    }

    const bicycleId = review.bicycle;
    await Review.findByIdAndDelete(req.params.id);
    await updateBicycleRatingSummary(bicycleId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid review ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function
const updateBicycleRatingSummary = async (bicycleId) => {
  const stats = await Review.aggregate([
    { $match: { bicycle: bicycleId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  await Bicycle.findByIdAndUpdate(bicycleId, {
    $set: stats.length
      ? {
          'ratingSummary.averageRating': Math.round(stats[0].averageRating * 10) / 10,
          'ratingSummary.totalReviews': stats[0].totalReviews
        }
      : {
          'ratingSummary.averageRating': 0,
          'ratingSummary.totalReviews': 0
        }
  });
};

module.exports = router;
