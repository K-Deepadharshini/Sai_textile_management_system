import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Grid, Card, CardContent, CardMedia, CardActions,
  Typography, Button, Chip, Box, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Rating, Pagination, Stack,
  Tooltip, CircularProgress, InputAdornment, Paper
} from '@mui/material';
import {
  FilterList, Search, Visibility, ShoppingCart,
  Palette, Scale, LocalOffer, Inventory
} from '@mui/icons-material';
import { productService } from '../../services';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    denier: '',
    shade: '',
    minPrice: '',
    maxPrice: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [productsPerPage] = useState(12);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAvailableProducts();
      // Normalize possible response shapes:
      // - axios response -> response.data = { success, data }
      // - service returned server JSON -> response = { success, data }
      // - direct array -> response = [ ... ]
      const serverPayload = response?.data ?? response;
      const list = Array.isArray(serverPayload)
        ? serverPayload
        : (serverPayload?.data ?? serverPayload?.data ?? serverPayload?.data) || serverPayload?.data || [];
      // Fallback: if serverPayload has 'data' field use it, else if it's array use it
      const productsArray = Array.isArray(serverPayload)
        ? serverPayload
        : Array.isArray(serverPayload?.data)
          ? serverPayload.data
          : [];

      // Ensure each product has a status (endpoint may omit status)
      const normalizedProducts = productsArray.map(p => ({
        ...p,
        status: p?.status || ((p?.stockQuantity && Number(p.stockQuantity) > 0) ? 'available' : 'out-of-stock')
      }));

      setProducts(normalizedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product => {
        const name = (product?.name || '').toString().toLowerCase();
        const code = (product?.productCode || product?._id || '').toString().toLowerCase();
        const desc = (product?.description || '').toString().toLowerCase();
        const type = (product?.type || '').toString().toLowerCase();
        const denier = (product?.denier || '').toString().toLowerCase();
        const shade = (product?.shade?.colorName || '').toString().toLowerCase();
        return (
          name.includes(term) ||
          code.includes(term) ||
          desc.includes(term) ||
          type.includes(term) ||
          denier.includes(term) ||
          shade.includes(term)
        );
      });
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(product => (product?.type || '').toString() === filters.type.toString());
    }

    // Apply denier filter
    if (filters.denier) {
      filtered = filtered.filter(product => (product?.denier || '').toString() === filters.denier.toString());
    }

    // Apply shade filter
    if (filters.shade) {
      filtered = filtered.filter(product => 
        product.shade?.colorName?.toLowerCase().includes(filters.shade.toLowerCase())
      );
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter(product => product.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(product => product.price <= parseFloat(filters.maxPrice));
    }

    // Apply status filter (only if explicitly set)
    if (filters.status && filters.status !== '') {
      filtered = filtered.filter(product => product.status === filters.status);
    }

    setFilteredProducts(filtered);
    setPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      denier: '',
      shade: '',
      minPrice: '',
      maxPrice: '',
      status: 'available'
    });
    setSearchTerm('');
  };

  const getUniqueValues = (field) => {
    const values = products.map(product => product[field]).filter(Boolean);
    return [...new Set(values)];
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
  };

  const handlePlaceOrder = (product) => {
    // Navigate to new order page with product pre-selected
    navigate(`/client/orders/new?product=${product._id}`);
  };

  // Calculate pagination
  const indexOfLastProduct = page * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getProductTypeLabel = (type) => {
    const labels = {
      'polyester-filament': 'Polyester Filament',
      'yarn-dyed': 'Yarn Dyed',
      'raw-yarn': 'Raw Yarn'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'success',
      'out-of-stock': 'error',
      'discontinued': 'default'
    };
    return colors[status] || 'default';
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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#2c3e50', fontWeight: 'bold' }}>
        Available Products
      </Typography>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search Products"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {getUniqueValues('type').map(type => (
                  <MenuItem key={type} value={type}>
                    {getProductTypeLabel(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Denier</InputLabel>
              <Select
                value={filters.denier}
                onChange={(e) => handleFilterChange('denier', e.target.value)}
                label="Denier"
              >
                <MenuItem value="">All Deniers</MenuItem>
                {getUniqueValues('denier').map(denier => (
                  <MenuItem key={denier} value={denier}>{denier}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Min Price"
              type="number"
              variant="outlined"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              label="Max Price"
              type="number"
              variant="outlined"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              startIcon={<FilterList />}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Products Grid */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory /> Showing {filteredProducts.length} Products
        </Typography>
        {filteredProducts.length === 0 ? (
          <Box textAlign="center" py={10}>
            <Typography variant="h6" color="text.secondary">
              No products found matching your criteria
            </Typography>
            <Button variant="contained" onClick={clearFilters} sx={{ mt: 2 }}>
              Clear All Filters
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {currentProducts.map((product) => (
                <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Product Image */}
                    <CardMedia
                      component="div"
                      sx={{
                        height: 200,
                        bgcolor: product.shade?.hexCode || '#e0e0e0',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Palette sx={{ fontSize: 60, color: 'white' }} />
                          <Typography variant="h6" color="white" sx={{ mt: 1 }}>
                            {product.shade?.colorName || 'No Image'}
                          </Typography>
                        </Box>
                      )}
                      <Chip
                        label={getStatusColor(product.status)}
                        color={getStatusColor(product.status)}
                        size="small"
                        sx={{ position: 'absolute', top: 10, right: 10 }}
                      />
                    </CardMedia>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2">
                        {product.name}
                      </Typography>
                      
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            Code:
                          </Typography>
                          <Chip label={product.productCode} size="small" variant="outlined" />
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Scale sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Denier: {product.denier}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Palette sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Shade: {product.shade?.colorName || 'N/A'}
                          </Typography>
                          {product.shade?.hexCode && (
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                bgcolor: product.shade.hexCode,
                                border: '1px solid #ccc'
                              }}
                            />
                          )}
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocalOffer sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            MOQ: {product.moq} {product.unit}
                          </Typography>
                        </Box>
                      </Stack>

                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatCurrency(product.price)}/{product.unit}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" display="block">
                        Stock: {product.stockQuantity} {product.unit}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        onClick={() => handlePlaceOrder(product)}
                        disabled={product.status !== 'available'}
                      >
                        {product.status === 'available' ? 'Order Now' : 'Out of Stock'}
                      </Button>
                      <IconButton
                        onClick={() => handleViewDetails(product)}
                        sx={{ ml: 'auto' }}
                      >
                        <Tooltip title="View Details">
                          <Visibility />
                        </Tooltip>
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Product Details Dialog */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">{selectedProduct.name}</Typography>
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      height: 300,
                      bgcolor: selectedProduct.shade?.hexCode || '#e0e0e0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {selectedProduct.images?.[0]?.url ? (
                      <img
                        src={selectedProduct.images[0].url}
                        alt={selectedProduct.name}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <Palette sx={{ fontSize: 100, color: 'white' }} />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Product Code
                      </Typography>
                      <Typography variant="body1">{selectedProduct.productCode}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body1">
                        {getProductTypeLabel(selectedProduct.type)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Specifications
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2">Denier: {selectedProduct.denier}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Twist: {selectedProduct.specifications?.twist || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Tenacity: {selectedProduct.specifications?.tenacity || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            Elongation: {selectedProduct.specifications?.elongation || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Shade Details
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="body1">
                          {selectedProduct.shade?.colorName || 'N/A'}
                        </Typography>
                        {selectedProduct.shade?.hexCode && (
                          <Box
                            sx={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              bgcolor: selectedProduct.shade.hexCode,
                              border: '2px solid #ccc'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pricing
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {formatCurrency(selectedProduct.price)}/{selectedProduct.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        GST: {selectedProduct.gstPercentage}%
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Minimum Order Quantity
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.moq} {selectedProduct.unit}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Available Stock
                      </Typography>
                      <Typography variant="body1">
                        {selectedProduct.stockQuantity} {selectedProduct.unit}
                      </Typography>
                    </Box>
                    
                    {selectedProduct.description && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">
                          {selectedProduct.description}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setSelectedProduct(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<ShoppingCart />}
                onClick={() => {
                  handlePlaceOrder(selectedProduct);
                  setSelectedProduct(null);
                }}
                disabled={selectedProduct.status !== 'available'}
              >
                Place Order
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Products;