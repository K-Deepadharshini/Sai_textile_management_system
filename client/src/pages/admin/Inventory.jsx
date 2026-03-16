import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import inventoryService from '../../services/inventoryService';

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

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
    searchContainer: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
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
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    inventoryTable: {
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
      backgroundColor: {
        'in-stock': 'var(--success-light)',
        'low-stock': 'var(--warning-light)',
        'out-of-stock': 'var(--danger-light)',
        'expired': 'var(--gray-200)',
      }[status] || 'var(--gray-200)',
      color: {
        'in-stock': 'var(--success-color)',
        'low-stock': 'var(--warning-color)',
        'out-of-stock': 'var(--danger-color)',
        'expired': 'var(--gray-700)',
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
    editButton: {
      color: 'var(--primary-color)',
    },
    deleteButton: {
      color: 'var(--danger-color)',
    },
    lowStockAlert: {
      backgroundColor: 'var(--warning-light)',
      border: '1px solid var(--warning-color)',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    alertIcon: {
      color: 'var(--warning-color)',
      fontSize: '1.25rem',
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
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getAllInventory();
      if (response.success) {
        setInventory(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item) => {
    setCurrentItem(item);
    setShowModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const response = await inventoryService.deleteInventoryItem(item._id);
        if (response.success) {
          toast.success('Item deleted successfully');
          fetchInventory();
        }
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const flatData = Object.fromEntries(formData.entries());
    
    // Restructure nested fields properly
    const itemData = {
      itemCode: flatData.itemCode,
      itemName: flatData.itemName,
      itemType: flatData.itemType,
      category: flatData.category,
      unit: flatData.unit,
      currentStock: parseFloat(flatData.currentStock) || 0,
      minStockLevel: parseFloat(flatData.minStockLevel) || 50,
      reorderPoint: parseFloat(flatData.reorderPoint) || 100,
      averageCost: parseFloat(flatData.averageCost) || 0,
      supplierDetails: {
        name: flatData['supplierDetails.name'] || '',
        contact: flatData['supplierDetails.contact'] || '',
        email: flatData['supplierDetails.email'] || '',
        leadTime: parseInt(flatData['supplierDetails.leadTime']) || 0,
      },
    };
    
    try {
      let response;
      if (currentItem) {
        response = await inventoryService.updateInventoryItem(currentItem._id, itemData);
      } else {
        response = await inventoryService.createInventoryItem(itemData);
      }
      
      if (response.success) {
        toast.success(currentItem ? 'Item updated successfully' : 'Item added successfully');
        setShowModal(false);
        fetchInventory();
      }
    } catch (error) {
      toast.error('Failed to save item');
    }
  };

  const lowStockItems = inventory.filter(item => 
    item.status === 'low-stock' || item.status === 'out-of-stock'
  );

  const totalValue = inventory.reduce((sum, item) => {
    const stock = parseFloat(item.currentStock) || 0;
    const cost = parseFloat(item.averageCost) || 0;
    return sum + (stock * cost);
  }, 0);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterCategory || item.category === filterCategory;
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
        <h1 style={styles.headerTitle}>Inventory Management</h1>
        <div style={styles.headerActions}>
          <button
            style={styles.addButton}
            onClick={handleAddItem}
          >
            <FaPlus />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div style={styles.lowStockAlert}>
          <FaExclamationTriangle style={styles.alertIcon} />
          <div>
            <strong>Low Stock Alert:</strong> {lowStockItems.length} items need attention
          </div>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{inventory.length}</div>
          <div style={styles.statLabel}>Total Items</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
          <div style={styles.statLabel}>Total Value</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {lowStockItems.length}
          </div>
          <div style={styles.statLabel}>Low Stock Items</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {inventory.filter(item => item.status === 'in-stock').length}
          </div>
          <div style={styles.statLabel}>In Stock Items</div>
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
            placeholder="Search inventory items..."
            style={{ ...styles.searchInput, paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          style={styles.filterSelect}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="polyester-chips">Polyester Chips</option>
          <option value="dyes">Dyes</option>
          <option value="chemicals">Chemicals</option>
          <option value="packaging">Packaging</option>
          <option value="yarn">Yarn</option>
        </select>
      </div>

      <div style={styles.inventoryTable}>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.tableHeaderCell}>Item Code</th>
              <th style={styles.tableHeaderCell}>Item Name</th>
              <th style={styles.tableHeaderCell}>Category</th>
              <th style={styles.tableHeaderCell}>Current Stock</th>
              <th style={styles.tableHeaderCell}>Status</th>
              <th style={styles.tableHeaderCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map((item) => (
              <tr key={item._id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <strong>{item.itemCode}</strong>
                </td>
                <td style={styles.tableCell}>{item.itemName}</td>
                <td style={styles.tableCell}>{item.category}</td>
                <td style={styles.tableCell}>
                  {item.currentStock} {item.unit}
                </td>
                <td style={styles.tableCell}>
                  <span style={styles.statusBadge(item.status)}>
                    {item.status.replace('-', ' ')}
                  </span>
                </td>
                <td style={styles.tableCell}>
                  <div style={styles.actionButtons}>
                    <button
                      style={{ ...styles.actionButton, ...styles.editButton }}
                      onClick={() => handleEditItem(item)}
                      title="Edit Item"
                    >
                      <FaEdit />
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteButton }}
                      onClick={() => handleDeleteItem(item)}
                      title="Delete Item"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {currentItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h2>
              <button
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Item Code *</label>
                  <input
                    type="text"
                    name="itemCode"
                    style={styles.formInput}
                    defaultValue={currentItem?.itemCode}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Item Name *</label>
                  <input
                    type="text"
                    name="itemName"
                    style={styles.formInput}
                    defaultValue={currentItem?.itemName}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Item Type *</label>
                  <select name="itemType" style={styles.formInput} defaultValue={currentItem?.itemType}>
                    <option value="raw-material">Raw Material</option>
                    <option value="finished-goods">Finished Goods</option>
                    <option value="consumables">Consumables</option>
                    <option value="chemicals">Chemicals</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category *</label>
                  <select name="category" style={styles.formInput} defaultValue={currentItem?.category}>
                    <option value="polyester-chips">Polyester Chips</option>
                    <option value="dyes">Dyes</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="packaging">Packaging</option>
                    <option value="yarn">Yarn</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Current Stock</label>
                  <input
                    type="number"
                    name="currentStock"
                    style={styles.formInput}
                    defaultValue={currentItem?.currentStock || 0}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Unit *</label>
                  <input
                    type="text"
                    name="unit"
                    style={styles.formInput}
                    defaultValue={currentItem?.unit || 'kg'}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Min Stock Level</label>
                  <input
                    type="number"
                    name="minStockLevel"
                    style={styles.formInput}
                    defaultValue={currentItem?.minStockLevel || 50}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Reorder Point</label>
                  <input
                    type="number"
                    name="reorderPoint"
                    style={styles.formInput}
                    defaultValue={currentItem?.reorderPoint || 100}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Average Cost</label>
                  <input
                    type="number"
                    name="averageCost"
                    step="0.01"
                    style={styles.formInput}
                    defaultValue={currentItem?.averageCost || 0}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Max Stock Level</label>
                  <input
                    type="number"
                    name="maxStockLevel"
                    style={styles.formInput}
                    defaultValue={currentItem?.maxStockLevel || 1000}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Supplier Name</label>
                <input
                  type="text"
                  name="supplierDetails.name"
                  style={styles.formInput}
                  defaultValue={currentItem?.supplierDetails?.name}
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Supplier Contact</label>
                  <input
                    type="text"
                    name="supplierDetails.contact"
                    style={styles.formInput}
                    defaultValue={currentItem?.supplierDetails?.contact}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Supplier Email</label>
                  <input
                    type="email"
                    name="supplierDetails.email"
                    style={styles.formInput}
                    defaultValue={currentItem?.supplierDetails?.email}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Lead Time (days)</label>
                <input
                  type="number"
                  name="supplierDetails.leadTime"
                  style={styles.formInput}
                  defaultValue={currentItem?.supplierDetails?.leadTime || 0}
                />
              </div>

              <button type="submit" style={styles.submitButton}>
                {currentItem ? 'Update Item' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;