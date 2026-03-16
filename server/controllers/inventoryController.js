import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private/Admin
export const createInventoryItem = async (req, res) => {
  try {
    const {
      itemName,
      itemType,
      category,
      unit,
      currentStock,
      minStockLevel,
      maxStockLevel,
      reorderPoint,
      averageCost,
      supplierDetails,
      location,
      batchNumber,
      expiryDate,
      notes
    } = req.body;

    // Generate item code
    const prefix = itemType === 'raw-material' ? 'RM' : 
                   itemType === 'finished-goods' ? 'FG' :
                   itemType === 'consumables' ? 'CON' : 'CHEM';
    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Inventory.countDocuments();
    const itemCode = `${prefix}${year}${month}${(count + 1).toString().padStart(4, '0')}`;

    // Parse nested fields - handle both JSON strings and objects
    let parsedSupplierDetails = {};
    if (supplierDetails) {
      try {
        parsedSupplierDetails = typeof supplierDetails === 'string' 
          ? JSON.parse(supplierDetails) 
          : (supplierDetails || {});
      } catch (e) {
        console.warn('Could not parse supplierDetails:', e.message);
        parsedSupplierDetails = typeof supplierDetails === 'object' ? supplierDetails : {};
      }
    }

    let parsedLocation = {};
    if (location) {
      try {
        parsedLocation = typeof location === 'string'
          ? JSON.parse(location)
          : (location || {});
      } catch (e) {
        console.warn('Could not parse location:', e.message);
        parsedLocation = typeof location === 'object' ? location : {};
      }
    }

    let parsedLastPurchase = {};
    if (req.body.lastPurchase) {
      try {
        parsedLastPurchase = typeof req.body.lastPurchase === 'string'
          ? JSON.parse(req.body.lastPurchase)
          : (req.body.lastPurchase || {});
        if (parsedLastPurchase.date) {
          parsedLastPurchase.date = new Date(parsedLastPurchase.date);
        }
      } catch (e) {
        console.warn('Could not parse lastPurchase:', e.message);
        parsedLastPurchase = {};
      }
    }

    // Create inventory item
    const inventoryItem = await Inventory.create({
      itemCode,
      itemName,
      itemType,
      category,
      unit,
      currentStock: currentStock || 0,
      minStockLevel: minStockLevel || 50,
      maxStockLevel: maxStockLevel || 1000,
      reorderPoint: reorderPoint || 100,
      averageCost: averageCost || 0,
      supplierDetails: parsedSupplierDetails,
      lastPurchase: parsedLastPurchase,
      location: parsedLocation,
      batchNumber,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      notes,
      status: currentStock <= 0 ? 'out-of-stock' : 
              currentStock <= (minStockLevel || 50) ? 'low-stock' : 'in-stock'
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventoryItem
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private/Admin
export const getInventoryItems = async (req, res) => {
  try {
    const { 
      itemType, 
      category, 
      status, 
      search, 
      lowStock = false,
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (itemType) query.itemType = itemType;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$minStockLevel'] };
    }
    
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const items = await Inventory.find(query)
      .sort('-updatedAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Inventory.countDocuments(query);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: items
    });
  } catch (error) {
    console.error('Get inventory items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private/Admin
export const getInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventoryItem = async (req, res) => {
  try {
    let item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Parse JSON fields if present - handle both string and object formats
    if (req.body.supplierDetails) {
      try {
        req.body.supplierDetails = typeof req.body.supplierDetails === 'string'
          ? JSON.parse(req.body.supplierDetails)
          : req.body.supplierDetails;
      } catch (e) {
        console.warn('Could not parse supplierDetails:', e.message);
      }
    }
    if (req.body.location) {
      try {
        req.body.location = typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;
      } catch (e) {
        console.warn('Could not parse location:', e.message);
      }
    }
    if (req.body.lastPurchase) {
      try {
        req.body.lastPurchase = typeof req.body.lastPurchase === 'string'
          ? JSON.parse(req.body.lastPurchase)
          : req.body.lastPurchase;
        if (req.body.lastPurchase.date) {
          req.body.lastPurchase.date = new Date(req.body.lastPurchase.date);
        }
      } catch (e) {
        console.warn('Could not parse lastPurchase:', e.message);
      }
    }

    // Handle date field
    if (req.body.expiryDate) {
      req.body.expiryDate = new Date(req.body.expiryDate);
    }

    // Update average cost if price is provided in lastPurchase
    if (req.body.lastPurchase && req.body.lastPurchase.price && req.body.lastPurchase.quantity) {
      const newPrice = parseFloat(req.body.lastPurchase.price);
      const newQuantity = parseFloat(req.body.lastPurchase.quantity);
      const oldQuantity = item.currentStock - newQuantity;
      const oldCost = item.averageCost * oldQuantity;
      const newCost = newPrice * newQuantity;
      
      req.body.averageCost = (oldCost + newCost) / item.currentStock;
    }

    // Update the item
    item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Don't allow deleting items with stock
    if (item.currentStock > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete inventory item with stock. Please clear stock first.'
      });
    }

    await item.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update inventory stock
// @route   PUT /api/inventory/:id/stock
// @access  Private/Admin
export const updateInventoryStock = async (req, res) => {
  try {
    const { quantity, type, price, supplier, notes } = req.body; // type: 'add' or 'subtract'
    
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    if (type === 'add') {
      const oldQuantity = item.currentStock;
      const newQuantity = oldQuantity + parseInt(quantity);
      
      // Update average cost
      if (price) {
        const oldCost = item.averageCost * oldQuantity;
        const newCost = parseFloat(price) * parseInt(quantity);
        item.averageCost = (oldCost + newCost) / newQuantity;
      }
      
      item.currentStock = newQuantity;
      
      // Update last purchase
      if (price && supplier) {
        item.lastPurchase = {
          date: new Date(),
          quantity: parseInt(quantity),
          price: parseFloat(price),
          supplier
        };
      }
    } else if (type === 'subtract') {
      if (item.currentStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      item.currentStock -= parseInt(quantity);
      
      // Update notes if provided
      if (notes) {
        item.notes = item.notes ? `${item.notes}\n${notes}` : notes;
      }
    }

    // Update status based on stock
    if (item.currentStock <= 0) {
      item.status = 'out-of-stock';
    } else if (item.currentStock <= item.minStockLevel) {
      item.status = 'low-stock';
    } else {
      item.status = 'in-stock';
    }

    // Check expiry
    if (item.expiryDate && new Date() > item.expiryDate) {
      item.status = 'expired';
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Inventory stock updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update inventory stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private/Admin
export const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      status: { $ne: 'expired' }
    }).sort('currentStock');

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get expired items
// @route   GET /api/inventory/expired
// @access  Private/Admin
export const getExpiredItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      expiryDate: { $lt: new Date() },
      currentStock: { $gt: 0 }
    }).sort('expiryDate');

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Get expired items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private/Admin
export const getInventoryStats = async (req, res) => {
  try {
    // Total items
    const totalItems = await Inventory.countDocuments();
    
    // Items by type
    const itemsByType = await Inventory.aggregate([
      { $group: { _id: '$itemType', count: { $sum: 1 } } }
    ]);
    
    // Items by status
    const itemsByStatus = await Inventory.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Total inventory value
    const inventoryValue = await Inventory.aggregate([
      { $match: { status: { $ne: 'expired' } } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$averageCost'] } } } }
    ]);
    
    // Low stock items count
    const lowStockCount = await Inventory.countDocuments({
      $expr: { $lte: ['$currentStock', '$minStockLevel'] },
      status: { $ne: 'expired' }
    });
    
    // Out of stock items count
    const outOfStockCount = await Inventory.countDocuments({ status: 'out-of-stock' });
    
    // Expired items count
    const expiredCount = await Inventory.countDocuments({ status: 'expired' });

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        itemsByType,
        itemsByStatus,
        totalValue: inventoryValue[0]?.total || 0,
        lowStockCount,
        outOfStockCount,
        expiredCount
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search inventory items
// @route   GET /api/inventory/search
// @access  Private/Admin
export const searchInventory = async (req, res) => {
  try {
    const { q, category, itemType } = req.query;
    
    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { itemName: { $regex: q, $options: 'i' } },
        { itemCode: { $regex: q, $options: 'i' } },
        { batchNumber: { $regex: q, $options: 'i' } },
        { 'supplierDetails.name': { $regex: q, $options: 'i' } }
      ];
    }

    // Filters
    if (category) query.category = category;
    if (itemType) query.itemType = itemType;

    const items = await Inventory.find(query)
      .select('itemCode itemName itemType category unit currentStock status location')
      .limit(20);

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Search inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update multiple inventory items (bulk update)
// @route   PUT /api/inventory/bulk-update
// @access  Private/Admin
export const bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, quantity, type, notes }
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates format'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const item = await Inventory.findById(update.id);
        
        if (!item) {
          errors.push({ id: update.id, error: 'Item not found' });
          continue;
        }

        if (update.type === 'add') {
          item.currentStock += parseInt(update.quantity);
        } else if (update.type === 'subtract') {
          if (item.currentStock < update.quantity) {
            errors.push({ id: update.id, error: 'Insufficient stock' });
            continue;
          }
          item.currentStock -= parseInt(update.quantity);
        }

        // Update status
        if (item.currentStock <= 0) {
          item.status = 'out-of-stock';
        } else if (item.currentStock <= item.minStockLevel) {
          item.status = 'low-stock';
        } else {
          item.status = 'in-stock';
        }

        // Add notes
        if (update.notes) {
          item.notes = item.notes ? `${item.notes}\n${update.notes}` : update.notes;
        }

        await item.save();
        results.push({ id: update.id, success: true, data: item });
      } catch (error) {
        errors.push({ id: update.id, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      data: {
        updated: results.length,
        errors: errors.length,
        results,
        errors
      }
    });
  } catch (error) {
    console.error('Bulk update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};