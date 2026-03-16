import express from 'express';
import { createDispatch, getDispatches, getClientDispatches, getDispatch, updateDispatch, deleteDispatch, updateDispatchStatus, getDispatchStats, generateLR } from '../controllers/dispatchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Client routes
router.get('/client',
  protect,
  authorize('client'),
  getClientDispatches
);

// Admin routes
router.post('/',
  protect,
  authorize('admin'),
  createDispatch
);

router.get('/',
  protect,
  authorize('admin'),
  getDispatches
);

router.get('/stats',
  protect,
  authorize('admin'),
  getDispatchStats
);

router.get('/:id/lr',
  protect,
  generateLR
);

router.get('/:id',
  protect,
  getDispatch
);

router.put('/:id',
  protect,
  authorize('admin'),
  updateDispatch
);

router.put('/:id/status',
  protect,
  authorize('admin'),
  updateDispatchStatus
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteDispatch
);

export default router;