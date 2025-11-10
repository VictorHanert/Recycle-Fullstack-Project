import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./layouts/MainLayout";

// Import pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import { PageLoader } from "./components/shared/LoadingSpinners";

// Import admin components
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./components/admin/AdminOverview";
import UsersManagement from "./components/admin/users/UsersManagement";
import ProductsManagement from "./components/admin/products/ProductsManagement";
import Stats from "./components/admin/Stats";
import RecentActivity from "./components/admin/RecentActivity";
import Locations from "./components/admin/Locations";

// Protected Route wrapper component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <PageLoader size={60} message="Authenticating..." />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Admin Route wrapper component  
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <PageLoader size={60} message="Verifying admin access..." />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// App routes component
function AppRoutes() {
  const { checkAuth, loading } = useAuth();
  
  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Show loader while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader size={60} message="Loading..." />
      </div>
    );
  }
  
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/user/:userId" element={<UserProfile />} />

          {/* Protected routes (requires login) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-product"
            element={
              <ProtectedRoute>
                <CreateProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/products/:id" 
            element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/products/:id/edit"
            element={
              <ProtectedRoute>
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:userId"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="stats" element={<Stats />} />
            <Route path="activity" element={<RecentActivity />} />
            <Route path="locations" element={<Locations />} />
          </Route>
        </Routes>
      </MainLayout>
    </Router>
  );
}

function App() {
  return (
    <>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;
