import express from 'express';
import { 
  createProductionBatch, 
  getProductionBatches, 
  getProductionBatch, 
  updateProductionBatch, 
  updateBatchStatus,
  deleteProductionBatch, 
  getProductionStats,
  getBatchesByOrder
} from '../controllers/productionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.post('/',
  protect,
  authorize('admin'),
  createProductionBatch
);

router.get('/',
  protect,
  authorize('admin'),
  getProductionBatches
);

router.get('/stats',
  protect,
  authorize('admin'),
  getProductionStats
);

router.get('/order/:orderId',
  protect,
  getBatchesByOrder
);

// IMPORTANT: Status update route MUST come before the general update route
router.put('/:id/status',
  protect,
  authorize('admin'),
  updateBatchStatus
);

router.get('/:id',
  protect,
  getProductionBatch
);

router.put('/:id',
  protect,
  authorize('admin'),
  updateProductionBatch
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteProductionBatch
);

export default router;