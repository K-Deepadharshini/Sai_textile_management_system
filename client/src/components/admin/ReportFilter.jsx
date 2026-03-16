import React, { useState } from 'react';
import { FaCalendar, FaFilePdf, FaFileExcel, FaFilter, FaDownload } from 'react-icons/fa';
import { format, subDays, subMonths, subYears } from 'date-fns';

const ReportFilter = ({ onGenerate, onExport, reportType }) => {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [formatType, setFormatType] = useState('pdf');
  const [filters, setFilters] = useState({
    status: '',
    productType: '',
    client: '',
  });

  // CSS Styles within the component
  const styles = {
    filterCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: 'var(--shadow)',
      marginBottom: '1.5rem',
    },
    filterHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    filterTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    filterControls: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    filterBody: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    filterGroup: {
      marginBottom: '1rem',
    },
    filterLabel: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--gray-700)',
    },
    dateInputGroup: {
      display: 'flex',
      gap: '1rem',
    },
    dateInput: {
      flex: 1,
      padding: '0.5rem 0.75rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
    },
    select: {
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      backgroundColor: 'white',
    },
    quickDateButtons: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      marginBottom: '1rem',
    },
    quickDateButton: {
      padding: '0.375rem 0.75rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      color: 'var(--gray-700)',
      fontSize: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    quickDateButtonActive: {
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      borderColor: 'var(--primary-color)',
    },
    formatOptions: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    formatOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    formatOptionActive: {
      backgroundColor: 'var(--primary-light)',
      borderColor: 'var(--primary-color)',
      color: 'var(--primary-color)',
    },
    actionButtons: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
    },
    generateButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1.5rem',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    exportButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1.5rem',
      backgroundColor: 'var(--success-color)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
  };

  const quickDateRanges = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'This Month', days: 'month' },
    { label: 'Last Month', days: 'last-month' },
    { label: 'This Year', days: 'year' },
  ];

  const handleQuickDateSelect = (range) => {
    const today = new Date();
    let startDate;

    if (range.days === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (range.days === 'last-month') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      setDateRange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
      return;
    } else if (range.days === 'year') {
      startDate = new Date(today.getFullYear(), 0, 1);
    } else {
      startDate = subDays(today, range.days);
    }

    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    });
  };

  const handleGenerate = () => {
    onGenerate({
      ...dateRange,
      ...filters,
      format: formatType,
    });
  };

  const handleExport = () => {
    onExport({
      ...dateRange,
      ...filters,
      format: formatType,
    });
  };

  const handleQuickDateHover = (e) => {
    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
  };

  const handleQuickDateLeave = (e) => {
    e.currentTarget.style.backgroundColor = 'white';
  };

  const handleButtonHover = (e, type) => {
    const colorMap = {
      generate: '#1e40af',
      export: '#065f46',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
  };

  const handleButtonLeave = (e, type) => {
    const colorMap = {
      generate: 'var(--primary-color)',
      export: 'var(--success-color)',
    };
    e.currentTarget.style.backgroundColor = colorMap[type];
  };

  const isActiveRange = (range) => {
    const today = new Date();
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (range.days === 'month') {
      return startDate.getDate() === 1 && 
             startDate.getMonth() === today.getMonth() &&
             startDate.getFullYear() === today.getFullYear();
    }
    
    return diffDays === range.days;
  };

  return (
    <div style={styles.filterCard}>
      <div style={styles.filterHeader}>
        <div style={styles.filterTitle}>
          <FaFilter />
          <span>Report Filters</span>
        </div>
        <div style={styles.filterControls}>
          <span style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            Report Type: {reportType}
          </span>
        </div>
      </div>

      <div style={styles.quickDateButtons}>
        {quickDateRanges.map((range) => (
          <button
            key={range.label}
            style={{
              ...styles.quickDateButton,
              ...(isActiveRange(range) ? styles.quickDateButtonActive : {}),
            }}
            onClick={() => handleQuickDateSelect(range)}
            onMouseEnter={handleQuickDateHover}
            onMouseLeave={handleQuickDateLeave}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div style={styles.filterBody}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Date Range</label>
          <div style={styles.dateInputGroup}>
            <input
              type="date"
              style={styles.dateInput}
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
            <input
              type="date"
              style={styles.dateInput}
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status</label>
          <select
            style={styles.select}
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-production">In Production</option>
            <option value="completed">Completed</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Product Type</label>
          <select
            style={styles.select}
            value={filters.productType}
            onChange={(e) => setFilters({...filters, productType: e.target.value})}
          >
            <option value="">All Products</option>
            <option value="polyester-filament">Polyester Filament</option>
            <option value="yarn-dyed">Yarn Dyed</option>
            <option value="raw-yarn">Raw Yarn</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Client</label>
          <select
            style={styles.select}
            value={filters.client}
            onChange={(e) => setFilters({...filters, client: e.target.value})}
          >
            <option value="">All Clients</option>
            <option value="client">Client</option>
            <option value="messages">Messages</option>
            <option value="inventory">Inventory</option>
          </select>
        </div>
      </div>

      <div style={styles.formatOptions}>
        <div
          style={{
            ...styles.formatOption,
            ...(formatType === 'pdf' ? styles.formatOptionActive : {}),
          }}
          onClick={() => setFormatType('pdf')}
        >
          <FaFilePdf />
          <span>PDF Format</span>
        </div>
        <div
          style={{
            ...styles.formatOption,
            ...(formatType === 'excel' ? styles.formatOptionActive : {}),
          }}
          onClick={() => setFormatType('excel')}
        >
          <FaFileExcel />
          <span>Excel Format</span>
        </div>
      </div>

      <div style={styles.actionButtons}>
        <button
          style={styles.generateButton}
          onClick={handleGenerate}
          onMouseEnter={(e) => handleButtonHover(e, 'generate')}
          onMouseLeave={(e) => handleButtonLeave(e, 'generate')}
        >
          <FaCalendar />
          <span>Generate Report</span>
        </button>
        <button
          style={styles.exportButton}
          onClick={handleExport}
          onMouseEnter={(e) => handleButtonHover(e, 'export')}
          onMouseLeave={(e) => handleButtonLeave(e, 'export')}
        >
          <FaDownload />
          <span>Export {formatType.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};

export default ReportFilter;