import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './routes/AdminRoute';
import ClientRoute from './routes/ClientRoute';

// Common Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProduction from './pages/admin/Production';
import AdminInventory from './pages/admin/Inventory';
import AdminOrders from './pages/admin/Orders';
import AdminDispatch from './pages/admin/Dispatch';
import AdminInvoices from './pages/admin/Invoices';
import AdminReports from './pages/admin/Reports';
import AdminClients from './pages/admin/Clients';
import AdminMessages from './pages/admin/Messages';

// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import ClientProducts from './pages/client/Products';
import ClientOrders from './pages/client/Orders';
import ClientInvoices from './pages/client/Invoices';
import ClientReports from './pages/client/Reports';
import ClientMessages from './pages/client/Messages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <AdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/products" element={<AdminProducts />} />
                    <Route path="/production" element={<AdminProduction />} />
                    <Route path="/inventory" element={<AdminInventory />} />
                    <Route path="/orders" element={<AdminOrders />} />
                    <Route path="/dispatch" element={<AdminDispatch />} />
                    <Route path="/invoices" element={<AdminInvoices />} />
                    <Route path="/reports" element={<AdminReports />} />
                    <Route path="/clients" element={<AdminClients />} />
                    <Route path="/messages" element={<AdminMessages />} />
                  </Routes>
                </AdminLayout>
              </AdminRoute>
            } />
            
            {/* Client Routes */}
            <Route path="/client/*" element={
              <ClientRoute>
                <ClientLayout>
                  <Routes>
                    <Route path="/" element={<ClientDashboard />} />
                    <Route path="/products" element={<ClientProducts />} />
                    <Route path="/orders" element={<ClientOrders />} />
                    <Route path="/invoices" element={<ClientInvoices />} />
                    <Route path="/reports" element={<ClientReports />} />
                    <Route path="/messages" element={<ClientMessages />} />
                  </Routes>
                </ClientLayout>
              </ClientRoute>
            } />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Layout Components
const AdminLayout = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return (
    <div className="main-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <Navbar user={user} />
        <div className="container">
          {children}
        </div>
      </div>
    </div>
  );
};

const ClientLayout = ({ children }) => {
  const { user } = React.useContext(AuthContext);
  return (
    <div className="main-layout">
      <Sidebar role="client" />
      <div className="main-content">
        <Navbar user={user} />
        <div className="container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default App;