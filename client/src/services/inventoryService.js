import api from './api';

const inventoryService = {
  // Create inventory item
  async createInventoryItem(itemData) {
    try {
      const response = await api.post('/inventory', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create inventory item' };
    }
  },

  // Get all inventory items
  async getAllInventory(params = {}) {
    try {
      const response = await api.get('/inventory', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory' };
    }
  },

  // Get inventory item by ID
  async getInventoryItemById(id) {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory item' };
    }
  },

  // Update inventory item
  async updateInventoryItem(id, itemData) {
    try {
      const response = await api.put(`/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update inventory item' };
    }
  },

  // Delete inventory item
  async deleteInventoryItem(id) {
    try {
      const response = await api.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete inventory item' };
    }
  },

  // Update stock
  async updateStock(id, quantity, action) {
    try {
      const response = await api.put(`/inventory/${id}/stock`, { quantity, action });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update stock' };
    }
  },

  // Get low stock items
  async getLowStockItems() {
    try {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch low stock items' };
    }
  },

  // Get inventory statistics
  async getInventoryStats() {
    try {
      const response = await api.get('/inventory/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory statistics' };
    }
  },

  // Search inventory
  async searchInventory(query) {
    try {
      const response = await api.get('/inventory/search', { params: { query } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search inventory' };
    }
  },
};

export default inventoryService;