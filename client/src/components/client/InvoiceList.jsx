import React, { useState } from 'react';
import { FaFileInvoice, FaDownload, FaEye, FaPrint, FaSort, FaFilter } from 'react-icons/fa';
import { format } from 'date-fns';

const InvoiceList = ({ invoices, onView, onDownload, onPrint }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  // CSS Styles within the component
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    },
    header: {
      padding: '1.5rem',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    controls: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
    },
    filterSelect: {
      padding: '0.5rem 2rem 0.5rem 0.75rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      minWidth: '150px',
    },
    invoiceList: {
      padding: '0',
    },
    invoiceItem: {
      padding: '1.25rem 1.5rem',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'background-color 0.2s',
    },
    invoiceItemHover: {
      backgroundColor: 'var(--gray-50)',
    },
    invoiceInfo: {
      flex: 1,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      alignItems: 'center',
    },
    invoiceNumber: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    invoiceDate: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    invoiceAmount: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
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
    badgePaid: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success-color)',
    },
    badgeUnpaid: {
      backgroundColor: 'var(--warning-light)',
      color: 'var(--warning-color)',
    },
    badgeOverdue: {
      backgroundColor: 'var(--danger-light)',
      color: 'var(--danger-color)',
    },
    badgePartial: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-color)',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    actionButton: {
      padding: '0.5rem',
      borderRadius: '0.375rem',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem',
    },
    viewButton: {
      color: 'var(--primary-color)',
    },
    downloadButton: {
      color: 'var(--success-color)',
    },
    printButton: {
      color: 'var(--gray-600)',
    },
    buttonHover: {
      backgroundColor: 'var(--gray-100)',
    },
    emptyState: {
      padding: '3rem 1rem',
      textAlign: 'center',
      color: 'var(--gray-500)',
    },
    emptyIcon: {
      fontSize: '3rem',
      color: 'var(--gray-300)',
      marginBottom: '1rem',
    },
    pagination: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid var(--gray-200)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    },
    pageButtonActive: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      borderColor: 'var(--primary-color)',
    },
  };

  const getStatusBadgeStyle = (status) => {
    const badgeStyles = {
      'paid': styles.badgePaid,
      'unpaid': styles.badgeUnpaid,
      'overdue': styles.badgeOverdue,
      'partially-paid': styles.badgePartial,
    };
    return badgeStyles[status] || styles.badgeUnpaid;
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus === 'all') return true;
    return invoice.paymentStatus === filterStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.invoiceDate);
        bValue = new Date(b.invoiceDate);
        break;
      case 'amount':
        aValue = a.grandTotal;
        bValue = b.grandTotal;
        break;
      case 'number':
        aValue = a.invoiceNumber;
        bValue = b.invoiceNumber;
        break;
      default:
        aValue = a.invoiceDate;
        bValue = b.invoiceDate;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleInvoiceHover = (e) => {
    e.currentTarget.style.backgroundColor = styles.invoiceItemHover.backgroundColor;
  };

  const handleInvoiceLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
  };

  const handleActionHover = (e) => {
    e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
  };

  const handleActionLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  };

  if (invoices.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <FaFileInvoice style={styles.emptyIcon} />
          <p>No invoices found</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <FaFileInvoice />
          <span>My Invoices</span>
        </div>
        <div style={styles.controls}>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="partially-paid">Partially Paid</option>
          </select>
        </div>
      </div>

      <div style={styles.invoiceList}>
        {sortedInvoices.map((invoice) => (
          <div
            key={invoice.id}
            style={styles.invoiceItem}
            onMouseEnter={handleInvoiceHover}
            onMouseLeave={handleInvoiceLeave}
          >
            <div style={styles.invoiceInfo}>
              <div>
                <div style={styles.invoiceNumber}>{invoice.invoiceNumber}</div>
                <div style={styles.invoiceDate}>
                  {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                </div>
              </div>
              <div>
                <span style={styles.invoiceAmount}>
                  ₹{invoice.grandTotal?.toLocaleString() || '0'}
                </span>
              </div>
              <div>
                <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(invoice.paymentStatus) }}>
                  {invoice.paymentStatus.replace('-', ' ')}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                  Due: {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                </span>
              </div>
            </div>
            <div style={styles.actionButtons}>
              <button
                style={{ ...styles.actionButton, ...styles.viewButton }}
                onClick={() => onView(invoice)}
                onMouseEnter={handleActionHover}
                onMouseLeave={handleActionLeave}
                title="View Invoice"
              >
                <FaEye />
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.downloadButton }}
                onClick={() => onDownload(invoice)}
                onMouseEnter={handleActionHover}
                onMouseLeave={handleActionLeave}
                title="Download PDF"
              >
                <FaDownload />
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.printButton }}
                onClick={() => onPrint(invoice)}
                onMouseEnter={handleActionHover}
                onMouseLeave={handleActionLeave}
                title="Print Invoice"
              >
                <FaPrint />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.pagination}>
        <div style={styles.pageInfo}>
          Showing {sortedInvoices.length} invoices
        </div>
      </div>
    </div>
  );
};

export default InvoiceList;