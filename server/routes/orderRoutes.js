import express from 'express';
import { createOrder, getOrders, getClientOrders, getOrder, updateOrder, updateOrderStatus, deleteOrder, getOrderStats, getOrderTimeline, assignProductionBatch, cancelOrder } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Client routes
router.get('/client',
  protect,
  authorize('client'),
  getClientOrders
);

router.put('/:id/cancel',
  protect,
  authorize('client'),
  cancelOrder
);

// Common routes
router.post('/',
  protect,
  createOrder
);

router.get('/',
  protect,
  getOrders
);

router.get('/stats',
  protect,
  getOrderStats
);

router.get('/:id',
  protect,
  getOrder
);

router.get('/:id/timeline',
  protect,
  getOrderTimeline
);

// Admin routes
router.put('/:id',
  protect,
  authorize('admin'),
  updateOrder
);

router.put('/:id/status',
  protect,
  updateOrderStatus
);

router.post('/:id/assign-batch',
  protect,
  authorize('admin'),
  assignProductionBatch
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteOrder
);

export default router;