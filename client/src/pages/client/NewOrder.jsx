import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, TextField, Button, Grid, Card, CardContent,
  MenuItem, Select, FormControl, InputLabel, IconButton, Divider
} from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { productService, orderService } from '../../services';
import './NewOrder.css';

const NewOrder = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const prefillProductId = params.get('product');

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState(prefillProductId ? [{ product: prefillProductId, quantity: 1 }] : [{ product: '', quantity: 1 }]);
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', pincode: '', country: '' });
  const [billingAddress, setBillingAddress] = useState({ street: '', city: '', state: '', pincode: '', country: '' });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [paymentTerms, setPaymentTerms] = useState('net-15');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  useEffect(() => {
    // If prefill product id provided, ensure first item uses it and set unit price
    if (prefillProductId && items.length === 1) {
      const prod = products.find(p => (p._id || p.id) === prefillProductId);
      setItems([{ product: prefillProductId, quantity: 1, unitPrice: prod?.price || 0 }]);
    }
  }, [prefillProductId, products]);

  const fetchAvailableProducts = async () => {
    try {
      const res = await productService.getAvailableProducts();
      const list = res?.data?.data || res?.data || res || [];
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const updateItem = (index, key, value) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: value };
    
    // If product changed, auto-set unit price
    if (key === 'product' && value) {
      const prod = products.find(p => (p._id || p.id) === value);
      if (prod && prod.price) {
        next[index].unitPrice = prod.price;
      }
    }
    
    setItems(next);
  };

  const addItem = () => setItems([...items, { product: '', quantity: 1 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const validateItems = () => {
    for (const it of items) {
      if (!it.product) {
        toast.error('Please select product for all items');
        return false;
      }
      if (!it.quantity || Number(it.quantity) < 1) {
        toast.error('Quantity must be at least 1');
        return false;
      }
      const prod = products.find(p => p._id === it.product || p.id === it.product);
      if (prod) {
        if (prod.moq && Number(it.quantity) < prod.moq) {
          toast.error(`Minimum order quantity for ${prod.name || prod.productCode} is ${prod.moq}`);
          return false;
        }
        if (typeof prod.stockQuantity === 'number' && Number(it.quantity) > prod.stockQuantity) {
          toast.error(`Insufficient stock for ${prod.name || prod.productCode}. Available: ${prod.stockQuantity}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateItems()) return;
    setLoading(true);
    try {
      const orderItems = items.map(it => {
        const prod = products.find(p => p._id === it.product || p.id === it.product) || {};
        return {
          product: it.product,
          quantity: Number(it.quantity),
          unitPrice: prod.price || it.unitPrice || 0
        };
      });

      const payload = {
        items: orderItems,
        shippingAddress,
        billingAddress,
        deliveryDate: deliveryDate || null,
        priority,
        paymentTerms,
        notes
      };

      await orderService.createOrder(payload);
      toast.success('Order created');
      navigate('/client/orders');
    } catch (error) {
      // Log full error details for debugging
      console.error('Create order error', error);
      console.error('Create order error response:', error?.response || error);

      // Prefer structured server message when available
      const serverMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      const message = serverMessage || 'Failed to create order';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-order-container">
      <Paper className="new-order-paper">
        <div className="new-order-header">
          <Typography variant="h5">Create New Order</Typography>
        </div>

        <Box component="form" onSubmit={handleSubmit} className="new-order-form">
          <Typography variant="h6" className="section-title">Items</Typography>
          {items.map((it, idx) => (
            <Card key={idx} className="item-card">
              <CardContent>
                <Grid container spacing={2} className="item-grid">
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth className="product-select">
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={it.product}
                        label="Product"
                        onChange={(e) => updateItem(idx, 'product', e.target.value)}
                      >
                        <MenuItem value="">Select product</MenuItem>
                        {products.map(p => (
                          <MenuItem key={p._id || p.id} value={p._id || p.id}>{p.name || p.productCode} - ₹{p.price}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField 
                      label="Quantity" 
                      type="number" 
                      fullWidth 
                      className="quantity-field"
                      value={it.quantity} 
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)} 
                      inputProps={{ min: 1 }} 
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField 
                      label="Unit Price" 
                      type="number" 
                      fullWidth 
                      className="unit-price-field"
                      value={it.unitPrice || ''} 
                      disabled 
                    />
                  </Grid>

                  <Grid item xs={12} md={2}>
                    <IconButton 
                      onClick={() => removeItem(idx)} 
                      disabled={items.length === 1} 
                      className="remove-btn"
                      aria-label="remove"
                    >
                      <RemoveCircleOutline />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<AddCircleOutline />} className="add-item-btn" onClick={addItem}>Add Item</Button>
          </Box>

          <Divider className="divider-custom" />

          <div className="address-section">
            <Typography variant="h6" className="section-title">Shipping Address</Typography>
            <Grid container spacing={2} className="address-grid">
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Street" 
                  fullWidth 
                  className="address-field"
                  value={shippingAddress.street} 
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="City" 
                  fullWidth 
                  className="address-field"
                  value={shippingAddress.city} 
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="State" 
                  fullWidth 
                  className="address-field"
                  value={shippingAddress.state} 
                  onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Pincode" 
                  fullWidth 
                  className="address-field"
                  value={shippingAddress.pincode} 
                  onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Country" 
                  fullWidth 
                  className="address-field"
                  value={shippingAddress.country} 
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })} 
                />
              </Grid>
            </Grid>
          </div>

          <div className="address-section">
            <Typography variant="h6" className="section-title">Billing Address</Typography>
            <Grid container spacing={2} className="address-grid">
              <Grid item xs={12} md={6}>
                <TextField 
                  label="Street" 
                  fullWidth 
                  className="address-field"
                  value={billingAddress.street} 
                  onChange={(e) => setBillingAddress({ ...billingAddress, street: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField 
                  label="City" 
                  fullWidth 
                  className="address-field"
                  value={billingAddress.city} 
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="State" 
                  fullWidth 
                  className="address-field"
                  value={billingAddress.state} 
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Pincode" 
                  fullWidth 
                  className="address-field"
                  value={billingAddress.pincode} 
                  onChange={(e) => setBillingAddress({ ...billingAddress, pincode: e.target.value })} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Country" 
                  fullWidth 
                  className="address-field"
                  value={billingAddress.country} 
                  onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })} 
                />
              </Grid>
            </Grid>
          </div>

          <div className="form-controls">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField 
                  label="Delivery Date" 
                  type="date" 
                  fullWidth 
                  InputLabelProps={{ shrink: true }} 
                  value={deliveryDate} 
                  onChange={(e) => setDeliveryDate(e.target.value)} 
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth className="priority-select">
                  <InputLabel>Priority</InputLabel>
                  <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth className="payment-select">
                  <InputLabel>Payment Terms</InputLabel>
                  <Select value={paymentTerms} label="Payment Terms" onChange={(e) => setPaymentTerms(e.target.value)}>
                    <MenuItem value="advance">Advance</MenuItem>
                    <MenuItem value="net-7">Net 7</MenuItem>
                    <MenuItem value="net-15">Net 15</MenuItem>
                    <MenuItem value="net-30">Net 30</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Notes" 
                  multiline 
                  rows={3} 
                  fullWidth 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                />
              </Grid>
            </Grid>
          </div>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="outlined" 
              sx={{ mr: 2 }} 
              onClick={() => navigate('/client/orders')} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              size="large" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Creating Order...' : 'Create Order'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default NewOrder;
