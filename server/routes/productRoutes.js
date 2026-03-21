import express from 'express';
import { 
  createProduct, 
  getProducts, 
  getAvailableProducts, 
  getProduct, 
  updateProduct, 
  deleteProduct, 
  searchProducts, 
  getLowStockProducts,
  getProductCategories,
  getProductStats,
  uploadProductImage,
  deleteProductImage,
  updateStock,
  uploadProduct3DModel,
  deleteProduct3DModel
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public routes for available products (for clients)
router.get('/available', protect, authorize('client'), getAvailableProducts);

// Admin routes
router.post('/', 
  protect, 
  authorize('admin'),
  upload.array('images', 5),
  createProduct
);

router.get('/',
  protect,
  getProducts
);

router.get('/search',
  protect,
  searchProducts
);

router.get('/low-stock',
  protect,
  authorize('admin'),
  getLowStockProducts
);

router.get('/categories',
  protect,
  getProductCategories
);

router.get('/stats',
  protect,
  authorize('admin'),
  getProductStats
);

router.get('/:id',
  protect,
  getProduct
);

router.put('/:id',
  protect,
  authorize('admin'),
  upload.array('images', 5),
  updateProduct
);

router.delete('/:id',
  protect,
  authorize('admin'),
  deleteProduct
);

router.put('/:id/stock',
  protect,
  authorize('admin'),
  updateStock
);

router.post('/:id/image',
  protect,
  authorize('admin'),
  upload.single('image'),
  uploadProductImage
);

router.delete('/:id/image/:imageId',
  protect,
  authorize('admin'),
  deleteProductImage
);

router.post('/:id/model3d',
  protect,
  authorize('admin'),
  upload.single('model'),
  uploadProduct3DModel
);

// Also accept PUT to support clients using update-style model uploads.
router.put('/:id/model3d',
  protect,
  authorize('admin'),
  upload.single('model'),
  uploadProduct3DModel
);

router.delete('/:id/model3d',
  protect,
  authorize('admin'),
  deleteProduct3DModel
);

export default router;