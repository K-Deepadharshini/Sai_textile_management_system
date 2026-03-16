import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Button, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Grid, Stack, CircularProgress,
  Tooltip, Alert, Card, CardContent
} from '@mui/material';
import {
  Add, Visibility, Edit, Delete, Search, FilterList,
  ShoppingCart, CheckCircle, LocalShipping, Schedule,
  Error, Cancel, AttachMoney
} from '@mui/icons-material';
import { orderService } from '../../services';
import { formatDate } from '../../utils/formatDate';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getClientOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.client?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= startOfDay
          );
          break;
        case 'this-week':
          const startOfWeek = new Date(startOfDay);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= startOfWeek
          );
          break;
        case 'this-month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(order => 
            new Date(order.orderDate) >= startOfMonth
          );
          break;
        case 'last-month':
          const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
          });
          break;
      }
    }

    setFilteredOrders(filtered);
    setPage(0);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleNewOrder = () => {
    navigate('/client/orders/new');
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
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
      'pending': <Schedule color="warning" />,
      'confirmed': <CheckCircle color="info" />,
      'in-production': <Schedule color="primary" />,
      'ready-for-dispatch': <LocalShipping color="secondary" />,
      'dispatched': <LocalShipping color="action" />,
      'delivered': <CheckCircle color="success" />,
      'cancelled': <Cancel color="error" />
    };
    return icons[status] || <Schedule />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'confirmed': 'info',
      'in-production': 'primary',
      'ready-for-dispatch': 'secondary',
      'dispatched': 'default',
      'delivered': 'success',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'partially-paid': 'info',
      'paid': 'success',
      'overdue': 'error'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateOrderProgress = (order) => {
    const statusProgress = {
      'pending': 10,
      'confirmed': 25,
      'in-production': 50,
      'quality-check': 75,
      'ready-for-dispatch': 90,
      'dispatched': 95,
      'delivered': 100
    };
    return statusProgress[order.status] || 0;
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
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          My Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage all your orders in one place
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: '50%' }}>
                  <ShoppingCart sx={{ color: 'primary.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ bgcolor: 'warning.light', p: 1, borderRadius: '50%' }}>
                  <Schedule sx={{ color: 'warning.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ bgcolor: 'info.light', p: 1, borderRadius: '50%' }}>
                  <LocalShipping sx={{ color: 'info.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.filter(o => ['in-production', 'ready-for-dispatch', 'dispatched'].includes(o.status)).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: '50%' }}>
                  <CheckCircle sx={{ color: 'success.main' }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {orders.filter(o => o.status === 'delivered').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Delivered
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search orders..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="in-production">In Production</MenuItem>
                <MenuItem value="ready-for-dispatch">Ready for Dispatch</MenuItem>
                <MenuItem value="dispatched">Dispatched</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
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
                <MenuItem value="last-month">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewOrder}
              sx={{ mr: 1 }}
            >
              New Order
            </Button>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <div className="table-responsive">
        <TableContainer component={Paper}>
          <Table>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order #</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Items</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payment</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.orderDate)}
                    </Typography>
                    {order.deliveryDate && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Delivery: {formatDate(order.deliveryDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.items?.length || 0} items
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {order.items?.[0]?.product?.name || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(order.grandTotal)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(order.status)}
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Progress: {calculateOrderProgress(order)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus}
                      color={getPaymentStatusColor(order.paymentStatus)}
                      size="small"
                    />
                    {order.paymentDueDate && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Due: {formatDate(order.paymentDueDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(order)}
                          color="primary"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {order.status === 'pending' && (
                        <Tooltip title="Cancel Order">
                          <IconButton
                            size="small"
                            onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                            color="error"
                          >
                            <Delete fontSize="small" />
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
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      </div>

      {/* Order Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" component="div">Order Details - {selectedOrder.orderNumber}</Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                {/* Order Summary */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Order Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedOrder.orderDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Delivery Date
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.deliveryDate ? formatDate(selectedOrder.deliveryDate) : 'Not Set'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Status
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(selectedOrder.status)}
                          <Typography variant="body1" textTransform="capitalize">
                            {selectedOrder.status}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Priority
                        </Typography>
                        <Chip
                          label={selectedOrder.priority}
                          color={selectedOrder.priority === 'urgent' ? 'error' : 'default'}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Order Items */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2">
                                {item.product?.name || 'Product'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.product?.productCode || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {item.quantity} {item.product?.unit || 'kg'}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell align="right">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="body1">Subtotal</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1">
                              {formatCurrency(selectedOrder.totalAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="body1">GST ({selectedOrder.items?.[0]?.gstPercentage || 18}%)</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1">
                              {formatCurrency(selectedOrder.gstAmount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="body1" fontWeight="bold">
                              Grand Total
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight="bold">
                              {formatCurrency(selectedOrder.grandTotal)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Shipping Address */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Shipping Address
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    {selectedOrder.shippingAddress ? (
                      <>
                        <Typography variant="body1">
                          {selectedOrder.shippingAddress.street}
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.shippingAddress.pincode}
                        </Typography>
                        <Typography variant="body1">
                          {selectedOrder.shippingAddress.country}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No shipping address provided
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                {/* Production Progress */}
                {selectedOrder.productionBatches && selectedOrder.productionBatches.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Production Status
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        {selectedOrder.productionBatches.map((batchId, index) => (
                          <Box key={index} display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">
                              Batch #{batchId.slice(-6)}: In Progress
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Notes
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="body2">
                      {selectedOrder.notes}
                    </Typography>
                  </Paper>
                </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              {selectedOrder.status === 'pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    handleStatusUpdate(selectedOrder._id, 'cancelled');
                    setOpenDialog(false);
                  }}
                >
                  Cancel Order
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<AttachMoney />}
                href={`/client/invoices?order=${selectedOrder._id}`}
              >
                View Invoice
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Orders;