// src/services/productionService.js
import api from './api';

const productionService = {
  // Create production batch
  async createBatch(batchData) {
    try {
      console.log('🚀 Sending batch data to server:', batchData);
      
      // Ensure data is properly formatted (frontend already parses JSON strings to objects)
      const formattedData = {
        ...batchData,
        quantityProduced: parseFloat(batchData.quantityProduced),
        wastage: parseFloat(batchData.wastage) || 0,
        startDate: batchData.startDate,
        endDate: batchData.endDate || null,
        machineDetails: batchData.machineDetails || {},
        dyeingDetails: batchData.dyeingDetails || {},
        rawMaterialUsed: batchData.rawMaterialUsed || [],
      };
      
      const response = await api.post('/production', formattedData);
      console.log('✅ Server response:', response.data);
      return response.data;
    } catch (error) {
      // Log full error response for debugging
      console.error('❌ Error creating batch:', error);
      console.error('Error response:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error status:', error.response?.status);
      console.error('Full error response object:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to create production batch';
      const errorDetails = error.response?.data?.errors || error.response?.data;
      
      throw { 
        message: errorMessage, 
        details: errorDetails,
        validationErrors: error.response?.data?.errors 
      };
    }
  },

  // Get all production batches
  async getAllBatches(params = {}) {
    try {
      console.log('📋 Fetching batches with params:', params);
      const response = await api.get('/production', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching batches:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to fetch production batches',
        details: error.response?.data 
      };
    }
  },

  // Get batch by ID
  async getBatchById(id) {
    try {
      const response = await api.get(`/production/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching batch:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to fetch batch',
        details: error.response?.data 
      };
    }
  },

  // Update batch
  async updateBatch(id, batchData) {
    try {
      const response = await api.put(`/production/${id}`, batchData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating batch:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to update batch',
        details: error.response?.data 
      };
    }
  },

  // Update batch status
  async updateBatchStatus(id, status) {
    try {
      const response = await api.put(`/production/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('❌ Error updating status:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to update batch status',
        details: error.response?.data 
      };
    }
  },

  // Delete batch
  async deleteBatch(id) {
    try {
      const response = await api.delete(`/production/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting batch:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to delete batch',
        details: error.response?.data 
      };
    }
  },

  // Get production statistics
  async getProductionStats(period = 'month') {
    try {
      const response = await api.get('/production/stats', { params: { period } });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      throw { 
        message: error.response?.data?.message || 'Failed to fetch production statistics',
        details: error.response?.data 
      };
    }
  }
};

export default productionService;