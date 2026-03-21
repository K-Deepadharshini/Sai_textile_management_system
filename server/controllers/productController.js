import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Helper function to upload file buffer to Cloudinary using stream
const uploadToCloudinary = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'textile-products',
        resource_type: 'image',
        public_id: `product-${Date.now()}-${filename.split('.')[0]}`,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload successful:', {
            url: result.secure_url,
            publicId: result.public_id
          });
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );

    // Create a readable stream from the buffer
    Readable.from(fileBuffer).pipe(stream);
  });
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    console.log('📝 Request body:', req.body);
    console.log('📸 Request files:', req.files?.length || 0);
    
    // Debug file details
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        console.log(`📄 File ${index + 1}:`, {
          fieldname: file.fieldname,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }

    const {
      name, type, denier, moq,
      unit, price, gstPercentage, minStockLevel, maxStockLevel,
      description, productCode, stockQuantity
    } = req.body;

    // Check if product code already exists
    const existingProduct = await Product.findOne({ productCode });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists'
      });
    }

    // Handle image upload with better error handling
    let images = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          console.log('🚀 Uploading file to Cloudinary:', file.originalname);
          
          // Check if file is an image
          if (!file.mimetype.startsWith('image/')) {
            console.warn(`⏭️  Skipping non-image file: ${file.originalname}`);
            continue;
          }
          
          const uploadedImage = await uploadToCloudinary(file.buffer, file.originalname);
          images.push(uploadedImage);
        }
      } catch (imgErr) {
        console.error('❌ Image upload error:', imgErr);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: imgErr.message
        });
      }
    }

    console.log('Images to save:', images);

    // Create product
    const product = new Product({
      productCode,
      name,
      type,
      denier,
      moq: parseFloat(moq),
      unit,
      price: parseFloat(price),
      gstPercentage: gstPercentage ? parseFloat(gstPercentage) : 18,
      stockQuantity: stockQuantity ? parseFloat(stockQuantity) : 0,
      minStockLevel: minStockLevel ? parseFloat(minStockLevel) : 100,
      maxStockLevel: maxStockLevel ? parseFloat(maxStockLevel) : 10000,
      images,
      description: description || '',
      createdBy: req.user.id,
      status: stockQuantity && parseFloat(stockQuantity) > 0 ? 'available' : 'out-of-stock'
    });

    await product.save();

    console.log('Product saved with images:', product.images);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error details:', error);
    
    // If validation error, return 400 with details
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
    
    // If duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res) => {
  try {
    const { type, denier, status, search, page = 1, limit = 100 } = req.query;
    
    // Build query
    let query = {};
    
    if (type) query.type = type;
    if (denier) query.denier = denier;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // For clients, only show available products
    if (req.user.role === 'client') {
      query.status = 'available';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get available products for clients
// @route   GET /api/products/available
// @access  Private/Client
export const getAvailableProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      status: 'available',
      stockQuantity: { $gt: 0 }
    }).select('name productCode type denier moq unit price gstPercentage stockQuantity images description model3D')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get available products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // For clients, check if product is available
    if (req.user.role === 'client' && product.status !== 'available') {
      return res.status(403).json({
        success: false,
        message: 'Product is not available'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Update request files:', req.files);

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle image upload for update
    if (req.files && req.files.length > 0) {
      try {
        // Delete old images from cloudinary
        if (product.images && product.images.length > 0) {
          for (const image of product.images) {
            try {
              console.warn('🗑️  Deleting old image from cloudinary:', image.publicId);
              await cloudinary.uploader.destroy(image.publicId);
            } catch (destroyErr) {
              console.warn('⚠️  Error deleting old image:', destroyErr);
            }
          }
        }

        const images = [];
        for (const file of req.files) {
          console.log('🚀 Uploading file to Cloudinary:', file.originalname);
          
          // Check if file is an image
          if (!file.mimetype.startsWith('image/')) {
            console.warn(`⏭️  Skipping non-image file: ${file.originalname}`);
            continue;
          }

          const uploadedImage = await uploadToCloudinary(file.buffer, file.originalname);
          images.push(uploadedImage);
        }
        req.body.images = images;
      } catch (imgErr) {
        console.error('❌ Image upload error (update):', imgErr);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: imgErr.message
        });
      }
    }

    // Parse numeric fields
    const numericFields = ['price', 'moq', 'gstPercentage', 'stockQuantity', 'minStockLevel', 'maxStockLevel'];
    numericFields.forEach(field => {
      if (req.body[field] !== undefined) {
        req.body[field] = parseFloat(req.body[field]);
      }
    });

    // Update stock status if quantity changes
    if (req.body.stockQuantity !== undefined) {
      const stockQuantity = parseFloat(req.body.stockQuantity);
      if (stockQuantity <= 0) {
        req.body.status = 'out-of-stock';
      } else if (stockQuantity <= (req.body.minStockLevel || product.minStockLevel)) {
        req.body.status = 'available'; // Keep as available but low stock
      } else {
        req.body.status = 'available';
      }
    }

    // Check for duplicate product code if changed
    if (req.body.productCode && req.body.productCode !== product.productCode) {
      const existingProduct = await Product.findOne({ 
        productCode: req.body.productCode,
        _id: { $ne: req.params.id }
      });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product code already exists'
        });
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
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
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete images from cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId);
        } catch (destroyErr) {
          console.warn('Error deleting image from cloudinary:', destroyErr);
        }
      }
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateStock = async (req, res) => {
  try {
    const { quantity, action } = req.body; // action: 'add' or 'subtract'
    
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (action === 'add') {
      product.stockQuantity += parseInt(quantity);
    } else if (action === 'subtract') {
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      product.stockQuantity -= parseInt(quantity);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "add" or "subtract"'
      });
    }

    // Update status based on stock
    if (product.stockQuantity <= 0) {
      product.status = 'out-of-stock';
    } else if (product.stockQuantity <= product.minStockLevel) {
      product.status = 'available';
    } else {
      product.status = 'available';
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Private
export const searchProducts = async (req, res) => {
  try {
    const { q, type, minPrice, maxPrice } = req.query;
    
    let query = {};

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { productCode: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // For clients, only show available products
    if (req.user.role === 'client') {
      query.status = 'available';
    }

    const products = await Product.find(query)
      .select('name productCode type denier price stockQuantity images unit moq')
      .limit(20);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $lte: ['$stockQuantity', '$minStockLevel']
      },
      status: { $ne: 'discontinued' }
    }).sort('stockQuantity');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { type: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get product categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private/Admin
export const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $facet: {
          totalProducts: [
            { $count: 'count' }
          ],
          productsByType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          productsByStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          stockValue: [
            {
              $group: {
                _id: null,
                totalStockValue: {
                  $sum: { $multiply: ['$stockQuantity', '$price'] }
                },
                totalStockQuantity: { $sum: '$stockQuantity' }
              }
            }
          ],
          lowStockProducts: [
            {
              $match: {
                $expr: {
                  $lte: ['$stockQuantity', '$minStockLevel']
                }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload product image
// @route   POST /api/products/:id/image
// @access  Private/Admin
export const uploadProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'textile-products'
    });

    // Add image to product
    product.images.push({
      url: result.secure_url,
      publicId: result.public_id
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: product.images
    });
  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/image/:imageId
// @access  Private/Admin
export const deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the image
    const imageIndex = product.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = product.images[imageIndex];

    // Delete from cloudinary
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (cloudinaryErr) {
      console.warn('Cloudinary delete error:', cloudinaryErr);
    }

    // Remove from array
    product.images.splice(imageIndex, 1);

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: product.images
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Upload product 3D model
// @route   POST /api/products/:id/model3d
// @access  Private/Admin
export const uploadProduct3DModel = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a 3D model file'
      });
    }

    // Validate file type
    if (!req.file.originalname.toLowerCase().endsWith('.fbx')) {
      return res.status(400).json({
        success: false,
        message: 'Only FBX files are supported'
      });
    }

    // Upload file to cloudinary (raw file)
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'textile-products/3d-models',
      resource_type: 'raw',
      public_id: `product-model-${req.params.id}-${Date.now()}`
    });

    // Update product with 3D model
    product.model3D = {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: req.file.originalname
    };

    await product.save();

    res.status(200).json({
      success: true,
      message: '3D model uploaded successfully',
      data: product.model3D
    });
  } catch (error) {
    console.error('Upload 3D model error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete product 3D model
// @route   DELETE /api/products/:id/model3d
// @access  Private/Admin
export const deleteProduct3DModel = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.model3D || !product.model3D.publicId) {
      return res.status(404).json({
        success: false,
        message: '3D model not found'
      });
    }

    // Delete from cloudinary
    try {
      await cloudinary.uploader.destroy(product.model3D.publicId, {
        resource_type: 'raw'
      });
    } catch (cloudinaryErr) {
      console.warn('Cloudinary delete error:', cloudinaryErr);
    }

    // Remove 3D model from product
    product.model3D = null;

    await product.save();

    res.status(200).json({
      success: true,
      message: '3D model deleted successfully'
    });
  } catch (error) {
    console.error('Delete 3D model error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};