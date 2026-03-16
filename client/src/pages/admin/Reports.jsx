import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel, FaFilter, FaDownload, FaChartBar, FaPrint, FaCalendarAlt } from 'react-icons/fa';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ReportFilter from '../../components/admin/ReportFilter';
import { reportService } from '../../services';
import { format as formatDate, subDays, subMonths, subYears } from 'date-fns';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: formatDate(new Date(), 'yyyy-MM-dd'),
  });
  const [reportData, setReportData] = useState({
    sales: null,
    production: null,
    inventory: null,
    orders: null,
  });
  const [charts, setCharts] = useState({
    salesTrend: null,
    productionStatus: null,
    inventoryStatus: null,
    clientDistribution: null,
  });

  // CSS Styles within the component
  const styles = {
    container: {
      padding: '1rem 0',
    },
    pageHeader: {
      marginBottom: '2rem',
    },
    pageTitle: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    pageSubtitle: {
      fontSize: '1rem',
      color: 'var(--gray-600)',
    },
    reportTabs: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem',
      borderBottom: '1px solid var(--gray-200)',
      paddingBottom: '0.5rem',
    },
    tabButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: 'transparent',
      color: 'var(--gray-600)',
      border: 'none',
      borderBottom: '2px solid transparent',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    tabButtonActive: {
      color: 'var(--primary-color)',
      borderBottomColor: 'var(--primary-color)',
      backgroundColor: 'var(--primary-light)',
    },
    filterSection: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      marginBottom: '2rem',
      overflow: 'hidden',
    },
    reportContent: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    summaryCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
    },
    summaryHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      paddingBottom: '0.75rem',
      borderBottom: '1px solid var(--gray-200)',
    },
    summaryTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    summaryIcon: {
      fontSize: '1.25rem',
      color: 'var(--gray-500)',
    },
    summaryStats: {
      marginTop: '1rem',
    },
    statItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--gray-100)',
    },
    statLabel: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    statValue: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
      gridColumn: reportType === 'sales' ? 'span 2' : 'span 1',
    },
    chartHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    chartTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    chartContainer: {
      height: '300px',
      position: 'relative',
    },
    exportSection: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
      marginTop: '1.5rem',
    },
    exportHeader: {
      marginBottom: '1.5rem',
    },
    exportTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    exportDescription: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    exportButtons: {
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    exportButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: 'white',
      color: 'var(--primary-color)',
      border: '1px solid var(--primary-color)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    pdfButton: {
      backgroundColor: 'var(--danger-color)',
      color: 'white',
      borderColor: 'var(--danger-color)',
    },
    excelButton: {
      backgroundColor: 'var(--success-color)',
      color: 'white',
      borderColor: 'var(--success-color)',
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '3rem 1rem',
      color: 'var(--gray-500)',
    },
  };

  const reportTypes = [
    { id: 'sales', label: 'Sales Reports', icon: <FaChartBar /> },
    { id: 'production', label: 'Production Reports', icon: <FaChartBar /> },
    { id: 'inventory', label: 'Inventory Reports', icon: <FaChartBar /> },
    { id: 'orders', label: 'Order Reports', icon: <FaChartBar /> },
    { id: 'client', label: 'Client Reports', icon: <FaChartBar /> },
  ];

  // Sample data for charts
  const sampleSalesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (in Lakhs)',
        data: [65, 78, 90, 81, 96, 105],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const sampleProductionData = {
    labels: ['Completed', 'In Progress', 'Planned', 'On Hold'],
    datasets: [
      {
        label: 'Production Status',
        data: [45, 25, 15, 5],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const sampleInventoryData = {
    labels: ['Polyester Chips', 'Dyes', 'Chemicals', 'Packaging'],
    datasets: [
      {
        label: 'Stock Levels (in Tons)',
        data: [120, 85, 45, 30],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const sampleOrdersData = {
    labels: ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'],
    datasets: [
      {
        label: 'Orders by Status',
        data: [12, 19, 7, 22, 3],
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(99, 102, 241)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const sampleClientsData = {
    labels: ['Client A', 'Client B', 'Client C', 'Client D'],
    datasets: [
      {
        label: 'Top Clients by Revenue',
        data: [120000, 95000, 75000, 50000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(99, 102, 241, 0.8)'
        ],
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await reportService.getReportData({
        type: reportType,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (response.success) {
        setReportData(prev => ({
          ...prev,
          [reportType]: response.data
        }));

        // Normalize server response into chart-friendly shape
        updateCharts(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch report data');
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCharts = (data) => {
    switch (reportType) {
      case 'sales':
        // server returns { salesData: [{date, revenue, orders, averageOrderValue}, ...], summary }
        if (data?.salesData && Array.isArray(data.salesData)) {
          const labels = data.salesData.map(item => formatDate(new Date(item.date), 'dd MMM'));
          const values = data.salesData.map(item => item.revenue || 0);
          setCharts(prev => ({
            ...prev,
            salesTrend: {
              labels,
              datasets: [{
                ...sampleSalesData.datasets[0],
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.2)'
              }]
            }
          }));
        } else {
          setCharts(prev => ({
            ...prev,
            salesTrend: sampleSalesData,
          }));
        }
        break;
      case 'production':
        // server returns { batchesByStatus: [{ _id: status, count }], monthlyProduction }
        if (data?.batchesByStatus && Array.isArray(data.batchesByStatus)) {
          const labels = data.batchesByStatus.map(s => s._id || 'Unknown');
          const values = data.batchesByStatus.map(s => s.count || 0);
          setCharts(prev => ({
            ...prev,
            productionStatus: {
              labels,
              datasets: [{
                ...sampleProductionData.datasets[0],
                data: values,
                backgroundColor: sampleProductionData.datasets[0].backgroundColor
              }]
            }
          }));
        } else {
          setCharts(prev => ({ ...prev, productionStatus: sampleProductionData }));
        }
        break;
      case 'inventory':
        // server returns { byCategory: [{ _id: category, stock, count, value }], summary }
        if (data?.byCategory && Array.isArray(data.byCategory)) {
          const labels = data.byCategory.map(c => c._id || 'Unknown');
          const values = data.byCategory.map(c => c.stock || c.count || 0);
          setCharts(prev => ({
            ...prev,
            inventoryStatus: {
              labels,
              datasets: [{
                ...sampleInventoryData.datasets[0],
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
              }]
            }
          }));
        } else {
          setCharts(prev => ({ ...prev, inventoryStatus: sampleInventoryData }));
        }
        break;
      case 'orders': {
        // server may return paginated orders: { total, count, data: [orders...] }
        const ordersList = data?.data || data?.orders || (Array.isArray(data) ? data : []);
        if (Array.isArray(ordersList) && ordersList.length > 0) {
          const counts = ordersList.reduce((acc, o) => {
            const s = (o.status || 'unknown').toString();
            acc[s] = (acc[s] || 0) + 1;
            return acc;
          }, {});
          const labels = Object.keys(counts);
          const values = Object.values(counts);
          const bg = labels.map((_, i) => sampleOrdersData.datasets[0].backgroundColor[i % sampleOrdersData.datasets[0].backgroundColor.length]);
          setCharts(prev => ({
            ...prev,
            ordersStatus: {
              labels,
              datasets: [{
                ...sampleOrdersData.datasets[0],
                data: values,
                backgroundColor: bg,
              }]
            }
          }));
        } else {
          setCharts(prev => ({ ...prev, ordersStatus: sampleOrdersData }));
        }
        break;
      }
      case 'client': {
        // For admin, server may return sales-like data with topClients
        const topClients = data?.topClients || data?.statistics?.clients || (data?.clients || null);
        if (Array.isArray(topClients) && topClients.length > 0) {
          const labels = topClients.map(c => (c.client?.companyName || c.client?.name || c._id?.toString() || c._id));
          const values = topClients.map(c => c.revenue || c.totalSpent || c.total || 0);
          const bg = labels.map((_, i) => sampleClientsData.datasets[0].backgroundColor[i % sampleClientsData.datasets[0].backgroundColor.length]);
          setCharts(prev => ({
            ...prev,
            clientDistribution: {
              labels,
              datasets: [{
                ...sampleClientsData.datasets[0],
                data: values,
                backgroundColor: bg
              }]
            }
          }));
        } else {
          setCharts(prev => ({ ...prev, clientDistribution: sampleClientsData }));
        }
        break;
      }
      default:
        break;
    }
  };

  const handleGenerateReport = async (filters) => {
    setLoading(true);
    try {
      const response = await reportService.generateReport({
        ...filters,
        type: reportType,
      });

      if (response.success) {
        toast.success('Report generated successfully');
        fetchReportData();
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (fileFormat) => {
    setLoading(true);
    try {
      const response = await reportService.exportReport({
        type: reportType,
        format: fileFormat,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { 
          type: fileFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = fileFormat === 'excel' ? 'xlsx' : fileFormat;
        a.download = `report_${reportType}_${formatDate(new Date(), 'yyyy-MM-dd')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Report exported as ${fileFormat.toUpperCase()}`);
      }
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryCards = () => {
    const data = reportData[reportType];
    if (!data) return null;
    const summary = data.summary || data;

    switch (reportType) {
      case 'sales':
        return (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Sales Summary</h3>
              <FaChartBar style={styles.summaryIcon} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Revenue</span>
                <span style={styles.statValue}>₹{(summary.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Orders Count</span>
                <span style={styles.statValue}>{summary.totalOrders || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Average Order Value</span>
                <span style={styles.statValue}>₹{(summary.averageOrderValue || 0).toLocaleString()}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Growth Rate</span>
                <span style={{ ...styles.statValue, color: (summary.growthRate || 0) >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                  {summary.growthRate || 0}%
                </span>
              </div>
            </div>
          </div>
        );
      case 'production':
        return (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Production Summary</h3>
              <FaChartBar style={styles.summaryIcon} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Batches</span>
                <span style={styles.statValue}>{summary.totalBatches || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Quantity Produced</span>
                <span style={styles.statValue}>{summary.totalProduced || 0} kg</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Average Wastage</span>
                <span style={styles.statValue}>{summary.averageWastage || 0}%</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Efficiency</span>
                <span style={styles.statValue}>{summary.efficiency || 0}%</span>
              </div>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Inventory Summary</h3>
              <FaChartBar style={styles.summaryIcon} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Items</span>
                <span style={styles.statValue}>{summary.totalItems || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Low Stock Items</span>
                <span style={styles.statValue}>{summary.lowStockItems || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Out of Stock</span>
                <span style={styles.statValue}>{summary.outOfStockItems || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Value</span>
                <span style={styles.statValue}>₹{(summary.totalValue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      case 'orders': {
        const ordersData = summary || {};
        const totalOrders = ordersData.total || ordersData.count || (Array.isArray(ordersData) ? ordersData.length : 0);
        return (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Orders Summary</h3>
              <FaChartBar style={styles.summaryIcon} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Orders</span>
                <span style={styles.statValue}>{totalOrders}</span>
              </div>
            </div>
          </div>
        );
      }
      case 'client': {
        const orderSummary = (data.orderSummary || data.summary || {});
        return (
          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Client Summary</h3>
              <FaChartBar style={styles.summaryIcon} />
            </div>
            <div style={styles.summaryStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Orders</span>
                <span style={styles.statValue}>{orderSummary.totalOrders || 0}</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Total Spent</span>
                <span style={styles.statValue}>₹{(orderSummary.totalSpent || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };
 

  const renderChart = () => {
    switch (reportType) {
      case 'sales':
        return charts.salesTrend ? (
          <Bar data={charts.salesTrend} options={chartOptions} />
        ) : null;
      case 'production':
        return charts.productionStatus ? (
          <Pie data={charts.productionStatus} options={chartOptions} />
        ) : null;
      case 'inventory':
        return charts.inventoryStatus ? (
          <Bar data={charts.inventoryStatus} options={chartOptions} />
        ) : null;
      case 'orders':
        return charts.ordersStatus ? (
          <Pie data={charts.ordersStatus} options={chartOptions} />
        ) : null;
      case 'client':
        return charts.clientDistribution ? (
          <Bar data={charts.clientDistribution} options={chartOptions} />
        ) : null;
      default:
        return null;
    }
  };

  const handleTabHover = (e) => {
    if (e.currentTarget.getAttribute('data-active') !== 'true') {
      e.currentTarget.style.backgroundColor = 'var(--gray-50)';
    }
  };

  const handleTabLeave = (e) => {
    if (e.currentTarget.getAttribute('data-active') !== 'true') {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
  };

  const handleExportHover = (e, type) => {
    if (type === 'pdf') {
      e.currentTarget.style.backgroundColor = '#b91c1c';
    } else if (type === 'excel') {
      e.currentTarget.style.backgroundColor = '#047857';
    } else {
      e.currentTarget.style.backgroundColor = 'var(--primary-color)';
    }
  };

  const handleExportLeave = (e, type) => {
    if (type === 'pdf') {
      e.currentTarget.style.backgroundColor = styles.pdfButton.backgroundColor;
    } else if (type === 'excel') {
      e.currentTarget.style.backgroundColor = styles.excelButton.backgroundColor;
    } else {
      e.currentTarget.style.backgroundColor = styles.exportButton.backgroundColor;
    }
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
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Reports & Analytics</h1>
        <p style={styles.pageSubtitle}>
          Generate detailed reports and analyze business performance
        </p>
      </div>

      <div style={styles.reportTabs}>
        {reportTypes.map((tab) => (
          <button
            key={tab.id}
            data-active={reportType === tab.id}
            style={{
              ...styles.tabButton,
              ...(reportType === tab.id ? styles.tabButtonActive : {}),
            }}
            onClick={() => setReportType(tab.id)}
            onMouseEnter={handleTabHover}
            onMouseLeave={handleTabLeave}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div style={styles.filterSection}>
        <ReportFilter
          onGenerate={handleGenerateReport}
          onExport={handleExportReport}
          reportType={reportType}
        />
      </div>

      <div style={styles.reportContent}>
        {renderSummaryCards()}
        
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>
              {reportType === 'sales' && 'Revenue Trend'}
              {reportType === 'production' && 'Production Status Distribution'}
              {reportType === 'inventory' && 'Inventory Stock Levels'}
              {reportType === 'orders' && 'Order Status Distribution'}
              {reportType === 'client' && 'Client Distribution'}
            </h3>
            <FaChartBar style={{ color: 'var(--gray-500)' }} />
          </div>
          <div style={styles.chartContainer}>
            {renderChart() || (
              <div style={styles.emptyState}>
                <p>No chart data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.exportSection}>
        <div style={styles.exportHeader}>
          <h3 style={styles.exportTitle}>Export Reports</h3>
          <p style={styles.exportDescription}>
            Download detailed reports in multiple formats for analysis and record keeping
          </p>
        </div>
        <div style={styles.exportButtons}>
          <button
            style={{ ...styles.exportButton, ...styles.pdfButton }}
            onClick={() => handleExportReport('pdf')}
            onMouseEnter={(e) => handleExportHover(e, 'pdf')}
            onMouseLeave={(e) => handleExportLeave(e, 'pdf')}
            disabled={loading}
          >
            <FaFilePdf />
            <span>Export as PDF</span>
          </button>
          <button
            style={{ ...styles.exportButton, ...styles.excelButton }}
            onClick={() => handleExportReport('excel')}
            onMouseEnter={(e) => handleExportHover(e, 'excel')}
            onMouseLeave={(e) => handleExportLeave(e, 'excel')}
            disabled={loading}
          >
            <FaFileExcel />
            <span>Export as Excel</span>
          </button>
          <button
            style={styles.exportButton}
            onClick={() => window.print()}
            onMouseEnter={(e) => handleExportHover(e, 'print')}
            onMouseLeave={(e) => handleExportLeave(e, 'print')}
          >
            <FaPrint />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;