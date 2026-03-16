import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import ProductionBatch from '../models/ProductionBatch.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';
import generatePDF from '../utils/generatePDF.js';
import generateExcel from '../utils/generateExcel.js';

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private/Admin
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily', client } = req.query;
    
    const matchStage = { status: { $ne: 'cancelled' } };
    
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }
    
    if (client) matchStage.client = client;

    let groupStage;
    switch (groupBy) {
      case 'daily':
        groupStage = {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' },
            day: { $dayOfMonth: '$orderDate' }
          },
          date: { $first: '$orderDate' },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' }
        };
        break;
      case 'weekly':
        groupStage = {
          _id: {
            year: { $year: '$orderDate' },
            week: { $week: '$orderDate' }
          },
          week: { $first: { $week: '$orderDate' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' }
        };
        break;
      case 'monthly':
        groupStage = {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          month: { $first: { $month: '$orderDate' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' }
        };
        break;
      default:
        groupStage = {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' }
        };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    // Get top clients
    const topClients = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$client',
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        salesData,
        topProducts,
        topClients,
        summary: {
          totalOrders: salesData.reduce((sum, item) => sum + item.orders, 0),
          totalRevenue: salesData.reduce((sum, item) => sum + item.revenue, 0),
          averageOrderValue: salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) / salesData.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get production report
// @route   GET /api/reports/production
// @access  Private/Admin
export const getProductionReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.startDate = {};
      if (startDate) matchStage.startDate.$gte = new Date(startDate);
      if (endDate) matchStage.startDate.$lte = new Date(endDate);
    }
    
    if (status) matchStage.status = status;

    // Production statistics
    const productionStats = await ProductionBatch.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBatches: { $sum: 1 },
          totalProduced: { $sum: '$quantityProduced' },
          totalWastage: { $sum: '$wastage' },
          averageWastage: { $avg: '$wastagePercentage' },
          efficiency: { 
            $avg: { 
              $multiply: [
                { $divide: [{ $subtract: ['$quantityProduced', '$wastage'] }, '$quantityProduced'] },
                100
              ]
            }
          }
        }
      }
    ]);

    // Batches by status
    const batchesByStatus = await ProductionBatch.aggregate([
      { $match: matchStage },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly production
    const monthlyProduction = await ProductionBatch.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$startDate' },
            month: { $month: '$startDate' }
          },
          month: { $first: { $month: '$startDate' } },
          batches: { $sum: 1 },
          produced: { $sum: '$quantityProduced' },
          wastage: { $sum: '$wastage' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top products by production
    const topProducts = await ProductionBatch.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$product',
          batches: { $sum: 1 },
          produced: { $sum: '$quantityProduced' },
          wastage: { $sum: '$wastage' }
        }
      },
      { $sort: { produced: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: productionStats[0] || {
          totalBatches: 0,
          totalProduced: 0,
          totalWastage: 0,
          averageWastage: 0,
          efficiency: 0
        },
        batchesByStatus,
        monthlyProduction,
        topProducts
      }
    });
  } catch (error) {
    console.error('Get production report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private/Admin
export const getInventoryReport = async (req, res) => {
  try {
    const { category, itemType, lowStockOnly } = req.query;
    
    const matchStage = {};
    
    if (category) matchStage.category = category;
    if (itemType) matchStage.itemType = itemType;
    if (lowStockOnly === 'true') {
      matchStage.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }

    // Inventory summary
    const inventorySummary = await Inventory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          totalStock: { $sum: '$currentStock' },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$currentStock', '$minStockLevel'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$currentStock', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Inventory by category
    const inventoryByCategory = await Inventory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          stock: { $sum: '$currentStock' }
        }
      }
    ]);

    // Inventory by type
    const inventoryByType = await Inventory.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$itemType',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          stock: { $sum: '$currentStock' }
        }
      }
    ]);

    // Low stock items
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      currentStock: { $gt: 0 }
    })
      .select('itemCode itemName category currentStock minStockLevel maxStockLevel averageCost status')
      .sort('currentStock');

    // Expired items
    const expiredItems = await Inventory.find({
      expiryDate: { $lt: new Date() },
      currentStock: { $gt: 0 }
    })
      .select('itemCode itemName category expiryDate currentStock averageCost')
      .sort('expiryDate');

    res.status(200).json({
      success: true,
      data: {
        summary: inventorySummary[0] || {
          totalItems: 0,
          totalValue: 0,
          totalStock: 0,
          lowStockItems: 0,
          outOfStockItems: 0
        },
        byCategory: inventoryByCategory,
        byType: inventoryByType,
        lowStockItems,
        expiredItems
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get financial report
// @route   GET /api/reports/financial
// @access  Private/Admin
export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { paymentStatus: { $ne: 'cancelled' } };
    
    if (startDate || endDate) {
      matchStage.invoiceDate = {};
      if (startDate) matchStage.invoiceDate.$gte = new Date(startDate);
      if (endDate) matchStage.invoiceDate.$lte = new Date(endDate);
    }

    // Invoice statistics
    const invoiceStats = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalCollected: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' },
          averageCollectionPeriod: { $avg: { $subtract: ['$dueDate', '$invoiceDate'] } }
        }
      }
    ]);

    // Revenue by month
    const revenueByMonth = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          month: { $first: { $month: '$invoiceDate' } },
          billed: { $sum: '$grandTotal' },
          collected: { $sum: '$amountPaid' },
          outstanding: { $sum: '$balanceDue' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Payment status breakdown
    const paymentStatus = await Invoice.aggregate([
      { $match: matchStage },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, amount: { $sum: '$grandTotal' } } }
    ]);

    // Overdue invoices
    const overdueInvoices = await Invoice.find({
      ...matchStage,
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ['unpaid', 'partially-paid'] }
    })
      .populate('client', 'name companyName')
      .populate('order', 'orderNumber')
      .select('invoiceNumber invoiceDate dueDate grandTotal balanceDue paymentStatus')
      .sort('dueDate');

    // Collection efficiency
    const collectionEfficiency = revenueByMonth.map(month => ({
      month: month.month,
      collectionRate: month.billed > 0 ? (month.collected / month.billed) * 100 : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: invoiceStats[0] || {
          totalInvoices: 0,
          totalBilled: 0,
          totalCollected: 0,
          totalOutstanding: 0,
          averageCollectionPeriod: 0
        },
        revenueByMonth,
        paymentStatus,
        overdueInvoices,
        collectionEfficiency
      }
    });
  } catch (error) {
    console.error('Get financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get client report
// @route   GET /api/reports/client/:id
// @access  Private/Admin
export const getClientReport = async (req, res) => {
  try {
    const clientId = req.params.id;
    const { startDate, endDate } = req.query;
    
    const matchStage = { client: clientId };
    
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    // Get client details
    const client = await User.findById(clientId)
      .select('name companyName email phone address gstNumber status createdAt');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Get client orders
    const orders = await Order.find(matchStage)
      .populate('items.product', 'name')
      .select('orderNumber orderDate status grandTotal paymentStatus')
      .sort('-orderDate');

    // Get client invoices
    const invoices = await Invoice.find({ client: clientId })
      .populate('order', 'orderNumber')
      .select('invoiceNumber invoiceDate dueDate grandTotal amountPaid balanceDue paymentStatus')
      .sort('-invoiceDate');

    // Calculate statistics
    const orderStats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          averageOrderValue: { $avg: '$grandTotal' },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed']] }, 1, 0] }
          }
        }
      }
    ]);

    const invoiceStats = await Invoice.aggregate([
      { $match: { client: clientId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' },
          overdueAmount: {
            $sum: {
              $cond: [
                { $and: [
                  { $lt: ['$dueDate', new Date()] },
                  { $in: ['$paymentStatus', ['unpaid', 'partially-paid']] }
                ]},
                '$balanceDue',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get payment history
    const paymentHistory = await Invoice.find({ client: clientId, 'paymentDetails.paymentDate': { $exists: true } })
      .select('invoiceNumber paymentDetails.paymentDate paymentDetails.amount grandTotal')
      .sort('-paymentDetails.paymentDate');

    // Get order frequency
    const orderFrequency = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        client,
        statistics: {
          orders: orderStats[0] || {
            totalOrders: 0,
            totalSpent: 0,
            averageOrderValue: 0,
            pendingOrders: 0
          },
          invoices: invoiceStats[0] || {
            totalInvoices: 0,
            totalBilled: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            overdueAmount: 0
          }
        },
        orders,
        invoices,
        paymentHistory,
        orderFrequency
      }
    });
  } catch (error) {
    console.error('Get client report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate PDF report
// @route   POST /api/reports/generate-pdf
// @access  Private
export const generatePDFReport = async (req, res) => {
  try {
    const { reportType, data, filters, title } = req.body;

    let pdfBuffer;
    
    switch (reportType) {
      case 'sales':
        pdfBuffer = await generatePDF.salesReport(data, filters);
        break;
      case 'production':
        pdfBuffer = await generatePDF.productionReport(data, filters);
        break;
      case 'inventory':
        pdfBuffer = await generatePDF.inventoryReport(data, filters);
        break;
      case 'financial':
        pdfBuffer = await generatePDF.financialReport(data, filters);
        break;
      case 'client':
        pdfBuffer = await generatePDF.clientReport(data, filters);
        break;
      case 'orders':
        pdfBuffer = await generatePDF.ordersReport(data, filters);
        break;
      case 'invoices':
        pdfBuffer = await generatePDF.invoiceReport(data, filters);
        break;
      case 'invoice':
        pdfBuffer = await generatePDF.invoice(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate Excel report
// @route   POST /api/reports/generate-excel
// @access  Private
export const generateExcelReport = async (req, res) => {
  try {
    const { reportType, data: incomingData, filters, title } = req.body;

    // Normalize incoming data to a safe shape expected by Excel generators
    let dataObj = incomingData || {};
    try {
      if (reportType === 'orders') {
        if (Array.isArray(incomingData)) {
          dataObj = {
            orders: incomingData,
            totalOrders: incomingData.length,
            totalSpent: incomingData.reduce((s, o) => s + (o.grandTotal || o.totalAmount || o.total || 0), 0)
          };
        } else {
          dataObj = incomingData || {};
        }
      }
    } catch (normalizeErr) {
      console.warn('Failed to normalize incoming report data:', normalizeErr);
      dataObj = incomingData || {};
    }

    console.log('Generate Excel request:', { reportType, hasData: !!incomingData, ordersCount: dataObj && (dataObj.orders ? dataObj.orders.length : (Array.isArray(dataObj) ? dataObj.length : undefined)) });

    let excelBuffer;
    try {
      switch (reportType) {
        case 'sales':
          excelBuffer = await generateExcel.salesReport(dataObj, filters);
          break;
        case 'production':
          excelBuffer = await generateExcel.productionReport(dataObj, filters);
          break;
        case 'inventory':
          excelBuffer = await generateExcel.inventoryReport(dataObj, filters);
          break;
        case 'financial':
          excelBuffer = await generateExcel.financialReport(dataObj, filters);
          break;
        case 'client':
          excelBuffer = await generateExcel.clientReport(dataObj, filters);
          break;
        case 'orders':
          excelBuffer = await generateExcel.ordersReport(dataObj, filters);
          break;
        case 'invoices':
          excelBuffer = await generateExcel.invoicesReport(dataObj, filters);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid report type'
          });
      }
    } catch (genErr) {
      console.error(`Excel generator error for type=${reportType}:`, genErr.stack || genErr);
      console.error('Incoming data preview:', {
        hasOrders: !!dataObj && (Array.isArray(dataObj.orders) ? dataObj.orders.length : undefined),
        keys: dataObj && typeof dataObj === 'object' ? Object.keys(dataObj) : typeof dataObj
      });
      throw genErr;
    }
    

    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Generate Excel report error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? error.message : (error.stack || error.message)
    });
  }
};

// @desc    Get client reports (for client dashboard)
// @route   GET /api/reports/client
// @access  Private/Client
export const getClientReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { client: req.user.id };
    
    if (startDate || endDate) {
      matchStage.orderDate = {};
      if (startDate) matchStage.orderDate.$gte = new Date(startDate);
      if (endDate) matchStage.orderDate.$lte = new Date(endDate);
    }

    // Get order summary
    const orderSummary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$grandTotal' },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed']] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get invoice summary
    const invoiceSummary = await Invoice.aggregate([
      { $match: { client: req.user.id } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalBilled: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalOutstanding: { $sum: '$balanceDue' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find(matchStage)
      .select('orderNumber orderDate status grandTotal items')
      .populate('items.product', 'name')
      .sort('-orderDate')
      .limit(5);

    // Get recent invoices
    const recentInvoices = await Invoice.find({ client: req.user.id })
      .select('invoiceNumber invoiceDate dueDate grandTotal balanceDue paymentStatus')
      .sort('-invoiceDate')
      .limit(5);

    // Get monthly spending
    const monthlySpending = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          month: { $first: { $month: '$orderDate' } },
          orders: { $sum: 1 },
          spending: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orderSummary: orderSummary[0] || {
          totalOrders: 0,
          totalSpent: 0,
          pendingOrders: 0,
          deliveredOrders: 0
        },
        invoiceSummary: invoiceSummary[0] || {
          totalInvoices: 0,
          totalBilled: 0,
          totalPaid: 0,
          totalOutstanding: 0
        },
        recentOrders,
        recentInvoices,
        monthlySpending
      }
    });
  } catch (error) {
    console.error('Get client reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get today's orders
    const todaysOrders = await Order.countDocuments({
      orderDate: {
        $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      }
    });

    // Get monthly orders
    const monthlyOrders = await Order.countDocuments({
      orderDate: { $gte: startOfMonth }
    });

    // Get yearly orders
    const yearlyOrders = await Order.countDocuments({
      orderDate: { $gte: startOfYear }
    });

    // Get today's revenue
    const todaysRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
            $lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
          },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Get monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: startOfMonth },
          status: { $ne: 'cancelled' }
        }
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    // Get pending orders
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending', 'confirmed'] }
    });

    // Get in-production orders
    const inProductionOrders = await Order.countDocuments({
      status: 'in-production'
    });

    // Get low stock items
    const lowStockItems = await Inventory.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      currentStock: { $gt: 0 }
    });

    // Get overdue invoices
    const overdueInvoices = await Invoice.countDocuments({
      dueDate: { $lt: new Date() },
      paymentStatus: { $in: ['unpaid', 'partially-paid'] }
    });

    // Get active clients
    const activeClients = await User.countDocuments({
      role: 'client',
      status: 'active'
    });

    // Get recent orders for activity feed
    const recentActivity = await Order.find()
      .populate('client', 'name companyName')
      .select('orderNumber client status orderDate grandTotal')
      .sort('-createdAt')
      .limit(5);

    // Get sales trend (last 6 months)
    const salesTrend = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(today.getFullYear(), today.getMonth() - 6, 1)
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
          },
          month: { $first: { $month: '$orderDate' } },
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        quickStats: {
          todaysOrders,
          monthlyOrders,
          yearlyOrders,
          todaysRevenue: todaysRevenue[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0,
          pendingOrders,
          inProductionOrders,
          lowStockItems,
          overdueInvoices,
          activeClients
        },
        recentActivity,
        salesTrend
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};