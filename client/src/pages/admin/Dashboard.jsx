import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBox, FaIndustry, FaClipboardList, FaRupeeSign, FaChartLine, FaCalendar } from 'react-icons/fa';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import StatsCard from '../../components/admin/StatsCard';
import OrderTable from '../../components/admin/OrderTable';
import { orderService, reportService } from '../../services';
import { format, subDays } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProduction: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersErrorMessage, setOrdersErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    sales: {},
    production: {},
    inventory: {},
  });

  // CSS Styles within the component
  const styles = {
    dashboard: {
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    chartsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem',
    },
    chartCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
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
      height: '250px',
      position: 'relative',
    },
    recentOrders: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
      marginTop: '1.5rem',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
    },
    sectionTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    viewAllButton: {
      padding: '0.5rem 1rem',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    viewAllButtonHover: {
      backgroundColor: '#1e40af',
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    },
  };

  // Use quickStats returned from the dashboard API (fallback to empty)
  const quick = stats?.quickStats || {};

  const statsData = [
    {
      title: 'Total Orders (Month)',
      value: quick?.monthlyOrders ?? 0,
      change: quick?.monthlyOrdersChange ?? 0,
      icon: 'orders',
      color: '#3b82f6',
    },
    {
      title: 'Active Production',
      value: quick?.inProductionOrders ?? quick?.activeProduction ?? 0,
      change: quick?.inProductionChange ?? 0,
      icon: 'production',
      color: '#8b5cf6',
    },
    {
      title: 'Pending Orders',
      value: quick?.pendingOrders ?? 0,
      change: quick?.pendingOrdersChange ?? 0,
      icon: 'orders',
      color: '#f59e0b',
    },
    {
      title: 'Monthly Revenue',
      value: quick?.monthlyRevenue ? `₹${(quick.monthlyRevenue / 100000).toFixed(2)}L` : '₹0',
      change: quick?.monthlyRevenueChange ?? 0,
      icon: 'revenue',
      color: '#10b981',
    },
  ];

  // Sample chart data
  const salesChartData = {
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

  const productionChartData = {
    labels: ['Polyester', 'Yarn Dyed', 'Raw Yarn', 'Specialty'],
    datasets: [
      {
        label: 'Production (in Tons)',
        data: [120, 85, 65, 40],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(139, 92, 246)',
          'rgb(245, 158, 11)',
          'rgb(16, 185, 129)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const inventoryChartData = {
    labels: ['In Stock', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [85, 12, 3],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch dashboard data from APIs (orders, dashboard stats, production, inventory)
      const [ordersResponse, statsResponse, productionResponse, inventoryResponse] = await Promise.all([
        orderService.getAllOrders(),
        reportService.getDashboardStats(),
        reportService.getProductionReport(),
        reportService.getInventoryReport(),
      ]);
      // Normalize responses: services may return { success, data } or raw data/array
      const normalize = (res) => {
        if (!res) return { success: false, data: [] };
        // If API explicitly returned success:false
        if (res && res.success === false) return { success: false, data: res.data || [] };
        if (Array.isArray(res)) return { success: true, data: res };
        if (res.success !== undefined && res.data !== undefined) return { success: res.success, data: res.data };
        if (res.data !== undefined) return { success: true, data: res.data };
        return { success: true, data: res };
      };

      const ordersNorm = normalize(ordersResponse);
      const statsNorm = normalize(statsResponse);
      const productionNorm = normalize(productionResponse);
      const inventoryNorm = normalize(inventoryResponse);

      // Prefer recentActivity from dashboard stats (it is already trimmed and populated),
      // fall back to orders API. Also dedupe by _id/orderNumber when merging.
      const ordersList = Array.isArray(ordersNorm.data) ? ordersNorm.data : [];

      if (statsNorm.success) {
        const statsDataObj = typeof statsNorm.data === 'object' ? statsNorm.data : {};
        setStats(statsDataObj);

        // Build sales chart from salesTrend if present
        if (Array.isArray(statsDataObj.salesTrend) && statsDataObj.salesTrend.length > 0) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const labels = statsDataObj.salesTrend.map((s) => {
            const m = Number(s.month) || 0;
            return monthNames[m - 1] || `M${m}`;
          });
          const data = statsDataObj.salesTrend.map((s) => s.revenue || 0);
          setChartData((c) => ({ ...c, sales: { labels, datasets: [{ label: 'Revenue', data, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.4, fill: true }] } }));
        }

        // Merge and dedupe recent activity with orders list
        const recentFromStats = Array.isArray(statsDataObj.recentActivity) ? statsDataObj.recentActivity : [];

        const normalizeOrder = (o) => ({
          id: o._id || o.id || (o.orderNumber ? String(o.orderNumber) : undefined),
          orderNumber: o.orderNumber || o.orderNo || o.order_id || '',
          client: o.client || {},
          orderDate: o.orderDate || o.createdAt || null,
          totalAmount: o.totalAmount ?? o.grandTotal ?? o.total ?? o.amount ?? 0,
          status: o.status || 'pending',
          raw: o,
        });

        if (recentFromStats.length > 0) {
          const seen = new Set();
          const merged = [];

          const pushUnique = (o) => {
            const norm = normalizeOrder(o);
            const key = norm.id || norm.orderNumber || JSON.stringify(norm.raw);
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(norm);
            }
          };

          recentFromStats.forEach(pushUnique);
          ordersList.forEach(pushUnique);

          setRecentOrders(merged.slice(0, 10));
        } else {
          setRecentOrders(ordersList.slice(0, 10).map(normalizeOrder));
        }
      } else if (ordersNorm.success) {
        setRecentOrders(ordersList.slice(0, 10));
      }

        // If both calls failed, capture error message for UI (likely authentication)
        if (!statsNorm.success && !ordersNorm.success) {
          const msg = statsNorm.data?.message || ordersNorm.data?.message || 'No orders available';
          setOrdersErrorMessage(msg);
        } else {
          setOrdersErrorMessage(null);
        }

      // Build production chart from production report (topProducts)
      if (productionNorm.success && productionNorm.data) {
        const prodData = productionNorm.data.topProducts || productionNorm.data.topProducts || [];
        if (Array.isArray(prodData) && prodData.length > 0) {
          const labels = prodData.map((p) => (p.product?.name || p.product?.itemName || p._id || 'Product'));
          const data = prodData.map((p) => p.produced || p.produced || p.quantity || p.revenue || 0);
          setChartData((c) => ({ ...c, production: { labels, datasets: [{ label: 'Production', data, backgroundColor: ['rgba(59,130,246,0.8)','rgba(139,92,246,0.8)','rgba(245,158,11,0.8)','rgba(16,185,129,0.8)'], borderColor: ['rgb(59,130,246)','rgb(139,92,246)','rgb(245,158,11)','rgb(16,185,129)'], borderWidth: 1 }] } }));
        }
      }

      // Build inventory chart from inventory report summary
      if (inventoryNorm.success && inventoryNorm.data) {
        const summary = inventoryNorm.data.summary || inventoryNorm.data;
        const totalItems = summary.totalItems ?? 0;
        const low = summary.lowStockItems ?? 0;
        const out = summary.outOfStockItems ?? 0;
        const inStock = Math.max(0, (totalItems - low - out));
        setChartData((c) => ({ ...c, inventory: { labels: ['In Stock', 'Low Stock', 'Out of Stock'], datasets: [{ data: [inStock, low, out], backgroundColor: ['rgba(16,185,129,0.8)','rgba(245,158,11,0.8)','rgba(239,68,68,0.8)'], borderColor: ['rgb(16,185,129)','rgb(245,158,11)','rgb(239,68,68)'], borderWidth: 1 }] } }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order) => {
    console.log('View order:', order);
    // Navigate to order details
  };

  const handleEditOrder = (order) => {
    console.log('Edit order:', order);
    // Navigate to edit order
  };

  const handleDeleteOrder = (order) => {
    console.log('Delete order:', order);
    // Show confirmation modal
  };

  const navigate = useNavigate();
  const handleViewAllOrders = () => {
    // SPA navigation to orders page
    navigate('/admin/orders');
  };

  const handleButtonHover = (e) => {
    e.currentTarget.style.backgroundColor = styles.viewAllButtonHover.backgroundColor;
  };

  const handleButtonLeave = (e) => {
    e.currentTarget.style.backgroundColor = styles.viewAllButton.backgroundColor;
  };

  if (loading) {
    return (
      <div style={styles.loadingSpinner}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" />
          <div style={{ marginTop: 12 }}>Loading dashboard…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboard}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Dashboard Overview</h1>
        <p style={styles.pageSubtitle}>
          Welcome to Sai Pathirakaliamman Textile Process
        </p>
      </div>

      <div style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Revenue Trend</h3>
            <FaChartLine style={{ color: 'var(--gray-500)' }} />
          </div>
          <div style={styles.chartContainer}>
            <Line data={Object.keys(chartData.sales).length ? chartData.sales : salesChartData} options={chartOptions} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Production Distribution</h3>
            <FaIndustry style={{ color: 'var(--gray-500)' }} />
          </div>
          <div style={styles.chartContainer}>
            <Doughnut data={Object.keys(chartData.production).length ? chartData.production : productionChartData} options={chartOptions} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Inventory Status</h3>
            <FaBox style={{ color: 'var(--gray-500)' }} />
          </div>
          <div style={styles.chartContainer}>
            <Bar data={Object.keys(chartData.inventory).length ? chartData.inventory : inventoryChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div style={styles.recentOrders}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          <button
            style={styles.viewAllButton}
            onClick={handleViewAllOrders}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            View All Orders
          </button>
        </div>
        <OrderTable
          orders={recentOrders}
          onView={handleViewOrder}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          emptyMessage={ordersErrorMessage}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;