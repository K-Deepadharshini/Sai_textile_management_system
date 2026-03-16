import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaDownload, FaPrint, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import invoiceService from '../../services/invoiceService';
import { format } from 'date-fns';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
    invoicesTable: {
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
        'unpaid': 'var(--danger-light)',
        'partially-paid': 'var(--warning-light)',
        'paid': 'var(--success-light)',
        'overdue': 'var(--danger-light)',
      }[status] || 'var(--gray-200)',
      color: {
        'unpaid': 'var(--danger-color)',
        'partially-paid': 'var(--warning-color)',
        'paid': 'var(--success-color)',
        'overdue': 'var(--danger-color)',
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
    downloadButton: {
      color: 'var(--success-color)',
    },
    printButton: {
      color: 'var(--gray-600)',
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getAllInvoices({
        paymentStatus: filterStatus || undefined,
      });
      if (response.success) {
        setInvoices(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const pdfBlob = await invoiceService.generateInvoicePDF(invoice._id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterStatus || invoice.paymentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
        <h1 style={styles.headerTitle}>Invoice Management</h1>
        <p style={styles.headerSubtitle}>Manage and track all invoices</p>
      </div>

      <div style={styles.filtersContainer}>
        <input
          type="text"
          placeholder="Search by invoice number or client..."
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
          <option value="unpaid">Unpaid</option>
          <option value="partially-paid">Partially Paid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div style={styles.invoicesTable}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Invoice No</th>
              <th style={styles.tableHeaderCell}>Client</th>
              <th style={styles.tableHeaderCell}>Invoice Date</th>
              <th style={styles.tableHeaderCell}>Due Date</th>
              <th style={styles.tableHeaderCell}>Amount</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice._id}
                style={styles.tableRow}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <td style={styles.tableCell}>
                  <strong>{invoice.invoiceNumber}</strong>
                </td>
                <td style={styles.tableCell}>
                  {invoice.client?.companyName || 'N/A'}
                </td>
                <td style={styles.tableCell}>
                  {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                </td>
                <td style={styles.tableCell}>
                  {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                </td>
                <td style={styles.tableCell}>
                  <FaRupeeSign style={{ fontSize: '0.75rem', marginRight: '0.25rem' }} />
                  {invoice.grandTotal?.toLocaleString() || '0'}
                </td>
                <td style={styles.tableCell}>
                  <span style={styles.statusBadge(invoice.paymentStatus)}>
                    {invoice.paymentStatus.replace('-', ' ')}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.actionButton, ...styles.viewButton }}
                      onClick={() => handleViewInvoice(invoice)}
                      title="View Invoice"
                    >
                      <FaEye />
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.downloadButton }}
                      onClick={() => handleDownloadPDF(invoice)}
                      title="Download PDF"
                    >
                      <FaDownload />
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.printButton }}
                      onClick={() => window.print()}
                      title="Print Invoice"
                    >
                      <FaPrint />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInvoices;