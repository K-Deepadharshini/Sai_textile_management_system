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
  FaTimes,
  FaChevronDown,
  FaSignOutAlt,
  FaCog,
  FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [menuDropdown, setMenuDropdown] = useState(false);

  const mainMenu = [
    { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { path: '/admin/products', icon: <FaBox />, label: 'Products' },
    { path: '/admin/orders', icon: <FaClipboardList />, label: 'Orders' },
    { path: '/admin/reports', icon: <FaChartBar />, label: 'Reports' },
  ];

  const dropdownMenu = [
    { path: '/admin/production', icon: <FaIndustry />, label: 'Production' },
    { path: '/admin/inventory', icon: <FaWarehouse />, label: 'Inventory' },
    { path: '/admin/dispatch', icon: <FaShippingFast />, label: 'Dispatch' },
    { path: '/admin/invoices', icon: <FaFileInvoice />, label: 'Invoices' },
    { path: '/admin/clients', icon: <FaUsers />, label: 'Clients' },
    { path: '/admin/messages', icon: <FaEnvelope />, label: 'Messages' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-container">
        {/* Logo Section */}
        <div className="admin-navbar-logo">
          <h2>Sai Pathirakaliamman Textile Admin</h2>
          <p>Management System</p>
        </div>

        {/* Desktop Menu */}
        <div className={`admin-navbar-menu ${menuOpen ? 'active' : ''}`}>
          {mainMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
          
          {/* More Options Dropdown - Hidden on Mobile */}
          {!menuOpen && (
            <div className="admin-menu-dropdown">
              <button 
                className="admin-dropdown-btn"
                onClick={() => setMenuDropdown(!menuDropdown)}
              >
                <span className="admin-nav-icon"><FaBars /></span>
                <span className="admin-nav-label">More</span>
                <FaChevronDown className={`dropdown-chevron ${menuDropdown ? 'open' : ''}`} />
              </button>

              {menuDropdown && (
                <div className="admin-menu-dropdown-content">
                  {dropdownMenu.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                        `admin-dropdown-link ${isActive ? 'active' : ''}`
                      }
                      onClick={() => {
                        setMenuOpen(false);
                        setMenuDropdown(false);
                      }}
                    >
                      <span className="admin-nav-icon">{item.icon}</span>
                      <span className="admin-nav-label">{item.label}</span>
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
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Side - User Profile & Settings */}
        <div className="admin-navbar-right">
          {/* Profile Dropdown */}
          <div className="admin-profile-dropdown">
            <button 
              className="admin-profile-btn"
              onClick={() => setProfileDropdown(!profileDropdown)}
            >
              <div className="admin-profile-avatar">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="admin-profile-info">
                <p className="admin-profile-name">{user?.name}</p>
                <p className="admin-profile-role">Administrator</p>
              </div>
              <FaChevronDown className={`chevron ${profileDropdown ? 'open' : ''}`} />
            </button>

            {profileDropdown && (
              <div className="admin-dropdown-menu">
                <div className="admin-dropdown-header">
                  <FaUserCircle />
                  <div>
                    <h4>{user?.name}</h4>
                    <p>{user?.email}</p>
                  </div>
                </div>
                <div className="admin-dropdown-divider"></div>
                <button className="admin-dropdown-item logout" onClick={handleLogout}>
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="admin-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
