import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      setAuthLoading(false);
      return;
    }

    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        setToken(storedToken);
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuth();
    } finally {
      setAuthLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        // Backend returns `{ user, token }` inside `response.data`
        const { token: newToken, user: userData } = response.data;

        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setToken(newToken);
        setUser(userData);

        toast.success('Login successful!');

        // Navigate based on role (use top-level routes defined in App.jsx)
        setTimeout(() => {
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/client');
          }
        }, 100);

        return { success: true };
      } else {
        toast.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        toast.success('Registration successful! Please login.');
        navigate('/login');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        // Update user in state and localStorage
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile updated successfully');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'Update failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Update failed. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Update failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        toast.success('Password changed successfully');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'Password change failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Change password error:', error);
      toast.error(error.message || 'Password change failed. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Password change failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        toast.success('Password reset email sent');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'Failed to send reset email');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to send reset email. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Failed to send reset email. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    setLoading(true);
    try {
      const response = await authService.resetPassword(token, password);
      
      if (response.success) {
        toast.success('Password reset successful');
        navigate('/login');
        return { success: true, message: response.message };
      } else {
        toast.error(response.message || 'Password reset failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Password reset failed. Please try again.');
      return { 
        success: false, 
        message: error.message || 'Password reset failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    authLoading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;