import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaBuilding, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaIdCard,
  FaArrowLeft,
  FaUserPlus,
  FaSpinner 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    companyName: '',
    phone: '',
    gstNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role,
    });
  };

  const validateForm = () => {
    // Required fields validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      toast.error('Please enter a password');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    
    if (formData.role === 'client') {
      if (!formData.companyName.trim()) {
        toast.error('Please enter your company name');
        return false;
      }
      
      if (!formData.gstNumber.trim()) {
        toast.error('Please enter your GST number');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        address: formData.address,
      };
      
      // Add client-specific fields
      if (formData.role === 'client') {
        registrationData.companyName = formData.companyName;
        registrationData.gstNumber = formData.gstNumber;
      }
      
      const result = await register(registrationData);
      
      if (result.success) {
        toast.success(result.message || 'Registration successful!');
        // Navigation is handled in AuthContext
      } else {
        toast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.registerContainer}>
      <div style={styles.registerCard}>
        <Link to="/login" style={styles.backButton}>
          <FaArrowLeft />
          <span>Back to Login</span>
        </Link>
        
        <div style={styles.registerHeader}>
          <h1 style={styles.companyName}>Sai Pathirakaliamman Textile</h1>
          <p style={styles.companyTagline}>Create your account</p>
          <h2 style={styles.registerTitle}>Join our management system</h2>
        </div>

        <div style={styles.roleSelector}>
          <button
            type="button"
            style={{
              ...styles.roleButton,
              ...(formData.role === 'client' ? styles.roleButtonActive : {}),
            }}
            onClick={() => handleRoleChange('client')}
            disabled={loading}
          >
            <FaBuilding />
            <span>Client Account</span>
          </button>
          <button
            type="button"
            style={{
              ...styles.roleButton,
              ...(formData.role === 'admin' ? styles.roleButtonActive : {}),
            }}
            onClick={() => handleRoleChange('admin')}
            disabled={loading}
          >
            <FaUser />
            <span>Admin Account</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            {/* Personal Information */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaUser style={styles.labelIcon} />
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaEnvelope style={styles.labelIcon} />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaPhone style={styles.labelIcon} />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter your phone number"
                required
                disabled={loading}
              />
            </div>

            {/* Client Specific Fields */}
            {formData.role === 'client' && (
              <>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaBuilding style={styles.labelIcon} />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    style={styles.inputField}
                    placeholder="Enter your company name"
                    required
                    disabled={loading}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    <FaIdCard style={styles.labelIcon} />
                    GST Number *
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    style={styles.inputField}
                    placeholder="Enter GST number"
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Password Fields */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaLock style={styles.labelIcon} />
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Create a password (min 6 characters)"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaLock style={styles.labelIcon} />
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Confirm your password"
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            {/* Address Fields */}
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                <FaMapMarkerAlt style={styles.labelIcon} />
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Enter street address"
                disabled={loading}
              />
            </div>

            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>City</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  style={styles.inputField}
                  placeholder="City"
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>State</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  style={styles.inputField}
                  placeholder="State"
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Pincode</label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  style={styles.inputField}
                  placeholder="Pincode"
                  disabled={loading}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  style={styles.inputField}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div style={styles.termsSection}>
            <p style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Link to="/terms" style={styles.termsLink}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" style={styles.termsLink}>
                Privacy Policy
              </Link>
            </p>
          </div>

          <button
            type="submit"
            style={{
              ...styles.registerButton,
              ...(loading ? styles.registerButtonLoading : {}),
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <FaUserPlus />
                <span>Create Account</span>
              </>
            )}
          </button>

          <div style={styles.loginSection}>
            <p style={styles.loginText}>
              Already have an account?{' '}
              <Link to="/login" style={styles.loginLink}>
                Sign in here
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
          
          input:focus, select:focus {
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
  registerContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '1rem',
    backgroundImage: 'linear-gradient(135deg, #1a4d3e 0%, #2c5c52 100%)',
  },
  registerCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '800px',
    padding: '2.5rem',
    position: 'relative',
    overflow: 'hidden',
    margin: '1rem',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '1.5rem',
    transition: 'color 0.2s',
  },
  registerHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
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
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  registerTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#334155',
    margin: '0',
  },
  roleSelector: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    backgroundColor: '#f1f5f9',
    padding: '0.5rem',
    borderRadius: '1rem',
  },
  roleButton: {
    flex: 1,
    padding: '1rem 1.5rem',
    border: 'none',
    borderRadius: '0.75rem',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'all 0.3s ease',
  },
  roleButtonActive: {
    backgroundColor: 'white',
    color: '#1a4d3e',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  formLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#475569',
  },
  labelIcon: {
    color: '#94a3b8',
    fontSize: '0.875rem',
  },
  inputField: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.75rem',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  termsSection: {
    margin: '2rem 0 1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
  },
  termsText: {
    color: '#64748b',
    fontSize: '0.875rem',
    textAlign: 'center',
    margin: '0',
  },
  termsLink: {
    color: '#1a4d3e',
    textDecoration: 'none',
    fontWeight: '600',
  },
  registerButton: {
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
    boxShadow: '0 4px 6px -1px rgba(26, 77, 62, 0.3)',
  },
  registerButtonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  loginSection: {
    marginTop: '1.5rem',
    textAlign: 'center',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
  },
  loginText: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: '0',
  },
  loginLink: {
    color: '#1a4d3e',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s',
  },
  copyright: {
    textAlign: 'center',
    marginTop: '2rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f1f5f9',
  },
};

export default Register;