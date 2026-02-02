const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Bicycle = require('../models/Bicycle');
const BicycleType = require('../models/BicycleType');
const Order = require('../models/Order');
const { authenticate, authorize } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const router = express.Router();

const allowedSortFields = [
  'price',
  '-price',
  'createdAt',
  '-createdAt',
  'ratingSummary.averageRating',
  '-ratingSummary.averageRating',
  'price_asc',
  'price_desc',
  'rating_desc',
  'newest'
];

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Bicycles
 *   description: Bicycle management
 */

/**
 * @swagger
 * /api/bicycles:
 *   get:
 *     summary: Get all bicycles
 *     tags: [Bicycles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, -price, createdAt, -createdAt, ratingSummary.averageRating, -ratingSummary.averageRating, price_asc, price_desc, rating_desc, newest]
 *     responses:
 *       200:
 *         description: List of bicycles
 */
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('sort').optional().isIn(allowedSortFields)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 12;
  const skip = (page - 1) * limit;

  const filter = req.user?.role === 'admin' ? {} : { isActive: true };

  if (req.query.type) filter.type = req.query.type;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = +req.query.minPrice;
    if (req.query.maxPrice) filter.price.$lte = +req.query.maxPrice;
  }

  let sort = { createdAt: -1 };
  switch (req.query.sort) {
    case 'price':
    case 'price_asc': sort = { price: 1 }; break;
    case '-price':
    case 'price_desc': sort = { price: -1 }; break;
    case 'rating_desc':
    case '-ratingSummary.averageRating': sort = { 'ratingSummary.averageRating': -1 }; break;
    case 'createdAt': sort = { createdAt: 1 }; break;
  }

  const bicycles = await Bicycle.find(filter)
    .populate('type', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Bicycle.countDocuments(filter);

  res.json({ bicycles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

/**
 * @swagger
 * /api/bicycles/{id}:
 *   get:
 *     summary: Get bicycle by ID
 *     tags: [Bicycles]
 */
router.get('/:id', async (req, res) => {
  const bicycle = await Bicycle.findById(req.params.id)
    .populate('type', 'name slug description');
  if (!bicycle) return res.status(404).json({ message: 'Bicycle not found' });
  res.json(bicycle);
});

/**
 * @swagger
 * /api/bicycles:
 *   post:
 *     summary: Create bicycle (admin)
 *     tags: [Bicycles]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize('admin'), [
  body('name').notEmpty(),
  body('description').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('type').isMongoId()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const typeExists = await BicycleType.findById(req.body.type);
  if (!typeExists) return res.status(400).json({ message: 'Invalid type' });

  const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const bicycle = await Bicycle.create({ ...req.body, slug });

  res.status(201).json(bicycle);
});

/**
 * @swagger
 * /api/bicycles/{id}:
 *   put:
 *     summary: Update bicycle (admin)
 *     tags: [Bicycles]
 *     security: [{ bearerAuth: [] }]
 */
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (req.body.name) {
    req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  const bicycle = await Bicycle.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true }
  );

  if (!bicycle) return res.status(404).json({ message: 'Bicycle not found' });
  res.json(bicycle);
});

/**
 * @swagger
 * /api/bicycles/{id}/stock:
 *   patch:
 *     summary: Update stock
 *     tags: [Bicycles]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/stock', authenticate, authorize('admin'), [
  body('quantity').isInt()
], async (req, res) => {
  const bicycle = await Bicycle.findByIdAndUpdate(
    req.params.id,
    { $inc: { stock: req.body.quantity } },
    { new: true }
  );
  if (!bicycle) return res.status(404).json({ message: 'Bicycle not found' });
  res.json(bicycle);
});

/**
 * @swagger
 * /api/bicycles/{id}:
 *   delete:
 *     summary: Soft delete bicycle
 *     tags: [Bicycles]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  const bicycle = await Bicycle.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!bicycle) return res.status(404).json({ message: 'Bicycle not found' });
  res.json({ message: 'Soft deleted', bicycle });
});

/**
 * @swagger
 * /api/bicycles/{id}/hard:
 *   delete:
 *     summary: Hard delete bicycle
 *     tags: [Bicycles]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/:id/hard', authenticate, authorize('admin'), async (req, res) => {
  const bicycle = await Bicycle.findById(req.params.id);
  if (!bicycle) return res.status(404).json({ message: 'Bicycle not found' });

  const hasOrders = await Order.exists({ 'items.bicycle': bicycle._id });
  if (hasOrders) return res.status(400).json({ message: 'Cannot hard delete bicycle with orders' });

  await bicycle.deleteOne();
  res.json({ message: 'Hard deleted' });
});

module.exports = router;
