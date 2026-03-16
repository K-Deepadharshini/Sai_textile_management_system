import api from './api';

const dispatchService = {
  // Create dispatch
  async createDispatch(dispatchData) {
    try {
      const response = await api.post('/dispatch', dispatchData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create dispatch' };
    }
  },

  // Get all dispatches
  async getAllDispatches(params = {}) {
    try {
      const response = await api.get('/dispatch', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dispatches' };
    }
  },

  // Get dispatch by ID
  async getDispatchById(id) {
    try {
      const response = await api.get(`/dispatch/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dispatch' };
    }
  },

  // Update dispatch
  async updateDispatch(id, dispatchData) {
    try {
      const response = await api.put(`/dispatch/${id}`, dispatchData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update dispatch' };
    }
  },

  // Update dispatch status
  async updateDispatchStatus(id, status) {
    try {
      const response = await api.put(`/dispatch/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update dispatch status' };
    }
  },

  // Delete dispatch
  async deleteDispatch(id) {
    try {
      const response = await api.delete(`/dispatch/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete dispatch' };
    }
  },

  // Generate LR (Lorry Receipt)
  async generateLR(id) {
    try {
      const response = await api.get(`/dispatch/${id}/lr`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate LR' };
    }
  },

  // Upload delivery proof
  async uploadDeliveryProof(id, proofData) {
    try {
      const formData = new FormData();
      formData.append('proof', proofData);
      const response = await api.post(`/dispatch/${id}/delivery-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload delivery proof' };
    }
  },

  // Get dispatch statistics
  async getDispatchStats(period = 'month') {
    try {
      const response = await api.get('/dispatch/stats', { params: { period } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dispatch statistics' };
    }
  },
};

export default dispatchService;