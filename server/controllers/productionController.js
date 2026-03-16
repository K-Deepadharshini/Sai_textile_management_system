import ProductionBatch from '../models/ProductionBatch.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Create new production batch
// @route   POST /api/production
// @access  Private/Admin
export const createProductionBatch = async (req, res) => {
  try {
    console.log('📝 Received batch creation request:', req.body);
    console.log('👤 User creating batch:', req.user);
   
    const {
      product,
      rawMaterialUsed,
      quantityProduced,
      machineDetails,
      dyeingDetails,
      startDate,
      endDate,
      wastage,
      assignedTo,
      order,
      notes
    } = req.body;

    // Validate required fields
    if (!product) {
      return res.status(400).json({
        success: false,
        message: 'Product is required'
      });
    }

    if (!quantityProduced) {
      return res.status(400).json({
        success: false,
        message: 'Quantity produced is required'
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required'
      });
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if order exists if provided
    if (order) {
      const orderExists = await Order.findById(order);
      if (!orderExists) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }
    }

    // Parse and validate numeric fields
    const parsedQuantityProduced = typeof quantityProduced === 'string'
      ? parseFloat(quantityProduced)
      : quantityProduced;
   
    const parsedWastage = wastage
      ? (typeof wastage === 'string' ? parseFloat(wastage) : wastage)
      : 0;

    if (isNaN(parsedQuantityProduced) || parsedQuantityProduced <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity produced must be a valid positive number'
      });
    }

    if (isNaN(parsedWastage) || parsedWastage < 0) {
      return res.status(400).json({
        success: false,
        message: 'Wastage must be a valid non-negative number'
      });
    }

    // Parse JSON fields
    let parsedRawMaterials = [];
    if (rawMaterialUsed) {
      try {
        const raw = typeof rawMaterialUsed === 'string'
          ? JSON.parse(rawMaterialUsed)
          : rawMaterialUsed;
        parsedRawMaterials = Array.isArray(raw) ? raw : [];
      } catch (parseErr) {
        console.warn('⚠️  Could not parse rawMaterialUsed:', parseErr.message);
        parsedRawMaterials = [];
      }
    }

    let parsedMachineDetails = {};
    if (machineDetails) {
      try {
        const machine = typeof machineDetails === 'string'
          ? JSON.parse(machineDetails)
          : machineDetails;
        parsedMachineDetails = machine || {};
      } catch (parseErr) {
        console.warn('⚠️  Could not parse machineDetails:', parseErr.message);
        parsedMachineDetails = {};
      }
    }

    let parsedDyeingDetails = {};
    if (dyeingDetails) {
      try {
        const dye = typeof dyeingDetails === 'string'
          ? JSON.parse(dyeingDetails)
          : dyeingDetails;
        parsedDyeingDetails = dye || {};
       
        if (parsedDyeingDetails.dyeingDate && parsedDyeingDetails.dyeingDate !== '') {
          parsedDyeingDetails.dyeingDate = new Date(parsedDyeingDetails.dyeingDate);
        } else {
          delete parsedDyeingDetails.dyeingDate;
        }
      } catch (parseErr) {
        console.warn('⚠️  Could not parse dyeingDetails:', parseErr.message);
        parsedDyeingDetails = {};
      }
    }

    // Create production batch
    const batchData = {
      product,
      rawMaterialUsed: parsedRawMaterials,
      quantityProduced: parsedQuantityProduced,
      unit: productExists.unit || 'kg',
      machineDetails: parsedMachineDetails,
      dyeingDetails: parsedDyeingDetails,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      wastage: parsedWastage,
      assignedTo,
      order,
      notes: notes || '',
      createdBy: req.user.id
    };

    console.log('✅ Creating batch with data:', batchData);

    const productionBatch = await ProductionBatch.create(batchData);

    // Calculate wastage percentage
    if (parsedWastage > 0 && parsedQuantityProduced > 0) {
      productionBatch.wastagePercentage = (parsedWastage / parsedQuantityProduced) * 100;
      await productionBatch.save();
    }

    // If order is provided, update order status
    if (order) {
      await Order.findByIdAndUpdate(order, {
        status: 'in-production',
        $addToSet: { productionBatches: productionBatch._id }
      });
    }

    console.log('✅ Batch created successfully:', productionBatch._id);

    res.status(201).json({
      success: true,
      message: 'Production batch created successfully',
      data: productionBatch
    });
  } catch (error) {
    console.error('❌ Create production batch error:', error);
   
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const key in error.errors) {
        errors[key] = error.errors[key].message;
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Handle duplicate batch number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Batch number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all production batches
// @route   GET /api/production
// @access  Private/Admin
export const getProductionBatches = async (req, res) => {
  try {
    const { status, product, startDate, endDate, page = 1, limit = 50 } = req.query;
   
    // Build query
    let query = {};
   
    if (status && status !== 'all') query.status = status;
    if (product) query.product = product;
   
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
   
    const batches = await ProductionBatch.find(query)
      .populate('product', 'name productCode unit')
      .populate('order', 'orderNumber')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ProductionBatch.countDocuments(query);

    res.status(200).json({
      success: true,
      count: batches.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: batches
    });
  } catch (error) {
    console.error('Get production batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single production batch
// @route   GET /api/production/:id
// @access  Private
export const getProductionBatch = async (req, res) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id)
      .populate('product', 'name productCode type denier shade specifications unit')
      .populate('order', 'orderNumber client items')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Get production batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update production batch status
// @route   PUT /api/production/:id/status
// @access  Private/Admin
export const updateBatchStatus = async (req, res) => {
  try {
    const { status, qualityCheck } = req.body;
   
    const batch = await ProductionBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Validate status
    const validStatuses = ['planned', 'in-progress', 'completed', 'quality-check', 'dispatched'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    batch.status = status;
   
    if (qualityCheck) {
      batch.qualityCheck = qualityCheck;
      if (qualityCheck.checkDate) {
        batch.qualityCheck.checkDate = new Date(qualityCheck.checkDate);
      }
    }

    // If status is completed, update product stock
    if (status === 'completed' && batch.status !== 'completed') {
      const product = await Product.findById(batch.product);
      if (product) {
        const netQuantity = batch.quantityProduced - batch.wastage;
        product.stockQuantity += netQuantity;
       
        // Update product status if needed
        if (product.stockQuantity <= 0) {
          product.status = 'out-of-stock';
        } else if (product.stockQuantity <= product.minStockLevel) {
          product.status = 'low-stock';
        } else {
          product.status = 'available';
        }
       
        await product.save();
      }

      // Update order status if batch is linked to an order
      if (batch.order) {
        const order = await Order.findById(batch.order);
        if (order) {
          // Check if all production batches for this order are completed
          const allBatches = await ProductionBatch.find({ order: batch.order });
          const allCompleted = allBatches.every(b => b.status === 'completed');
         
          if (allCompleted) {
            order.status = 'quality-check';
            await order.save();
          }
        }
      }
    }

    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Production batch status updated successfully',
      data: batch
    });
  } catch (error) {
    console.error('Update batch status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update production batch
// @route   PUT /api/production/:id
// @access  Private/Admin
export const updateProductionBatch = async (req, res) => {
  try {
    let batch = await ProductionBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Parse JSON fields if present
    if (req.body.rawMaterialUsed) {
      try {
        req.body.rawMaterialUsed = typeof req.body.rawMaterialUsed === 'string' 
          ? JSON.parse(req.body.rawMaterialUsed) 
          : req.body.rawMaterialUsed;
      } catch (error) {
        console.warn('Could not parse rawMaterialUsed:', error.message);
      }
    }
    
    if (req.body.machineDetails) {
      try {
        req.body.machineDetails = typeof req.body.machineDetails === 'string'
          ? JSON.parse(req.body.machineDetails)
          : req.body.machineDetails;
      } catch (error) {
        console.warn('Could not parse machineDetails:', error.message);
      }
    }
    
    if (req.body.dyeingDetails) {
      try {
        req.body.dyeingDetails = typeof req.body.dyeingDetails === 'string'
          ? JSON.parse(req.body.dyeingDetails)
          : req.body.dyeingDetails;
        if (req.body.dyeingDetails.dyeingDate) {
          req.body.dyeingDetails.dyeingDate = new Date(req.body.dyeingDetails.dyeingDate);
        }
      } catch (error) {
        console.warn('Could not parse dyeingDetails:', error.message);
      }
    }
    
    if (req.body.qualityCheck) {
      try {
        req.body.qualityCheck = typeof req.body.qualityCheck === 'string'
          ? JSON.parse(req.body.qualityCheck)
          : req.body.qualityCheck;
        if (req.body.qualityCheck.checkDate) {
          req.body.qualityCheck.checkDate = new Date(req.body.qualityCheck.checkDate);
        }
      } catch (error) {
        console.warn('Could not parse qualityCheck:', error.message);
      }
    }

    // Handle date fields
    if (req.body.startDate) {
      req.body.startDate = new Date(req.body.startDate);
    }
    if (req.body.endDate) {
      req.body.endDate = new Date(req.body.endDate);
    }

    // Calculate wastage percentage if wastage or quantityProduced is updated
    if (req.body.wastage !== undefined || req.body.quantityProduced !== undefined) {
      const wastage = req.body.wastage !== undefined ? parseFloat(req.body.wastage) : batch.wastage;
      const quantityProduced = req.body.quantityProduced !== undefined ? parseFloat(req.body.quantityProduced) : batch.quantityProduced;
     
      if (quantityProduced > 0) {
        req.body.wastagePercentage = (wastage / quantityProduced) * 100;
      }
    }

    // Update the batch
    batch = await ProductionBatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Production batch updated successfully',
      data: batch
    });
  } catch (error) {
    console.error('Update production batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete production batch
// @route   DELETE /api/production/:id
// @access  Private/Admin
export const deleteProductionBatch = async (req, res) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Production batch not found'
      });
    }

    // Don't allow deleting completed batches
    if (batch.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed production batch'
      });
    }

    // Remove batch reference from order if exists
    if (batch.order) {
      await Order.findByIdAndUpdate(batch.order, {
        $pull: { productionBatches: batch._id }
      });
    }

    await batch.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Production batch deleted successfully'
    });
  } catch (error) {
    console.error('Delete production batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get production statistics
// @route   GET /api/production/stats
// @access  Private/Admin
export const getProductionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
   
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.startDate = {};
      if (startDate) dateFilter.startDate.$gte = new Date(startDate);
      if (endDate) dateFilter.startDate.$lte = new Date(endDate);
    }

    // Get total batches
    const totalBatches = await ProductionBatch.countDocuments(dateFilter);
   
    // Get completed batches
    const completedBatches = await ProductionBatch.countDocuments({
      ...dateFilter,
      status: 'completed'
    });
   
    // Get in-progress batches
    const inProgressBatches = await ProductionBatch.countDocuments({
      ...dateFilter,
      status: 'in-progress'
    });
   
    // Get total quantity produced
    const totalProduced = await ProductionBatch.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$quantityProduced' } } }
    ]);
   
    // Get total wastage
    const totalWastage = await ProductionBatch.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$wastage' } } }
    ]);
   
    // Get batches by status
    const batchesByStatus = await ProductionBatch.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
   
    // Get monthly production data
    const monthlyData = await ProductionBatch.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: { $month: '$startDate' },
          month: { $first: { $month: '$startDate' } },
          totalProduced: { $sum: '$quantityProduced' },
          totalWastage: { $sum: '$wastage' },
          batchCount: { $sum: 1 }
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBatches,
        completedBatches,
        inProgressBatches,
        totalQuantityProduced: totalProduced[0]?.total || 0,
        totalWastage: totalWastage[0]?.total || 0,
        batchesByStatus,
        monthlyData
      }
    });
  } catch (error) {
    console.error('Get production stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get production batches by order
// @route   GET /api/production/order/:orderId
// @access  Private
export const getBatchesByOrder = async (req, res) => {
  try {
    const batches = await ProductionBatch.find({ order: req.params.orderId })
      .populate('product', 'name productCode')
      .populate('assignedTo', 'name')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    console.error('Get batches by order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};