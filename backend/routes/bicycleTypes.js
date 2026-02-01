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
    console.log('POST /api/types - Request body:', req.body); // Add log
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, image, isActive = true } = req.body;
    
    // Generate slug more reliably
    let slug = name.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, ''); // Remove dashes at the beginning and end
    
    console.log('Generated slug from name:', slug); // Add log
    
    // Check slug uniqueness
    const existingType = await BicycleType.findOne({ slug });
    if (existingType) {
      // Add timestamp if slug already exists
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
      console.log('Slug already exists, new slug:', slug); // Add log
    }

    console.log('Creating type with data:', { // Add log
      name,
      slug,
      description: description || '',
      image: image || '',
      isActive: isActive !== undefined ? isActive : true
    });

    const type = new BicycleType({
      name,
      slug,
      description: description || '',
      image: image || '',
      isActive: isActive !== undefined ? isActive : true
    });

    await type.save();
    console.log('Type saved successfully:', type); // Add log
    res.status(201).json(type);
  } catch (error) {
    console.error('Create bicycle type error:', error);
    console.error('Error details:', error.message); // Add log
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
    const updateData = { ...req.body };
    
    // If we change the name, update the slug
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Check slug uniqueness for other documents
      const existingType = await BicycleType.findOne({
        slug: updateData.slug,
        _id: { $ne: req.params.id }
      });
      
      if (existingType) {
        updateData.slug = `${updateData.slug}-${Date.now().toString().slice(-6)}`;
      }
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
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Slug already exists' });
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

