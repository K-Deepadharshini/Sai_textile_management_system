import React, { useState } from 'react';
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { format } from 'date-fns';

const OrderTable = ({ orders, onView, onEdit, onDelete, onStatusChange, emptyMessage }) => {
  const [sortField, setSortField] = useState('orderDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // CSS Styles within the component
  const styles = {
    container: {
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
      padding: '0.75rem 1rem',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--gray-700)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid var(--gray-200)',
      cursor: 'pointer',
      userSelect: 'none',
    },
    sortableHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    tableRow: {
      transition: 'background-color 0.2s',
    },
    tableRowHover: {
      backgroundColor: 'var(--gray-50)',
    },
    tableCell: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid var(--gray-200)',
      fontSize: '0.875rem',
      color: 'var(--gray-800)',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    badgePending: {
      backgroundColor: 'var(--warning-light)',
      color: 'var(--warning-color)',
    },
    badgeConfirmed: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-color)',
    },
    badgeProduction: {
      backgroundColor: '#8b5cf620',
      color: '#8b5cf6',
    },
    badgeCompleted: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success-color)',
    },
    badgeDispatched: {
      backgroundColor: '#3b82f620',
      color: '#3b82f6',
    },
    badgeDelivered: {
      backgroundColor: '#10b98120',
      color: '#10b981',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    actionButton: {
      padding: '0.375rem',
      borderRadius: '0.25rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButton: {
      color: 'var(--primary-color)',
    },
    editButton: {
      color: 'var(--warning-color)',
    },
    deleteButton: {
      color: 'var(--danger-color)',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem',
      borderTop: '1px solid var(--gray-200)',
    },
    pageInfo: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    pageButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    pageButton: {
      padding: '0.375rem 0.75rem',
      borderRadius: '0.25rem',
      border: '1px solid var(--gray-300)',
      backgroundColor: 'white',
      color: 'var(--gray-700)',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
    },
    pageButtonActive: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      borderColor: 'var(--primary-color)',
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    emptyState: {
      padding: '3rem 1rem',
      textAlign: 'center',
      color: 'var(--gray-500)',
    },
  };

  const getStatusBadgeStyle = (status) => {
    const badgeStyles = {
      'pending': styles.badgePending,
      'confirmed': styles.badgeConfirmed,
      'in-production': styles.badgeProduction,
      'completed': styles.badgeCompleted,
      'dispatched': styles.badgeDispatched,
      'delivered': styles.badgeDelivered,
    };
    return badgeStyles[status] || styles.badgePending;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
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
      delete: 'var(--danger-light)',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
  };

  const handleActionLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  if (!orders || orders.length === 0) {
    return (
      <div style={styles.emptyState}>
        <p>{emptyMessage || 'No orders found'}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            {[
              { field: 'orderNumber', label: 'Order No' },
              { field: 'client', label: 'Client' },
              { field: 'orderDate', label: 'Date' },
              { field: 'totalAmount', label: 'Amount' },
              { field: 'status', label: 'Status' },
              { field: 'actions', label: 'Actions' },
            ].map((column) => (
              <th 
                key={column.field}
                style={styles.tableHeaderCell}
                onClick={() => column.field !== 'actions' && handleSort(column.field)}
              >
                <div style={styles.sortableHeader}>
                  {column.label}
                  {column.field !== 'actions' && sortField === column.field && (
                    sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />
                  )}
                  {column.field !== 'actions' && sortField !== column.field && (
                    <FaSort />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedOrders.map((order) => (
            <tr 
              key={order.id}
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
                ₹{order.totalAmount?.toLocaleString() || '0'}
              </td>
              <td style={styles.tableCell}>
                <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(order.status) }}>
                  {order.status.replace('-', ' ')}
                </span>
              </td>
              <td style={styles.tableCell}>
                <div style={styles.actionButtons}>
                  <button
                    style={{ ...styles.actionButton, ...styles.viewButton }}
                    onClick={() => onView(order)}
                    onMouseEnter={(e) => handleActionHover(e, 'view')}
                    onMouseLeave={handleActionLeave}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    style={{ ...styles.actionButton, ...styles.editButton }}
                    onClick={() => onEdit(order)}
                    onMouseEnter={(e) => handleActionHover(e, 'edit')}
                    onMouseLeave={handleActionLeave}
                    title="Edit Order"
                  >
                    <FaEdit />
                  </button>
                  <button
                    style={{ ...styles.actionButton, ...styles.deleteButton }}
                    onClick={() => onDelete(order)}
                    onMouseEnter={(e) => handleActionHover(e, 'delete')}
                    onMouseLeave={handleActionLeave}
                    title="Delete Order"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.pagination}>
        <div style={styles.pageInfo}>
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedOrders.length)} of {sortedOrders.length} orders
        </div>
        <div style={styles.pageButtons}>
          <button
            style={{
              ...styles.pageButton,
              ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
            }}
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              style={{
                ...styles.pageButton,
                ...(currentPage === index + 1 ? styles.pageButtonActive : {}),
              }}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            style={{
              ...styles.pageButton,
              ...(currentPage === totalPages ? styles.pageButtonDisabled : {}),
            }}
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;