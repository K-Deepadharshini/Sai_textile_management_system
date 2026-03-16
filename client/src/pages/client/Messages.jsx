import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Container, Paper, Typography, Box, Button, TextField,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Chip, IconButton, Divider, CircularProgress, Badge,
  Drawer, InputAdornment, Menu, MenuItem, Grid
} from '@mui/material';
import {
  Send, Search, AttachFile, MarkEmailRead, Delete,
  FilterList, Refresh, Person, Email, Schedule,
  Error, CheckCircle, Chat, Close, MoreVert,
  LocalShipping, ShoppingCart, AttachMoney
} from '@mui/icons-material';
import { messageService } from '../../services';
import { formatDate } from '../../utils/formatDate';

const Messages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, searchTerm, filter]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      const response = await messageService.getClientMessages();
      const sortedMessages = (response.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMessages(sortedMessages);
      
      // Mark messages as read if they're selected
      if (selectedMessage) {
        const updatedMessage = sortedMessages.find(m => m._id === selectedMessage._id);
        if (updatedMessage) setSelectedMessage(updatedMessage);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(message =>
        message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(message => message.category === filter);
    }

    // Apply unread filter
    if (filter === 'unread') {
      filtered = filtered.filter(message => !message.isRead);
    }

    setFilteredMessages(filtered);
  };

  const handleSelectMessage = async (message) => {
    setSelectedMessage(message);
    setDrawerOpen(true);
    // Note: Not marking as read here to avoid 403 errors with sent messages
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const messageData = {
        receiver: 'admin', // Backend will handle routing to admin
        message: newMessage,
        subject: 'New Message',
        category: 'general',
        priority: 'normal'
      };

      await messageService.sendMessage(messageData);
      
      // Clear input and refresh messages
      setNewMessage('');
      fetchMessages();
      
      // Show success message
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedMessage) return;

    try {
      setSending(true);
      const replyData = {
        receiver: selectedMessage.sender._id,
        message: replyMessage,
        subject: `Re: ${selectedMessage.subject || 'Message'}`,
        order: selectedMessage.order?._id,
        category: selectedMessage.category,
        priority: selectedMessage.priority
      };

      await messageService.sendMessage(replyData);
      
      // Clear reply input
      setReplyMessage('');
      
      // Show success message
      toast.success('Reply sent successfully!');
      
      // Refresh messages
      fetchMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await messageService.deleteMessage(messageId);
        fetchMessages();
        if (selectedMessage?._id === messageId) {
          setSelectedMessage(null);
          setDrawerOpen(false);
        }
        toast.success('Message deleted successfully!');
      } catch (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': 'error',
      'normal': 'primary',
      'low': 'default'
    };
    return colors[priority] || 'default';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'order-inquiry': <ShoppingCart />,
      'payment': <AttachMoney />,
      'delivery': <LocalShipping />,
      'complaint': <Error />,
      'feedback': <CheckCircle />,
      'general': <Email />
    };
    return icons[category] || <Email />;
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Messages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate with the admin team
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Sidebar - Message List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Grid container alignItems="center" spacing={1}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                    <Box>
                      <Chip
                        label={`${unreadCount} unread`}
                        size="small"
                        color={unreadCount > 0 ? 'error' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={fetchMessages}>
                        <Refresh fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                      >
                        <FilterList fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                      >
                        <MenuItem onClick={() => { setFilter('all'); setAnchorEl(null); }}>
                          All Messages
                        </MenuItem>
                        <MenuItem onClick={() => { setFilter('unread'); setAnchorEl(null); }}>
                          Unread Only
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { setFilter('order-inquiry'); setAnchorEl(null); }}>
                          Order Inquiries
                        </MenuItem>
                        <MenuItem onClick={() => { setFilter('payment'); setAnchorEl(null); }}>
                          Payment Related
                        </MenuItem>
                        <MenuItem onClick={() => { setFilter('delivery'); setAnchorEl(null); }}>
                          Delivery Updates
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Message List */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {filteredMessages.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Chat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No messages found
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredMessages.map((message, index) => (
                    <React.Fragment key={message._id}>
                      <ListItem
                        slotProps={{ root: { component: 'div' } }}
                        selected={selectedMessage?._id === message._id}
                        onClick={() => handleSelectMessage(message)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: !message.isRead ? 'action.hover' : 'inherit',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            color="error"
                            variant="dot"
                            invisible={message.isRead}
                          >
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getCategoryIcon(message.category)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography
                                variant="subtitle2"
                                fontWeight={!message.isRead ? 'bold' : 'normal'}
                                noWrap
                              >
                                {message.subject || 'No Subject'}
                              </Typography>
                              <Chip
                                label={message.priority}
                                size="small"
                                color={getPriorityColor(message.priority)}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{
                              mt: 0.5,
                              color: !message.isRead ? 'text.primary' : 'text.secondary',
                              fontWeight: !message.isRead ? 'medium' : 'normal',
                              fontSize: '0.875rem'
                            }}>
                              <Box sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0.5
                              }}>
                                {message.message}
                              </Box>
                              <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                {formatDate(message.createdAt)}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredMessages.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Paper>

          {/* New Message Form */}
          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              New Message to Admin
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? <CircularProgress size={24} /> : <Send />}
              </IconButton>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side - Message Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {selectedMessage.subject || 'No Subject'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Chip
                          icon={<Person fontSize="small" />}
                          label={`From: ${selectedMessage.sender?.name || 'Admin'}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={getCategoryIcon(selectedMessage.category)}
                          label={selectedMessage.category}
                          size="small"
                        />
                        <Chip
                          label={selectedMessage.priority}
                          size="small"
                          color={getPriorityColor(selectedMessage.priority)}
                        />
                        {selectedMessage.order && (
                          <Chip
                            icon={<ShoppingCart fontSize="small" />}
                            label={`Order: ${selectedMessage.order.orderNumber}`}
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/client/orders?order=${selectedMessage.order._id}`)}
                          />
                        )}
                      </Box>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteMessage(selectedMessage._id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDrawerOpen(false)}
                        sx={{ display: { md: 'none' } }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Received: {formatDate(selectedMessage.createdAt)}
                    {selectedMessage.isRead && (
                      <>
                        {' • '}
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                          <MarkEmailRead fontSize="small" sx={{ mr: 0.5 }} />
                          Read
                        </Box>
                      </>
                    )}
                  </Typography>
                </Box>

                {/* Message Body */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                  <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedMessage.message}
                    </Typography>
                    
                    {/* Attachments */}
                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Attachments:
                        </Typography>
                        <Grid container spacing={1}>
                          {selectedMessage.attachments.map((file, index) => (
                          <Grid key={index} size="auto">
                              <Button
                                size="small"
                                startIcon={<AttachFile />}
                                href={file.fileUrl}
                                target="_blank"
                                variant="outlined"
                              >
                                {file.fileName}
                              </Button>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                  </Paper>

                  {/* Reply Section */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Reply to this message:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleReply}
                        disabled={sending || !replyMessage.trim()}
                        sx={{ height: 'fit-content' }}
                      >
                        Send
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 3 
              }}>
                <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a message to view
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Choose a message from the list to read and reply
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Paper>
        </Grid>
      </Grid>

      {/* Mobile Drawer for Message Details */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: '100vw', height: '100vh' }}>
          {selectedMessage && (
            <>
              {/* Mobile Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                    {selectedMessage.subject || 'No Subject'}
                  </Typography>
                  <IconButton onClick={() => setDrawerOpen(false)}>
                    <Close />
                  </IconButton>
                </Box>
              </Box>
              {/* Message content would go here */}
            </>
          )}
        </Box>
      </Drawer>
    </Container>
  );
};

export default Messages;