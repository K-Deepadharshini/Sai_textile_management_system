import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaBox, 
  FaClipboardList,
  FaFileInvoice,
  FaChartBar,
  FaEnvelope,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaSignOutAlt,
  FaUserCircle,
  FaShoppingCart,
  FaUsers,
  FaWarehouse,
  FaBell
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './ClientNavbar.css';

const ClientNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const [menuDropdown, setMenuDropdown] = useState(false);

  const mainMenu = [
    { path: '/client', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/client/products', icon: <FaBox />, label: 'Products' },
    { path: '/client/orders', icon: <FaShoppingCart />, label: 'My Orders' },
    { path: '/client/invoices', icon: <FaFileInvoice />, label: 'Invoices' },
  ];

  const dropdownMenu = [
    { path: '/client/reports', icon: <FaChartBar />, label: 'Reports' },
    { path: '/client/messages', icon: <FaEnvelope />, label: 'Messages' },
  ];

  const notifications = [
    { id: 1, message: 'Your order #12345 has been dispatched', time: '2 hours ago' },
    { id: 2, message: 'Invoice #INV-001 is ready for download', time: '1 day ago' },
    { id: 3, message: 'New quotation received from admin', time: '2 days ago' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="client-navbar">
      <div className="client-navbar-container">
        {/* Logo Section */}
        <div className="client-navbar-logo">
          <h2>Sai Pathirakaliamman Textile</h2>
          <p>Client Portal</p>
        </div>

        {/* Desktop Menu */}
        <div className={`client-navbar-menu ${menuOpen ? 'active' : ''}`}>
          {mainMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `client-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="client-nav-icon">{item.icon}</span>
              <span className="client-nav-label">{item.label}</span>
            </NavLink>
          ))}
          
          {/* More Options Dropdown - Hidden on Mobile */}
          {!menuOpen && (
            <div className="client-menu-dropdown">
              <button 
                className="client-dropdown-btn"
                onClick={() => setMenuDropdown(!menuDropdown)}
              >
                <span className="client-nav-icon"><FaBars /></span>
                <span className="client-nav-label">More</span>
                <FaChevronDown className={`dropdown-chevron ${menuDropdown ? 'open' : ''}`} />
              </button>

              {menuDropdown && (
                <div className="client-menu-dropdown-content">
                  {dropdownMenu.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                        `client-dropdown-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setMenuDropdown(false);
                      }}
                    >
                      <span className="client-nav-icon">{item.icon}</span>
                      <span className="client-nav-label">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Menu Items for Mobile */}
          {menuOpen && dropdownMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `client-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="client-nav-icon">{item.icon}</span>
              <span className="client-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Side - Notifications & Profile */}
        <div className="client-navbar-right">
          {/* Notifications */}
          <div className="client-notification-dropdown">
            <button 
              className="client-notification-btn"
              onClick={() => setNotificationDropdown(!notificationDropdown)}
            >
              <FaBell />
              <span className="notification-badge">3</span>
            </button>

            {notificationDropdown && (
              <div className="client-notification-menu">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <button className="mark-read">Mark all as read</button>
                </div>
                <div className="notification-list">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="client-profile-dropdown">
            <button 
              className="client-profile-btn"
              onClick={() => setProfileDropdown(!profileDropdown)}
            >
              <div className="client-profile-avatar">
                {user?.name?.charAt(0) || 'C'}
              </div>
              <div className="client-profile-info">
                <p className="client-profile-name">{user?.name}</p>
                <p className="client-profile-company">{user?.companyName || 'Client'}</p>
              </div>
              <FaChevronDown className={`chevron ${profileDropdown ? 'open' : ''}`} />
            </button>

            {profileDropdown && (
              <div className="client-dropdown-menu">
                <div className="client-dropdown-header">
                  <FaUserCircle />
                  <div>
                    <h4>{user?.name}</h4>
                    <p>{user?.email}</p>
                  </div>
                </div>
                <div className="client-dropdown-divider"></div>
                <button className="client-dropdown-item logout" onClick={handleLogout}>
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="client-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavbar;
