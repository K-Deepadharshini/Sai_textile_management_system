import api from './api.js';

// Using shared API instance from api.js

const productService = {
  // Create product
  async createProduct(productData) {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      console.error('Create product error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to create product' };
    }
  },

  // Get all products
  async getAllProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Get all products error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  // Get available products (for clients)
  async getAvailableProducts(params = {}) {
    try {
      const response = await api.get('/products/available', { params });
      return response.data;
    } catch (error) {
      console.error('Get available products error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch products' };
    }
  },

  // Get product by ID
  async getProductById(id) {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get product by ID error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch product' };
    }
  },

  // Update product
  async updateProduct(id, productData) {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error('Update product error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to update product' };
    }
  },

  // Delete product
  async deleteProduct(id) {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete product error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to delete product' };
    }
  },

  // Update stock
  async updateStock(id, quantity, action) {
    try {
      const response = await api.put(`/products/${id}/stock`, {
        quantity,
        action,
      });
      return response.data;
    } catch (error) {
      console.error('Update stock error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to update stock' };
    }
  },

  // Get low stock products
  async getLowStockProducts() {
    try {
      const response = await api.get('/products/low-stock');
      return response.data;
    } catch (error) {
      console.error('Get low stock products error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch low stock products' };
    }
  },

  // Search products
  async searchProducts(query) {
    try {
      const response = await api.get('/products/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error('Search products error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to search products' };
    }
  },

  // Get product categories
  async getProductCategories() {
    try {
      const response = await api.get('/products/categories');
      return response.data;
    } catch (error) {
      console.error('Get product categories error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch categories' };
    }
  },

  // Get product statistics
  async getProductStats() {
    try {
      const response = await api.get('/products/stats');
      return response.data;
    } catch (error) {
      console.error('Get product stats error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to fetch product statistics' };
    }
  },

  // Upload product image
  async uploadProductImage(productId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.post(`/products/${productId}/image`, formData);
      return response.data;
    } catch (error) {
      console.error('Upload product image error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to upload image' };
    }
  },

  // Delete product image
  async deleteProductImage(productId, imageId) {
    try {
      const response = await api.delete(`/products/${productId}/image/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Delete product image error:', error.response?.data || error);
      throw error.response?.data || { message: 'Failed to delete image' };
    }
  },
};

export default productService;