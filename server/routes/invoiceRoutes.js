import express from 'express';
import { createInvoice, getInvoices, getClientInvoices, getInvoice, updateInvoice, deleteInvoice, downloadInvoice, sendInvoice, getOverdueInvoices, recordPayment } from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes - specific paths before parameter paths
router.post('/',
  protect,
  authorize('admin'),
  createInvoice
);

router.get('/',
  protect,
  authorize('admin'),
  getInvoices
);

// Client routes
router.get('/client',
  protect,
  authorize('client'),
  getClientInvoices
);

// Special admin routes - before parameter routes
router.get('/overdue',
  protect,
  authorize('admin'),
  getOverdueInvoices
);

// Parameter routes - must come last
router.get('/:id/download',
  protect,
  downloadInvoice
);

router.get('/:id',
  protect,
  getInvoice
);

router.put('/:id',
  protect,
  authorize('admin'),
  updateInvoice
);

router.post('/:id/send',
  protect,
  authorize('admin'),
  sendInvoice
);

// Client or admin can record a payment for an invoice
router.post('/:id/payment',
  protect,
  recordPayment
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteInvoice
);

export default router;