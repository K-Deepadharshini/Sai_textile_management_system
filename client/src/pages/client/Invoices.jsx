import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Stack, CircularProgress,
  Tooltip, Alert as MuiAlert, Card, CardContent, LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Download, Print, Visibility, Email, Receipt,
  Search, FilterList, Paid, Pending, Error,
  CalendarToday, AttachMoney, PictureAsPdf
} from '@mui/icons-material';
import { invoiceService } from '../../services';
import { formatDate } from '../../utils/formatDate';

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paramsFromUrl = new URLSearchParams(location.search);
  const orderQuery = paramsFromUrl.get('order');
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrInvoice, setQrInvoice] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [activeOrderFilter, setActiveOrderFilter] = useState(orderQuery);
  const [ignoreOrderFilter, setIgnoreOrderFilter] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [orderQuery, ignoreOrderFilter]);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const fetchInvoices = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = { ...params };
      
      // Only apply order filter if not explicitly ignored
      if (orderQuery && !ignoreOrderFilter && !params.skipOrderFilter) {
        queryParams.order = orderQuery;
        setActiveOrderFilter(orderQuery);
      } else {
        setActiveOrderFilter(null);
      }
      
      const response = await invoiceService.getClientInvoices(queryParams);
      
      // Handle the response structure from your controller
      const invoiceData = response?.data || response || [];
      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showAlert(error?.message || 'Error fetching invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.order?.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.paymentStatus === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            return invoiceDate.toDateString() === today.toDateString();
          });
          break;
        case 'this-week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            return invoiceDate >= startOfWeek && invoiceDate <= today;
          });
          break;
        case 'this-month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(invoice => {
            const invoiceDate = new Date(invoice.invoiceDate);
            return invoiceDate >= startOfMonth && invoiceDate <= today;
          });
          break;
        case 'overdue':
          filtered = filtered.filter(invoice => {
            const dueDate = new Date(invoice.dueDate);
            const today = new Date();
            return (invoice.paymentStatus === 'overdue') || 
                   (invoice.paymentStatus !== 'paid' && dueDate < today);
          });
          break;
        default:
          break;
      }
    }

    setFilteredInvoices(filtered);
    setPage(0);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDialog(true);
  };

  const handleDownload = async (invoice) => {
    try {
      const response = await invoiceService.downloadInvoice(invoice._id);
      
      // Create blob from response
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      showAlert('Invoice downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showAlert(error?.message || 'Failed to download invoice', 'error');
    }
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    
    // Get company logo if available
    const logoUrl = '/logo.png'; // Update with your actual logo path
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Roboto', 'Segoe UI', Arial, sans-serif; 
              margin: 30px; 
              color: #333;
              line-height: 1.6;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 30px;
              border: 1px solid #ddd;
              background: white;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1976d2;
            }
            .company-info h1 {
              color: #1976d2;
              font-size: 24px;
              margin-bottom: 5px;
            }
            .company-info p {
              color: #666;
              font-size: 14px;
            }
            .invoice-header {
              text-align: right;
            }
            .invoice-header h2 {
              color: #2c3e50;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .invoice-meta {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .meta-item h4 {
              color: #666;
              font-size: 14px;
              margin-bottom: 5px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .meta-item p {
              font-size: 16px;
              font-weight: 500;
              color: #2c3e50;
            }
            .meta-item .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-unpaid { background: #fff3cd; color: #856404; }
            .status-paid { background: #d4edda; color: #155724; }
            .status-partially-paid { background: #cce5ff; color: #004085; }
            .status-overdue { background: #f8d7da; color: #721c24; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            th {
              background: #1976d2;
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 500;
              border: none;
            }
            td {
              padding: 15px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .totals-section {
              margin-top: 40px;
              margin-left: auto;
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .total-label {
              color: #666;
            }
            .total-value {
              font-weight: 500;
              color: #2c3e50;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              color: #1976d2;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #1976d2;
            }
            .balance-due {
              color: #d32f2f;
              font-weight: bold;
            }
            .amount-paid {
              color: #2e7d32;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
              .invoice-container { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="company-info">
                <h1>SAI PATHIRAKALIAMMAN TEXTILE PROCESS</h1>
                <p>Textile Processing & Manufacturing</p>
                <p>Email: info@saitextileprocess.com | Phone: +91 1234567890</p>
              </div>
              <div class="invoice-header">
                <h2>INVOICE</h2>
                <h3 style="color: #1976d2; margin: 10px 0;">${invoice.invoiceNumber || 'N/A'}</h3>
              </div>
            </div>
            
            <div class="invoice-meta">
              <div class="meta-item">
                <h4>Invoice Date</h4>
                <p>${formatDate(invoice.invoiceDate)}</p>
              </div>
              <div class="meta-item">
                <h4>Due Date</h4>
                <p style="${new Date(invoice.dueDate) < new Date() ? 'color: #d32f2f; font-weight: bold;' : ''}">
                  ${formatDate(invoice.dueDate)}
                </p>
              </div>
              <div class="meta-item">
                <h4>Order Number</h4>
                <p>${invoice.order?.orderNumber || 'N/A'}</p>
              </div>
              <div class="meta-item">
                <h4>Status</h4>
                <span class="status status-${invoice.paymentStatus}">${invoice.paymentStatus?.toUpperCase() || 'UNPAID'}</span>
              </div>
              ${invoice.client ? `
                <div class="meta-item">
                  <h4>Client</h4>
                  <p>${invoice.client.companyName || invoice.client.name || 'N/A'}</p>
                </div>
              ` : ''}
              ${invoice.client?.gstNumber ? `
                <div class="meta-item">
                  <h4>GST Number</h4>
                  <p>${invoice.client.gstNumber}</p>
                </div>
              ` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>GST %</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || []).map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.description || 'Product/Service'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>₹${(item.unitPrice || 0).toFixed(2)}</td>
                    <td>${item.gstPercentage || 18}%</td>
                    <td>₹${((item.total || 0) + (item.gstAmount || 0)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">₹${(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">GST Amount:</span>
                <span class="total-value">₹${(invoice.gstAmount || 0).toFixed(2)}</span>
              </div>
              ${(invoice.shippingCharges || 0) > 0 ? `
                <div class="total-row">
                  <span class="total-label">Shipping Charges:</span>
                  <span class="total-value">₹${invoice.shippingCharges.toFixed(2)}</span>
                </div>
              ` : ''}
              ${(invoice.discount || 0) > 0 ? `
                <div class="total-row">
                  <span class="total-label">Discount:</span>
                  <span class="total-value amount-paid">-₹${invoice.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span class="total-label">GRAND TOTAL:</span>
                <span class="total-value">₹${(invoice.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Amount Paid:</span>
                <span class="total-value amount-paid">₹${(invoice.amountPaid || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">BALANCE DUE:</span>
                <span class="total-value balance-due">₹${(invoice.balanceDue || invoice.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p style="margin-top: 10px;">
                <strong>Sai Pathirakaliamman Textile Process</strong><br>
                Address: [Your Company Address Here]<br>
                GSTIN: [Your GST Number Here]
              </p>
              <p style="margin-top: 20px; font-size: 12px; color: #999;">
                This is a computer generated invoice. No signature required.
              </p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="
                padding: 12px 24px;
                background: #1976d2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                margin-right: 10px;
              ">
                Print Invoice
              </button>
              <button onclick="window.close()" style="
                padding: 12px 24px;
                background: #666;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">
                Close Window
              </button>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleSendReminder = async (invoice) => {
    try {
      await invoiceService.sendReminder(invoice._id);
      showAlert('Reminder sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending reminder:', error);
      showAlert(error?.message || 'Failed to send reminder', 'error');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusIcon = (status) => {
    const icons = {
      'unpaid': <Pending color="warning" />,
      'partially-paid': <Paid color="info" />,
      'paid': <Paid color="success" />,
      'overdue': <Error color="error" />
    };
    return icons[status] || <Pending />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'unpaid': 'warning',
      'partially-paid': 'info',
      'paid': 'success',
      'overdue': 'error'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const calculatePaymentProgress = (invoice) => {
    if (!invoice || !invoice.grandTotal || invoice.grandTotal === 0) return 0;
    const paid = invoice.amountPaid || 0;
    const progress = (paid / invoice.grandTotal) * 100;
    return Math.min(progress, 100);
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ open: true, message, severity });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, open: false }));
    }, 3000);
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const clearOrderFilter = () => {
    setIgnoreOrderFilter(true);
    showAlert('Showing all invoices', 'success');
  };

  const handleMakePayment = (invoice) => {
    // Show QR modal for quick demo payment flow
    setQrInvoice(invoice);
    setQrOpen(true);
  };

  const handleConfirmQrPayment = async (invoice) => {
    if (!invoice) return;
    try {
      setProcessingPayment(true);

      const payload = {
        amount: invoice.grandTotal || 0,
        paymentMethod: 'upi',
        transactionId: `QR-${Date.now()}`,
        bankName: '',
        chequeNumber: '',
        remarks: 'Paid via sample QR'
      };

      const res = await invoiceService.updatePaymentStatus(invoice._id, payload);
      const updatedInvoice = res?.data || res;

      // Update local state using server response
      setInvoices(prev => prev.map(inv => inv._id === invoice._id ? ({ ...updatedInvoice }) : inv));
      setFilteredInvoices(prev => prev.map(inv => inv._id === invoice._id ? ({ ...updatedInvoice }) : inv));
      if (selectedInvoice && selectedInvoice._id === invoice._id) {
        setSelectedInvoice({ ...updatedInvoice });
      }

      showAlert('Payment recorded as paid', 'success');
      setQrOpen(false);
      setQrInvoice(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
      showAlert(error?.message || 'Failed to record payment', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = filteredInvoices.map(invoice => ({
        'Invoice Number': invoice.invoiceNumber,
        'Order Number': invoice.order?.orderNumber || 'N/A',
        'Invoice Date': formatDate(invoice.invoiceDate),
        'Due Date': formatDate(invoice.dueDate),
        'Client': invoice.client?.companyName || invoice.client?.name || 'N/A',
        'Subtotal': formatCurrency(invoice.subtotal),
        'GST Amount': formatCurrency(invoice.gstAmount),
        'Grand Total': formatCurrency(invoice.grandTotal),
        'Amount Paid': formatCurrency(invoice.amountPaid),
        'Balance Due': formatCurrency(invoice.balanceDue),
        'Payment Status': invoice.paymentStatus,
        'Payment Method': invoice.paymentMethod || 'N/A'
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `invoices_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showAlert('Invoices exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting invoices:', error);
      showAlert('Failed to export invoices', 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Calculate totals
  const totalOutstanding = invoices
    .filter(inv => ['unpaid', 'partially-paid', 'overdue'].includes(inv.paymentStatus))
    .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  const overdueCount = invoices.filter(inv => 
    inv.paymentStatus === 'overdue' || 
    (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.paymentStatus !== 'paid')
  ).length;

  const paidCount = invoices.filter(inv => inv.paymentStatus === 'paid').length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert 
          elevation={6}
          variant="filled" 
          severity={alert.severity}
          onClose={handleCloseAlert}
        >
          {alert.message}
        </MuiAlert>
      </Snackbar>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Invoices & Payments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View, download, and manage your invoices and payments
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ 
                  bgcolor: 'primary.light', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Receipt sx={{ color: 'primary.main', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {invoices.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ 
                  bgcolor: 'warning.light', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Pending sx={{ color: 'warning.main', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatCurrency(totalOutstanding)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Outstanding
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ 
                  bgcolor: 'error.light', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Error sx={{ color: 'error.main', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {overdueCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ 
                  bgcolor: 'success.light', 
                  p: 1.5, 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Paid sx={{ color: 'success.main', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {paidCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Invoices
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Filter Alert */}
      {activeOrderFilter && (
        <MuiAlert 
          severity="info" 
          onClose={clearOrderFilter}
          sx={{ mb: 3, cursor: 'pointer' }}
        >
          Showing invoices for a specific order. Invoices are generated by the admin after order finalization. 
          <strong> Click to view all invoices</strong> or check back later if this order doesn't have an invoice yet.
        </MuiAlert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search invoices..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="unpaid">Unpaid</MenuItem>
                <MenuItem value="partially-paid">Partially Paid</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="Date"
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="this-week">This Week</MenuItem>
                <MenuItem value="this-month">This Month</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 2, md: 0 } }}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              sx={{ mr: 1, mb: { xs: 1, md: 0 } }}
            >
              Clear Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Invoice #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Order #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Due Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Paid</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 2 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Receipt sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No invoices found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {invoices.length === 0 ? 'No invoices available' : 'Try adjusting your filters'}
                    </Typography>
                    {activeOrderFilter && (
                      <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                        <Typography variant="body2" color="warning.main" sx={{ mb: 2, fontWeight: 500 }}>
                          📋 Invoice Not Generated Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          An invoice for this order hasn't been generated by the admin yet. 
                          <br/>
                          Once the order is ready, the admin will create the invoice.
                          <br/>
                          <br/>
                          Come back here later to view and download your invoice.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={clearOrderFilter}
                          >
                            View All Invoices
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => navigate('/client/orders')}
                          >
                            Back to Orders
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((invoice) => (
                <TableRow 
                  key={invoice._id || invoice.invoiceNumber} 
                  hover
                  sx={{ 
                    '&:hover': { backgroundColor: 'action.hover' },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.invoiceNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {invoice.order?.orderNumber || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(invoice.invoiceDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday 
                        fontSize="small" 
                        color={new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'paid' ? 'error' : 'inherit'} 
                      />
                      <Typography 
                        variant="body2" 
                        color={new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'paid' ? 'error' : 'inherit'}
                        fontWeight={new Date(invoice.dueDate) < new Date() && invoice.paymentStatus !== 'paid' ? 'bold' : 'normal'}
                      >
                        {formatDate(invoice.dueDate)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(invoice.grandTotal || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculatePaymentProgress(invoice)} 
                        color={
                          invoice.paymentStatus === 'paid' ? 'success' : 
                          invoice.paymentStatus === 'overdue' ? 'error' : 'primary'
                        }
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(invoice.amountPaid || 0)} / {formatCurrency(invoice.grandTotal || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(invoice.paymentStatus)}
                      label={invoice.paymentStatus?.toUpperCase() || 'UNPAID'}
                      color={getStatusColor(invoice.paymentStatus)}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        textTransform: 'uppercase',
                        fontWeight: 'medium',
                        borderWidth: 1.5
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(invoice)}
                          color="primary"
                          sx={{ '&:hover': { bgcolor: 'primary.light' } }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(invoice)}
                          color="secondary"
                          sx={{ '&:hover': { bgcolor: 'secondary.light' } }}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print">
                        <IconButton
                          size="small"
                          onClick={() => handlePrint(invoice)}
                          color="default"
                          sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(invoice.paymentStatus === 'overdue' || invoice.paymentStatus === 'unpaid') && (
                        <Tooltip title="Send Reminder">
                          <IconButton
                            size="small"
                            onClick={() => handleSendReminder(invoice)}
                            color="warning"
                            sx={{ '&:hover': { bgcolor: 'warning.light' } }}
                          >
                            <Email fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {invoice.balanceDue > 0 && (
                        <Tooltip title="Make Payment">
                          <IconButton
                            size="small"
                            onClick={() => handleMakePayment(invoice)}
                            color="success"
                            sx={{ '&:hover': { bgcolor: 'success.light' } }}
                          >
                            <AttachMoney fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
        />
      </TableContainer>

      {/* Invoice Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        {selectedInvoice && (
          <>
            <DialogTitle sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              py: 3
            }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Invoice Details - {selectedInvoice.invoiceNumber}
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedInvoice.paymentStatus)}
                  label={selectedInvoice.paymentStatus?.toUpperCase() || 'UNPAID'}
                  color={getStatusColor(selectedInvoice.paymentStatus)}
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers sx={{ py: 3 }}>
              <Grid container spacing={3}>
                {/* Invoice Header */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Invoice Date
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatDate(selectedInvoice.invoiceDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Due Date
                        </Typography>
                        <Typography 
                          variant="body1" 
                          fontWeight="medium"
                          color={new Date(selectedInvoice.dueDate) < new Date() ? 'error' : 'inherit'}
                        >
                          {formatDate(selectedInvoice.dueDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Order Number
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedInvoice.order?.orderNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Client
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedInvoice.client?.companyName || selectedInvoice.client?.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Payment Method
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedInvoice.paymentMethod?.toUpperCase() || 'Not Specified'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Payment Terms
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedInvoice.paymentTerms || 'Standard Terms'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Invoice Items */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Invoice Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.light' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Description</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Unit Price</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>GST %</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'white' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {item.description || 'Product/Service'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {item.quantity || 0}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {formatCurrency(item.unitPrice || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">
                                {item.gstPercentage || 18}%
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="medium">
                                {formatCurrency(item.total || 0)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Invoice Summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={8}>
                        <Typography variant="body1" color="text.secondary">
                          Subtotal
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography variant="body1">
                          {formatCurrency(selectedInvoice.subtotal || 0)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body1" color="text.secondary">
                          GST Amount
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography variant="body1">
                          {formatCurrency(selectedInvoice.gstAmount || 0)}
                        </Typography>
                      </Grid>
                      
                      {(selectedInvoice.shippingCharges || 0) > 0 && (
                        <>
                          <Grid item xs={8}>
                            <Typography variant="body1" color="text.secondary">
                              Shipping Charges
                            </Typography>
                          </Grid>
                          <Grid item xs={4} textAlign="right">
                            <Typography variant="body1">
                              {formatCurrency(selectedInvoice.shippingCharges)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      {(selectedInvoice.discount || 0) > 0 && (
                        <>
                          <Grid item xs={8}>
                            <Typography variant="body1" color="success.main">
                              Discount
                            </Typography>
                          </Grid>
                          <Grid item xs={4} textAlign="right">
                            <Typography variant="body1" color="success.main">
                              -{formatCurrency(selectedInvoice.discount)}
                            </Typography>
                          </Grid>
                        </>
                      )}
                      
                      <Grid item xs={8}>
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          Grand Total
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                          {formatCurrency(selectedInvoice.grandTotal || 0)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body1" color="text.secondary">
                          Amount Paid
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography variant="body1" color="success.main" fontWeight="medium">
                          {formatCurrency(selectedInvoice.amountPaid || 0)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={8}>
                        <Typography variant="body1" fontWeight="bold">
                          Balance Due
                        </Typography>
                      </Grid>
                      <Grid item xs={4} textAlign="right">
                        <Typography 
                          variant="body1" 
                          fontWeight="bold"
                          color={(selectedInvoice.balanceDue || 0) > 0 ? 'error.main' : 'success.main'}
                        >
                          {formatCurrency(selectedInvoice.balanceDue || selectedInvoice.grandTotal || 0)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Payment Details */}
                {selectedInvoice.paymentDetails && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      Payment Details
                    </Typography>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Grid container spacing={3}>
                        {selectedInvoice.paymentDetails.transactionId && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Transaction ID
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedInvoice.paymentDetails.transactionId}
                            </Typography>
                          </Grid>
                        )}
                        {selectedInvoice.paymentDetails.paymentDate && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Payment Date
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {formatDate(selectedInvoice.paymentDetails.paymentDate)}
                            </Typography>
                          </Grid>
                        )}
                        {selectedInvoice.paymentDetails.bankName && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Bank Name
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedInvoice.paymentDetails.bankName}
                            </Typography>
                          </Grid>
                        )}
                        {selectedInvoice.paymentDetails.chequeNumber && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Cheque Number
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedInvoice.paymentDetails.chequeNumber}
                            </Typography>
                          </Grid>
                        )}
                        {selectedInvoice.paymentDetails.remarks && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Remarks
                            </Typography>
                            <Typography variant="body1">
                              {selectedInvoice.paymentDetails.remarks}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => setOpenDialog(false)}
                sx={{ minWidth: 100 }}
              >
                Close
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => {
                  handlePrint(selectedInvoice);
                  setOpenDialog(false);
                }}
                sx={{ minWidth: 120 }}
              >
                Print
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={() => {
                  handleDownload(selectedInvoice);
                  setOpenDialog(false);
                }}
                color="primary"
                sx={{ minWidth: 140 }}
              >
                Download PDF
              </Button>
              {(selectedInvoice.balanceDue || selectedInvoice.grandTotal || 0) > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AttachMoney />}
                  onClick={() => {
                    handleMakePayment(selectedInvoice);
                    setOpenDialog(false);
                  }}
                  sx={{ minWidth: 140 }}
                >
                  Pay Now
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* QR Payment Dialog (demo) */}
      <Dialog
        open={qrOpen}
        onClose={() => { if (!processingPayment) { setQrOpen(false); setQrInvoice(null); } }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Scan QR to Pay</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <img
              alt="Sample QR"
              src="https://via.placeholder.com/260x260.png?text=QR+CODE"
              style={{ width: 260, height: 260, objectFit: 'cover', borderRadius: 8 }}
            />
            <Typography variant="h6">
              Amount: {formatCurrency(qrInvoice?.balanceDue || qrInvoice?.grandTotal || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is a demo QR. Click Confirm to mark invoice as paid.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => { setQrOpen(false); setQrInvoice(null); }} disabled={processingPayment}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleConfirmQrPayment(qrInvoice)}
            disabled={processingPayment}
          >
            {processingPayment ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Invoices;