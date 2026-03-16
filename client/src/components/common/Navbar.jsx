import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaBell, FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New order received', time: '10 min ago', read: false },
    { id: 2, message: 'Production batch completed', time: '1 hour ago', read: false },
    { id: 3, message: 'Low stock alert', time: '2 hours ago', read: true },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="company-info">
          <h2>Sai Pathirakaliamman Textile Process</h2>
          <p>Welcome back, {user?.name}!</p>
        </div>
      </div>
      
      <div className="navbar-right">
        {/* Notifications */}
        <div className="notification-dropdown">
          <button 
            className="icon-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FaBell />
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu notification-menu">
              <div className="dropdown-header">
                <h3>Notifications</h3>
                <button className="text-btn">Mark all as read</button>
              </div>
              
              <div className="notification-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="dropdown-footer">
                <button className="text-btn">View all notifications</button>
              </div>
            </div>
          )}
        </div>
        
        {/* User Profile */}
        <div className="profile-dropdown">
          <button 
            className="profile-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FaUserCircle className="profile-icon" />
            <span>{user?.name}</span>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu profile-menu">
              <div className="user-info">
                <FaUserCircle className="user-icon" />
                <div>
                  <h4>{user?.name}</h4>
                  <p>{user?.email}</p>
                  <p className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Client'}</p>
                </div>
              </div>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item">
                <FaUserCircle />
                <span>My Profile</span>
              </button>
              
              <button className="dropdown-item">
                <FaCog />
                <span>Settings</span>
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item logout-btn" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;