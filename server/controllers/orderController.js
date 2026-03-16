import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import ProductionBatch from '../models/ProductionBatch.js';
import Invoice from '../models/Invoice.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      shippingAddress, 
      billingAddress, 
      deliveryDate, 
      priority, 
      paymentTerms,
      notes 
    } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must have at least one item'
      });
    }

    // Check product availability and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
        });
      }

      if (item.quantity < product.moq) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for ${product.name} is ${product.moq} ${product.unit}`
        });
      }

      const itemTotal = item.quantity * product.price;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: product.price,
        gstPercentage: product.gstPercentage || 18,
        totalPrice: itemTotal
      });
    }

    // Calculate GST and grand total
    const gstPercentage = orderItems[0].gstPercentage; // Assuming same GST for all items
    const gstAmount = (totalAmount * gstPercentage) / 100;
    const grandTotal = totalAmount + gstAmount;

    // Determine client (for admin creating order for client)
    let clientId = req.user.id;
    if (req.user.role === 'admin' && req.body.clientId) {
      const client = await User.findById(req.body.clientId);
      if (!client || client.role !== 'client') {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID'
        });
      }
      clientId = req.body.clientId;
    }

    // Parse addresses
    let parsedShippingAddress = {};
    if (shippingAddress) {
      parsedShippingAddress = typeof shippingAddress === 'string' 
        ? JSON.parse(shippingAddress) 
        : shippingAddress;
    }

    let parsedBillingAddress = {};
    if (billingAddress) {
      parsedBillingAddress = typeof billingAddress === 'string' 
        ? JSON.parse(billingAddress) 
        : billingAddress;
    }

    // Create order
    // Ensure an orderNumber exists to satisfy validation (use timestamp-based fallback)
    const orderNumber = `ORD${Date.now()}`;

    const order = await Order.create({
      orderNumber,
      client: clientId,
      items: orderItems,
      totalAmount,
      gstAmount,
      grandTotal,
      shippingAddress: parsedShippingAddress,
      billingAddress: parsedBillingAddress,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      priority: priority || 'medium',
      paymentTerms: paymentTerms || 'net-15',
      notes,
      createdBy: req.user.id,
      status: req.user.role === 'admin' ? 'confirmed' : 'pending'
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all orders (Admin) or client's orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
  try {
    const { 
      status, 
      client, 
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (status) query.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'client.companyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role-based filtering
    if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'admin' && client) {
      query.client = client;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('client', 'name companyName email phone')
      .populate('items.product', 'name productCode unit')
      .populate('productionBatches', 'batchNumber status')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get client's orders
// @route   GET /api/orders/client
// @access  Private/Client
export const getClientOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { client: req.user.id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(query)
      .populate('items.product', 'name productCode unit price')
      .populate('productionBatches', 'batchNumber status quantityProduced')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: orders
    });
  } catch (error) {
    console.error('Get client orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'name companyName email phone address gstNumber')
      .populate('items.product', 'name productCode type denier shade unit')
      .populate('productionBatches')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && order.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private/Admin
export const updateOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Don't allow updating completed or cancelled orders
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${order.status} order`
      });
    }

    // Parse addresses if provided
    if (req.body.shippingAddress) {
      req.body.shippingAddress = typeof req.body.shippingAddress === 'string' 
        ? JSON.parse(req.body.shippingAddress) 
        : req.body.shippingAddress;
    }
    if (req.body.billingAddress) {
      req.body.billingAddress = typeof req.body.billingAddress === 'string' 
        ? JSON.parse(req.body.billingAddress) 
        : req.body.billingAddress;
    }

    // Handle date fields
    if (req.body.deliveryDate) {
      req.body.deliveryDate = new Date(req.body.deliveryDate);
    }

    // Update order
    order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization for clients
    if (req.user.role === 'client') {
      if (order.client.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this order'
        });
      }
      // Clients can only cancel pending orders
      if (status !== 'cancelled' || order.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel pending orders'
        });
      }
    }

    // Handle cancellation - restore product stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    // Handle status changes that affect production
    if (status === 'in-production' && order.status !== 'in-production') {
      // Create production batches for order items
      for (const item of order.items) {
        const productionBatch = await ProductionBatch.create({
          product: item.product,
          quantityProduced: item.quantity,
          order: order._id,
          status: 'planned',
          createdBy: req.user.id
        });
        
        order.productionBatches.push(productionBatch._id);
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Don't allow deleting orders that are in progress
    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete order that is in progress'
      });
    }

    // Restore product stock if order is not cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity }
        });
      }
    }

    // Delete associated production batches
    await ProductionBatch.deleteMany({ order: order._id });

    await order.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
export const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.$gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === 'client') {
      dateFilter.client = req.user.id;
    }

    // Get total orders
    const totalOrders = await Order.countDocuments(dateFilter);
    
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    
    // Get average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, avg: { $avg: '$grandTotal' } } }
    ]);
    
    // Get monthly orders
    const monthlyOrders = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $month: '$orderDate' },
          month: { $first: { $month: '$orderDate' } },
          count: { $sum: 1 },
          revenue: { $sum: '$grandTotal' }
        }
      },
      { $sort: { month: 1 } }
    ]);

    // Get top clients (admin only)
    let topClients = [];
    if (req.user.role === 'admin') {
      topClients = await Order.aggregate([
        { $match: { ...dateFilter, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$client',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$grandTotal' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'clientInfo'
          }
        },
        { $unwind: '$clientInfo' }
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        ordersByStatus,
        totalRevenue: totalRevenue[0]?.total || 0,
        averageOrderValue: avgOrderValue[0]?.avg || 0,
        monthlyOrders,
        topClients
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get order timeline
// @route   GET /api/orders/:id/timeline
// @access  Private
export const getOrderTimeline = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

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
        message: 'Not authorized to access this order'
      });
    }

    // Get production batches
    const productionBatches = await ProductionBatch.find({ order: order._id })
      .select('batchNumber status startDate endDate quantityProduced wastage')
      .sort('startDate');

    // Get invoices
    const invoices = await Invoice.find({ order: order._id })
      .select('invoiceNumber invoiceDate dueDate paymentStatus grandTotal amountPaid')
      .sort('invoiceDate');

    // Build timeline
    const timeline = [
      {
        event: 'Order Placed',
        date: order.orderDate,
        description: `Order ${order.orderNumber} was placed`,
        status: 'completed'
      }
    ];

    // Add status changes
    const statusEvents = [
      { status: 'confirmed', event: 'Order Confirmed' },
      { status: 'in-production', event: 'Production Started' },
      { status: 'quality-check', event: 'Quality Check' },
      { status: 'ready-for-dispatch', event: 'Ready for Dispatch' },
      { status: 'dispatched', event: 'Order Dispatched' },
      { status: 'delivered', event: 'Order Delivered' },
      { status: 'cancelled', event: 'Order Cancelled' }
    ];

    // Find when each status was reached (simplified - in real app, track status changes)
    statusEvents.forEach(event => {
      if (order.status === event.status || 
          (event.status === 'confirmed' && order.status !== 'pending')) {
        timeline.push({
          event: event.event,
          date: order.updatedAt, // Simplified - should track actual change time
          description: `Order ${event.event.toLowerCase()}`,
          status: 'completed'
        });
      }
    });

    // Add production batch events
    productionBatches.forEach(batch => {
      timeline.push({
        event: 'Production Batch',
        date: batch.startDate,
        description: `Batch ${batch.batchNumber}: ${batch.quantityProduced} units`,
        details: `Status: ${batch.status}, Wastage: ${batch.wastage} units`,
        status: batch.status === 'completed' ? 'completed' : 'in-progress'
      });
    });

    // Add invoice events
    invoices.forEach(invoice => {
      timeline.push({
        event: 'Invoice Generated',
        date: invoice.invoiceDate,
        description: `Invoice ${invoice.invoiceNumber}`,
        details: `Amount: ₹${invoice.grandTotal}, Status: ${invoice.paymentStatus}`,
        status: invoice.paymentStatus === 'paid' ? 'completed' : 'pending'
      });
    });

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      success: true,
      data: {
        order: order.orderNumber,
        currentStatus: order.status,
        timeline
      }
    });
  } catch (error) {
    console.error('Get order timeline error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Assign production batch to order
// @route   POST /api/orders/:id/assign-batch
// @access  Private/Admin
export const assignProductionBatch = async (req, res) => {
  try {
    const { batchId } = req.body;
    
    const order = await Order.findById(req.params.id);
    const batch = await ProductionBatch.findById(batchId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Check if batch is already assigned to another order
    if (batch.order && batch.order.toString() !== order._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Batch is already assigned to another order'
      });
    }

    // Update batch
    batch.order = order._id;
    await batch.save();

    // Update order
    if (!order.productionBatches.includes(batchId)) {
      order.productionBatches.push(batchId);
    }
    
    // Update order status if not already in production
    if (order.status !== 'in-production') {
      order.status = 'in-production';
    }
    
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Production batch assigned to order',
      data: { order, batch }
    });
  } catch (error) {
    console.error('Assign production batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private/Client
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.client.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be cancelled'
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stockQuantity: item.quantity }
      });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};