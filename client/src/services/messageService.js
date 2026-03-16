import api from './api';

const messageService = {
  // Send message
  async sendMessage(messageData) {
    try {
      const response = await api.post('/messages', messageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },

  // Get inbox messages
  async getInboxMessages(params = {}) {
    try {
      const response = await api.get('/messages/inbox', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inbox messages' };
    }
  },

  // Get sent messages
  async getSentMessages(params = {}) {
    try {
      const response = await api.get('/messages/sent', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch sent messages' };
    }
  },

  // Get message by ID
  async getMessageById(id) {
    try {
      const response = await api.get(`/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch message' };
    }
  },

  // Mark message as read
  async markAsRead(id) {
    try {
      const response = await api.put(`/messages/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to mark message as read' };
    }
  },

  // Delete message
  async deleteMessage(id) {
    try {
      const response = await api.delete(`/messages/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete message' };
    }
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch unread count' };
    }
  },

  // Get client messages
  async getClientMessages(params = {}) {
    try {
      const response = await api.get('/messages/client', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Get messages (for admin)
  async getMessages(endpoint = '') {
    try {
      // Convert endpoint paths to query parameters
      let params = {};
      if (endpoint === '/inbox') {
        params.type = 'received';
      } else if (endpoint === '/sent') {
        params.type = 'sent';
      }
      
      const response = await api.get('/messages', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch messages' };
    }
  },

  // Send reply to a message
  async sendReply(messageId, replyText) {
    try {
      // Get the original message to get sender info
      const messageResponse = await api.get(`/messages/${messageId}`);
      let originalMessage;
      
      // Handle different response structures
      if (messageResponse.data?.data) {
        originalMessage = messageResponse.data.data;
      } else if (messageResponse.data?.message) {
        originalMessage = messageResponse.data;
      } else {
        originalMessage = messageResponse.data;
      }
      
      // Send reply to the sender of the original message
      const response = await api.post('/messages', {
        receiver: originalMessage.sender._id,
        message: replyText,
        subject: `Re: ${originalMessage.subject || 'Message'}`,
        category: originalMessage.category || 'general',
        priority: originalMessage.priority || 'normal'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send reply' };
    }
  },

  // Upload attachment
  async uploadAttachment(formData) {
    try {
      const response = await api.post('/messages/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload attachment' };
    }
  },

  // Get clients list for messaging (admin only)
  async getClients() {
    try {
      // Get all users via auth endpoint
      const response = await api.get('/auth/users');
      console.log('Fetched users/clients:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        // If data is directly an array
        return { data: response.data };
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        // If data is nested in response.data.data
        return response.data;
      }
      
      // Fallback: return empty array - component will use message senders
      console.warn('Unexpected users response format:', response);
      return { data: [] };
    } catch (error) {
      console.error('Failed to fetch clients list from /auth/users:', error);
      return { data: [] };
    }
  },
};

export default messageService;