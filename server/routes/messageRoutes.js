import express from 'express';
import { sendMessage, getMessages, getClientMessages, getMessage, markAsRead, deleteMessage, getConversation, getMessagesByOrder, getUnreadCount, getMessageStats, sendBulkMessage } from '../controllers/messageController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All specific routes FIRST, generic routes LAST

// Common routes
router.post('/',
  protect,
  sendMessage
);

router.get('/',
  protect,
  getMessages
);

// Unread count route - specific before generic :id
router.get('/unread/count',
  protect,
  getUnreadCount
);

// Client routes
router.get('/client',
  protect,
  authorize('client'),
  getClientMessages
);

// Conversation route
router.get('/conversation/:userId',
  protect,
  getConversation
);

// Order messages route
router.get('/order/:orderId',
  protect,
  getMessagesByOrder
);

// Admin stats route
router.get('/stats',
  protect,
  authorize('admin'),
  getMessageStats
);

// Bulk message route
router.post('/bulk',
  protect,
  authorize('admin'),
  sendBulkMessage
);

// Generic routes LAST
router.get('/:id',
  protect,
  getMessage
);

router.put('/:id/read',
  protect,
  markAsRead
);

router.delete('/:id',
  protect,
  deleteMessage
);

export default router;