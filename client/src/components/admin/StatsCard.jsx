import React from 'react';
import { FaBox, FaIndustry, FaClipboardList, FaRupeeSign, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const StatsCard = ({ title, value, change, icon, color }) => {
  // CSS Styles within the component
  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: 'var(--shadow)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardHover: {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-lg)',
    },
    cardContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    statsInfo: {
      flex: 1,
    },
    statsTitle: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--gray-600)',
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    statsValue: {
      fontSize: '1.875rem',
      fontWeight: '700',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    statsChange: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    statsChangePositive: {
      color: 'var(--success-color)',
    },
    statsChangeNegative: {
      color: 'var(--danger-color)',
    },
    iconContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '0.375rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
    },
    trendLine: {
      marginTop: '1rem',
      height: '4px',
      borderRadius: '2px',
      background: `linear-gradient(90deg, ${color} 0%, rgba(255,255,255,0) 100%)`,
    },
  };

  const getIcon = (iconType) => {
    const icons = {
      products: <FaBox />,
      production: <FaIndustry />,
      orders: <FaClipboardList />,
      revenue: <FaRupeeSign />,
    };
    return icons[iconType] || <FaBox />;
  };

  const isPositive = parseFloat(change) >= 0;

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = styles.cardHover.transform;
    e.currentTarget.style.boxShadow = styles.cardHover.boxShadow;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = styles.card.boxShadow;
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={styles.cardContent}>
        <div style={styles.statsInfo}>
          <p style={styles.statsTitle}>{title}</p>
          <h3 style={styles.statsValue}>{value}</h3>
          <div 
            style={{
              ...styles.statsChange,
              ...(isPositive ? styles.statsChangePositive : styles.statsChangeNegative),
            }}
          >
            {isPositive ? <FaArrowUp /> : <FaArrowDown />}
            <span>{Math.abs(change)}% from last month</span>
          </div>
        </div>
        <div 
          style={{
            ...styles.iconContainer,
            backgroundColor: `${color}20`,
            color: color,
          }}
        >
          {getIcon(icon)}
        </div>
      </div>
      <div style={styles.trendLine} />
    </div>
  );
};

export default StatsCard;