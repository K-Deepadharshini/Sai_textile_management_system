import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaBox, FaFilter, FaImage, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import productService from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    console.log('📦 Starting fetchProducts...');
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      console.log('📦 API Response:', response);
      
      if (response && response.success) {
        console.log(`📦 Success! Found ${response.data.length} products`);
        
        // Debug each product thoroughly
        response.data.forEach((product, index) => {
          console.log(`\n📋 Product ${index + 1}:`);
          console.log('  ID:', product._id);
          console.log('  Name:', product.name);
          console.log('  Code:', product.productCode);
          console.log('  Has images array?', Array.isArray(product.images));
          console.log('  Images length:', product.images?.length || 0);
          
          if (product.images && product.images.length > 0) {
            console.log('  Images found:');
            product.images.forEach((img, imgIndex) => {
              console.log(`    Image ${imgIndex + 1}:`);
              console.log('      URL:', img.url);
              console.log('      Full image object:', img);
              
              // Test if image URL is accessible
              const testImg = new Image();
              testImg.onload = () => console.log(`      ✅ Image ${imgIndex + 1} URL is accessible`);
              testImg.onerror = () => console.log(`      ❌ Image ${imgIndex + 1} URL is NOT accessible`);
              testImg.src = img.url;
            });
          } else {
            console.log('  ❌ No images found for this product');
            console.log('  Full product object:', product);
          }
        });
        
        setProducts(response.data);
      } else {
        console.error('❌ API response not successful:', response);
        toast.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('❌ Fetch products error:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
      console.log('📦 fetchProducts completed');
    }
  };

  const handleAddProduct = () => {
    console.log('➕ Add product clicked');
    setCurrentProduct(null);
    setImagePreviews([]);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    console.log('✏️ Edit product clicked:', product);
    console.log('Product images for editing:', product.images);
    setCurrentProduct(product);
    setImagePreviews(product.images || []);
    setShowModal(true);
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        const response = await productService.deleteProduct(product._id);
        if (response.success) {
          toast.success('Product deleted successfully');
          fetchProducts();
        }
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleImageChange = (e) => {
    const files = e.target.files;
    console.log('🖼️ Files selected:', files.length);
    
    const newPreviews = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`  File ${i + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toLocaleString()
      });
      
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          id: Date.now() + i,
          url: e.target.result,
          file: file,
          isNew: true
        });
        
        if (newPreviews.length === files.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImagePreview = (id) => {
    setImagePreviews(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    console.log('🚀 ========== FORM SUBMISSION START ==========');
    setIsSubmitting(true);
    
    try {
      const form = e.target;
      // Create FormData manually to avoid including file input files
      const formData = new FormData();
      
      // Add form fields manually
      formData.append('name', form.name.value);
      formData.append('productCode', form.productCode.value);
      formData.append('type', form.type.value);
      formData.append('denier', form.denier.value);
      formData.append('price', form.price.value);
      formData.append('moq', form.moq.value);
      formData.append('unit', form.unit.value);
      formData.append('minStockLevel', form.minStockLevel.value);
      formData.append('stockQuantity', form.stockQuantity.value);
      formData.append('gstPercentage', form.gstPercentage.value);
      formData.append('description', form.description.value);
      
      console.log('📝 Form elements:');
      const formElements = {
        name: form.name.value,
        productCode: form.productCode.value,
        type: form.type.value,
        denier: form.denier.value,
        price: form.price.value,
        moq: form.moq.value,
        unit: form.unit.value,
        minStockLevel: form.minStockLevel.value,
        stockQuantity: form.stockQuantity.value,
        gstPercentage: form.gstPercentage.value,
        description: form.description.value
      };
      console.table(formElements);

      // Get new image files
      const newImages = imagePreviews.filter(img => img.isNew);
      console.log('🖼️ New images to upload:', newImages.length);
      
      // Add new image files to FormData
      newImages.forEach((img, index) => {
        console.log(`  Adding image ${index + 1}:`, img.file.name);
        formData.append('images', img.file);
      });

      // If editing, keep existing images
      if (currentProduct && currentProduct.images) {
        console.log('🖼️ Existing images:', currentProduct.images.length);
        currentProduct.images.forEach((img, index) => {
          console.log(`  Keeping existing image ${index + 1}:`, img.url);
        });
      }

      console.log('📦 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[0] === 'images') {
          console.log(`  ${pair[0]}: [File] ${pair[1].name}`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      let response;
      if (currentProduct) {
        console.log('🔄 Updating product:', currentProduct._id);
        response = await productService.updateProduct(currentProduct._id, formData);
      } else {
        console.log('➕ Creating new product');
        response = await productService.createProduct(formData);
      }

      console.log('✅ API Response received:', response);

      if (response && response.success) {
        console.log('🎉 SUCCESS! Product saved.');
        console.log('📊 Response data:', response.data);
        console.log('📸 Images in response:', response.data.images);
        
        // Test all image URLs
        if (response.data.images && response.data.images.length > 0) {
          console.log('🔗 Testing image URLs:');
          response.data.images.forEach((img, index) => {
            console.log(`  Image ${index + 1}: ${img.url}`);
            const testImg = new Image();
            testImg.onload = () => console.log(`    ✅ Loads successfully`);
            testImg.onerror = () => console.log(`    ❌ Failed to load`);
            testImg.src = img.url;
          });
        } else {
          console.log('⚠️  No images in response!');
        }
        
        toast.success(currentProduct ? 'Product updated successfully' : 'Product added successfully');
        setShowModal(false);
        setCurrentProduct(null);
        setImagePreviews([]);
        fetchProducts();
      } else {
        console.error('❌ API response not successful:', response);
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      console.error('Error details:', {
        message: error.message,
        error: error.error,
        response: error.response?.data
      });
      
      const errorMessage = error?.message || 
                          error?.error || 
                          error?.response?.data?.message || 
                          'Failed to save product';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log('========== FORM SUBMISSION END ==========\n');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.productCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterType || product.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={styles.loadingSpinner}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--gray-600)' }}>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Product Management</h1>
        <div style={styles.headerActions}>
          <button
            style={styles.addButton}
            onClick={handleAddProduct}
          >
            <FaPlus />
            <span>Add Product</span>
          </button>
          <button
            style={{...styles.addButton, backgroundColor: 'var(--gray-600)'}}
            onClick={fetchProducts}
            title="Refresh products"
          >
            <FaSearch />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div style={styles.searchContainer}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FaSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
          }} />
          <input
            type="text"
            placeholder="Search products by name or code..."
            style={{ ...styles.searchInput, paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="polyester-filament">Polyester Filament</option>
          <option value="yarn-dyed">Yarn Dyed</option>
          <option value="raw-yarn">Raw Yarn</option>
        </select>
      </div>

      <div style={styles.infoBar}>
        <span>Total Products: {products.length}</span>
        <span>Showing: {filteredProducts.length}</span>
        <span style={{ color: 'var(--primary-color)', cursor: 'pointer' }} onClick={() => console.log('Products:', products)}>
          Click to log products to console
        </span>
      </div>

      <div style={styles.productsGrid}>
        {filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <FaBox style={{ fontSize: '3rem', color: 'var(--gray-300)', marginBottom: '1rem' }} />
            <h3>No products found</h3>
            <p>{searchTerm ? 'Try a different search term' : 'Add your first product'}</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product._id} style={styles.productCard}>
              {/* Image Section with Debug Info */}
              <div style={styles.productImageContainer}>
                <div style={styles.productImage}>
                  {product.images && product.images.length > 0 && product.images[0].url ? (
                    <>
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        style={styles.productImg}
                        onLoad={() => console.log(`✅ Image loaded: ${product.images[0].url}`)}
                        onError={(e) => {
                          console.error(`❌ Image failed: ${product.images[0].url}`);
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div style={styles.imageFallback}>
                        <FaImage />
                        <span>Image failed to load</span>
                      </div>
                    </>
                  ) : (
                    <div style={styles.noImage}>
                      <FaBox />
                      <span>No image</span>
                      <div style={styles.debugInfo}>
                        <small>Click Edit to add image</small>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Debug Info Overlay */}
                <div style={styles.debugOverlay} onClick={() => console.log('Product debug:', product)}>
                  <small>
                    Images: {product.images?.length || 0}
                    {product.images?.length > 0 && ` (View console)`}
                  </small>
                </div>
              </div>

              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.productCode}>
                <strong>Code:</strong> {product.productCode}
                {product.images?.length > 0 && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--success-color)',
                    marginLeft: '0.5rem'
                  }}>
                    ✓ Has {product.images.length} image{product.images.length !== 1 ? 's' : ''}
                  </span>
                )}
              </p>
              
              <div style={styles.productDetails}>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Type</div>
                  <div style={styles.detailValue}>
                    {product.type.replace('-', ' ')}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Denier</div>
                  <div style={styles.detailValue}>{product.denier}</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>MOQ</div>
                  <div style={styles.detailValue}>
                    {product.moq} {product.unit}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Price</div>
                  <div style={styles.detailValue}>₹{product.price}</div>
                </div>
              </div>

              <div style={styles.stockStatus}>
                <span>Stock: {product.stockQuantity} {product.unit}</span>
                <span style={styles.stockBadge(product.stockQuantity, product.minStockLevel)}>
                  {product.stockQuantity <= 0 ? 'Out of Stock' : 
                   product.stockQuantity <= product.minStockLevel ? 'Low Stock' : 'In Stock'}
                </span>
              </div>

              <div style={styles.productActions}>
                <button
                  style={{ ...styles.actionButton, ...styles.editButton }}
                  onClick={() => handleEditProduct(product)}
                >
                  <FaEdit />
                  <span>Edit</span>
                </button>
                <button
                  style={{ ...styles.actionButton, ...styles.deleteButton }}
                  onClick={() => handleDeleteProduct(product)}
                >
                  <FaTrash />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {currentProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowModal(false);
                  setCurrentProduct(null);
                  setImagePreviews([]);
                }}
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  style={styles.formInput}
                  defaultValue={currentProduct?.name}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Product Code *</label>
                  <input
                    type="text"
                    name="productCode"
                    style={styles.formInput}
                    defaultValue={currentProduct?.productCode}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Type *</label>
                  <select 
                    name="type" 
                    style={styles.formInput} 
                    defaultValue={currentProduct?.type || 'polyester-filament'}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="polyester-filament">Polyester Filament</option>
                    <option value="yarn-dyed">Yarn Dyed</option>
                    <option value="raw-yarn">Raw Yarn</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Denier *</label>
                  <input
                    type="text"
                    name="denier"
                    style={styles.formInput}
                    defaultValue={currentProduct?.denier}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    style={styles.formInput}
                    defaultValue={currentProduct?.price}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>MOQ *</label>
                  <input
                    type="number"
                    name="moq"
                    min="1"
                    style={styles.formInput}
                    defaultValue={currentProduct?.moq}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Unit *</label>
                  <select 
                    name="unit" 
                    style={styles.formInput} 
                    defaultValue={currentProduct?.unit || 'kg'}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="meter">Meters</option>
                    <option value="yard">Yards</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Min Stock Level</label>
                  <input
                    type="number"
                    name="minStockLevel"
                    min="0"
                    style={styles.formInput}
                    defaultValue={currentProduct?.minStockLevel || 100}
                    disabled={isSubmitting}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Current Stock</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    min="0"
                    style={styles.formInput}
                    defaultValue={currentProduct?.stockQuantity || 0}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>GST Percentage (%)</label>
                <input
                  type="number"
                  name="gstPercentage"
                  step="0.01"
                  min="0"
                  max="100"
                  style={styles.formInput}
                  defaultValue={currentProduct?.gstPercentage || 18}
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  name="description"
                  style={styles.formInput}
                  rows="3"
                  defaultValue={currentProduct?.description}
                  disabled={isSubmitting}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Product Images</label>
                <input
                  type="file"
                  name="images"
                  style={styles.formInput}
                  multiple
                  accept="image/*"
                  disabled={isSubmitting}
                  onChange={handleImageChange}
                />
                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                  Upload JPEG, PNG, or GIF images (max 5)
                </small>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div style={styles.imagePreviews}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {imagePreviews.length} image{imagePreviews.length !== 1 ? 's' : ''} selected
                    </p>
                    <div style={styles.previewGrid}>
                      {imagePreviews.map((preview) => (
                        <div key={preview.id} style={styles.previewItem}>
                          <img src={preview.url} alt="Preview" style={styles.previewImg} />
                          <button
                            type="button"
                            style={styles.removePreviewBtn}
                            onClick={() => removeImagePreview(preview.id)}
                            disabled={isSubmitting}
                          >
                            <FaTimes />
                          </button>
                          {preview.isNew && (
                            <div style={styles.newBadge}>New</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner-small" style={{ marginRight: '0.5rem' }}></div>
                    Saving...
                  </>
                ) : (
                  currentProduct ? 'Update Product' : 'Add Product'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Styles
const styles = {
  container: {
    padding: '1rem 0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerTitle: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: 'var(--gray-900)',
  },
  headerActions: {
    display: 'flex',
    gap: '1rem',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchContainer: {
    marginBottom: '1rem',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid var(--gray-300)',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '1px solid var(--gray-300)',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    minWidth: '150px',
  },
  infoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--gray-50)',
    borderRadius: '0.375rem',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
    color: 'var(--gray-600)',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: 'var(--shadow)',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: 'var(--shadow)',
    padding: '1.5rem',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: '1rem',
  },
  productImage: {
    width: '100%',
    height: '200px',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--gray-100)',
    position: 'relative',
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '0.375rem',
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--gray-400)',
    fontSize: '3rem',
  },
  imageFallback: {
    display: 'none',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--warning-light)',
    color: 'var(--warning-color)',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    gap: '0.5rem',
  },
  debugOverlay: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.7rem',
    cursor: 'pointer',
    zIndex: 2,
  },
  debugInfo: {
    fontSize: '0.7rem',
    color: 'var(--gray-500)',
    marginTop: '0.25rem',
  },
  productName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: 'var(--gray-900)',
    marginBottom: '0.5rem',
  },
  productCode: {
    fontSize: '0.875rem',
    color: 'var(--gray-600)',
    marginBottom: '1rem',
  },
  productDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  detailItem: {
    fontSize: '0.875rem',
  },
  detailLabel: {
    color: 'var(--gray-600)',
    marginBottom: '0.125rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    color: 'var(--gray-900)',
    fontWeight: '500',
  },
  stockStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  stockBadge: (stock, minStock) => ({
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: stock <= 0 ? 'var(--danger-light)' : 
                   stock <= minStock ? 'var(--warning-light)' : 'var(--success-light)',
    color: stock <= 0 ? 'var(--danger-color)' : 
           stock <= minStock ? 'var(--warning-color)' : 'var(--success-color)',
  }),
  productActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  actionButton: {
    flex: 1,
    padding: '0.5rem',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  },
  editButton: {
    backgroundColor: 'var(--primary-light)',
    color: 'var(--primary-color)',
  },
  deleteButton: {
    backgroundColor: 'var(--danger-light)',
    color: 'var(--danger-color)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--gray-900)',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--gray-600)',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  formLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: 'var(--gray-700)',
  },
  formInput: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--gray-300)',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  imagePreviews: {
    marginTop: '1rem',
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
  },
  previewItem: {
    position: 'relative',
    borderRadius: '0.375rem',
    overflow: 'hidden',
  },
  previewImg: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '0.375rem',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: '0.25rem',
    right: '0.25rem',
    background: 'rgba(0,0,0,0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
  newBadge: {
    position: 'absolute',
    bottom: '0.25rem',
    left: '0.25rem',
    background: 'var(--success-color)',
    color: 'white',
    fontSize: '0.6rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '0.25rem',
  },
  submitButton: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center', 
    minHeight: '200px',
  },
};

export default AdminProducts;