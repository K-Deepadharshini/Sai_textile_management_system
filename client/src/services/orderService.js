import api from './api';

const orderService = {
  // Create order
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create order' };
    }
  },

  // Get all orders
  async getAllOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Get order by ID
  async getOrderById(id) {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  // Update order
  async updateOrder(id, orderData) {
    try {
      const response = await api.put(`/orders/${id}`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update order' };
    }
  },

  // Update order status
  async updateOrderStatus(id, status) {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  // Delete order
  async deleteOrder(id) {
    try {
      const response = await api.delete(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete order' };
    }
  },

  // Get client orders (automatically uses authenticated user)
  async getClientOrders(params = {}) {
    try {
      // Server exposes client orders at /orders/client
      const response = await api.get('/orders/client', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch client orders' };
    }
  },

  // Get order by ID for client
  async getClientOrderById(id) {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order' };
    }
  },

  // Get order statistics
  async getOrderStats(period = 'month') {
    try {
      const response = await api.get('/orders/stats', { params: { period } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch order statistics' };
    }
  },

  // Assign production batch to order
  async assignBatchToOrder(orderId, batchId) {
    try {
      const response = await api.post(`/orders/${orderId}/assign-batch`, { batchId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign batch to order' };
    }
  },
};

export default orderService;