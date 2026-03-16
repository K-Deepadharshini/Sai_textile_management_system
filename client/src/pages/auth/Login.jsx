import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEnvelope, FaLock, FaUserPlus, FaSignInAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (!result.success) {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <h1 style={styles.companyName}>Sai Pathirakaliamman Textile</h1>
          <p style={styles.companyTagline}>Management System</p>
          <h2 style={styles.loginTitle}>Sign in to your account</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email Address</label>
            <div style={styles.inputGroup}>
              <FaEnvelope style={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter your email"
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Password</label>
            <div style={styles.inputGroup}>
              <FaLock style={styles.inputIcon} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
                minLength="6"
              />
            </div>
          </div>

          <div style={styles.forgotPassword}>
            <Link to="/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            style={{
              ...styles.loginButton,
              ...(loading ? styles.loginButtonLoading : {}),
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <FaSignInAlt />
                <span>Sign in</span>
              </>
            )}
          </button>

          <div style={styles.registerSection}>
            <div style={styles.divider}>
              <span style={styles.dividerText}>or</span>
            </div>
            
            <p style={styles.registerText}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.registerLink}>
                <FaUserPlus style={{ marginRight: '4px' }} />
                Create one now
              </Link>
            </p>
          </div>
        </form>

        <div style={styles.copyright}>
          © {new Date().getFullYear()} Sai Pathirakaliamman Textile Process
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          input:focus {
            border-color: #1a4d3e !important;
            box-shadow: 0 0 0 3px rgba(26, 77, 62, 0.1) !important;
            outline: none;
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '1rem',
    backgroundImage: 'linear-gradient(135deg, #1a4d3e 0%, #2c5c52 100%)',
  },
  loginCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '440px',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  companyName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #1a4d3e 0%, #2c5c52 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  companyTagline: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginBottom: '1.5rem',
    fontWeight: '500',
  },
  loginTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#334155',
    margin: '0',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  formLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
  },
  inputGroup: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '1rem',
    zIndex: '1',
  },
  inputField: {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  forgotPassword: {
    textAlign: 'right',
    marginBottom: '1.5rem',
  },
  forgotLink: {
    color: '#1a4d3e',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  loginButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#1a4d3e',
    color: 'white',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
    marginTop: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(26, 77, 62, 0.3)',
  },
  loginButtonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  registerSection: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  dividerText: {
    backgroundColor: 'white',
    padding: '0 1rem',
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  registerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.95rem',
    margin: '0',
  },
  registerLink: {
    color: '#1a4d3e',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'color 0.2s',
  },
  copyright: {
    textAlign: 'center',
    marginTop: '2.5rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f1f5f9',
  },
};

export default Login;