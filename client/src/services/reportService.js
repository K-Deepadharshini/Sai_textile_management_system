import api from './api';

const reportService = {
  // Get sales report
  async getSalesReport(params = {}) {
    try {
      const response = await api.get('/reports/sales', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sales report' };
    }
  },

  // Get production report
  async getProductionReport(params = {}) {
    try {
      const response = await api.get('/reports/production', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch production report' };
    }
  },
  
  // Get orders (used for orders report)
  async getOrdersReport(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch orders' };
    }
  },

  // Get inventory report
  async getInventoryReport(params = {}) {
    try {
      const response = await api.get('/reports/inventory', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inventory report' };
    }
  },

  // Get client report
  async getClientReport(params = {}) {
    try {
      const response = await api.get('/reports/client', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch client report' };
    }
  },

  // Get client reports (for authenticated user)
  async getClientReports(params = {}) {
    try {
      const response = await api.get('/reports/my-reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch reports' };
    }
  },

  // Get dashboard stats
  async getDashboardStats() {
    try {
      // server route is /api/reports/dashboard (not dashboard-stats)
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard stats' };
    }
  },

  // Generate PDF report (server expects POST /api/reports/generate-pdf)
  async generatePDFReport(reportType, params = {}) {
    try {
      // Ensure filters use provided params (startDate, endDate, etc.)
      const filters = params.dateRange || { ...params };

      // If no data provided, attempt to fetch report data for the given type/filters
      let dataPayload = params.data;
      if (!dataPayload) {
        try {
          const resp = await this.getReportData({ type: reportType, ...filters });
          dataPayload = resp.success ? resp.data : {};
        } catch (e) {
          dataPayload = {};
        }
      }

      // For production reports, fetch batches if missing so PDF contains batch details
      if (reportType === 'production') {
        if (!dataPayload || (!dataPayload.batches || dataPayload.batches.length === 0)) {
          try {
            const resp = await api.get('/production', { params: { startDate: filters.startDate, endDate: filters.endDate, limit: 1000 } });
            const batchesData = resp.data && resp.data.data ? resp.data.data : [];
            const mapped = batchesData.map(b => ({
              batchNumber: b.batchNumber || b._id,
              productName: b.product?.name || (b.productName || 'Unknown'),
              status: b.status || 'unknown',
              quantity: b.quantityProduced || b.quantity || 0,
              wastage: b.wastage || 0
            }));
            dataPayload = dataPayload || {};
            dataPayload.batches = mapped;
            dataPayload.summary = dataPayload.summary || {};
            dataPayload.summary.totalBatches = dataPayload.summary.totalBatches || mapped.length;
            dataPayload.summary.totalProduced = dataPayload.summary.totalProduced || mapped.reduce((s, x) => s + (x.quantity || 0), 0);
            dataPayload.summary.averageWastage = dataPayload.summary.averageWastage || (mapped.length ? (mapped.reduce((s,x)=>s+(x.wastage||0),0)/mapped.length) : 0);
          } catch (e) {
            // continue
          }
        }
      }

      const payload = {
        reportType,
        // transform server report shape into the simple reportData shape expected by
        // the server PDF/Excel generator utilities
        data: transformForExport(reportType, dataPayload, filters),
        filters: filters || {},
        title: params.filename || `${reportType}_report`,
      };

      const response = await api.post('/reports/generate-pdf', payload, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate PDF report' };
    }
  },

  // Generate Excel report (server expects POST /api/reports/generate-excel)
  async generateExcelReport(reportType, params = {}) {
    try {
      const filters = params.dateRange || { ...params };

      let dataPayload = params.data;
      if (!dataPayload) {
        try {
          const resp = await this.getReportData({ type: reportType, ...filters });
          dataPayload = resp.success ? resp.data : {};
        } catch (e) {
          dataPayload = {};
        }
      }

      // For production reports, fetch batches if missing so Excel contains batch details
      if (reportType === 'production') {
        if (!dataPayload || (!dataPayload.batches || dataPayload.batches.length === 0)) {
          try {
            const resp = await api.get('/production', { params: { startDate: filters.startDate, endDate: filters.endDate, limit: 1000 } });
            const batchesData = resp.data && resp.data.data ? resp.data.data : [];
            const mapped = batchesData.map(b => ({
              batchNumber: b.batchNumber || b._id,
              productName: b.product?.name || (b.productName || 'Unknown'),
              status: b.status || 'unknown',
              quantity: b.quantityProduced || b.quantity || 0,
              wastage: b.wastage || 0
            }));
            dataPayload = dataPayload || {};
            dataPayload.batches = mapped;
            dataPayload.summary = dataPayload.summary || {};
            dataPayload.summary.totalBatches = dataPayload.summary.totalBatches || mapped.length;
            dataPayload.summary.totalProduced = dataPayload.summary.totalProduced || mapped.reduce((s, x) => s + (x.quantity || 0), 0);
            dataPayload.summary.averageWastage = dataPayload.summary.averageWastage || (mapped.length ? (mapped.reduce((s,x)=>s+(x.wastage||0),0)/mapped.length) : 0);
          } catch (e) {
            // continue
          }
        }
      }

      const payload = {
        reportType,
        data: transformForExport(reportType, dataPayload, filters),
        filters: filters || {},
        title: params.filename || `${reportType}_report`,
      };

      const response = await api.post('/reports/generate-excel', payload, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate Excel report' };
    }
  },

  // Get revenue analytics
  async getRevenueAnalytics(params = {}) {
    try {
      const response = await api.get('/reports/revenue-analytics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch revenue analytics' };
    }
  },

  // Get product performance report
  async getProductPerformance(params = {}) {
    try {
      const response = await api.get('/reports/product-performance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch product performance report' };
    }
  },

  // Get client purchase history
  async getClientPurchaseHistory(params = {}) {
    try {
      const response = await api.get('/reports/my-purchase-history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch purchase history' };
    }
  },

  // Compatibility wrapper used by the UI: returns { success, data }
  async getReportData({ type = 'sales', ...params } = {}) {
    try {
      let data;
      switch (type) {
        case 'sales':
          data = await this.getSalesReport(params);
          break;
        case 'orders':
          data = await this.getOrdersReport(params);
          break;
        case 'production':
          data = await this.getProductionReport(params);
          break;
        case 'inventory':
          data = await this.getInventoryReport(params);
          break;
        case 'client':
          // If a specific client id is provided fetch client report, otherwise
          // fetch sales report to get topClients for client distribution in admin view.
          if (params.client || params.clientId) {
            data = await this.getClientReport(params);
          } else {
            data = await this.getSalesReport(params);
          }
          break;
        case 'dashboard':
          data = await this.getDashboardStats(params);
          break;
        default:
          // Fallback to sales if unknown
          data = await this.getSalesReport(params);
      }

      // The lower-level methods return `response.data` from axios, which may itself be
      // an object like { success: true, data: { ... } }. Unwrap if necessary so callers
      // receive the inner `data` (summary, lists) expected by the UI.
      if (data && data.success && data.data !== undefined) {
        return { success: true, data: data.data };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Trigger server-side generation (generic). Returns { success, data }
  async generateReport({ type = 'sales', ...params } = {}) {
    try {
      // Call server PDF generation endpoint directly (server has no generic /reports/generate)
      const payload = { reportType: type, data: params.data || params, filters: params };
      const response = await api.post('/reports/generate-pdf', payload, { responseType: 'blob' });
      return { success: true, data: response.data };
    } catch (err) {
      // If server doesn't have generic endpoint, fall back to PDF generation
      try {
        const blob = await this.generatePDFReport(type, { ...params });
        return { success: true, data: blob };
      } catch (error) {
        return { success: false, error };
      }
    }
  },

  // Export report as PDF/Excel. Returns { success, data } where data is blob
  async exportReport({ type = 'sales', format = 'pdf', ...params } = {}) {
    try {
      if (format === 'pdf') {
        const blob = await this.generatePDFReport(type, params);
        return { success: true, data: blob };
      }

      if (format === 'excel' || format === 'xlsx') {
        const blob = await this.generateExcelReport(type, params);
        return { success: true, data: blob };
      }

      // Fallback: request an export endpoint
      const resp = await api.get(`/reports/export`, { params: { type, format, ...params }, responseType: 'blob' });
      return { success: true, data: resp.data };
    } catch (error) {
      return { success: false, error };
    }
  },
};

// Helper to transform server report response into the flat shape used by server-side
// PDF/Excel generators (they expect fields like period, totalBatches, totalQuantity, etc.).
function transformForExport(reportType, dataPayload = {}, filters = {}) {
  // Preserve arrays (orders list) so transform cases can handle them correctly
  
  const summary = (dataPayload && dataPayload.summary) ? dataPayload.summary : {};
  const period = filters.startDate && filters.endDate ? `${filters.startDate} - ${filters.endDate}` : undefined;

  switch (reportType) {
    case 'orders': {
      // dataPayload may be paginated: { total, count, data: [...] } or an array of orders
      const list = Array.isArray(dataPayload.data)
        ? dataPayload.data
        : (Array.isArray(dataPayload) ? dataPayload : (dataPayload.orders || dataPayload.data || []));

      const totalOrders = dataPayload.total || dataPayload.count || list.length || 0;
      const totalSpent = (dataPayload.summary && dataPayload.summary.totalSpent) || list.reduce((s, o) => s + (o.grandTotal || o.totalAmount || o.total || 0), 0);

      return {
        period,
        totalOrders,
        totalSpent,
        orders: list
      };
    }
    case 'production':
      return {
        period,
        totalBatches: summary.totalBatches || 0,
        totalQuantity: summary.totalProduced || summary.totalQuantity || 0,
        avgWastage: summary.averageWastage || summary.avgWastage || 0,
        completionRate: summary.efficiency || 0,
        batches: dataPayload.batches && Array.isArray(dataPayload.batches) && dataPayload.batches.length > 0 
          ? dataPayload.batches 
          : (dataPayload.monthlyProduction || [])
      };
    case 'sales':
      return {
        period,
        totalOrders: summary.totalOrders || 0,
        totalRevenue: summary.totalRevenue || 0,
        averageOrderValue: summary.averageOrderValue || 0,
        topProducts: dataPayload.topProducts || []
      };
    case 'inventory':
      return {
        period,
        totalItems: summary.totalItems || 0,
        totalValue: summary.totalValue || 0,
        lowStockItems: summary.lowStockItems || 0,
        outOfStockItems: summary.outOfStockItems || summary.outOfStock || 0,
        byCategory: dataPayload.byCategory || []
      };
    case 'client': {
      // dataPayload is the summaryData object with structure: { totalOrders, totalInvoices, totalAmount, totalPaid, totalOutstanding, averageOrderValue }
      const clientData = Array.isArray(dataPayload) ? dataPayload[0] : dataPayload;
      return {
        period,
        totalOrders: clientData.totalOrders || 0,
        totalInvoiceAmount: clientData.totalAmount || 0,
        totalPaid: clientData.totalPaid || 0,
        totalOutstanding: clientData.totalOutstanding || 0,
        averageOrderValue: clientData.averageOrderValue || 0
      };
    }
    case 'invoices': {
      // dataPayload is an array of invoice objects
      const invoicesList = Array.isArray(dataPayload) ? dataPayload : (dataPayload.invoices || []);
      const totalAmount = invoicesList.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const totalPaid = invoicesList.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
      const totalOutstanding = invoicesList.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
      
      return {
        period,
        totalInvoices: invoicesList.length || 0,
        totalAmount: totalAmount,
        totalPaid: totalPaid,
        totalOutstanding: totalOutstanding,
        invoices: invoicesList
      };
    }
    default:
      return { 
        period, 
        ...summary 
      };
  }
}

export default reportService;