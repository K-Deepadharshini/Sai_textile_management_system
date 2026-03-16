import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import authService from '../../services/authService';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  // CSS Styles within the component
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--gray-50)',
      padding: '1rem',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      boxShadow: 'var(--shadow-lg)',
      width: '100%',
      maxWidth: '420px',
      padding: '2.5rem',
    },
    header: {
      textAlign: 'center',
      marginBottom: '2rem',
    },
    backButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'var(--gray-600)',
      textDecoration: 'none',
      fontSize: '0.875rem',
      marginBottom: '1rem',
      transition: 'color 0.2s',
    },
    backButtonHover: {
      color: 'var(--primary-color)',
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: 'var(--gray-900)',
      marginBottom: '0.5rem',
    },
    description: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
      lineHeight: '1.5',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: 'var(--gray-700)',
    },
    inputGroup: {
      position: 'relative',
    },
    inputIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'var(--gray-400)',
      fontSize: '1rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
      border: '1px solid var(--gray-300)',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
    },
    inputFocus: {
      outline: 'none',
      borderColor: 'var(--primary-color)',
      boxShadow: '0 0 0 3px rgba(26, 86, 219, 0.1)',
    },
    submitButton: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: 'var(--primary-color)',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.2s',
    },
    submitButtonHover: {
      backgroundColor: '#1e40af',
    },
    submitButtonLoading: {
      opacity: 0.7,
      cursor: 'not-allowed',
    },
    successMessage: {
      backgroundColor: 'var(--success-light)',
      border: '1px solid var(--success-color)',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      textAlign: 'center',
      marginBottom: '1.5rem',
    },
    successIcon: {
      fontSize: '3rem',
      color: 'var(--success-color)',
      marginBottom: '1rem',
    },
    successTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: 'var(--success-color)',
      marginBottom: '0.5rem',
    },
    successText: {
      fontSize: '0.875rem',
      color: 'var(--gray-600)',
      lineHeight: '1.5',
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        setEmailSent(true);
        toast.success('Password reset email sent successfully!');
      } else {
        toast.error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (e) => {
    e.currentTarget.style.borderColor = styles.inputFocus.borderColor;
    e.currentTarget.style.boxShadow = styles.inputFocus.boxShadow;
  };

  const handleInputBlur = (e) => {
    e.currentTarget.style.borderColor = styles.input.border;
    e.currentTarget.style.boxShadow = '';
  };

  const handleButtonHover = (e) => {
    if (!loading) {
      e.currentTarget.style.backgroundColor = styles.submitButtonHover.backgroundColor;
    }
  };

  const handleButtonLeave = (e) => {
    if (!loading) {
      e.currentTarget.style.backgroundColor = styles.submitButton.backgroundColor;
    }
  };

  const handleBackHover = (e) => {
    e.currentTarget.style.color = styles.backButtonHover.color;
  };

  const handleBackLeave = (e) => {
    e.currentTarget.style.color = styles.backButton.color;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <Link
            to="/login"
            style={styles.backButton}
            onMouseEnter={handleBackHover}
            onMouseLeave={handleBackLeave}
          >
            <FaArrowLeft />
            <span>Back to login</span>
          </Link>
          <h2 style={styles.title}>Reset your password</h2>
          <p style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {emailSent ? (
          <div style={styles.successMessage}>
            <FaCheckCircle style={styles.successIcon} />
            <h3 style={styles.successTitle}>Check your email</h3>
            <p style={styles.successText}>
              We've sent password reset instructions to {email}. Please check your email and follow the link to reset your password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputGroup}>
                <FaEnvelope style={styles.inputIcon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonLoading : {}),
              }}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;