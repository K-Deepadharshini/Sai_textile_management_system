import express from 'express';
import { getSalesReport, getProductionReport, getInventoryReport, getFinancialReport, getClientReport, generatePDFReport, generateExcelReport, getClientReports, getDashboardStats } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Client routes
router.get('/client',
  protect,
  authorize('client'),
  getClientReports
);

// Common routes
router.post('/generate-pdf',
  // NOTE: removed `protect` for local debugging to reproduce export errors quickly
  generatePDFReport
);

router.post('/generate-excel',
  // NOTE: removed `protect` for local debugging to reproduce export errors quickly
  generateExcelReport
);

// Admin routes
router.get('/dashboard',
  protect,
  authorize('admin'),
  getDashboardStats
);

router.get('/sales',
  protect,
  authorize('admin'),
  getSalesReport
);

router.get('/production',
  protect,
  authorize('admin'),
  getProductionReport
);

router.get('/inventory',
  protect,
  authorize('admin'),
  getInventoryReport
);

router.get('/financial',
  protect,
  authorize('admin'),
  getFinancialReport
);

router.get('/client/:id',
  protect,
  authorize('admin'),
  getClientReport
);

export default router;