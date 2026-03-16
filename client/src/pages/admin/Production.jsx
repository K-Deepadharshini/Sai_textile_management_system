import React, { useState, useEffect } from 'react';
import { FaPlus, FaPlay, FaCheck, FaTruck, FaCalendar, FaFilter, FaEdit, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import productionService from '../../services/productionService';
import productService from '../../services/productService';
import { format } from 'date-fns';

const AdminProduction = () => {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    product: '',
    quantityProduced: '',
    wastage: '0',
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: '',
    machineDetails: JSON.stringify({ machineId: '', machineName: '', operator: '' }),
    dyeingDetails: JSON.stringify({ dyeLot: '', shade: '', dyeQuantity: '', dyeUnit: 'kg', dyeingDate: '' }),
    rawMaterialUsed: JSON.stringify([]),
    notes: ''
  });

  // CSS Styles within the component
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
    filters: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '0.5rem 1rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      color: 'var(--gray-700)',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    filterButtonActive: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      borderColor: 'var(--primary-color)',
    },
    batchesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '1.5rem',
    },
    batchCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    batchHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid var(--gray-200)',
    },
    batchNumber: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    statusBadge: (status) => ({
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      backgroundColor: {
        'planned': 'var(--gray-200)',
        'in-progress': 'var(--warning-light)',
        'completed': 'var(--success-light)',
        'quality-check': 'var(--primary-light)',
        'dispatched': 'var(--info-light)',
      }[status] || 'var(--gray-200)',
      color: {
        'planned': 'var(--gray-700)',
        'in-progress': 'var(--warning-color)',
        'completed': 'var(--success-color)',
        'quality-check': 'var(--primary-color)',
        'dispatched': 'var(--info-color)',
      }[status] || 'var(--gray-700)',
    }),
    batchDetails: {
      marginBottom: '1.5rem',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.75rem',
      fontSize: '0.875rem',
    },
    detailLabel: {
      color: 'var(--gray-600)',
    },
    detailValue: {
      color: 'var(--gray-900)',
      fontWeight: '500',
    },
    progressBar: {
      height: '8px',
      backgroundColor: 'var(--gray-200)',
      borderRadius: '4px',
      margin: '1rem 0',
      overflow: 'hidden',
    },
    progressFill: (status) => ({
      height: '100%',
      width: {
        'planned': '25%',
        'in-progress': '50%',
        'quality-check': '75%',
        'completed': '100%',
        'dispatched': '100%',
      }[status] || '25%',
      backgroundColor: {
        'planned': 'var(--gray-400)',
        'in-progress': 'var(--warning-color)',
        'quality-check': 'var(--primary-color)',
        'completed': 'var(--success-color)',
        'dispatched': 'var(--info-color)',
      }[status] || 'var(--gray-400)',
      transition: 'width 0.3s ease',
    }),
    batchActions: {
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
    startButton: {
      backgroundColor: 'var(--warning-light)',
      color: 'var(--warning-color)',
    },
    completeButton: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success-color)',
    },
    dispatchButton: {
      backgroundColor: 'var(--info-light)',
      color: 'var(--info-color)',
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
      maxWidth: '600px',
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
    statusOptions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    statusOption: {
      padding: '1rem',
      border: '2px solid var(--gray-300)',
      borderRadius: '0.5rem',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    statusOptionActive: {
      borderColor: 'var(--primary-color)',
      backgroundColor: 'var(--primary-light)',
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  useEffect(() => {
    fetchProducts();
    fetchBatches();
  }, [filterStatus]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProducts({ limit: 1000 });
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await productionService.getAllBatches({
        status: filterStatus || undefined,
      });
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch production batches');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitBatch = async (e) => {
    e.preventDefault();
   
    if (!formData.product || !formData.quantityProduced || !formData.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
     
      // Parse JSON fields properly
      const parseMachineDetails = () => {
        try {
          return typeof formData.machineDetails === 'string'
            ? JSON.parse(formData.machineDetails)
            : formData.machineDetails || {};
        } catch {
          return {};
        }
      };

      const parseDyeingDetails = () => {
        try {
          return typeof formData.dyeingDetails === 'string'
            ? JSON.parse(formData.dyeingDetails)
            : formData.dyeingDetails || {};
        } catch {
          return {};
        }
      };

      const parseRawMaterials = () => {
        try {
          return typeof formData.rawMaterialUsed === 'string'
            ? JSON.parse(formData.rawMaterialUsed)
            : Array.isArray(formData.rawMaterialUsed)
              ? formData.rawMaterialUsed
              : [];
        } catch {
          return [];
        }
      };

      // Prepare data with proper type conversions
      const submitData = {
        product: formData.product,
        quantityProduced: parseFloat(formData.quantityProduced),
        wastage: parseFloat(formData.wastage) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        machineDetails: parseMachineDetails(),
        dyeingDetails: parseDyeingDetails(),
        rawMaterialUsed: parseRawMaterials(),
        notes: formData.notes
      };

      console.log('📦 Submitting batch data:', submitData);
     
      const response = await productionService.createBatch(submitData);
     
      if (response.success) {
        toast.success('✅ Production batch created successfully');
        setShowModal(false);
        resetFormData();
        fetchBatches();
      } else {
        toast.error(response.message || 'Failed to create batch');
      }
    } catch (error) {
      console.error('❌ Error creating batch:', error);
      // Show detailed error message to user
      const errorMsg = error?.message || 'Failed to create production batch';
      const details = error?.details?.message || error?.details?.errors || null;
      const displayMsg = details ? `${errorMsg}: ${JSON.stringify(details)}` : errorMsg;
      toast.error(displayMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      product: '',
      quantityProduced: '',
      wastage: '0',
      startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDate: '',
      machineDetails: JSON.stringify({ machineId: '', machineName: '', operator: '' }),
      dyeingDetails: JSON.stringify({ dyeLot: '', shade: '', dyeQuantity: '', dyeUnit: 'kg', dyeingDate: '' }),
      rawMaterialUsed: JSON.stringify([]),
      notes: ''
    });
  };

  const handleStatusChange = async (batchId, newStatus) => {
    try {
      const response = await productionService.updateBatchStatus(batchId, newStatus);
      if (response.success) {
        toast.success('Batch status updated');
        fetchBatches();
        setShowStatusModal(false);
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  const handleUpdateStatus = (batch) => {
    setSelectedBatch(batch);
    setShowStatusModal(true);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'planned': 'in-progress',
      'in-progress': 'quality-check',
      'quality-check': 'completed',
      'completed': 'dispatched',
    };
    return statusFlow[currentStatus];
  };

  const handleButtonHover = (e, type) => {
    const colorMap = {
      add: '#1e40af',
      start: '#d97706',
      complete: '#059669',
      dispatch: '#0ea5e9',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
    e.currentTarget.style.color = 'white';
  };

  const handleButtonLeave = (e, type) => {
    const colorMap = {
      add: 'var(--primary-color)',
      start: 'var(--warning-light)',
      complete: 'var(--success-light)',
      dispatch: 'var(--info-light)',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
    e.currentTarget.style.color = {
      start: 'var(--warning-color)',
      complete: 'var(--success-color)',
      dispatch: 'var(--info-color)',
    }[type] || 'white';
  };

  const handleFilterHover = (e) => {
    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
  };

  const handleFilterLeave = (e, active) => {
    if (!active) {
      e.currentTarget.style.backgroundColor = 'white';
    }
  };

  const filteredBatches = batches.filter(batch =>
    !filterStatus || batch.status === filterStatus
  );

  if (loading) {
    return (
      <div style={styles.loadingSpinner}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Production Management</h1>
        <div style={styles.headerActions}>
          <button
            style={styles.addButton}
            onClick={() => setShowModal(true)}
            onMouseEnter={(e) => handleButtonHover(e, 'add')}
            onMouseLeave={(e) => handleButtonLeave(e, 'add')}
          >
            <FaPlus />
            <span>New Batch</span>
          </button>
        </div>
      </div>

      <div style={styles.filters}>
        {['all', 'planned', 'in-progress', 'quality-check', 'completed', 'dispatched'].map((status) => (
          <button
            key={status}
            style={{
              ...styles.filterButton,
              ...(filterStatus === (status === 'all' ? '' : status) && styles.filterButtonActive),
            }}
            onClick={() => setFilterStatus(status === 'all' ? '' : status)}
            onMouseEnter={handleFilterHover}
            onMouseLeave={(e) => handleFilterLeave(e, filterStatus === (status === 'all' ? '' : status))}
          >
            {status === 'all' ? 'All Batches' : status.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div style={styles.batchesGrid}>
        {filteredBatches && filteredBatches.length > 0 ? (
          filteredBatches.map((batch) => (
            <div key={batch._id} style={styles.batchCard}>
            <div style={styles.batchHeader}>
              <div>
                <h3 style={styles.batchNumber}>{batch.batchNumber}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                  {batch.product?.name}
                </p>
              </div>
              <span style={styles.statusBadge(batch.status)}>
                {batch.status.replace('-', ' ')}
              </span>
            </div>

            <div style={styles.batchDetails}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Start Date</span>
                <span style={styles.detailValue}>
                  {format(new Date(batch.startDate), 'dd MMM yyyy')}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Quantity</span>
                <span style={styles.detailValue}>
                  {batch.quantityProduced} {batch.unit}
                </span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Wastage</span>
                <span style={styles.detailValue}>
                  {batch.wastage} {batch.unit} ({batch.wastagePercentage?.toFixed(1)}%)
                </span>
              </div>
              {batch.order && (
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Order</span>
                  <span style={styles.detailValue}>{batch.order?.orderNumber}</span>
                </div>
              )}
            </div>

            <div style={styles.progressBar}>
              <div style={styles.progressFill(batch.status)} />
            </div>

            <div style={styles.batchActions}>
              {batch.status === 'planned' && (
                <button
                  style={{ ...styles.actionButton, ...styles.startButton }}
                  onClick={() => handleStatusChange(batch._id, 'in-progress')}
                  onMouseEnter={(e) => handleButtonHover(e, 'start')}
                  onMouseLeave={(e) => handleButtonLeave(e, 'start')}
                >
                  <FaPlay />
                  <span>Start Production</span>
                </button>
              )}
             
              {batch.status === 'in-progress' && (
                <button
                  style={{ ...styles.actionButton, ...styles.completeButton }}
                  onClick={() => handleStatusChange(batch._id, 'quality-check')}
                  onMouseEnter={(e) => handleButtonHover(e, 'complete')}
                  onMouseLeave={(e) => handleButtonLeave(e, 'complete')}
                >
                  <FaCheck />
                  <span>Quality Check</span>
                </button>
              )}
             
              {batch.status === 'quality-check' && (
                <button
                  style={{ ...styles.actionButton, ...styles.completeButton }}
                  onClick={() => handleStatusChange(batch._id, 'completed')}
                  onMouseEnter={(e) => handleButtonHover(e, 'complete')}
                  onMouseLeave={(e) => handleButtonLeave(e, 'complete')}
                >
                  <FaCheck />
                  <span>Mark Complete</span>
                </button>
              )}
             
              {batch.status === 'completed' && (
                <button
                  style={{ ...styles.actionButton, ...styles.dispatchButton }}
                  onClick={() => handleStatusChange(batch._id, 'dispatched')}
                  onMouseEnter={(e) => handleButtonHover(e, 'dispatch')}
                  onMouseLeave={(e) => handleButtonLeave(e, 'dispatch')}
                >
                  <FaTruck />
                  <span>Dispatch</span>
                </button>
              )}
             
              <button
                style={{ ...styles.actionButton, ...styles.startButton }}
                onClick={() => handleUpdateStatus(batch)}
                onMouseEnter={(e) => handleButtonHover(e, 'start')}
                onMouseLeave={(e) => handleButtonLeave(e, 'start')}
              >
                <FaEdit />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        ))
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
            <p>No batches found. Create a new batch to get started.</p>
          </div>
        )}
      </div>

      {showStatusModal && selectedBatch && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Batch Status</h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedBatch(null);
                }}
              >
                ×
              </button>
            </div>
           
            <p style={{ marginBottom: '1.5rem', color: 'var(--gray-600)' }}>
              Current status: <strong>{selectedBatch.status.replace('-', ' ')}</strong>
            </p>
           
            <div style={styles.statusOptions}>
              {['planned', 'in-progress', 'quality-check', 'completed', 'dispatched'].map((status) => (
                <div
                  key={status}
                  style={{
                    ...styles.statusOption,
                    ...(selectedBatch.status === status && styles.statusOptionActive),
                  }}
                  onClick={() => handleStatusChange(selectedBatch._id, status)}
                >
                  {status.replace('-', ' ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modalContent, maxWidth: '700px', maxHeight: '85vh'}}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Production Batch</h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
           
            <form onSubmit={handleSubmitBatch} style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 120px)', paddingRight: '0.5rem' }}>
              {/* Product Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Product <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit'
                  }}
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.productCode}) - Stock: {product.stockQuantity} {product.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Produced */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Quantity Produced <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="number"
                  name="quantityProduced"
                  value={formData.quantityProduced}
                  onChange={handleFormChange}
                  min="0.1"
                  step="0.1"
                  required
                  placeholder="Enter quantity produced"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Wastage */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Wastage
                </label>
                <input
                  type="number"
                  name="wastage"
                  value={formData.wastage}
                  onChange={handleFormChange}
                  min="0"
                  step="0.1"
                  placeholder="Enter wastage quantity"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Start Date */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Start Date <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* End Date */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--gray-700)' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Enter any notes about this batch"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: isSubmitting ? 'var(--gray-400)' : 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#1e40af')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--primary-color)')}
                >
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetFormData();
                  }}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--gray-200)',
                    color: 'var(--gray-700)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--gray-300)')}
                  onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--gray-200)')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProduction;