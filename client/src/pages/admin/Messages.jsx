import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaSearch, FaReply, FaTrash, FaEye, FaPaperclip, FaUser, FaClock, FaPlus, FaTimes } from 'react-icons/fa';
import messageService from '../../services/messageService';
import toast from 'react-hot-toast';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    receiver: '',
    subject: '',
    message: '',
    category: 'general',
    priority: 'normal',
  });

  // Improved CSS Styles
  const styles = {
    pageWrapper: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f5f7fa',
      padding: '1.5rem',
      gap: '1rem',
    },
    pageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    pageTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.875rem',
      fontWeight: '700',
      color: '#2c3e50',
    },
    filterSection: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
    },
    filterSelect: {
      padding: '0.75rem 1rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      minWidth: '150px',
    },
    contentWrapper: {
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: '1rem',
      flex: 1,
      minHeight: 0,
    },
    sidebar: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    },
    sidebarHeader: {
      padding: '1rem',
      borderBottom: '1px solid #e0e6ed',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
    },
    searchBox: {
      position: 'relative',
      width: '100%',
    },
    searchInput: {
      width: '100%',
      padding: '0.75rem 0.75rem 0.75rem 2.5rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    searchIcon: {
      position: 'absolute',
      left: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#95aac9',
      pointerEvents: 'none',
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #e0e6ed',
    },
    tab: {
      flex: 1,
      padding: '1rem',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#7a8fa6',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      position: 'relative',
      textAlign: 'center',
      transition: 'color 0.2s',
    },
    tabActive: {
      color: '#0066cc',
    },
    messageListContainer: {
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    },
    messageList: {
      display: 'flex',
      flexDirection: 'column',
    },
    messageItem: {
      padding: '1rem',
      borderBottom: '1px solid #e0e6ed',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start',
      backgroundColor: 'white',
    },
    messageItemUnread: {
      backgroundColor: '#f0f4ff',
    },
    messageItemSelected: {
      backgroundColor: '#e6f0ff',
      borderLeft: '4px solid #0066cc',
    },
    messageItemHover: {
      backgroundColor: '#f9fbfd',
    },
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#0066cc',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '0.875rem',
      flexShrink: 0,
    },
    messageContent: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
    },
    messageHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '0.5rem',
    },
    senderName: {
      fontWeight: '600',
      color: '#2c3e50',
      fontSize: '0.875rem',
    },
    messageTime: {
      fontSize: '0.75rem',
      color: '#95aac9',
      flexShrink: 0,
    },
    messageSubject: {
      fontWeight: '500',
      color: '#2c3e50',
      fontSize: '0.875rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    messagePreview: {
      fontSize: '0.75rem',
      color: '#7a8fa6',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
    },
    mainContent: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden',
    },
    messageDetailHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #e0e6ed',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1rem',
    },
    detailInfo: {
      flex: 1,
    },
    detailTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '0.75rem',
    },
    detailMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      fontSize: '0.875rem',
      color: '#7a8fa6',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    priorityBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
    },
    deleteButton: {
      padding: '0.5rem 1rem',
      backgroundColor: '#fff3f0',
      border: '1px solid #ffcccc',
      color: '#d9534f',
      borderRadius: '0.375rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s',
    },
    messageBody: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      lineHeight: '1.6',
      color: '#2c3e50',
    },
    replySection: {
      padding: '1.5rem',
      borderTop: '1px solid #e0e6ed',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    replyInput: {
      width: '100%',
      minHeight: '100px',
      padding: '1rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      resize: 'vertical',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    replyActions: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
    },
    replyButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.2s',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#95aac9',
      textAlign: 'center',
      padding: '2rem',
    },
    emptyIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
      opacity: 0.5,
    },
    composeButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'background-color 0.2s',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    modalHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #e0e6ed',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#2c3e50',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#95aac9',
      transition: 'color 0.2s',
    },
    modalBody: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#2c3e50',
    },
    input: {
      padding: '0.75rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    select: {
      padding: '0.75rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    textarea: {
      padding: '0.75rem',
      border: '1px solid #e0e6ed',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontFamily: 'inherit',
      minHeight: '150px',
      resize: 'vertical',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
    },
    modalFooter: {
      padding: '1.5rem',
      borderTop: '1px solid #e0e6ed',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '1rem',
    },
    cancelButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#f5f7fa',
      border: '1px solid #e0e6ed',
      color: '#2c3e50',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    sendButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#0066cc',
      color: 'white',
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
  };

  useEffect(() => {
    fetchMessages();
  }, [activeTab]);

  useEffect(() => {
    // Load users on component mount and when messages change
    fetchUsers();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      // Try to fetch list of users/clients from the API
      const response = await messageService.getClients();
      console.log('getClients response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        // Filter to only include non-admin users (clients)
        const clients = response.data.filter(u => u.role !== 'admin');
        setUsers(clients);
        console.log(`Loaded ${clients.length} clients from API (filtered from ${response.data.length} users)`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching clients from API, using message-based fallback:', error);
      // Fallback: extract unique senders and receivers from messages
      if (messages && Array.isArray(messages) && messages.length > 0) {
        const uniqueUsers = [];
        const userMap = new Map();
        
        messages.forEach(msg => {
          // Add senders (clients who sent messages)
          if (msg.sender?._id && !userMap.has(msg.sender._id)) {
            uniqueUsers.push({
              _id: msg.sender._id,
              name: msg.sender.name || 'Unknown',
              email: msg.sender.email || '',
              role: msg.sender.role || 'client'
            });
            userMap.set(msg.sender._id, true);
          }
          // Add receivers (clients admin sent messages to)
          if (msg.receiver?._id && !userMap.has(msg.receiver._id)) {
            uniqueUsers.push({
              _id: msg.receiver._id,
              name: msg.receiver.name || 'Unknown',
              email: msg.receiver.email || '',
              role: msg.receiver.role || 'client'
            });
            userMap.set(msg.receiver._id, true);
          }
        });
        
        // Filter out admins
        const clientsList = uniqueUsers.filter(u => u.role !== 'admin');
        console.log(`Loaded ${clientsList.length} clients from message fallback (filtered from ${uniqueUsers.length} unique users)`);
        setUsers(clientsList);
      } else {
        console.warn('No messages available for fallback, and API call failed');
        setUsers([]);
      }
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'inbox' ? '/inbox' : '/sent';
      console.log('Fetching messages, activeTab:', activeTab, 'endpoint:', endpoint);
      const response = await messageService.getMessages(endpoint);
      
      // Log the full response structure for debugging
      console.log('=== FULL RESPONSE OBJECT ===');
      console.log('response:', response);
      console.log('response.success:', response?.success);
      console.log('response.count:', response?.count);
      console.log('response.total:', response?.total);
      console.log('response.data type:', typeof response?.data);
      console.log('response.data isArray:', Array.isArray(response?.data));
      console.log('response.data length:', response?.data?.length);
      console.log('response.data content:', response?.data);
      console.log('=== END RESPONSE ===');
      
      // messageService.getMessages returns the full server response object
      // Server returns: { success: true, count, total, unreadCount, data: [...], ... }
      let messageData = [];
      
      if (response?.data && Array.isArray(response.data)) {
        messageData = response.data;
        console.log(`✓ Extracted ${messageData.length} messages from response.data`);
      } else {
        console.error('✗ Unexpected response structure - response.data is not an array');
      }
      
      console.log(`✓ Successfully loaded ${messageData.length} messages for ${activeTab} tab`);
      setMessages(messageData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error(error.message || 'Failed to fetch messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      try {
        await messageService.markAsRead(message._id);
        fetchMessages();
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    try {
      const response = await messageService.sendReply(selectedMessage._id, replyText);
      if (response.success) {
        toast.success('Reply sent successfully');
        setReplyText('');
        fetchMessages();
      }
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const response = await messageService.deleteMessage(messageId);
        if (response.success) {
          toast.success('Message deleted');
          fetchMessages();
          if (selectedMessage?._id === messageId) {
            setSelectedMessage(null);
          }
        }
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };

  const handleCompose = async () => {
    if (!composeData.receiver || !composeData.message.trim()) {
      toast.error('Please select a recipient and enter a message');
      return;
    }

    try {
      console.log('Sending message:', {
        receiver: composeData.receiver,
        subject: composeData.subject,
        message: composeData.message.substring(0, 50) + '...',
        category: composeData.category,
        priority: composeData.priority
      });

      const response = await messageService.sendMessage(composeData);
      console.log('Send message response:', response);

      if (response.success || response.data) {
        toast.success('Message sent successfully');
        setComposeData({
          receiver: '',
          subject: '',
          message: '',
          category: 'general',
          priority: 'normal',
        });
        setShowCompose(false);
        // Refresh messages after sending
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    // If no filters applied, show all messages
    if (!searchTerm && filterCategory === 'all') {
      return true;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check search term - if empty, match all; otherwise check specific fields
    const matchesSearch = !searchTerm || 
      (msg.subject?.toLowerCase().includes(searchLower)) ||
      (msg.message?.toLowerCase().includes(searchLower)) ||
      (msg.sender?.name?.toLowerCase().includes(searchLower));
    
    // Check category
    const matchesCategory = filterCategory === 'all' || msg.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.emptyState}>
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div style={styles.pageTitle}>
          <FaEnvelope size={28} />
          <span>
            {activeTab === 'inbox' ? 'Inbox' : 'Sent Messages'}
            {messages.length > 0 && <span style={{ fontSize: '0.875rem', color: '#7a8fa6', marginLeft: '1rem' }}>({messages.length})</span>}
          </span>
        </div>
        <div style={styles.filterSection}>
          <select
            style={styles.filterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="order-inquiry">Order Inquiry</option>
            <option value="payment">Payment</option>
            <option value="delivery">Delivery</option>
            <option value="general">General</option>
            <option value="complaint">Complaint</option>
          </select>
          <button 
            style={styles.composeButton}
            onClick={() => setShowCompose(true)}
            title="Compose new message"
          >
            <FaPlus />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={styles.contentWrapper}>
        {/* Sidebar - Message List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.searchBox}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search messages..."
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'inbox' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('inbox')}
            >
              Inbox
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === 'sent' ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab('sent')}
            >
              Sent
            </button>
          </div>

          <div style={styles.messageListContainer}>
            {filteredMessages.length > 0 ? (
              <div style={styles.messageList}>
                {filteredMessages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      ...styles.messageItem,
                      ...((!msg.isRead && activeTab === 'inbox') ? styles.messageItemUnread : {}),
                      ...(selectedMessage?._id === msg._id ? styles.messageItemSelected : {}),
                    }}
                    onClick={() => handleViewMessage(msg)}
                    onMouseEnter={(e) => {
                      if (selectedMessage?._id !== msg._id) {
                        e.currentTarget.style.backgroundColor = styles.messageItemHover.backgroundColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedMessage?._id !== msg._id) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={styles.avatar}>
                      {msg.sender?.name?.charAt(0) || 'U'}
                    </div>
                    <div style={styles.messageContent}>
                      <div style={styles.messageHeader}>
                        <div style={styles.senderName}>
                          {msg.sender?.name || 'Unknown'}
                        </div>
                        <div style={styles.messageTime}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div style={styles.messageSubject}>
                        {msg.subject || 'No Subject'}
                      </div>
                      <div style={styles.messagePreview}>
                        {msg.message?.substring(0, 60) || 'No message'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <FaEnvelope style={styles.emptyIcon} />
                <p>No messages found</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Message Detail */}
        <div style={styles.mainContent}>
          {selectedMessage ? (
            <>
              <div style={styles.messageDetailHeader}>
                <div style={styles.detailInfo}>
                  <h2 style={styles.detailTitle}>
                    {selectedMessage.subject || 'No Subject'}
                  </h2>
                  <div style={styles.detailMeta}>
                    <div style={styles.metaItem}>
                      <FaUser size={14} />
                      <span>
                        {selectedMessage.sender?.name} ({selectedMessage.sender?.email})
                      </span>
                    </div>
                    <div style={styles.metaItem}>
                      <FaClock size={14} />
                      <span>
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span style={{
                      ...styles.priorityBadge,
                      backgroundColor: selectedMessage.priority === 'high' 
                        ? '#ffe6e6' 
                        : selectedMessage.priority === 'low' 
                        ? '#e6ffe6' 
                        : '#e6f0ff',
                      color: selectedMessage.priority === 'high' 
                        ? '#d9534f' 
                        : selectedMessage.priority === 'low' 
                        ? '#5cb85c' 
                        : '#0066cc',
                    }}>
                      {selectedMessage.priority} Priority
                    </span>
                  </div>
                </div>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(selectedMessage._id)}
                  title="Delete Message"
                >
                  <FaTrash /> Delete
                </button>
              </div>

              <div style={styles.messageBody}>
                <p>{selectedMessage.message}</p>
                
                {selectedMessage.attachments?.length > 0 && (
                  <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e0e6ed' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                      Attachments ({selectedMessage.attachments.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedMessage.attachments.map((attachment, index) => (
                        <a
                          key={index}
                          href={attachment.fileUrl}
                          download
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#f9fbfd',
                            border: '1px solid #e0e6ed',
                            borderRadius: '0.375rem',
                            textDecoration: 'none',
                            color: '#0066cc',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f0f4ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fbfd';
                          }}
                        >
                          <FaPaperclip size={14} />
                          <span>{attachment.fileName}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>
                            Download
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activeTab === 'inbox' && (
                <div style={styles.replySection}>
                  <textarea
                    style={styles.replyInput}
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div style={styles.replyActions}>
                    <button
                      style={styles.replyButton}
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = '#0052a3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#0066cc';
                      }}
                    >
                      <FaReply />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.emptyState}>
              <FaEnvelope style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>
                Select a Message
              </h3>
              <p>Choose a message from the list to view details and reply</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div style={styles.modalOverlay} onClick={() => setShowCompose(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Compose Message</h2>
              <button 
                style={styles.closeButton}
                onClick={() => setShowCompose(false)}
              >
                <FaTimes />
              </button>
            </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.label}>To (Select Client) {users.length > 0 && <span style={{ fontSize: '0.75rem', color: '#7a8fa6' }}>({users.length} available)</span>}</label>
              <select
                style={styles.select}
                value={composeData.receiver}
                onChange={(e) => setComposeData({...composeData, receiver: e.target.value})}
              >
                <option value="">
                  {users.length === 0 ? '-- No clients available --' : '-- Select a recipient --'}
                </option>
                {users && users.length > 0 && users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: '#7a8fa6', marginTop: '0.5rem' }}>
                  No clients found. Clients will appear here once they send you a message.
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Subject</label>
              <input
                type="text"
                style={styles.input}
                placeholder="Enter message subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                style={styles.select}
                value={composeData.category}
                onChange={(e) => setComposeData({...composeData, category: e.target.value})}
              >
                <option value="general">General</option>
                <option value="order-inquiry">Order Inquiry</option>
                <option value="payment">Payment</option>
                <option value="delivery">Delivery</option>
                <option value="complaint">Complaint</option>
                <option value="feedback">Feedback</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                style={styles.select}
                value={composeData.priority}
                onChange={(e) => setComposeData({...composeData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Message</label>
              <textarea
                style={styles.textarea}
                placeholder="Type your message here..."
                value={composeData.message}
                onChange={(e) => setComposeData({...composeData, message: e.target.value})}
              />
            </div>
          </div>

          <div style={styles.modalFooter}>
            <button
              style={styles.cancelButton}
              onClick={() => setShowCompose(false)}
            >
              Cancel
            </button>
            <button
              style={styles.sendButton}
              onClick={handleCompose}
              disabled={!composeData.receiver || !composeData.message.trim()}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Messages;