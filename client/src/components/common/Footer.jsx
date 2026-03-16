import React from 'react';
import { FaCopyright, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  // CSS Styles within the component
  const styles = {
    footer: {
      backgroundColor: 'var(--gray-900)',
      color: 'white',
      padding: '2rem 0',
      marginTop: '3rem',
      width: '100%',
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '2rem',
    },
    footerSection: {
      marginBottom: '1.5rem',
    },
    footerTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: 'var(--gray-100)',
    },
    footerText: {
      fontSize: '0.875rem',
      color: 'var(--gray-400)',
      lineHeight: '1.5',
      marginBottom: '0.5rem',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      color: 'var(--gray-400)',
      fontSize: '0.875rem',
    },
    contactIcon: {
      color: 'var(--primary-color)',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
    },
    linkItem: {
      marginBottom: '0.5rem',
    },
    link: {
      color: 'var(--gray-400)',
      textDecoration: 'none',
      fontSize: '0.875rem',
      transition: 'color 0.2s',
    },
    linkHover: {
      color: 'var(--primary-color)',
    },
    footerBottom: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1.5rem 1rem 0',
      borderTop: '1px solid var(--gray-800)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem',
    },
    copyright: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      color: 'var(--gray-400)',
    },
    socialLinks: {
      display: 'flex',
      gap: '1rem',
    },
    socialLink: {
      color: 'var(--gray-400)',
      fontSize: '1.25rem',
      transition: 'color 0.2s',
    },
    socialLinkHover: {
      color: 'var(--primary-color)',
    },
  };

  const handleLinkHover = (e) => {
    e.currentTarget.style.color = styles.linkHover.color;
  };

  const handleLinkLeave = (e) => {
    e.currentTarget.style.color = styles.link.color;
  };

  const handleSocialHover = (e) => {
    e.currentTarget.style.color = styles.socialLinkHover.color;
  };

  const handleSocialLeave = (e) => {
    e.currentTarget.style.color = styles.socialLink.color;
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.footerSection}>
          <h3 style={styles.footerTitle}>Sai Pathirakaliamman Textile Process</h3>
          <p style={styles.footerText}>
            Leading manufacturer of high-quality polyester filament and yarn-dyed textiles. 
            We combine traditional craftsmanship with modern technology.
          </p>
          <div style={styles.contactItem}>
            <FaPhone style={styles.contactIcon} />
            <span>+91 9876543210</span>
          </div>
          <div style={styles.contactItem}>
            <FaEnvelope style={styles.contactIcon} />
            <span>info@saitextile.com</span>
          </div>
          <div style={styles.contactItem}>
            <FaMapMarkerAlt style={styles.contactIcon} />
            <span>Tiruppur, Tamil Nadu, India</span>
          </div>
        </div>

        <div style={styles.footerSection}>
          <h3 style={styles.footerTitle}>Quick Links</h3>
          <ul style={styles.linkList}>
            {['Home', 'Products', 'About Us', 'Contact'].map((item) => (
              <li key={item} style={styles.linkItem}>
                <a 
                  href="#" 
                  style={styles.link}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.footerSection}>
          <h3 style={styles.footerTitle}>Our Products</h3>
          <ul style={styles.linkList}>
            {['Polyester Filament Yarn', 'Yarn Dyed Fabrics', 'Raw Yarn', 'Specialty Yarns'].map((item) => (
              <li key={item} style={styles.linkItem}>
                <a 
                  href="#" 
                  style={styles.link}
                  onMouseEnter={handleLinkHover}
                  onMouseLeave={handleLinkLeave}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div style={styles.footerSection}>
          <h3 style={styles.footerTitle}>Business Hours</h3>
          <p style={styles.footerText}>Monday - Friday: 9:00 AM - 6:00 PM</p>
          <p style={styles.footerText}>Saturday: 9:00 AM - 2:00 PM</p>
          <p style={styles.footerText}>Sunday: Closed</p>
        </div>
      </div>

      <div style={styles.footerBottom}>
        <div style={styles.copyright}>
          <FaCopyright /> 
          <span>{currentYear} Sai Pathirakaliamman Textile Process. All rights reserved.</span>
        </div>
        <div style={styles.socialLinks}>
          {['Facebook', 'Twitter', 'LinkedIn', 'Instagram'].map((social) => (
            <a 
              key={social}
              href="#" 
              style={styles.socialLink}
              onMouseEnter={handleSocialHover}
              onMouseLeave={handleSocialLeave}
              aria-label={social}
            >
              {social.charAt(0)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;