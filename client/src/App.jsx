import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './routes/AdminRoute';
import ClientRoute from './routes/ClientRoute';

// Home Page
import Home from './pages/Home';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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
import ClientNewOrder from './pages/client/NewOrder';
import ClientInvoices from './pages/client/Invoices';
import ClientReports from './pages/client/Reports';
import ClientMessages from './pages/client/Messages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="production" element={<AdminProduction />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="dispatch" element={<AdminDispatch />} />
              <Route path="invoices" element={<AdminInvoices />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="clients" element={<AdminClients />} />
              <Route path="messages" element={<AdminMessages />} />
            </Route>
            
            {/* Client Routes */}
            <Route path="/client" element={<ClientRoute />}>
              <Route index element={<ClientDashboard />} />
              <Route path="orders/new" element={<ClientNewOrder />} />
              <Route path="products" element={<ClientProducts />} />
              <Route path="orders" element={<ClientOrders />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="reports" element={<ClientReports />} />
              <Route path="messages" element={<ClientMessages />} />
            </Route>
            
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
