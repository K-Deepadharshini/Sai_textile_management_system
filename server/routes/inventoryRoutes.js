import express from 'express';
import { createInventoryItem, getInventoryItems, getInventoryItem, updateInventoryItem, deleteInventoryItem, updateInventoryStock, getLowStockItems, getExpiredItems, getInventoryStats, searchInventory, bulkUpdateInventory } from '../controllers/inventoryController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.post('/',
  protect,
  authorize('admin'),
  createInventoryItem
);

router.get('/',
  protect,
  authorize('admin'),
  getInventoryItems
);

router.get('/stats',
  protect,
  authorize('admin'),
  getInventoryStats
);

router.get('/low-stock',
  protect,
  authorize('admin'),
  getLowStockItems
);

router.get('/expired',
  protect,
  authorize('admin'),
  getExpiredItems
);

router.get('/search',
  protect,
  authorize('admin'),
  searchInventory
);

router.get('/:id',
  protect,
  authorize('admin'),
  getInventoryItem
);

router.put('/:id',
  protect,
  authorize('admin'),
  updateInventoryItem
);

router.put('/:id/stock',
  protect,
  authorize('admin'),
  updateInventoryStock
);

router.put('/bulk-update',
  protect,
  authorize('admin'),
  bulkUpdateInventory
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteInventoryItem
);

export default router;