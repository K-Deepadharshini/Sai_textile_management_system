import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaBox, 
  FaIndustry, 
  FaWarehouse,
  FaClipboardList,
  FaShippingFast,
  FaFileInvoice,
  FaChartBar,
  FaUsers,
  FaEnvelope,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../logo.png';

const Sidebar = ({ role }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const adminMenu = [
    { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FaBox />, label: 'Products' },
    { path: '/admin/production', icon: <FaIndustry />, label: 'Production' },
    { path: '/admin/inventory', icon: <FaWarehouse />, label: 'Inventory' },
    { path: '/admin/orders', icon: <FaClipboardList />, label: 'Orders' },
    { path: '/admin/dispatch', icon: <FaShippingFast />, label: 'Dispatch' },
    { path: '/admin/invoices', icon: <FaFileInvoice />, label: 'Invoices' },
    { path: '/admin/reports', icon: <FaChartBar />, label: 'Reports' },
    { path: '/admin/clients', icon: <FaUsers />, label: 'Clients' },
    { path: '/admin/messages', icon: <FaEnvelope />, label: 'Messages' },
  ];

  const clientMenu = [
    { path: '/client', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/client/products', icon: <FaBox />, label: 'Products' },
    { path: '/client/orders', icon: <FaClipboardList />, label: 'My Orders' },
    { path: '/client/invoices', icon: <FaFileInvoice />, label: 'Invoices' },
    { path: '/client/reports', icon: <FaChartBar />, label: 'Reports' },
    { path: '/client/messages', icon: <FaEnvelope />, label: 'Messages' },
  ];

  const menuItems = role === 'admin' ? adminMenu : clientMenu;

  // CSS Styles within the component
  const styles = {
    sidebar: {
      width: collapsed ? '70px' : '250px',
      backgroundColor: 'white',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      height: '100vh',
      position: 'sticky',
      top: 0,
    },
    sidebarHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid var(--gray-200)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
    },
    logoImg: {
      width: '32px',
      height: '32px',
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: '700',
      color: 'var(--primary-color)',
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      color: 'var(--gray-600)',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '0.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleBtnHover: {
      backgroundColor: 'var(--gray-100)',
      color: 'var(--gray-800)',
    },
    userProfile: {
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      borderBottom: '1px solid var(--gray-200)',
    },
    avatar: {
      width: '40px',
      height: '40px',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '1.125rem',
    },
    userDetails: {
      display: collapsed ? 'none' : 'block',
    },
    userName: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.25rem',
    },
    userRole: {
      fontSize: '0.75rem',
      color: 'var(--gray-600)',
    },
    sidebarNav: {
      flex: 1,
      padding: '1rem 0',
      overflowY: 'auto',
    },
    navLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1.5rem',
      color: 'var(--gray-700)',
      textDecoration: 'none',
      transition: 'all 0.2s',
      margin: '0.25rem 0',
    },
    navLinkActive: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-color)',
      borderRight: '3px solid var(--primary-color)',
    },
    navIcon: {
      fontSize: '1.25rem',
      minWidth: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    sidebarFooter: {
      padding: '1.5rem',
      borderTop: '1px solid var(--gray-200)',
    },
    companyInfo: {
      display: collapsed ? 'none' : 'block',
    },
    companyName: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.25rem',
    },
    companyContact: {
      fontSize: '0.75rem',
      color: 'var(--gray-600)',
    },
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.backgroundColor = 'var(--gray-50)';
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
  };

  const handleToggleHover = (e) => {
    e.currentTarget.style.backgroundColor = 'var(--gray-100)';
    e.currentTarget.style.color = 'var(--gray-800)';
  };

  const handleToggleLeave = (e) => {
    e.currentTarget.style.backgroundColor = '';
    e.currentTarget.style.color = 'var(--gray-600)';
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.logo}>
          <img src={logoImg} alt="Sai Pathirakaliamman Textile Logo" style={styles.logoImg} />
          {!collapsed && <h2 style={styles.logoText}>Sai Pathirakaliamman Textile</h2>}
        </div>
        <button 
          style={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
          onMouseEnter={handleToggleHover}
          onMouseLeave={handleToggleLeave}
        >
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
      </div>

      <div style={styles.userProfile}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0) || 'U'}
        </div>
        {!collapsed && (
          <div style={styles.userDetails}>
            <h4 style={styles.userName}>{user?.name}</h4>
            <p style={styles.userRole}>
              {user?.role === 'admin' ? 'Administrator' : 'Client'}
            </p>
          </div>
        )}
      </div>

      <nav style={styles.sidebarNav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        {!collapsed && (
          <div style={styles.companyInfo}>
            <p style={styles.companyName}>Sai Pathirakaliamman Textile Process</p>
            <p style={styles.companyContact}>+91 9876543210</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;