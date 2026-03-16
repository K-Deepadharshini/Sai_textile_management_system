import Dispatch from '../models/Dispatch.js';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';

// @desc    Create new dispatch
// @route   POST /api/dispatch
// @access  Private/Admin
export const createDispatch = async (req, res) => {
  try {
    const {
      order,
      invoice,
      dispatchDate,
      estimatedDeliveryDate,
      items,
      totalWeight,
      totalPackages,
      transportDetails,
      shippingAddress,
      documents
    } = req.body;

    // Check if order exists
    const orderExists = await Order.findById(order);
    if (!orderExists) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is ready for dispatch - accept orders in quality-check, ready-for-dispatch, or confirmed states
    const validStatuses = ['ready-for-dispatch', 'quality-check', 'confirmed'];
    if (!validStatuses.includes(orderExists.status)) {
      return res.status(400).json({
        success: false,
        message: `Order status must be one of: ${validStatuses.join(', ')}. Current status: ${orderExists.status}`
      });
    }

    // Invoice must be created before dispatch
    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice must be created before dispatch. Please create an invoice for this order first.'
      });
    }

    // Check if invoice exists
    const invoiceExists = await Invoice.findById(invoice);
    if (!invoiceExists) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Parse JSON fields
    let parsedItems = [];
    if (items) {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    }

    let parsedTransportDetails = {};
    if (transportDetails) {
      parsedTransportDetails = typeof transportDetails === 'string' 
        ? JSON.parse(transportDetails) 
        : transportDetails;
    }

    let parsedShippingAddress = {};
    if (shippingAddress) {
      parsedShippingAddress = typeof shippingAddress === 'string' 
        ? JSON.parse(shippingAddress) 
        : shippingAddress;
    }

    let parsedDocuments = [];
    if (documents) {
      parsedDocuments = typeof documents === 'string' ? JSON.parse(documents) : documents;
    }

    // Convert numeric fields to numbers
    let convertedTotalWeight = null;
    if (totalWeight) {
      // Remove any units like "kg" and convert to number
      const weightStr = typeof totalWeight === 'string' ? totalWeight.replace(/[^\d.]/g, '') : totalWeight;
      convertedTotalWeight = parseFloat(weightStr) || null;
    }

    let convertedTotalPackages = null;
    if (totalPackages) {
      convertedTotalPackages = parseInt(totalPackages) || null;
    }

    // Generate dispatch number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Dispatch.countDocuments();
    const dispatchNumber = `DISP${year}${month}${(count + 1).toString().padStart(4, '0')}`;

    // Create dispatch
    const dispatch = await Dispatch.create({
      dispatchNumber,
      order,
      invoice,
      client: orderExists.client,
      dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
      estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
      items: parsedItems,
      totalWeight: convertedTotalWeight,
      totalPackages: convertedTotalPackages,
      transportDetails: parsedTransportDetails,
      shippingAddress: parsedShippingAddress,
      documents: parsedDocuments,
      createdBy: req.user.id
    });

    // Update order status
    orderExists.status = 'dispatched';
    await orderExists.save();

    res.status(201).json({
      success: true,
      message: 'Dispatch created successfully',
      data: dispatch
    });
  } catch (error) {
    console.error('Create dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all dispatches
// @route   GET /api/dispatch
// @access  Private/Admin
export const getDispatches = async (req, res) => {
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
    if (client) query.client = client;
    
    // Date range filter
    if (startDate || endDate) {
      query.dispatchDate = {};
      if (startDate) query.dispatchDate.$gte = new Date(startDate);
      if (endDate) query.dispatchDate.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { dispatchNumber: { $regex: search, $options: 'i' } },
        { 'transportDetails.vehicleNumber': { $regex: search, $options: 'i' } },
        { 'transportDetails.lrNumber': { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const dispatches = await Dispatch.find(query)
      .populate('client', 'name companyName')
      .populate('order', 'orderNumber')
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispatch.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dispatches.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: dispatches
    });
  } catch (error) {
    console.error('Get dispatches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get client's dispatches
// @route   GET /api/dispatch/client
// @access  Private/Client
export const getClientDispatches = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { client: req.user.id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const dispatches = await Dispatch.find(query)
      .populate('order', 'orderNumber')
      .populate('invoice', 'invoiceNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispatch.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dispatches.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: dispatches
    });
  } catch (error) {
    console.error('Get client dispatches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single dispatch
// @route   GET /api/dispatch/:id
// @access  Private
export const getDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('client', 'name companyName email phone address')
      .populate('order', 'orderNumber items')
      .populate('invoice', 'invoiceNumber')
      .populate('createdBy', 'name email');

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && dispatch.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this dispatch'
      });
    }

    res.status(200).json({
      success: true,
      data: dispatch
    });
  } catch (error) {
    console.error('Get dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update dispatch
// @route   PUT /api/dispatch/:id
// @access  Private/Admin
export const updateDispatch = async (req, res) => {
  try {
    let dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Parse JSON fields if present
    if (req.body.items) {
      req.body.items = typeof req.body.items === 'string' 
        ? JSON.parse(req.body.items) 
        : req.body.items;
    }
    if (req.body.transportDetails) {
      req.body.transportDetails = typeof req.body.transportDetails === 'string' 
        ? JSON.parse(req.body.transportDetails) 
        : req.body.transportDetails;
    }
    if (req.body.shippingAddress) {
      req.body.shippingAddress = typeof req.body.shippingAddress === 'string' 
        ? JSON.parse(req.body.shippingAddress) 
        : req.body.shippingAddress;
    }
    if (req.body.documents) {
      req.body.documents = typeof req.body.documents === 'string' 
        ? JSON.parse(req.body.documents) 
        : req.body.documents;
    }
    if (req.body.deliveryProof) {
      req.body.deliveryProof = typeof req.body.deliveryProof === 'string' 
        ? JSON.parse(req.body.deliveryProof) 
        : req.body.deliveryProof;
      if (req.body.deliveryProof.deliveredAt) {
        req.body.deliveryProof.deliveredAt = new Date(req.body.deliveryProof.deliveredAt);
      }
    }

    // Handle date fields
    if (req.body.dispatchDate) {
      req.body.dispatchDate = new Date(req.body.dispatchDate);
    }
    if (req.body.estimatedDeliveryDate) {
      req.body.estimatedDeliveryDate = new Date(req.body.estimatedDeliveryDate);
    }
    if (req.body.actualDeliveryDate) {
      req.body.actualDeliveryDate = new Date(req.body.actualDeliveryDate);
    }

    // Update dispatch
    dispatch = await Dispatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update order status if dispatch is delivered
    if (req.body.status === 'delivered' && dispatch.status === 'delivered') {
      await Order.findByIdAndUpdate(dispatch.order, {
        status: 'delivered',
        deliveryDate: dispatch.actualDeliveryDate || new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dispatch updated successfully',
      data: dispatch
    });
  } catch (error) {
    console.error('Update dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete dispatch
// @route   DELETE /api/dispatch/:id
// @access  Private/Admin
export const deleteDispatch = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Don't allow deleting delivered dispatches
    if (dispatch.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivered dispatch'
      });
    }

    // Update order status back to ready-for-dispatch
    await Order.findByIdAndUpdate(dispatch.order, {
      status: 'ready-for-dispatch'
    });

    await dispatch.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Dispatch deleted successfully'
    });
  } catch (error) {
    console.error('Delete dispatch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update dispatch status
// @route   PUT /api/dispatch/:id/status
// @access  Private/Admin
export const updateDispatchStatus = async (req, res) => {
  try {
    const { status, deliveryProof } = req.body;
    
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    dispatch.status = status;
    
    if (deliveryProof) {
      dispatch.deliveryProof = deliveryProof;
      if (deliveryProof.deliveredAt) {
        dispatch.deliveryProof.deliveredAt = new Date(deliveryProof.deliveredAt);
      }
      dispatch.actualDeliveryDate = dispatch.deliveryProof.deliveredAt || new Date();
    }

    await dispatch.save();

    // Update order status if delivered
    if (status === 'delivered') {
      await Order.findByIdAndUpdate(dispatch.order, {
        status: 'delivered',
        deliveryDate: dispatch.actualDeliveryDate || new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Dispatch status updated successfully',
      data: dispatch
    });
  } catch (error) {
    console.error('Update dispatch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload dispatch document
// @route   POST /api/dispatch/:id/documents
// @access  Private/Admin
export const uploadDocument = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded'
      });
    }

    const document = req.files.document;
    const documentType = req.body.documentType || 'other';

    // In production, upload to cloud storage
    // For now, create a placeholder URL
    const documentUrl = `/uploads/dispatch/${dispatch._id}/${document.name}`;

    dispatch.documents.push({
      documentType,
      documentUrl,
      uploadedAt: new Date()
    });

    await dispatch.save();

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: dispatch
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get dispatch statistics
// @route   GET /api/dispatch/stats
// @access  Private/Admin
export const getDispatchStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.dispatchDate = {};
      if (startDate) dateFilter.dispatchDate.$gte = new Date(startDate);
      if (endDate) dateFilter.dispatchDate.$lte = new Date(endDate);
    }

    // Get total dispatches
    const totalDispatches = await Dispatch.countDocuments(dateFilter);
    
    // Get dispatches by status
    const dispatchesByStatus = await Dispatch.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get total packages dispatched
    const totalPackages = await Dispatch.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$totalPackages' } } }
    ]);
    
    // Get total weight dispatched
    const totalWeight = await Dispatch.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$totalWeight' } } }
    ]);
    
    // Get delayed dispatches
    const delayedDispatches = await Dispatch.countDocuments({
      ...dateFilter,
      status: 'delayed',
      estimatedDeliveryDate: { $lt: new Date() }
    });
    
    // Get monthly dispatches
    const monthlyDispatches = await Dispatch.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $month: '$dispatchDate' },
          month: { $first: { $month: '$dispatchDate' } },
          count: { $sum: 1 },
          packages: { $sum: '$totalPackages' },
          weight: { $sum: '$totalWeight' }
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalDispatches,
        dispatchesByStatus,
        totalPackages: totalPackages[0]?.total || 0,
        totalWeight: totalWeight[0]?.total || 0,
        delayedDispatches,
        monthlyDispatches
      }
    });
  } catch (error) {
    console.error('Get dispatch stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get dispatch tracking info
// @route   GET /api/dispatch/:id/tracking
// @access  Private
export const getTrackingInfo = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .select('dispatchNumber status transportDetails estimatedDeliveryDate actualDeliveryDate');

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client') {
      const isClientDispatch = await Dispatch.exists({
        _id: req.params.id,
        client: req.user.id
      });
      
      if (!isClientDispatch) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this dispatch'
        });
      }
    }

    // Build tracking timeline
    const timeline = [
      {
        event: 'Dispatched',
        date: dispatch.dispatchDate,
        description: 'Order dispatched from warehouse',
        status: 'completed'
      }
    ];

    if (dispatch.status === 'in-transit') {
      timeline.push({
        event: 'In Transit',
        date: dispatch.dispatchDate,
        description: 'Package in transit',
        status: 'in-progress'
      });
    } else if (dispatch.status === 'delivered') {
      timeline.push({
        event: 'Delivered',
        date: dispatch.actualDeliveryDate,
        description: 'Package delivered successfully',
        status: 'completed'
      });
    } else if (dispatch.status === 'delayed') {
      timeline.push({
        event: 'Delayed',
        date: new Date(),
        description: 'Delivery delayed',
        status: 'delayed'
      });
    }

    if (dispatch.estimatedDeliveryDate) {
      timeline.push({
        event: 'Estimated Delivery',
        date: dispatch.estimatedDeliveryDate,
        description: 'Estimated delivery date',
        status: 'pending'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        dispatchNumber: dispatch.dispatchNumber,
        status: dispatch.status,
        transportDetails: dispatch.transportDetails,
        timeline
      }
    });
  } catch (error) {
    console.error('Get tracking info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate Lorry Receipt (LR) PDF
// @route   GET /api/dispatch/:id/lr
// @access  Private
export const generateLR = async (req, res) => {
  try {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate('client', 'name companyName address phone gstNumber')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'name');

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: 'Dispatch not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && dispatch.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this dispatch'
      });
    }

    // Import PDFKit
    const PDFDocument = (await import('pdfkit')).default;
    
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.contentType('application/pdf');
      res.send(pdfData);
    });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('SAI PATHIRAKALIAMMAN TEXTILE PROCESS', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Polyester Filament & Yarn Dyed Textiles', { align: 'center' });
    doc.moveDown(0.5);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text('LORRY RECEIPT (LR)', { align: 'center' });
    doc.moveDown(1);

    // LR Details
    doc.fontSize(11).font('Helvetica-Bold').text('LR Details', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`LR Number: ${dispatch.dispatchNumber}`, 50);
    doc.text(`Order Number: ${dispatch.order?.orderNumber || 'N/A'}`, 50);
    doc.text(`LR Date: ${new Date(dispatch.dispatchDate).toLocaleDateString()}`, 50);
    doc.moveDown(0.5);

    // Transport Details
    doc.fontSize(11).font('Helvetica-Bold').text('Transport Details', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Transporter: ${dispatch.transportDetails.transporter || 'N/A'}`, 50);
    doc.text(`Vehicle Number: ${dispatch.transportDetails.vehicleNumber || 'N/A'}`, 50);
    doc.text(`Driver Name: ${dispatch.transportDetails.driverName || 'N/A'}`, 50);
    doc.text(`Driver Contact: ${dispatch.transportDetails.driverContact || 'N/A'}`, 50);
    doc.text(`LR Number: ${dispatch.transportDetails.lrNumber || 'N/A'}`, 50);
    doc.moveDown(0.5);

    // Consignee Details
    doc.fontSize(11).font('Helvetica-Bold').text('Consignee (Delivery Address)', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Company: ${dispatch.client?.companyName || 'N/A'}`, 50);
    doc.text(`Contact: ${dispatch.client?.name || 'N/A'}`, 50);
    doc.text(`Address: ${dispatch.shippingAddress.street || ''}, ${dispatch.shippingAddress.city || ''}, ${dispatch.shippingAddress.state || ''} - ${dispatch.shippingAddress.pincode || ''}`, 50);
    doc.text(`Country: ${dispatch.shippingAddress.country || 'N/A'}`, 50);
    doc.text(`Phone: ${dispatch.shippingAddress.contactNumber || 'N/A'}`, 50);
    doc.moveDown(0.5);

    // Shipment Details
    doc.fontSize(11).font('Helvetica-Bold').text('Shipment Details', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Packages: ${dispatch.totalPackages || 'N/A'}`, 50);
    doc.text(`Total Weight: ${dispatch.totalWeight || 'N/A'} kg`, 50);
    doc.text(`Items Count: ${(dispatch.items || []).length}`, 50);
    doc.moveDown(0.5);

    // Items Table
    if (dispatch.items && dispatch.items.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').text('Items', { underline: true });
      
      const tableTop = doc.y;
      const itemX = 50;
      const qtyX = 300;
      const batchX = 380;

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', itemX, tableTop);
      doc.text('Qty', qtyX, tableTop);
      doc.text('Batch', batchX, tableTop);

      doc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      let itemY = tableTop + 25;
      doc.font('Helvetica');

      dispatch.items.forEach((item, idx) => {
        const itemText = `Item ${idx + 1}`;
        doc.fontSize(9).text(itemText, itemX, itemY);
        doc.text(`${item.quantity || 0}`, qtyX, itemY);
        doc.text(`${(item.batchNumbers || []).join(', ') || 'N/A'}`, batchX, itemY);
        itemY += 20;
      });

      doc.moveTo(50, itemY - 5)
        .lineTo(550, itemY - 5)
        .stroke();
    }

    doc.moveDown(1);

    // Estimated Delivery
    doc.fontSize(10).font('Helvetica');
    doc.text(`Estimated Delivery Date: ${dispatch.estimatedDeliveryDate ? new Date(dispatch.estimatedDeliveryDate).toLocaleDateString() : 'N/A'}`, 50);
    doc.text(`Status: ${dispatch.status}`, 50);

    doc.moveDown(2);

    // Footer
    doc.fontSize(9).font('Helvetica').text('This is a computer-generated document. No signature required.', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Generate LR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};