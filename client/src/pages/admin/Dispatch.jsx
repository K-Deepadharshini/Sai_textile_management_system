import React, { useState, useEffect, useCallback } from 'react';
import { FaTruck, FaSearch, FaFilter, FaEye, FaEdit, FaCheck, FaFilePdf } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import dispatchService from '../../services/dispatchService';
import { orderService, invoiceService } from '../../services';
import { format } from 'date-fns';

const AdminDispatch = () => {
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDispatch, setNewDispatch] = useState({
    order: '',
    invoice: '',
    dispatchDate: '',
    estimatedDeliveryDate: '',
    items: [
      { product: '', quantity: '', batchNumbers: '', packagingType: '' }
    ],
    totalWeight: '',
    totalPackages: '',
    transportDetails: {
      transporter: '',
      vehicleNumber: '',
      driverName: '',
      driverContact: '',
      lrNumber: ''
    },
    shippingAddress: {
      street: '', city: '', state: '', pincode: '', country: '', contactPerson: '', contactNumber: ''
    }
  });
  const [ordersList, setOrdersList] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [ordersFetchError, setOrdersFetchError] = useState(null);
  const [invoicesList, setInvoicesList] = useState([]);
  const [invoicesFetchError, setInvoicesFetchError] = useState(null);

  const addItemRow = () => {
    setNewDispatch((prev) => ({ ...prev, items: [...prev.items, { product: '', quantity: '', batchNumbers: '', packagingType: '' }] }));
  };

  const removeItemRow = (index) => {
    setNewDispatch((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const updateItemField = (index, field, value) => {
    setNewDispatch((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => i === index ? { ...it, [field]: value } : it)
    }));
  };

  const fetchOrdersList = async () => {
    try {
      // Fetch orders that can be dispatched (confirmed, quality-check, or ready-for-dispatch status)
      const res = await orderService.getAllOrders({ limit: 200 });
      if (!res) {
        setOrdersList([]);
        setOrdersFetchError('No response from server');
        return;
      }

      if (Array.isArray(res)) {
        // Filter orders to show only those that can be dispatched
        const dispatchableOrders = res.filter(o => ['confirmed', 'quality-check', 'ready-for-dispatch'].includes(o.status));
        setOrdersList(dispatchableOrders);
        setOrdersFetchError(dispatchableOrders.length === 0 ? 'No orders available for dispatch' : null);
        return;
      }

      if (res.success === false) {
        setOrdersList([]);
        setOrdersFetchError(res.message || 'Failed to fetch orders');
        return;
      }

      if (res.success && res.data) {
        // Filter orders to show only those that can be dispatched
        const dispatchableOrders = (res.data || []).filter(o => ['confirmed', 'quality-check', 'ready-for-dispatch'].includes(o.status));
        setOrdersList(dispatchableOrders);
        setOrdersFetchError(dispatchableOrders.length === 0 ? 'No orders available for dispatch' : null);
      }
    } catch (err) {
      console.error('Failed to fetch orders for dispatch form', err);
      const msg = err?.message || (err?.response?.data?.message) || 'Failed to fetch orders';
      setOrdersFetchError(msg);
    }
  };

  useEffect(() => {
    fetchOrdersList();
  }, []);

  const fetchInvoicesForOrder = async (orderId) => {
    try {
      setInvoicesFetchError(null);
      const response = await invoiceService.getAllInvoices({ order: orderId });
      const invoiceData = response?.data || response || [];
      setInvoicesList(Array.isArray(invoiceData) ? invoiceData : []);
      
      if (Array.isArray(invoiceData) && invoiceData.length === 0) {
        setInvoicesFetchError('No invoices found for this order. Please create an invoice first.');
      }
    } catch (err) {
      console.error('Failed to fetch invoices', err);
      setInvoicesFetchError('Failed to fetch invoices');
      setInvoicesList([]);
    }
  };

  const handleOrderSelect = (orderId) => {
    (async () => {
      let ord = ordersList.find(o => (o._id || o.id) === orderId);
      try {
        // If order object doesn't have items populated, fetch full order
        if (!ord || !ord.items || ord.items.length === 0) {
          const resp = await orderService.getOrderById(orderId);
          if (resp && resp.success && resp.data) ord = resp.data;
        }
      } catch (err) {
        console.error('Failed to fetch order details', err);
      }

      if (!ord) {
        setProductOptions([]);
        setNewDispatch((prev) => ({ ...prev, order: '', items: [{ product: '', quantity: '', batchNumbers: '', packagingType: '' }] }));
        return;
      }

      // build product options from order items
      const opts = (ord.items || []).map((it) => {
        const p = it.product || {};
        return {
          id: p._id || p.id || p || '',
          name: p.name || p.productName || p.itemName || (typeof p === 'string' ? p : '')
        };
      });

      setProductOptions(opts);

      // prefill items from order
      const preItems = (ord.items || []).map((it) => ({
        product: (it.product && (it.product._id || it.product.id)) || it.product || '',
        quantity: it.quantity || 1,
        batchNumbers: Array.isArray(it.batchNumbers) ? it.batchNumbers.join(',') : (it.batchNumbers || ''),
        packagingType: it.packagingType || ''
      }));

      // prefill shipping address from order
      const preShippingAddress = ord.shippingAddress || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: '',
        contactPerson: '',
        contactNumber: ''
      };

      setNewDispatch((prev) => ({ 
        ...prev, 
        order: orderId, 
        invoice: '', // Reset invoice when order changes
        items: preItems.length ? preItems : [{ product: '', quantity: '', batchNumbers: '', packagingType: '' }],
        shippingAddress: preShippingAddress
      }));

      // Fetch invoices for this order
      fetchInvoicesForOrder(orderId);
    })();
  };

  // CSS Styles within the component
  const styles = {
    container: {
      padding: '1rem 0',
    },
    header: {
      marginBottom: '2rem',
    },
    headerTitle: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    headerSubtitle: {
      fontSize: '1rem',
      color: 'var(--gray-600)',
    },
    filtersContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      minWidth: '300px',
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    statIcon: {
      fontSize: '2rem',
      color: 'var(--primary-color)',
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
      marginBottom: '0.25rem',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    dispatchesTable: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeader: {
      backgroundColor: 'var(--gray-50)',
    },
    tableHeaderCell: {
      padding: '1rem',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--gray-700)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid var(--gray-200)',
    },
    tableRow: {
      transition: 'background-color 0.2s',
    },
    tableRowHover: {
      backgroundColor: 'var(--gray-50)',
    },
    tableCell: {
      padding: '1rem',
      borderBottom: '1px solid var(--gray-200)',
      fontSize: '0.875rem',
      color: 'var(--gray-800)',
    },
    statusBadge: (status) => ({
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      backgroundColor: {
        'ready': 'var(--warning-light)',
        'dispatched': 'var(--primary-light)',
        'in-transit': 'var(--info-light)',
        'delivered': 'var(--success-light)',
        'delayed': 'var(--danger-light)',
        'cancelled': 'var(--gray-200)',
      }[status] || 'var(--gray-200)',
      color: {
        'ready': 'var(--warning-color)',
        'dispatched': 'var(--primary-color)',
        'in-transit': 'var(--info-color)',
        'delivered': 'var(--success-color)',
        'delayed': 'var(--danger-color)',
        'cancelled': 'var(--gray-700)',
      }[status] || 'var(--gray-700)',
    }),
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    actionButton: {
      padding: '0.5rem',
      borderRadius: '0.25rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    viewButton: {
      color: 'var(--primary-color)',
    },
    updateButton: {
      color: 'var(--success-color)',
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
      maxWidth: '800px',
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
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    detailSection: {
      backgroundColor: 'var(--gray-50)',
      padding: '1.5rem',
      borderRadius: '0.5rem',
    },
    sectionTitle: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--gray-700)',
      marginBottom: '1rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    detailItem: {
      marginBottom: '0.75rem',
    },
    detailLabel: {
      fontSize: '0.75rem',
      color: 'var(--gray-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.25rem',
    },
    detailValue: {
      fontSize: '0.875rem',
      color: 'var(--gray-900)',
      fontWeight: '500',
    },
    itemsList: {
      marginBottom: '2rem',
    },
    itemRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--gray-200)',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '2rem',
    },
    actionButtonLarge: {
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
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  const fetchDispatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dispatchService.getAllDispatches({
        status: filterStatus || undefined,
      });
      if (response.success) {
        setDispatches(response.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch dispatches');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const handleViewDispatch = (dispatch) => {
    setSelectedDispatch(dispatch);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (dispatchId, newStatus) => {
    try {
      const response = await dispatchService.updateDispatchStatus(dispatchId, newStatus);
      if (response.success) {
        toast.success('Dispatch status updated');
        fetchDispatches();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update dispatch status');
    }
  };

  const handleGenerateLR = async (dispatchId) => {
    try {
      const response = await dispatchService.generateLR(dispatchId);
      
      // Create blob URL and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LR_${dispatchId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('LR downloaded successfully');
    } catch (err) {
      console.error('Generate LR error:', err);
      toast.error('Failed to generate LR');
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!newDispatch.order) {
        toast.error('Please select an order');
        return;
      }

      // Invoice is required before dispatch
      if (!newDispatch.invoice) {
        toast.error('Invoice must be created before dispatch. Please create an invoice for this order first.');
        return;
      }

      if (!newDispatch.items || newDispatch.items.length === 0 || !newDispatch.items.some(it => it.product)) {
        toast.error('Please add at least one item with a product');
        return;
      }

      if (!newDispatch.transportDetails.vehicleNumber) {
        toast.error('Vehicle number is required');
        return;
      }

      if (!newDispatch.shippingAddress.street && !newDispatch.shippingAddress.city) {
        toast.error('Please enter at least street or city in shipping address');
        return;
      }

      // prepare payload
      const payload = { ...newDispatch };
      // normalize items: convert batchNumbers string to array and quantity to number
      payload.items = (payload.items || []).map((it) => ({
        product: it.product,
        quantity: Number(it.quantity) || 0,
        batchNumbers: typeof it.batchNumbers === 'string' ? it.batchNumbers.split(',').map(s => s.trim()).filter(Boolean) : (it.batchNumbers || []),
        packagingType: it.packagingType || undefined
      }));
      
      // Filter out items with no product
      payload.items = payload.items.filter(it => it.product);
      
      // Convert empty strings to undefined
      if (!payload.dispatchDate) delete payload.dispatchDate;
      if (!payload.estimatedDeliveryDate) delete payload.estimatedDeliveryDate;
      if (!payload.totalWeight) delete payload.totalWeight;
      if (!payload.totalPackages) delete payload.totalPackages;

      console.log('Sending dispatch payload:', payload);

      const response = await dispatchService.createDispatch(payload);
      if (response.success) {
        toast.success('Dispatch created successfully');
        setShowCreateModal(false);
        setNewDispatch({
          order: '', invoice: '', dispatchDate: '', estimatedDeliveryDate: '', items: [{ product: '', quantity: '', batchNumbers: '', packagingType: '' }], totalWeight: '', totalPackages: '',
          transportDetails: { transporter: '', vehicleNumber: '', driverName: '', driverContact: '', lrNumber: '' },
          shippingAddress: { street: '', city: '', state: '', pincode: '', country: '', contactPerson: '', contactNumber: '' }
        });
        fetchDispatches();
      }
    } catch (error) {
      console.error('Create dispatch error:', error);
      toast.error(error?.message || 'Failed to create dispatch');
    }
  };

  const filteredDispatches = dispatches.filter(dispatch => {
    const matchesSearch = dispatch.dispatchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispatch.order?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dispatch.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || dispatch.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const dispatchStats = {
    total: dispatches.length,
    ready: dispatches.filter(d => d.status === 'ready').length,
    inTransit: dispatches.filter(d => d.status === 'in-transit').length,
    delivered: dispatches.filter(d => d.status === 'delivered').length,
  };

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
        <h1 style={styles.headerTitle}>Dispatch Management</h1>
        <p style={styles.headerSubtitle}>Track and manage all dispatches</p>
        <div style={{ marginTop: 12 }}>
          <button
            style={{ ...styles.actionButtonLarge, backgroundColor: 'var(--success-color)' }}
            onClick={() => setShowCreateModal(true)}
          >
            <FaTruck />
            <span style={{ marginLeft: 8, color: 'white' }}>Create Dispatch</span>
          </button>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <FaTruck style={styles.statIcon} />
          <div style={styles.statContent}>
            <div style={styles.statValue}>{dispatchStats.total}</div>
            <div style={styles.statLabel}>Total Dispatches</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{dispatchStats.ready}</div>
            <div style={styles.statLabel}>Ready for Dispatch</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🚚</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{dispatchStats.inTransit}</div>
            <div style={styles.statLabel}>In Transit</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{dispatchStats.delivered}</div>
            <div style={styles.statLabel}>Delivered</div>
          </div>
        </div>
      </div>

      <div style={styles.filtersContainer}>
        <input
          type="text"
          placeholder="Search by dispatch number, order, or client..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="ready">Ready</option>
          <option value="dispatched">Dispatched</option>
          <option value="in-transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="delayed">Delayed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={styles.dispatchesTable}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Dispatch No</th>
              <th style={styles.tableHeaderCell}>Order No</th>
              <th style={styles.tableHeaderCell}>Client</th>
              <th style={styles.tableHeaderCell}>Dispatch Date</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDispatches.map((dispatch) => (
              <tr
                key={dispatch._id}
                style={styles.tableRow}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <td style={styles.tableCell}>
                  <strong>{dispatch.dispatchNumber}</strong>
                </td>
                <td style={styles.tableCell}>
                  {dispatch.order?.orderNumber || 'N/A'}
                </td>
                <td style={styles.tableCell}>
                  {dispatch.client?.companyName || 'N/A'}
                </td>
                <td style={styles.tableCell}>
                  {format(new Date(dispatch.dispatchDate), 'dd MMM yyyy')}
                </td>
                <td style={styles.tableCell}>
                  <span style={styles.statusBadge(dispatch.status)}>
                    {dispatch.status.replace('-', ' ')}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.actionButton, ...styles.viewButton }}
                      onClick={() => handleViewDispatch(dispatch)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    
                    {dispatch.status === 'ready' && (
                      <button
                        style={{ ...styles.actionButton, ...styles.updateButton }}
                        onClick={() => handleUpdateStatus(dispatch._id, 'dispatched')}
                        title="Mark as Dispatched"
                      >
                        <FaCheck />
                      </button>
                    )}
                    
                    {dispatch.status === 'dispatched' && (
                      <button
                        style={{ ...styles.actionButton, ...styles.updateButton }}
                        onClick={() => handleUpdateStatus(dispatch._id, 'in-transit')}
                        title="Mark as In Transit"
                      >
                        <FaTruck />
                      </button>
                    )}
                    
                    {dispatch.status === 'in-transit' && (
                      <button
                        style={{ ...styles.actionButton, ...styles.updateButton }}
                        onClick={() => handleUpdateStatus(dispatch._id, 'delivered')}
                        title="Mark as Delivered"
                      >
                        <FaCheck />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedDispatch && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Dispatch Details - {selectedDispatch.dispatchNumber}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedDispatch(null);
                }}
              >
                ×
              </button>
            </div>

            <div style={styles.detailsGrid}>
              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Basic Information</h3>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Order Number</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.order?.orderNumber || 'N/A'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Client</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.client?.companyName || 'N/A'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Dispatch Date</div>
                  <div style={styles.detailValue}>
                    {format(new Date(selectedDispatch.dispatchDate), 'dd MMM yyyy')}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Status</div>
                  <div style={styles.detailValue}>
                    <span style={styles.statusBadge(selectedDispatch.status)}>
                      {selectedDispatch.status.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Transport Details</h3>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Transporter</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.transportDetails?.transporter || 'N/A'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Vehicle Number</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.transportDetails?.vehicleNumber || 'N/A'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>LR Number</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.transportDetails?.lrNumber || 'N/A'}
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Driver Contact</div>
                  <div style={styles.detailValue}>
                    {selectedDispatch.transportDetails?.driverContact || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.itemsList}>
              <h3 style={styles.sectionTitle}>Items in Dispatch</h3>
              {selectedDispatch.items?.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {item.product?.name || 'Product'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                      Batch: {item.batchNumbers?.join(', ') || 'N/A'}
                    </div>
                  </div>
                  <div>
                    {item.quantity} {item.packagingType || 'packages'}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.actionButtonLarge}
                onClick={() => handleGenerateLR(selectedDispatch._id)}
              >
                <FaFilePdf />
                <span>Generate LR</span>
              </button>
              
              {selectedDispatch.status === 'ready' && (
                <button
                  style={{ ...styles.actionButtonLarge, backgroundColor: 'var(--primary-color)' }}
                  onClick={() => {
                    handleUpdateStatus(selectedDispatch._id, 'dispatched');
                    setShowDetailsModal(false);
                  }}
                >
                  <FaCheck />
                  <span>Mark as Dispatched</span>
                </button>
              )}
              
              {selectedDispatch.status === 'dispatched' && (
                <button
                  style={{ ...styles.actionButtonLarge, backgroundColor: 'var(--info-color)' }}
                  onClick={() => {
                    handleUpdateStatus(selectedDispatch._id, 'in-transit');
                    setShowDetailsModal(false);
                  }}
                >
                  <FaTruck />
                  <span>Mark as In Transit</span>
                </button>
              )}
              
              {selectedDispatch.status === 'in-transit' && (
                <button
                  style={{ ...styles.actionButtonLarge, backgroundColor: 'var(--success-color)' }}
                  onClick={() => {
                    handleUpdateStatus(selectedDispatch._id, 'delivered');
                    setShowDetailsModal(false);
                  }}
                >
                  <FaCheck />
                  <span>Mark as Delivered</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create Dispatch</h2>
              <button style={styles.closeButton} onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateDispatch}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>Core</h3>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Order</div>
                    <select value={newDispatch.order} onChange={(e) => handleOrderSelect(e.target.value)} required style={{ width: '100%', padding: 8 }} disabled={ordersList.length === 0}>
                      {ordersList.length === 0 ? (
                        <option value="" disabled>{ordersFetchError || 'No orders available'}</option>
                      ) : (
                        <>
                          <option value="">Select order</option>
                          {ordersList.map((o) => (
                            <option key={o._id || o.id} value={o._id || o.id}>{o.orderNumber || o.orderNo || `${o._id || o.id}`}{o.client?.companyName ? ` - ${o.client.companyName}` : ''}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Invoice (Required)</div>
                    {invoicesList.length === 0 ? (
                      <div style={{ padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.875rem', color: '#856404' }}>
                        {invoicesFetchError || 'Select an order first'}
                      </div>
                    ) : (
                      <select value={newDispatch.invoice} onChange={(e) => setNewDispatch({...newDispatch, invoice: e.target.value})} required style={{ width: '100%', padding: 8 }}>
                        <option value="">Select an invoice</option>
                        {invoicesList.map((inv) => (
                          <option key={inv._id} value={inv._id}>
                            {inv.invoiceNumber} - ₹{inv.grandTotal?.toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Dispatch Date</div>
                    <input type="date" value={newDispatch.dispatchDate} onChange={(e) => setNewDispatch({...newDispatch, dispatchDate: e.target.value})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Estimated Delivery Date</div>
                    <input type="date" value={newDispatch.estimatedDeliveryDate} onChange={(e) => setNewDispatch({...newDispatch, estimatedDeliveryDate: e.target.value})} style={{ width: '100%', padding: 8 }} />
                  </div>
                </div>

                <div style={styles.detailSection}>
                  <h3 style={styles.sectionTitle}>Transport</h3>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Transporter</div>
                    <input value={newDispatch.transportDetails.transporter} onChange={(e) => setNewDispatch({...newDispatch, transportDetails: {...newDispatch.transportDetails, transporter: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Vehicle Number</div>
                    <input value={newDispatch.transportDetails.vehicleNumber} onChange={(e) => setNewDispatch({...newDispatch, transportDetails: {...newDispatch.transportDetails, vehicleNumber: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Driver Name</div>
                    <input value={newDispatch.transportDetails.driverName} onChange={(e) => setNewDispatch({...newDispatch, transportDetails: {...newDispatch.transportDetails, driverName: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Driver Contact</div>
                    <input value={newDispatch.transportDetails.driverContact} onChange={(e) => setNewDispatch({...newDispatch, transportDetails: {...newDispatch.transportDetails, driverContact: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                </div>
              </div>

              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Items</h3>
                {newDispatch.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={styles.detailLabel}>Product</div>
                        <select value={item.product} onChange={(e) => updateItemField(idx, 'product', e.target.value)} style={{ width: '100%', padding: 8 }} required>
                          {productOptions.length === 0 ? (
                            <option value="" disabled>{'No products for selected order'}</option>
                          ) : (
                            <>
                              <option value="">Select product</option>
                              {productOptions.map((p) => (
                                <option key={p.id || p._id || p} value={p.id || p._id || p}>{p.name || p.productName || p.label || (p._id || p)}</option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    <div>
                      <div style={styles.detailLabel}>Quantity</div>
                      <input type="number" value={item.quantity} onChange={(e) => updateItemField(idx, 'quantity', e.target.value)} style={{ width: '100%', padding: 8 }} required />
                    </div>
                    <div>
                      <div style={styles.detailLabel}>Batch Numbers (comma separated)</div>
                      <input value={item.batchNumbers} onChange={(e) => updateItemField(idx, 'batchNumbers', e.target.value)} placeholder="B1,B2" style={{ width: '100%', padding: 8 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.detailLabel}>Packaging</div>
                        <input value={item.packagingType} onChange={(e) => updateItemField(idx, 'packagingType', e.target.value)} placeholder="boxes" style={{ width: '100%', padding: 8 }} />
                      </div>
                      <div>
                        <button type="button" onClick={() => removeItemRow(idx)} style={{ padding: '6px 8px', marginBottom: 6 }}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button type="button" onClick={addItemRow} style={{ padding: '8px 12px' }}>+ Add Item</button>
                </div>
              </div>

              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Summary</h3>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Total Weight</div>
                  <input value={newDispatch.totalWeight} onChange={(e) => setNewDispatch({...newDispatch, totalWeight: e.target.value})} style={{ width: '100%', padding: 8 }} />
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailLabel}>Total Packages</div>
                  <input value={newDispatch.totalPackages} onChange={(e) => setNewDispatch({...newDispatch, totalPackages: e.target.value})} style={{ width: '100%', padding: 8 }} />
                </div>
              </div>

              <div style={styles.detailSection}>
                <h3 style={styles.sectionTitle}>Shipping Address</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Street *</div>
                    <input value={newDispatch.shippingAddress.street} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, street: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>City *</div>
                    <input value={newDispatch.shippingAddress.city} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, city: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>State</div>
                    <input value={newDispatch.shippingAddress.state} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, state: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Pincode</div>
                    <input value={newDispatch.shippingAddress.pincode} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, pincode: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Country</div>
                    <input value={newDispatch.shippingAddress.country} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, country: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Contact Person</div>
                    <input value={newDispatch.shippingAddress.contactPerson} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, contactPerson: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                  <div style={styles.detailItem}>
                    <div style={styles.detailLabel}>Contact Number</div>
                    <input value={newDispatch.shippingAddress.contactNumber} onChange={(e) => setNewDispatch({...newDispatch, shippingAddress: {...newDispatch.shippingAddress, contactNumber: e.target.value}})} style={{ width: '100%', padding: 8 }} />
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={{ ...styles.actionButtonLarge, backgroundColor: 'var(--gray-300)', color: 'black' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" style={styles.actionButtonLarge}>Create Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDispatch;