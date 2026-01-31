const express = require('express');
const Order = require('../models/Order');
const Bicycle = require('../models/Bicycle');
const Review = require('../models/Review');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stats/sales
// @desc    Get sales statistics (Aggregation pipeline)
// @access  Private (Admin only)
router.get('/sales', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { status: { $ne: 'cancelled' } };
    
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    const salesStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalItemsSold: {
            $sum: {
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          averageOrderValue: { $round: ['$averageOrderValue', 2] },
          totalItemsSold: 1
        }
      }
    ]);

    res.json(salesStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalItemsSold: 0
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/bicycles
// @desc    Get top selling bicycles (Aggregation pipeline)
// @access  Private (Admin only)
router.get('/bicycles', authenticate, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topBicycles = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.bicycle',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'bicycles',
          localField: '_id',
          foreignField: '_id',
          as: 'bicycle'
        }
      },
      { $unwind: '$bicycle' },
      {
        $project: {
          _id: 0,
          bicycleId: '$_id',
          bicycleName: '$bicycle.name',
          bicycleSlug: '$bicycle.slug',
          totalSold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ]);

    res.json(topBicycles);
  } catch (error) {
    console.error('Get top bicycles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/types
// @desc    Get sales by bicycle type (Aggregation pipeline)
// @access  Private (Admin only)
router.get('/types', authenticate, authorize('admin'), async (req, res) => {
  try {
    const typeStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'bicycles',
          localField: 'items.bicycle',
          foreignField: '_id',
          as: 'bicycle'
        }
      },
      { $unwind: '$bicycle' },
      {
        $lookup: {
          from: 'bicycletypes',
          localField: 'bicycle.type',
          foreignField: '_id',
          as: 'type'
        }
      },
      { $unwind: '$type' },
      {
        $group: {
          _id: '$type._id',
          typeName: { $first: '$type.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      {
        $project: {
          _id: 0,
          typeId: '$_id',
          typeName: 1,
          totalSold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ]);

    res.json(typeStats);
  } catch (error) {
    console.error('Get type stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/reviews
// @desc    Get review statistics (Aggregation pipeline)
// @access  Public
router.get('/reviews', async (req, res) => {
  try {
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: '$count' },
          averageRating: {
            $avg: {
              $multiply: ['$_id', '$count']
            }
          },
          ratingDistribution: {
            $push: {
              rating: '$_id',
              count: '$count'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 2] },
          ratingDistribution: 1
        }
      }
    ]);

    res.json(reviewStats[0] || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: []
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stats/overview
// @desc    Get overview statistics
// @access  Private (Admin only)
router.get('/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalBicycles, totalOrders, totalReviews] = await Promise.all([
      User.countDocuments(),
      Bicycle.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Review.countDocuments()
    ]);

    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const lowStockBicycles = await Bicycle.countDocuments({
      isActive: true,
      stock: { $lt: 10 }
    });

    res.json({
      users: totalUsers,
      bicycles: totalBicycles,
      orders: totalOrders,
      reviews: totalReviews,
      pendingOrders,
      lowStockBicycles
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

