import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../../logo.png';
import './PublicNavbar.css';

const PublicNavbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <nav className="public-navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <img src={logo} alt="Sai Textile Logo" className="nav-logo__image" />
          <div className="nav-logo__text">
            <h1>Sai Pathirakaliamman Textile</h1>
            <p>Premium Manufacturing</p>
          </div>
        </div>

        <button 
          className="hamburger-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <button 
            className="nav-link"
            onClick={() => handleScroll('products')}
          >
            Products
          </button>
          <button 
            className="nav-link"
            onClick={() => handleScroll('about')}
          >
            About Us
          </button>
          <button 
            className="nav-link"
            onClick={() => handleScroll('gallery')}
          >
            Gallery
          </button>
        </div>

        <div className="nav-buttons">
          <button 
            className="nav-btn login-btn"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="nav-btn register-btn"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
