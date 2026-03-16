import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import AdminNavbar from '../components/common/AdminNavbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading, authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/client" replace />;
  }

  // Admin layout with navbar and nested routes outlet
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AdminNavbar />
      <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, backgroundColor: '#f9f9f9', overflow: 'auto' }}>
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Outlet />
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
};

export default AdminRoute;