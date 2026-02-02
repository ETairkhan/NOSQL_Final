const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Bicycle = require('../models/Bicycle');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (user's orders or all for admin)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user._id };
    
    const orders = await Order.find(query)
      .populate('user', 'username email')
      .populate('items.bicycle', 'name slug images price')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */


// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('user', 'username email profile')
      .populate('items.bicycle', 'name slug images price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.bicycle').isMongoId().withMessage('Valid bicycle ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').isIn(['credit_card', 'paypal', 'cash_on_delivery']).withMessage('Invalid payment method'),
  body('shippingAddress').isObject().withMessage('Shipping address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod, discount } = req.body;

    // Validate products and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const bicycle = await Bicycle.findById(item.bicycle);
      if (!bicycle || !bicycle.isActive) {
        return res.status(400).json({ message: `Bicycle ${item.bicycle} not found or inactive` });
      }

      if (bicycle.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for bicycle ${bicycle.name}` });
      }

      const price = bicycle.discountPrice > 0 ? bicycle.discountPrice : bicycle.price;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        bicycle: bicycle._id,
        quantity: item.quantity,
        price,
        subtotal
      });

      // Update bicycle stock
      await Bicycle.findByIdAndUpdate(bicycle._id, {
        $inc: { stock: -item.quantity }
      });
    }

    const finalAmount = totalAmount - (discount || 0);

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      discount: discount || 0,
      finalAmount,
      status: 'pending'
    });

    await order.save();
    await order.populate('items.bicycle', 'name slug images price');

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Advanced update with $set)
// @access  Private (Admin only)
router.patch('/:id/status', authenticate, authorize('admin'), [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status } = req.body;
    const updateData = { status };

    if (status === 'delivered') {
      updateData.deliveredDate = new Date();
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('items.bicycle', 'name slug images price');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */


// @route   DELETE /api/orders/:id
// @desc    Cancel/Delete an order
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
      query.status = { $in: ['pending', 'processing'] }; // Only allow cancellation of pending/processing orders
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
    }

    // Restore bicycle stock if order is cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        await Bicycle.findByIdAndUpdate(item.bicycle, {
          $inc: { stock: item.quantity }
        });
      }
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/items', authenticate, async (req, res) => {
  const { bicycle, quantity } = req.body;

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: 'pending'
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found or not editable' });
  }

  const bike = await Bicycle.findById(bicycle);
  if (!bike || !bike.isActive) {
    return res.status(400).json({ message: 'Bicycle not available' });
  }

  if (bike.stock < quantity) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  const price = bike.discountPrice > 0 ? bike.discountPrice : bike.price;
  const subtotal = price * quantity;

  await Order.findByIdAndUpdate(order._id, {
    $push: {
      items: {
        bicycle,
        quantity,
        price,
        subtotal
      }
    },
    $inc: {
      totalAmount: subtotal,
      finalAmount: subtotal
    }
  });

  await Bicycle.findByIdAndUpdate(bicycle, {
    $inc: { stock: -quantity }
  });

  res.json({ message: 'Item added to order' });
});

router.delete('/:id/items/:bicycleId', authenticate, async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
    status: 'pending'
  });

  if (!order) {
    return res.status(404).json({ message: 'Order not found or not editable' });
  }

  const item = order.items.find(
    i => i.bicycle.toString() === req.params.bicycleId
  );

  if (!item) {
    return res.status(404).json({ message: 'Item not found in order' });
  }

  await Order.findByIdAndUpdate(order._id, {
    $pull: {
      items: { bicycle: item.bicycle }
    },
    $inc: {
      totalAmount: -item.subtotal,
      finalAmount: -item.subtotal
    }
  });

  await Bicycle.findByIdAndUpdate(item.bicycle, {
    $inc: { stock: item.quantity }
  });

  res.json({ message: 'Item removed from order' });
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 */

/**
 * @swagger
 * /api/orders/{id}/items:
 *   patch:
 *     summary: Add item to order (push)
 *     tags: [Orders]
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
 *         description: Item added
 */

/**
 * @swagger
 * /api/orders/{id}/items/{bicycleId}:
 *   delete:
 *     summary: Remove item from order (pull)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Item removed
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders (user or all for admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 */



module.exports = router;

