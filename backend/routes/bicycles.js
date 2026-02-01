const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Bicycle = require('../models/Bicycle');
const BicycleType = require('../models/BicycleType');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/bicycles
// @desc    Get all bicycles with filtering and pagination
// @access  Public
const allowedSortFields = [
  'price',
  '-price',
  'createdAt',
  '-createdAt',
  'ratingSummary.averageRating',
  '-ratingSummary.averageRating'
];
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),

  query('sort').optional().isIn(allowedSortFields)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };
    
    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Build sort
    let sort = {};
    switch (req.query.sort) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'rating_desc':
        sort = { 'ratingSummary.averageRating': -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const bicycles = await Bicycle.find(query)
      .populate('type', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Bicycle.countDocuments(query);

    res.json({
      bicycles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get bicycles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bicycles/:id
// @desc    Get single bicycle
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bicycle = await Bicycle.findById(req.params.id)
      .populate('type', 'name slug description');

    if (!bicycle) {
      return res.status(404).json({ message: 'Bicycle not found' });
    }

    res.json(bicycle);
  } catch (error) {
    console.error('Get bicycle error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bicycles
// @desc    Create a new bicycle
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Bicycle name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('type').isMongoId().withMessage('Valid bicycle type ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, discountPrice, stock, images, type, specifications } = req.body;

    // Check if type exists
    const typeExists = await BicycleType.findById(type);
    if (!typeExists) {
      return res.status(400).json({ message: 'Bicycle type not found' });
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const bicycle = new Bicycle({
      name,
      slug,
      description,
      price,
      discountPrice: discountPrice || 0,
      stock,
      images: images || [],
      type,
      specifications: specifications || {},
      ratingSummary: {
        averageRating: 0,
        totalReviews: 0
      }
    });

    await bicycle.save();
    await bicycle.populate('type', 'name slug');

    res.status(201).json(bicycle);
  } catch (error) {
    console.error('Create bicycle error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bicycle with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bicycles/:id
// @desc    Update a bicycle
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const bicycle = await Bicycle.findById(req.params.id);
    if (!bicycle) {
      return res.status(404).json({ message: 'Bicycle not found' });
    }

    const updateData = req.body;
    
    // If name changes, update slug
    if (updateData.name && updateData.name !== bicycle.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const updatedBicycle = await Bicycle.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('type', 'name slug');

    res.json(updatedBicycle);
  } catch (error) {
    console.error('Update bicycle error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/bicycles/:id/stock
// @desc    Update bicycle stock (Advanced update with $inc)
// @access  Private (Admin only)
router.patch('/:id/stock', authenticate, authorize('admin'), [
  body('quantity').isInt().withMessage('Quantity must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity } = req.body;
    const bicycle = await Bicycle.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock: quantity } },
      { new: true, runValidators: true }
    );

    if (!bicycle) {
      return res.status(404).json({ message: 'Bicycle not found' });
    }

    res.json(bicycle);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bicycles/:id
// @desc    Delete a bicycle (soft delete)
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const bicycle = await Bicycle.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!bicycle) {
      return res.status(404).json({ message: 'Bicycle not found' });
    }

    res.json({ message: 'Bicycle deleted successfully', bicycle });
  } catch (error) {
    console.error('Delete bicycle error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

