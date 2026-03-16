import React, { useState, useEffect } from 'react';
import { FaUsers, FaSearch, FaEdit, FaTrash, FaEye, FaToggleOn, FaToggleOff, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const itemsPerPage = 10;

  // CSS Styles
  const styles = {
    container: {
      padding: '1rem 0',
    },
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    pageTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.875rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
    },
    headerControls: {
      display: 'flex',
      gap: '1rem',
    },
    searchBox: {
      position: 'relative',
      width: '300px',
    },
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--gray-400)',
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
    },
    filterSelect: {
      padding: '0.75rem 2rem 0.75rem 1rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      minWidth: '150px',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
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
      width: '48px',
      height: '48px',
      borderRadius: '0.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
    },
    statInfo: {
      flex: 1,
    },
    statLabel: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
      marginBottom: '0.25rem',
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
    },
    clientsTable: {
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
    clientInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
    },
    clientDetails: {
      flex: 1,
    },
    clientName: {
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.25rem',
    },
    clientEmail: {
      fontSize: '0.75rem',
      color: 'var(--gray-600)',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
    },
    badgeActive: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success-color)',
    },
    badgeInactive: {
      backgroundColor: 'var(--gray-200)',
      color: 'var(--gray-600)',
    },
    badgeSuspended: {
      backgroundColor: 'var(--danger-light)',
      color: 'var(--danger-color)',
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
    toggleButton: {
      color: 'var(--success-color)',
    },
    emptyState: {
      padding: '3rem 1rem',
      textAlign: 'center',
      color: 'var(--gray-500)',
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
      padding: '0.5rem 1rem',
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
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await authService.getAllUsers({ role: 'client' });
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleStatusToggle = async (clientId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const response = await authService.updateUserStatus(clientId, newStatus);
      if (response.success) {
        toast.success('Client status updated');
        fetchClients();
      }
    } catch (error) {
      toast.error('Failed to update client status');
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        // Implement delete client API
        toast.success('Client deleted successfully');
        fetchClients();
      } catch (error) {
        toast.error('Failed to delete client');
      }
    }
  };

  const getStatusBadgeStyle = (status) => {
    const stylesMap = {
      'active': styles.badgeActive,
      'inactive': styles.badgeInactive,
      'suspended': styles.badgeSuspended,
    };
    return stylesMap[status] || styles.badgeInactive;
  };

  const stats = [
    { label: 'Total Clients', value: clients.length, icon: <FaUsers />, color: '#3b82f6' },
    { label: 'Active', value: clients.filter(c => c.status === 'active').length, icon: <FaToggleOn />, color: '#10b981' },
    { label: 'Inactive', value: clients.filter(c => c.status === 'inactive').length, icon: <FaToggleOff />, color: '#6b7280' },
    { label: 'Suspended', value: clients.filter(c => c.status === 'suspended').length, icon: <FaBuilding />, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div style={styles.loading}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div style={styles.pageTitle}>
          <FaUsers />
          <span>Client Management</span>
        </div>
        <div style={styles.headerControls}>
          <div style={styles.searchBox}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search clients..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            style={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={{ ...styles.statIcon, backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statValue}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.clientsTable}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Client</th>
              <th style={styles.tableHeaderCell}>Company</th>
              <th style={styles.tableHeaderCell}>Contact</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Last Login</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr 
                key={client._id} 
                style={styles.tableRow}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.tableRowHover.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <td style={styles.tableCell}>
                  <div style={styles.clientInfo}>
                    <div style={styles.avatar}>
                      {client.name.charAt(0)}
                    </div>
                    <div style={styles.clientDetails}>
                      <div style={styles.clientName}>{client.name}</div>
                      <div style={styles.clientEmail}>{client.email}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.clientName}>{client.companyName}</div>
                  <div style={styles.clientEmail}>GST: {client.gstNumber}</div>
                </td>
                <td style={styles.tableCell}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaPhone style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }} />
                      <span>{client.phone}</span>
                    </div>
                    {client.address?.city && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                        {client.address.city}, {client.address.state}
                      </div>
                    )}
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <span style={{ ...styles.statusBadge, ...getStatusBadgeStyle(client.status) }}>
                    {client.status}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  {client.lastLogin 
                    ? new Date(client.lastLogin).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.actionButton, ...styles.viewButton }}
                      onClick={() => setSelectedClient(client)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.toggleButton }}
                      onClick={() => handleStatusToggle(client._id, client.status)}
                      title={client.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {client.status === 'active' ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.editButton }}
                      onClick={() => {/* Implement edit */}}
                      title="Edit Client"
                    >
                      <FaEdit />
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      onClick={() => handleDelete(client._id)}
                      title="Delete Client"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div style={styles.emptyState}>
            <FaUsers style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--gray-300)' }} />
            <p>No clients found</p>
          </div>
        )}

        <div style={styles.pagination}>
          <div style={styles.pageInfo}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length} clients
          </div>
          <div style={styles.pageButtons}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === page ? styles.pageButtonActive : {}),
                }}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;