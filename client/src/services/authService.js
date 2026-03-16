// src/services/authService.js
import api from './api';

const authService = {
  // Login user
  async login(email, password) {
    try {
      console.log('Sending login request:', { email, passwordLength: password?.length });
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Login failed' 
      };
    }
  },

  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Registration failed' 
      };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to get user data' 
      };
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/update-profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to update profile' 
      };
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to change password' 
      };
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to send reset email' 
      };
    }
  },

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to reset password' 
      };
    }
  },

  // Logout
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Logout failed' 
      };
    }
  },

  // Get all users (admin only)
  async getAllUsers(params = {}) {
    try {
      const response = await api.get('/auth/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to fetch users' 
      };
    }
  },

  // Update user status (admin only)
  async updateUserStatus(userId, status) {
    try {
      const response = await api.put(`/auth/users/${userId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to update user status' 
      };
    }
  },

  // Delete user (admin only)
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/auth/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { 
        success: false, 
        message: error.message || 'Failed to delete user' 
      };
    }
  }
};

export default authService;