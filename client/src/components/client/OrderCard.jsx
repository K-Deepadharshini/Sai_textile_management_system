import React from 'react';
import { FaBox, FaCalendar, FaRupeeSign, FaTruck, FaCheckCircle, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';

const OrderCard = ({ order, onViewDetails, onTrackOrder }) => {
  // CSS Styles within the component
  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: 'var(--shadow)',
      padding: '1.5rem',
      marginBottom: '1rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    cardHover: {
      transform: 'translateY(-2px)',
      boxShadow: 'var(--shadow-lg)',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '1rem',
      paddingBottom: '0.75rem',
      borderBottom: '1px solid var(--gray-200)',
    },
    orderInfo: {
      flex: 1,
    },
    orderNumber: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.25rem',
    },
    orderDate: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.375rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    badgePending: {
      backgroundColor: 'var(--warning-light)',
      color: 'var(--warning-color)',
    },
    badgeConfirmed: {
      backgroundColor: 'var(--primary-light)',
      color: 'var(--primary-color)',
    },
    badgeProduction: {
      backgroundColor: '#8b5cf620',
      color: '#8b5cf6',
    },
    badgeCompleted: {
      backgroundColor: 'var(--success-light)',
      color: 'var(--success-color)',
    },
    badgeDispatched: {
      backgroundColor: '#3b82f620',
      color: '#3b82f6',
    },
    badgeDelivered: {
      backgroundColor: '#10b98120',
      color: '#10b981',
    },
    cardBody: {
      marginBottom: '1.5rem',
    },
    orderDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem',
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    detailIcon: {
      color: 'var(--gray-500)',
      fontSize: '0.875rem',
    },
    detailLabel: {
      fontSize: '0.75rem',
      color: 'var(--gray-600)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    detailValue: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--gray-900)',
    },
    productList: {
      marginTop: '1rem',
    },
    productItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem 0',
      borderBottom: '1px solid var(--gray-100)',
    },
    productName: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--gray-800)',
    },
    productQuantity: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
    },
    cardFooter: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: '1rem',
      borderTop: '1px solid var(--gray-200)',
    },
    totalAmount: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.75rem',
    },
    viewButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
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
    trackButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      backgroundColor: 'white',
      color: 'var(--primary-color)',
      border: '1px solid var(--primary-color)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    buttonHover: {
      backgroundColor: '#1e40af',
    },
    trackButtonHover: {
      backgroundColor: 'var(--primary-light)',
    },
  };

  const getStatusBadgeStyle = (status) => {
    const badgeStyles = {
      'pending': styles.badgePending,
      'confirmed': styles.badgeConfirmed,
      'in-production': styles.badgeProduction,
      'completed': styles.badgeCompleted,
      'dispatched': styles.badgeDispatched,
      'delivered': styles.badgeDelivered,
    };
    return badgeStyles[status] || styles.badgePending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': <FaClock />,
      'confirmed': <FaCheckCircle />,
      'in-production': <FaBox />,
      'completed': <FaCheckCircle />,
      'dispatched': <FaTruck />,
      'delivered': <FaCheckCircle />,
    };
    return icons[status] || <FaClock />;
  };

  const handleCardHover = (e) => {
    e.currentTarget.style.transform = styles.cardHover.transform;
    e.currentTarget.style.boxShadow = styles.cardHover.boxShadow;
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = styles.card.boxShadow;
  };

  const handleButtonHover = (e, type) => {
    if (type === 'view') {
      e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor;
    } else {
      e.currentTarget.style.backgroundColor = styles.trackButtonHover.backgroundColor;
    }
  };

  const handleButtonLeave = (e, type) => {
    if (type === 'view') {
      e.currentTarget.style.backgroundColor = styles.viewButton.backgroundColor;
    } else {
      e.currentTarget.style.backgroundColor = styles.trackButton.backgroundColor;
    }
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={handleCardHover}
      onMouseLeave={handleCardLeave}
    >
      <div style={styles.cardHeader}>
        <div style={styles.orderInfo}>
          <h3 style={styles.orderNumber}>{order.orderNumber}</h3>
          <div style={styles.orderDate}>
            <FaCalendar />
            <span>{format(new Date(order.orderDate), 'dd MMM yyyy')}</span>
          </div>
        </div>
        <div style={{ ...styles.statusBadge, ...getStatusBadgeStyle(order.status) }}>
          {getStatusIcon(order.status)}
          <span style={{ marginLeft: '0.5rem' }}>
            {order.status.replace('-', ' ')}
          </span>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.orderDetails}>
          <div style={styles.detailItem}>
            <FaBox style={styles.detailIcon} />
            <div>
              <div style={styles.detailLabel}>Items</div>
              <div style={styles.detailValue}>{order.items?.length || 0}</div>
            </div>
          </div>
          <div style={styles.detailItem}>
            <FaCalendar style={styles.detailIcon} />
            <div>
              <div style={styles.detailLabel}>Delivery</div>
              <div style={styles.detailValue}>
                {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMM') : 'Not set'}
              </div>
            </div>
          </div>
          <div style={styles.detailItem}>
            <FaTruck style={styles.detailIcon} />
            <div>
              <div style={styles.detailLabel}>Dispatch</div>
              <div style={styles.detailValue}>
                {order.dispatchStatus || 'Not dispatched'}
              </div>
            </div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div style={styles.productList}>
            {order.items.slice(0, 2).map((item, index) => (
              <div key={index} style={styles.productItem}>
                <span style={styles.productName}>{item.product?.name || 'Product'}</span>
                <span style={styles.productQuantity}>
                  {item.quantity} {item.unit || 'kg'}
                </span>
              </div>
            ))}
            {order.items.length > 2 && (
              <div style={{ ...styles.productItem, borderBottom: 'none' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                  +{order.items.length - 2} more items
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.cardFooter}>
        <div style={styles.totalAmount}>
          <FaRupeeSign style={{ fontSize: '0.875rem', marginRight: '0.25rem' }} />
          {order.grandTotal?.toLocaleString() || '0'}
        </div>
        <div style={styles.actionButtons}>
          <button
            style={styles.trackButton}
            onClick={() => onTrackOrder(order)}
            onMouseEnter={(e) => handleButtonHover(e, 'track')}
            onMouseLeave={(e) => handleButtonLeave(e, 'track')}
          >
            <FaTruck />
            <span>Track Order</span>
          </button>
          <button
            style={styles.viewButton}
            onClick={() => onViewDetails(order)}
            onMouseEnter={(e) => handleButtonHover(e, 'view')}
            onMouseLeave={(e) => handleButtonLeave(e, 'view')}
          >
            <FaBox />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;