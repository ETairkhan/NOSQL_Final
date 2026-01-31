const express = require('express');
const { body, validationResult } = require('express-validator');
const BicycleType = require('../models/BicycleType');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/types
// @desc    Get all bicycle types
// @access  Public
router.get('/', async (req, res) => {
  try {
    const types = await BicycleType.find({ isActive: true }).sort({ name: 1 });
    res.json(types);
  } catch (error) {
    console.error('Get bicycle types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/types/:id
// @desc    Get single bicycle type
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const type = await BicycleType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ message: 'Bicycle type not found' });
    }
    res.json(type);
  } catch (error) {
    console.error('Get bicycle type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle type ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/types
// @desc    Create a new bicycle type
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Bicycle type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, image } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const type = new BicycleType({
      name,
      slug,
      description,
      image
    });

    await type.save();
    res.status(201).json(type);
  } catch (error) {
    console.error('Create bicycle type error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Bicycle type with this name already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/types/:id
// @desc    Update a bicycle type
// @access  Private (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const updateData = req.body;
    
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const type = await BicycleType.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!type) {
      return res.status(404).json({ message: 'Bicycle type not found' });
    }

    res.json(type);
  } catch (error) {
    console.error('Update bicycle type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle type ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/types/:id
// @desc    Delete a bicycle type
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const type = await BicycleType.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!type) {
      return res.status(404).json({ message: 'Bicycle type not found' });
    }

    res.json({ message: 'Bicycle type deleted successfully', type });
  } catch (error) {
    console.error('Delete bicycle type error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid bicycle type ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

