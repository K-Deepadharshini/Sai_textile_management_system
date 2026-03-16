import Message from '../models/Message.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    let { receiver, order, subject, message, attachments, priority, category } = req.body;

    console.log('\n=== SEND MESSAGE REQUEST ===');
    console.log('Sender:', { id: req.user.id, role: req.user.role });
    console.log('Request body:', { receiver, order, subject, priority, category });

    // Handle special case where receiver is 'admin' - find the first admin user
    if (receiver === 'admin') {
      const adminUser = await User.findOne({ role: 'admin' });
      console.log('Receiver "admin" string provided - Looking for admin user, found:', adminUser ? adminUser._id : 'NOT FOUND');
      if (!adminUser) {
        return res.status(404).json({
          success: false,
          message: 'No admin user found'
        });
      }
      receiver = adminUser._id;
      console.log('Converted receiver "admin" to user ID:', receiver);
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      console.log('✗ Receiver user not found with ID:', receiver);
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }
    console.log('✓ Receiver found:', { id: receiverUser._id, name: receiverUser.name });

    // Check if order exists if provided
    if (order) {
      const orderExists = await Order.findById(order);
      if (!orderExists) {
        console.log('✗ Order not found with ID:', order);
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Check authorization for clients
      if (req.user.role === 'client' && orderExists.client.toString() !== req.user.id) {
        console.log('✗ Client not authorized for this order');
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send message for this order'
        });
      }
      console.log('✓ Order authorized:', order);
    }

    // Handle attachments
    let parsedAttachments = [];
    if (attachments) {
      parsedAttachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
    }

    // Create message
    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      order,
      subject,
      message,
      attachments: parsedAttachments,
      priority: priority || 'normal',
      category: category || 'general'
    });

    console.log('✓ Message created successfully:', {
      _id: newMessage._id,
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      subject: newMessage.subject,
      createdAt: newMessage.createdAt
    });
    console.log('=== END SEND MESSAGE ===\n');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    console.log('=== END SEND MESSAGE ===\n');
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all messages for user
// @route   GET /api/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { 
      type = 'all', // 'all', 'sent', 'received'
      category,
      isRead,
      priority,
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    console.log('\n=== GET MESSAGES REQUEST ===');
    console.log('User:', { id: req.user.id, role: req.user.role });
    console.log('Query params:', { type, category, isRead, priority, search, page, limit });
    
    // Build query based on message type
    let query = {};
    
    if (type === 'sent') {
      query.sender = req.user.id;
      console.log('Querying for sent messages - sender:', req.user.id);
    } else if (type === 'received') {
      query.receiver = req.user.id;
      console.log('Querying for received messages - receiver:', req.user.id);
    } else {
      query.$or = [
        { sender: req.user.id },
        { receiver: req.user.id }
      ];
      console.log('Querying for all messages - sender or receiver:', req.user.id);
    }
    
    // Additional filters
    if (category) query.category = category;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;
    
    // Search filter - merge with existing query without overwriting $or for type filtering
    if (search) {
      const searchQuery = {
        $or: [
          { subject: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      };
      
      // Merge search query with existing type query
      if (query.$or) {
        // If we already have an $or for type, combine both conditions
        query.$and = [
          { $or: query.$or },
          searchQuery
        ];
        delete query.$or;
      } else {
        // If no $or from type filter, just add search
        Object.assign(query, searchQuery);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('Final MongoDB query:', JSON.stringify(query));
    
    const messages = await Message.find(query)
      .populate('sender', 'name email role companyName')
      .populate('receiver', 'name email role companyName')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    console.log(`Results: Found ${messages.length} messages (total matching: ${total})`);
    
    if (messages.length > 0) {
      console.log('Sample message:', {
        _id: messages[0]._id,
        sender: messages[0].sender?.name,
        receiver: messages[0].receiver?.name,
        subject: messages[0].subject,
        createdAt: messages[0].createdAt
      });
    }
    
    // Get unread count
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });

    console.log('=== END GET MESSAGES ===\n');

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      unreadCount,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get client's messages
// @route   GET /api/messages/client
// @access  Private/Client
export const getClientMessages = async (req, res) => {
  try {
    const { isRead, category, search, page = 1, limit = 20 } = req.query;
    
    let query = { 
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    };
    
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (category) query.category = category;
    
    if (search) {
      query.$and = [
        query,
        {
          $or: [
            { subject: { $regex: search, $options: 'i' } },
            { message: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    // Get unread count
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      unreadCount,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: messages
    });
  } catch (error) {
    console.error('Get client messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
export const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email role companyName')
      .populate('receiver', 'name email role companyName')
      .populate('order', 'orderNumber items');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check authorization
    if (message.sender._id.toString() !== req.user.id && 
        message.receiver._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this message'
      });
    }

    // Mark as read if receiver is viewing
    if (message.receiver._id.toString() === req.user.id && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      await message.save();
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check authorization
    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check authorization
    if (message.sender.toString() !== req.user.id && 
        message.receiver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between current user and other user
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('order', 'orderNumber')
      .sort('createdAt');

    // Mark received messages as read
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: {
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          companyName: otherUser.companyName
        },
        messages
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get messages by order
// @route   GET /api/messages/order/:orderId
// @access  Private
export const getMessagesByOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && order.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access messages for this order'
      });
    }

    // Get messages for this order
    const messages = await Message.find({ order: orderId })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort('createdAt');

    // Mark received messages as read
    await Message.updateMany(
      {
        order: orderId,
        receiver: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages by order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get message statistics
// @route   GET /api/messages/stats
// @access  Private/Admin
export const getMessageStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get total messages
    const totalMessages = await Message.countDocuments(dateFilter);
    
    // Get messages by category
    const messagesByCategory = await Message.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Get messages by priority
    const messagesByPriority = await Message.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    // Get unread messages count
    const unreadMessages = await Message.countDocuments({
      ...dateFilter,
      isRead: false
    });
    
    // Get messages by month
    const messagesByMonth = await Message.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          month: { $first: { $month: '$createdAt' } },
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top communicators (clients who send most messages)
    const topCommunicators = await Message.aggregate([
      { 
        $match: { 
          ...dateFilter,
          'sender.role': 'client'
        } 
      },
      {
        $group: {
          _id: '$sender',
          messageCount: { $sum: 1 }
        }
      },
      { $sort: { messageCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalMessages,
        messagesByCategory,
        messagesByPriority,
        unreadMessages,
        messagesByMonth,
        topCommunicators
      }
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send bulk message to multiple clients
// @route   POST /api/messages/bulk
// @access  Private/Admin
export const sendBulkMessage = async (req, res) => {
  try {
    const { clientIds, subject, message, category, priority } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No clients specified'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Check if all clients exist
    const clients = await User.find({ 
      _id: { $in: clientIds },
      role: 'client'
    });

    if (clients.length !== clientIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more clients not found'
      });
    }

    // Create messages for each client
    const messages = [];
    const errors = [];

    for (const client of clients) {
      try {
        const newMessage = await Message.create({
          sender: req.user.id,
          receiver: client._id,
          subject,
          message,
          priority: priority || 'normal',
          category: category || 'general'
        });
        messages.push(newMessage);
      } catch (error) {
        errors.push({ clientId: client._id, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Messages sent to ${messages.length} clients`,
      data: {
        sent: messages.length,
        failed: errors.length,
        messages,
        errors
      }
    });
  } catch (error) {
    console.error('Send bulk message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};