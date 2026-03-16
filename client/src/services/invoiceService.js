import api from './api';

const invoiceService = {
  // Create invoice
  async createInvoice(invoiceData) {
    try {
      console.log('invoiceService.createInvoice called with:', invoiceData);
      const response = await api.post('/invoices', invoiceData);
      console.log('Invoice creation response:', response);
      return response.data;
    } catch (error) {
      console.error('invoiceService.createInvoice error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error message:', error.message);
      const errData = error.response?.data || {};
      throw {
        message: errData.message || errData.error || error.message || 'Failed to create invoice',
        response: error.response?.data,
        status: error.response?.status
      };
    }
  },

  // Get all invoices
  async getAllInvoices(params = {}) {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch invoices' };
    }
  },

  // Get invoice by ID
  async getInvoiceById(id) {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch invoice' };
    }
  },

  // Update invoice
  async updateInvoice(id, invoiceData) {
    try {
      const response = await api.put(`/invoices/${id}`, invoiceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update invoice' };
    }
  },

  // Update payment status
  async updatePaymentStatus(id, paymentData) {
    try {
      // Server exposes POST /api/invoices/:id/payment to record payments
      const response = await api.post(`/invoices/${id}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update payment status' };
    }
  },

  // Delete invoice
  async deleteInvoice(id) {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete invoice' };
    }
  },

  // Get client invoices (automatically uses authenticated user)
  async getClientInvoices(params = {}) {
    try {
      const response = await api.get('/invoices/client', { params });
      return response.data;
    } catch (error) {
      const err = error.response?.data || { message: 'Failed to fetch client invoices' };
      throw err;
    }
  },

  // Generate invoice PDF
  async generateInvoicePDF(id) {
    try {
      const response = await api.get(`/invoices/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate PDF' };
    }
  },

  // Get invoice statistics
  async getInvoiceStats(period = 'month') {
    try {
      const response = await api.get('/invoices/stats', { params: { period } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch invoice statistics' };
    }
  },

  // Send invoice via email
  async sendInvoiceEmail(id, emailData) {
    try {
      const response = await api.post(`/invoices/${id}/send-email`, emailData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send invoice email' };
    }
  },
};

export default invoiceService;