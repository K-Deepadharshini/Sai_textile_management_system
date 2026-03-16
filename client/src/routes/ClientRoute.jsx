import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { 
  Box, 
  CircularProgress, 
  Container, 
  Typography 
} from '@mui/material';
import ClientNavbar from '../components/common/ClientNavbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const ClientRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is not a client, redirect to appropriate dashboard
  if (user?.role !== 'client') {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Client layout with navbar and nested routes outlet
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ClientNavbar />
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, backgroundColor: '#f9f9f9', overflow: 'auto' }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Box sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#1a4d3e', 
                fontWeight: 'bold',
                mb: 1
              }}
            >
              Welcome back, {user?.name}!
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
            >
              Manage your orders, invoices, and communications
            </Typography>
          </Box>

          <Box sx={{ mb: 2, display: { xs: 'block', md: 'none' } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#1a4d3e', 
                fontWeight: 'bold',
                mb: 0.5
              }}
            >
              Hi, {user?.name}!
            </Typography>
          </Box>

          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default ClientRoute;