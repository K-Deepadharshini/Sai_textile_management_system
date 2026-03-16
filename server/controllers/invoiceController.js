import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import generatePDF from '../utils/generatePDF.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private/Admin
export const createInvoice = async (req, res) => {
  try {
    const { orderId, shippingCharges, discount, paymentTerms, dueDate } = req.body;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    console.log('Creating invoice for order:', orderId);

    // Get order
    const order = await Order.findById(orderId);
    console.log('Order found:', order ? 'Yes' : 'No', order?._id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Populate client and products separately with error handling
    await order.populate('client', 'name companyName email phone address gstNumber');
    console.log('Order client populated:', order.client ? 'Yes' : 'No');

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order has no items. Cannot create invoice.'
      });
    }

    // Populate products in items
    try {
      await order.populate('items.product', 'name productCode unit');
    } catch (popErr) {
      console.warn('Product population warning:', popErr.message);
      // Continue anyway
    }

    console.log('Order items count:', order.items.length);

    // Validate order client exists
    if (!order.client) {
      return res.status(400).json({
        success: false,
        message: 'Order client information is missing'
      });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this order'
      });
    }

    // Prepare invoice items from order items
    const invoiceItems = order.items.map(item => {
      const product = item.product || {};
      return {
        description: `${product.name || 'Unknown Product'} (${product.productCode || 'N/A'})`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: (item.quantity || 1) * (item.unitPrice || 0),
        gstPercentage: item.gstPercentage || 18,
        gstAmount: ((item.quantity || 1) * (item.unitPrice || 0) * (item.gstPercentage || 18)) / 100,
        total: ((item.quantity || 1) * (item.unitPrice || 0)) + (((item.quantity || 1) * (item.unitPrice || 0) * (item.gstPercentage || 18)) / 100)
      };
    });

    console.log('Invoice items prepared count:', invoiceItems.length);

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const gstAmount = invoiceItems.reduce((sum, item) => sum + item.gstAmount, 0);
    const grandTotal = subtotal + gstAmount + (parseFloat(shippingCharges) || 0) - (parseFloat(discount) || 0);

    console.log('Totals calculated:', { subtotal, gstAmount, grandTotal });

    // Create invoice
    const invoice = await Invoice.create({
      order: orderId,
      client: order.client._id,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: invoiceItems,
      subtotal,
      gstAmount,
      shippingCharges: parseFloat(shippingCharges) || 0,
      discount: parseFloat(discount) || 0,
      grandTotal,
      balanceDue: grandTotal,
      paymentTerms: paymentTerms || 'net-15',
      amountPaid: 0,
      createdBy: req.user.id
    });

    console.log('Invoice created:', invoice._id, invoice.invoiceNumber);

    // Update order payment status (use valid enum value from Order model)
    order.paymentStatus = 'pending';
    await order.save();

    console.log('Order updated with payment status');

    // Try to generate PDF, but don't fail if it errors
    try {
      const pdfBuffer = await generatePDF.invoice(invoice, order);
      invoice.pdfUrl = `/api/invoices/${invoice._id}/download`;
      await invoice.save();
      console.log('PDF generated and saved');
    } catch (pdfError) {
      console.warn('PDF generation warning (not critical):', pdfError.message);
      // Continue even if PDF fails
    }

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private/Admin
export const getInvoices = async (req, res) => {
  try {
    const { 
      status, 
      client, 
      order,
      startDate, 
      endDate, 
      search,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (status) query.paymentStatus = status;
    if (order) query.order = order;
    
    // Date range filter
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'client.companyName': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (client) query.client = client;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .populate('client', 'name companyName email')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: invoices
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get client's invoices
// @route   GET /api/invoices/client
// @access  Private/Client
export const getClientInvoices = async (req, res) => {
  try {
    const { status, order, page = 1, limit = 10 } = req.query;

    let query = { client: req.user.id };
    if (status) query.paymentStatus = status;
    if (order) query.order = order;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const invoices = await Invoice.find(query)
      .populate('order', 'orderNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(query);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: invoices
    });
  } catch (error) {
    console.error('Get client invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name companyName email phone address gstNumber')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && invoice.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this invoice'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private/Admin
export const updateInvoice = async (req, res) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Don't allow updating paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid invoice'
      });
    }

    // Handle date field
    if (req.body.dueDate) {
      req.body.dueDate = new Date(req.body.dueDate);
    }

    // Recalculate totals if items are updated
    if (req.body.items) {
      const items = typeof req.body.items === 'string' 
        ? JSON.parse(req.body.items) 
        : req.body.items;
      
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const gstAmount = items.reduce((sum, item) => 
        sum + ((item.quantity * item.unitPrice * item.gstPercentage) / 100), 0);
      
      req.body.subtotal = subtotal;
      req.body.gstAmount = gstAmount;
      req.body.grandTotal = subtotal + gstAmount + 
        (parseFloat(req.body.shippingCharges) || invoice.shippingCharges) - 
        (parseFloat(req.body.discount) || invoice.discount);
      req.body.balanceDue = req.body.grandTotal - (invoice.amountPaid || 0);
    } else {
      // Recalculate if shipping or discount changed
      if (req.body.shippingCharges !== undefined || req.body.discount !== undefined) {
        const shipping = parseFloat(req.body.shippingCharges) || invoice.shippingCharges;
        const discount = parseFloat(req.body.discount) || invoice.discount;
        req.body.grandTotal = invoice.subtotal + invoice.gstAmount + shipping - discount;
        req.body.balanceDue = req.body.grandTotal - (invoice.amountPaid || 0);
      }
    }

    // Update invoice
    invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Don't allow deleting paid invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid invoice'
      });
    }

    // Update order payment status
    await Order.findByIdAndUpdate(invoice.order, {
      paymentStatus: 'pending'
    });

    await invoice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Record payment
// @route   POST /api/invoices/:id/payment
// @access  Private
export const recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, bankName, chequeNumber, remarks } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization for clients (handle populated or raw ObjectId)
    const invoiceClientId = invoice.client && invoice.client._id ? invoice.client._id.toString() : (invoice.client ? invoice.client.toString() : null);
    if (req.user.role === 'client' && invoiceClientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to record payment for this invoice'
      });
    }

    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    // Update invoice
    invoice.amountPaid = (invoice.amountPaid || 0) + paymentAmount;
    invoice.balanceDue = invoice.grandTotal - invoice.amountPaid;
    
    // Update payment status
    if (invoice.amountPaid >= invoice.grandTotal) {
      invoice.paymentStatus = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.paymentStatus = 'partially-paid';
    }
    
    // Update payment details
    invoice.paymentMethod = paymentMethod;
    invoice.paymentDetails = {
      transactionId,
      paymentDate: new Date(),
      bankName,
      chequeNumber,
      remarks
    };

    await invoice.save();

    // Update order payment status
    await Order.findByIdAndUpdate(invoice.order, {
      paymentStatus: invoice.paymentStatus
    });

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Download invoice PDF
// @route   GET /api/invoices/:id/download
// @access  Private
export const downloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name companyName email phone address gstNumber')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'name email companyName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && invoice.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this invoice'
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF.invoice(invoice);

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send invoice via email
// @route   POST /api/invoices/:id/send
// @access  Private/Admin
export const sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name companyName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF.invoice(invoice);

    // Send email
    const message = `
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear ${invoice.client.name},</p>
      <p>Please find attached your invoice for order ${invoice.order?.orderNumber || 'N/A'}.</p>
      <p><strong>Invoice Details:</strong></p>
      <ul>
        <li>Invoice Number: ${invoice.invoiceNumber}</li>
        <li>Date: ${invoice.invoiceDate.toLocaleDateString()}</li>
        <li>Due Date: ${invoice.dueDate.toLocaleDateString()}</li>
        <li>Amount: ₹${invoice.grandTotal.toFixed(2)}</li>
        <li>Status: ${invoice.paymentStatus}</li>
      </ul>
      <p>Please make payment by the due date.</p>
      <p>Thank you for your business!</p>
      <p>Best regards,<br>Sai Pathirakaliamman Textile Process</p>
    `;

    await sendEmail({
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoiceNumber} - Sai Pathirakaliamman Textile Process`,
      html: message,
      attachments: [{
        filename: `invoice_${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send payment reminder
// @route   POST /api/invoices/:id/remind
// @access  Private
export const sendReminder = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client', 'name companyName email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check authorization
    if (req.user.role === 'client' && invoice.client._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send reminder for this invoice'
      });
    }

    // Only send for unpaid/overdue invoices
    if (invoice.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    const isOverdue = invoice.dueDate < new Date();
    
    const message = `
      <h2>${isOverdue ? 'Overdue' : 'Payment'} Reminder - Invoice ${invoice.invoiceNumber}</h2>
      <p>Dear ${invoice.client.name},</p>
      <p>This is a reminder for your ${isOverdue ? 'overdue' : 'pending'} invoice.</p>
      <p><strong>Invoice Details:</strong></p>
      <ul>
        <li>Invoice Number: ${invoice.invoiceNumber}</li>
        <li>Date: ${invoice.invoiceDate.toLocaleDateString()}</li>
        <li>Due Date: ${invoice.dueDate.toLocaleDateString()}</li>
        <li>Amount Due: ₹${invoice.balanceDue.toFixed(2)}</li>
        <li>Original Amount: ₹${invoice.grandTotal.toFixed(2)}</li>
        <li>Amount Paid: ₹${invoice.amountPaid.toFixed(2)}</li>
      </ul>
      ${isOverdue ? 
        '<p style="color: #d32f2f; font-weight: bold;">This invoice is overdue. Please make immediate payment.</p>' : 
        '<p>Please make payment by the due date.</p>'}
      <p>Thank you for your prompt attention to this matter.</p>
      <p>Best regards,<br>Sai Pathirakaliamman Textile Process</p>
    `;

    await sendEmail({
      to: invoice.client.email,
      subject: `${isOverdue ? 'Overdue' : 'Payment'} Reminder - Invoice ${invoice.invoiceNumber}`,
      html: message
    });

    res.status(200).json({
      success: true,
      message: 'Payment reminder sent successfully'
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats
// @access  Private
export const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.invoiceDate = {};
      if (startDate) dateFilter.invoiceDate.$gte = new Date(startDate);
      if (endDate) dateFilter.invoiceDate.$lte = new Date(endDate);
    }

    // Role-based filtering
    if (req.user.role === 'client') {
      dateFilter.client = req.user.id;
    }

    // Get total invoices
    const totalInvoices = await Invoice.countDocuments(dateFilter);
    
    // Get invoices by status
    const invoicesByStatus = await Invoice.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);
    
    // Get total revenue
    const totalRevenue = await Invoice.aggregate([
      { $match: { ...dateFilter, paymentStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    
    // Get total collected
    const totalCollected = await Invoice.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } }
    ]);
    
    // Get total outstanding
    const totalOutstanding = await Invoice.aggregate([
      { $match: { ...dateFilter, paymentStatus: { $in: ['unpaid', 'partially-paid', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$balanceDue' } } }
    ]);
    
    // Get overdue invoices
    const overdueInvoices = await Invoice.countDocuments({
      ...dateFilter,
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ['unpaid', 'partially-paid'] }
    });
    
    // Get monthly revenue
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { ...dateFilter, paymentStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $month: '$invoiceDate' },
          month: { $first: { $month: '$invoiceDate' } },
          revenue: { $sum: '$grandTotal' },
          collected: { $sum: '$amountPaid' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        invoicesByStatus,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCollected: totalCollected[0]?.total || 0,
        totalOutstanding: totalOutstanding[0]?.total || 0,
        overdueInvoices,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get overdue invoices
// @route   GET /api/invoices/overdue
// @access  Private/Admin
export const getOverdueInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ['unpaid', 'partially-paid'] }
    })
      .populate('client', 'name companyName email phone')
      .populate('order', 'orderNumber')
      .sort('dueDate');

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    console.error('Get overdue invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};       