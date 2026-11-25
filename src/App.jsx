import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Styles
import './styles/theme.css';

// Public & Customer Pages
import Home from './pages/customer/Home';
import ProductDetails from './pages/customer/ProductDetails';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import MyOrders from './pages/customer/MyOrders';
import OrderTracking from './pages/customer/OrderTracking';
import ReturnRequest from './pages/customer/ReturnRequest';
import ReturnTracking from './pages/customer/ReturnTracking';
import CustomerProfile from './pages/customer/Profile/CustomerProfile';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard/AdminDashboard';
import AdminProducts from './pages/admin/Products/AdminProducts';
import AdminOrders from './pages/admin/Orders/AdminOrders';
import AdminInventory from './pages/admin/Inventory/AdminInventory';
import AdminManufacturing from './pages/admin/Manufacturing/AdminManufacturing';
import AdminDeliveries from './pages/admin/Deliveries/AdminDeliveries';
import AdminReturns from './pages/admin/Returns/AdminReturns';
import AdminBulkReplacements from './pages/admin/Returns/AdminBulkReplacements';

// Business & Delivery Portals
import BusinessDashboard from './pages/business/Dashboard/BusinessDashboard';
import BulkOrders from './pages/business/BulkOrders';
import BusinessCatalog from './pages/business/BusinessCatalog';
import DeliveryDashboard from './pages/delivery/Dashboard/DeliveryDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer & Business Shared Routes */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin']}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin']}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id/track"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin']}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id/return"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin']}>
                <ReturnRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/returns/:id/track"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin']}>
                <ReturnTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['customer', 'business', 'admin', 'delivery']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inventory"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminInventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manufacturing"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminManufacturing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/deliveries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDeliveries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/returns"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReturns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bulk-replacements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBulkReplacements />
              </ProtectedRoute>
            }
          />

          {/* Business Protected Routes */}
          <Route
            path="/business/dashboard"
            element={
              <ProtectedRoute allowedRoles={['business', 'admin']}>
                <BusinessDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/business/bulk-orders"
            element={
              <ProtectedRoute allowedRoles={['business', 'admin']}>
                <BulkOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/business/orders"
            element={
              <ProtectedRoute allowedRoles={['business', 'admin']}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/business/catalog"
            element={
              <ProtectedRoute allowedRoles={['business', 'admin']}>
                <BusinessCatalog />
              </ProtectedRoute>
            }
          />

          {/* Delivery Protected Routes */}
          <Route
            path="/delivery/dashboard"
            element={
              <ProtectedRoute allowedRoles={['delivery', 'admin']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/assigned"
            element={
              <ProtectedRoute allowedRoles={['delivery', 'admin']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
