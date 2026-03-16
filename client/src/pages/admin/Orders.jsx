import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaEdit, FaCheck, FaTimes, FaPrint, FaFileInvoice } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import orderService from '../../services/orderService';
import { invoiceService } from '../../services';
import { format } from 'date-fns';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [invoiceCreationLoading, setInvoiceCreationLoading] = useState(false);

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
      minWidth: '200px',
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
      minWidth: '120px',
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
    ordersTable: {
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
        'pending': 'var(--warning-light)',
        'confirmed': 'var(--primary-light)',
        'in-production': 'var(--info-light)',
        'quality-check': 'var(--purple-light)',
        'ready-for-dispatch': 'var(--cyan-light)',
        'dispatched': 'var(--blue-light)',
        'delivered': 'var(--success-light)',
        'cancelled': 'var(--danger-light)',
      }[status] || 'var(--gray-200)',
      color: {
        'pending': 'var(--warning-color)',
        'confirmed': 'var(--primary-color)',
        'in-production': 'var(--info-color)',
        'quality-check': 'var(--purple-color)',
        'ready-for-dispatch': 'var(--cyan-color)',
        'dispatched': 'var(--blue-color)',
        'delivered': 'var(--success-color)',
        'cancelled': 'var(--danger-color)',
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
    editButton: {
      color: 'var(--warning-color)',
    },
    confirmButton: {
      color: 'var(--success-color)',
    },
    cancelButton: {
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
    orderDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '2rem',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid var(--gray-200)',
    },
    detailItem: {
      display: 'flex',
      flexDirection: 'column',
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
    itemsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '2rem',
    },
    totalSection: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: '1.5rem',
    },
    totalBox: {
      width: '300px',
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      fontSize: '0.875rem',
    },
    totalLabel: {
      color: 'var(--gray-600)',
    },
    totalValue: {
      color: 'var(--gray-900)',
      fontWeight: '500',
    },
    grandTotal: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      paddingTop: '0.75rem',
      borderTop: '1px solid var(--gray-300)',
    },
    modalActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
      marginTop: '2rem',
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders({
        status: filterStatus || undefined,
      });
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selectedOrder) {
      toast.error('No order selected');
      return;
    }

    if (!selectedOrder._id) {
      toast.error('Order ID is missing');
      return;
    }

    try {
      setInvoiceCreationLoading(true);
      console.log('Creating invoice for order:', selectedOrder._id, selectedOrder.orderNumber);
      
      const response = await invoiceService.createInvoice({
        orderId: selectedOrder._id,
        paymentTerms: 'net-15'
      });

      console.log('Invoice creation response:', response);

      if (response && response.success) {
        toast.success('Invoice created successfully!');
        setShowDetailsModal(false);
        // Refresh orders list
        fetchOrders();
      } else if (response && response.data && response.data.success) {
        // Handle nested success response
        toast.success('Invoice created successfully!');
        setShowDetailsModal(false);
        fetchOrders();
      } else {
        const errorMsg = response?.message || response?.data?.message || 'Failed to create invoice';
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      let errorMsg = 'Failed to create invoice';

      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.message) {
        errorMsg = error.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }

      console.error('Final error message:', errorMsg);

      // If invoice already exists for this order, navigate to the invoices page filtered by order
      if (errorMsg && errorMsg.toLowerCase().includes('invoice already exists')) {
        toast.success('Invoice already exists for this order. Redirecting to invoices...');
        // Refresh orders and redirect to admin invoices filtered by order
        try {
          fetchOrders();
        } catch (e) {
          console.warn('Failed to refresh orders before redirect', e);
        }
        window.location.href = `/admin/invoices?order=${selectedOrder._id}`;
        return;
      }

      toast.error(errorMsg);
    } finally {
      setInvoiceCreationLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success('Order status updated');
        fetchOrders();
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRowHover = (e) => {
    e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor;
  };

  const handleRowLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
  };

  const handleActionHover = (e, type) => {
    const colorMap = {
      view: 'var(--primary-light)',
      edit: 'var(--warning-light)',
      confirm: 'var(--success-light)',
      cancel: 'var(--danger-light)',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
  };

  const handleActionLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProduction: orders.filter(o => o.status === 'in-production').length,
    completed: orders.filter(o => ['dispatched', 'delivered'].includes(o.status)).length,
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
        <h1 style={styles.headerTitle}>Order Management</h1>
        <p style={styles.headerSubtitle}>Manage and track all customer orders</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{orderStats.total}</div>
            <div style={styles.statLabel}>Total Orders</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{orderStats.pending}</div>
            <div style={styles.statLabel}>Pending Orders</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏭</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{orderStats.inProduction}</div>
            <div style={styles.statLabel}>In Production</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <div style={styles.statValue}>{orderStats.completed}</div>
            <div style={styles.statLabel}>Completed Orders</div>
          </div>
        </div>
      </div>

      <div style={styles.filtersContainer}>
        <input
          type="text"
          placeholder="Search by order number or client..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={handleSearch}
        />
        <select
          style={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="in-production">In Production</option>
          <option value="quality-check">Quality Check</option>
          <option value="ready-for-dispatch">Ready for Dispatch</option>
          <option value="dispatched">Dispatched</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-responsive" style={styles.ordersTable}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Order Number</th>
              <th style={styles.tableHeaderCell}>Client</th>
              <th style={styles.tableHeaderCell}>Order Date</th>
              <th style={styles.tableHeaderCell}>Amount</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order._id}
                style={styles.tableRow}
                onMouseEnter={handleRowHover}
                onMouseLeave={handleRowLeave}
              >
                <td style={styles.tableCell}>
                  <strong>{order.orderNumber}</strong>
                </td>
                <td style={styles.tableCell}>
                  {order.client?.companyName || 'N/A'}
                </td>
                <td style={styles.tableCell}>
                  {format(new Date(order.orderDate), 'dd MMM yyyy')}
                </td>
                <td style={styles.tableCell}>
                  ₹{order.grandTotal?.toLocaleString() || '0'}
                </td>
                <td style={styles.tableCell}>
                  <span style={styles.statusBadge(order.status)}>
                    {order.status.replace('-', ' ')}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.actionButton, ...styles.viewButton }}
                      onClick={() => handleViewOrder(order)}
                      onMouseEnter={(e) => handleActionHover(e, 'view')}
                      onMouseLeave={handleActionLeave}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    
                    {order.status === 'pending' && (
                      <button
                        style={{ ...styles.actionButton, ...styles.confirmButton }}
                        onClick={() => handleUpdateStatus(order._id, 'confirmed')}
                        onMouseEnter={(e) => handleActionHover(e, 'confirm')}
                        onMouseLeave={handleActionLeave}
                        title="Confirm Order"
                      >
                        <FaCheck />
                      </button>
                    )}
                    
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        style={{ ...styles.actionButton, ...styles.cancelButton }}
                        onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                        onMouseEnter={(e) => handleActionHover(e, 'cancel')}
                        onMouseLeave={handleActionLeave}
                        title="Cancel Order"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                Order Details - {selectedOrder.orderNumber}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedOrder(null);
                }}
              >
                ×
              </button>
            </div>

            <div style={styles.orderDetails}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Client</span>
                <span style={styles.detailValue}>
                  {selectedOrder.client?.companyName || 'N/A'}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Order Date</span>
                <span style={styles.detailValue}>
                  {format(new Date(selectedOrder.orderDate), 'dd MMM yyyy')}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Delivery Date</span>
                <span style={styles.detailValue}>
                  {selectedOrder.deliveryDate 
                    ? format(new Date(selectedOrder.deliveryDate), 'dd MMM yyyy')
                    : 'Not set'}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Status</span>
                <span style={styles.detailValue}>
                  <span style={styles.statusBadge(selectedOrder.status)}>
                    {selectedOrder.status.replace('-', ' ')}
                  </span>
                </span>
              </div>
            </div>

            <table style={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                    Product
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                    Quantity
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                    Unit Price
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item, index) => (
                  <tr key={index}>
                    <td style={{ padding: '0.75rem 0' }}>
                      {item.product?.name || 'Product'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>
                      {item.quantity} {item.product?.unit || 'kg'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>
                      ₹{item.unitPrice?.toLocaleString() || '0'}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>
                      ₹{item.totalPrice?.toLocaleString() || '0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.totalSection}>
              <div style={styles.totalBox}>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>Subtotal</span>
                  <span style={styles.totalValue}>
                    ₹{selectedOrder.totalAmount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={styles.totalRow}>
                  <span style={styles.totalLabel}>GST (18%)</span>
                  <span style={styles.totalValue}>
                    ₹{selectedOrder.gstAmount?.toLocaleString() || '0'}
                  </span>
                </div>
                <div style={{ ...styles.totalRow, ...styles.grandTotal }}>
                  <span style={styles.totalLabel}>Grand Total</span>
                  <span style={styles.totalValue}>
                    ₹{selectedOrder.grandTotal?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--success-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: invoiceCreationLoading ? 'not-allowed' : 'pointer',
                  opacity: invoiceCreationLoading ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onClick={handleCreateInvoice}
                disabled={invoiceCreationLoading}
              >
                <FaFileInvoice />
                <span>{invoiceCreationLoading ? 'Creating...' : 'Create Invoice'}</span>
              </button>
              <button
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onClick={() => window.print()}
              >
                <FaPrint />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;