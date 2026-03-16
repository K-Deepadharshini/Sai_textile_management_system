import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, Paper, Typography, Box, Card, CardContent, 
  List, ListItem, ListItemText, Divider, Chip, 
  Button, LinearProgress, CircularProgress 
} from '@mui/material';
import { 
  ShoppingCart, LocalShipping, Receipt, 
  Inventory, TrendingUp, Warning 
} from '@mui/icons-material';
import { orderService, invoiceService, productService } from '../../services';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    activeOrders: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    availableProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ordersRes, invoicesRes, productsRes] = await Promise.all([
        orderService.getClientOrders(),
        invoiceService.getClientInvoices(),
        productService.getAvailableProducts()
      ]);

      const orders = ordersRes.data || [];
      const invoices = invoicesRes.data || [];
      const products = productsRes.data || [];

      // Calculate statistics
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const activeOrders = orders.filter(o => 
        ['in-production', 'quality-check', 'ready-for-dispatch'].includes(o.status)
      ).length;
      
      const pendingInvoicesList = invoices.filter(i => i.paymentStatus !== 'paid');
      
      setStats({
        totalOrders: orders.length,
        pendingOrders,
        activeOrders,
        totalInvoices: invoices.length,
        pendingInvoices: pendingInvoicesList.length,
        availableProducts: products.length
      });

      setRecentOrders(orders.slice(0, 5));
      setPendingInvoices(pendingInvoicesList.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'warning',
      'confirmed': 'info',
      'in-production': 'primary',
      'ready-for-dispatch': 'secondary',
      'dispatched': 'success',
      'delivered': 'success',
      'cancelled': 'error'
    };
    return statusColors[status] || 'default';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', bgcolor: `${color}.light`, color: `${color}.dark` }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ bgcolor: `${color}.main`, p: 1.5, borderRadius: '50%' }}>
            {React.cloneElement(icon, { sx: { fontSize: 30, color: 'white' } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#2c3e50', fontWeight: 'bold' }}>
        Client Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingCart />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Orders"
            value={stats.pendingOrders}
            icon={<Warning />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Active Orders"
            value={stats.activeOrders}
            icon={<TrendingUp />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Invoices"
            value={stats.totalInvoices}
            icon={<Receipt />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pending Payments"
            value={stats.pendingInvoices}
            icon={<Warning />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Available Products"
            value={stats.availableProducts}
            icon={<Inventory />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Recent Orders Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Recent Orders
              </Typography>
              <Button variant="outlined" size="small" href="/client/orders">
                View All
              </Button>
            </Box>
            <List>
              {recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No recent orders found
                </Typography>
              ) : (
                recentOrders.map((order, index) => (
                  <React.Fragment key={order._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="subtitle1">
                              {order.orderNumber}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              color={getStatusColor(order.status)}
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Date: {new Date(order.orderDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Total: {formatCurrency(order.grandTotal)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Pending Invoices Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Pending Payments
              </Typography>
              <Button variant="outlined" size="small" href="/client/invoices">
                View All
              </Button>
            </Box>
            <List>
              {pendingInvoices.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No pending payments
                </Typography>
              ) : (
                pendingInvoices.map((invoice, index) => (
                  <React.Fragment key={invoice._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="subtitle1">
                              {invoice.invoiceNumber}
                            </Typography>
                            <Chip
                              label={invoice.paymentStatus}
                              size="small"
                              color={
                                invoice.paymentStatus === 'overdue' ? 'error' : 
                                invoice.paymentStatus === 'partially-paid' ? 'warning' : 'default'
                              }
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Amount: {formatCurrency(invoice.balanceDue)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pendingInvoices.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/client/orders/new')}
              sx={{ py: 1.5 }}
            >
              New Order
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Receipt />}
              href="/client/invoices"
              sx={{ py: 1.5 }}
            >
              View Invoices
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LocalShipping />}
              href="/client/orders?status=dispatched"
              sx={{ py: 1.5 }}
            >
              Track Orders
            </Button>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Inventory />}
              href="/client/products"
              sx={{ py: 1.5 }}
            >
              Browse Products
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;