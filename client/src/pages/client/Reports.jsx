import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Grid, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, TextField, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Tabs, Tab, LinearProgress, Alert, Divider
} from '@mui/material';
import {
  Download, PictureAsPdf, TableChart, BarChart,
  CalendarToday, FilterList, Print, Email, TrendingUp,
  Inventory, ShoppingCart, AttachMoney, Receipt
} from '@mui/icons-material';
import { reportService, orderService, invoiceService } from '../../services';
import { formatDate } from '../../utils/formatDate';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart as RechartsLineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [reportType, setReportType] = useState('orders');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  const [exportDialog, setExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, invoicesRes] = await Promise.all([
        orderService.getClientOrders(),
        invoiceService.getClientInvoices()
      ]);

      setOrders(ordersRes.data || []);
      setInvoices(invoicesRes.data || []);
      // Reports data is derived from orders and invoices, no need for separate API call
      setReports([]);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExport = async (format) => {
    try {
      let data;
      let filename;
      
      switch (reportType) {
        case 'orders':
          data = filteredOrders;
          filename = `orders_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'invoices':
          data = filteredInvoices;
          filename = `invoices_report_${new Date().toISOString().split('T')[0]}`;
          break;
        case 'client':
          data = [summaryData];
          filename = `summary_report_${new Date().toISOString().split('T')[0]}`;
          break;
        default:
          return;
      }

      if (format === 'pdf') {
        // reportService.generatePDFReport returns a Blob (response.data)
        const blob = await reportService.generatePDFReport(reportType, { data, dateRange, filename });
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (format === 'excel') {
        const blob = await reportService.generateExcelReport(reportType, { data, dateRange, filename });
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Generate CSV client-side
        if (!data || data.length === 0) {
          throw new Error('No data to export');
        }
        const keys = Object.keys(data[0]);
        const csvRows = [keys.join(',')];
        for (const row of data) {
          csvRows.push(keys.map(k => {
            const val = row[k] === undefined || row[k] === null ? '' : String(row[k]);
            return `"${val.replace(/"/g, '""')}"`;
          }).join(','));
        }
        const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      setExportDialog(false);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    return orderDate >= new Date(dateRange.startDate) && 
           orderDate <= new Date(dateRange.endDate);
  });

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoiceDate);
    return invoiceDate >= new Date(dateRange.startDate) && 
           invoiceDate <= new Date(dateRange.endDate);
  });

  // Calculate summary statistics
  const summaryData = {
    totalOrders: filteredOrders.length,
    totalInvoices: filteredInvoices.length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
    totalPaid: filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
    totalOutstanding: filteredInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
    averageOrderValue: filteredOrders.length > 0 ? 
      filteredOrders.reduce((sum, order) => sum + order.grandTotal, 0) / filteredOrders.length : 0
  };

  // Chart data
  const orderStatusData = [
    { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length },
    { name: 'Confirmed', value: filteredOrders.filter(o => o.status === 'confirmed').length },
    { name: 'In Production', value: filteredOrders.filter(o => o.status === 'in-production').length },
    { name: 'Dispatched', value: filteredOrders.filter(o => o.status === 'dispatched').length },
    { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length },
  ];

  const paymentStatusData = [
    { name: 'Paid', value: filteredInvoices.filter(inv => inv.paymentStatus === 'paid').length },
    { name: 'Unpaid', value: filteredInvoices.filter(inv => inv.paymentStatus === 'unpaid').length },
    { name: 'Partially Paid', value: filteredInvoices.filter(inv => inv.paymentStatus === 'partially-paid').length },
    { name: 'Overdue', value: filteredInvoices.filter(inv => inv.paymentStatus === 'overdue').length },
  ];

  const monthlySalesData = [
    { month: 'Jan', sales: 450000 },
    { month: 'Feb', sales: 520000 },
    { month: 'Mar', sales: 480000 },
    { month: 'Apr', sales: 550000 },
    { month: 'May', sales: 600000 },
    { month: 'Jun', sales: 580000 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and analyze your business reports
        </Typography>
      </Box>

      {/* Date Range Filter */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="orders">Order Report</MenuItem>
                <MenuItem value="invoices">Invoice Report</MenuItem>
                <MenuItem value="client">Summary Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => setExportDialog(true)}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={() => window.print()}
            >
              Print
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<BarChart />} label="Overview" />
          <Tab icon={<ShoppingCart />} label="Orders" />
          <Tab icon={<Receipt />} label="Invoices" />
          <Tab icon={<TrendingUp />} label="Analytics" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'primary.light', p: 1.5, borderRadius: '50%' }}>
                    <ShoppingCart sx={{ color: 'primary.main', fontSize: 30 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryData.totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Orders
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'success.light', p: 1.5, borderRadius: '50%' }}>
                    <AttachMoney sx={{ color: 'success.main', fontSize: 30 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(summaryData.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Value
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'warning.light', p: 1.5, borderRadius: '50%' }}>
                    <Receipt sx={{ color: 'warning.main', fontSize: 30 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {summaryData.totalInvoices}
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
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ bgcolor: 'error.light', p: 1.5, borderRadius: '50%' }}>
                    <Inventory sx={{ color: 'error.main', fontSize: 30 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(summaryData.totalOutstanding)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Payment Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={paymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Orders Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Order Report ({filteredOrders.length} orders)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('excel')}
            >
              Export as Excel
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell>{formatCurrency(order.grandTotal)}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        size="small"
                        color={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'cancelled' ? 'error' :
                          'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.paymentStatus}
                        size="small"
                        color={
                          order.paymentStatus === 'paid' ? 'success' :
                          order.paymentStatus === 'overdue' ? 'error' :
                          'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Invoices Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              Invoice Report ({filteredInvoices.length} invoices)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('excel')}
            >
              Export as Excel
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice._id} hover>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(invoice.grandTotal)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell>{formatCurrency(invoice.balanceDue)}</TableCell>
                    <TableCell>
                      <Chip
                        label={invoice.paymentStatus}
                        size="small"
                        color={
                          invoice.paymentStatus === 'paid' ? 'success' :
                          invoice.paymentStatus === 'overdue' ? 'error' :
                          'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Analytics Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Sales Trend
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={monthlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                </RechartsLineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Average Order Value Trend
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" color="primary">
                  {formatCurrency(summaryData.averageOrderValue)}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Average value per order
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Collection Efficiency
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Collected: {formatCurrency(summaryData.totalPaid)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(summaryData.totalPaid / summaryData.totalAmount) * 100} 
                      color="success"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Outstanding: {formatCurrency(summaryData.totalOutstanding)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(summaryData.totalOutstanding / summaryData.totalAmount) * 100} 
                      color="error"
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format"
            >
              <MenuItem value="pdf">PDF Document</MenuItem>
              <MenuItem value="excel">Excel Spreadsheet</MenuItem>
              <MenuItem value="csv">CSV File</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              The report will include data from {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => handleExport(exportFormat)}
            startIcon={exportFormat === 'pdf' ? <PictureAsPdf /> : <TableChart />}
          >
            Export as {exportFormat.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reports;