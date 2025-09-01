import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import { HomePage, ProductsPage, AdminPage, LoginPage, StatusPage } from './pages';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/*" element={
            <Layout>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                
                {/* Hidden Routes */}
                <Route path="/status" element={<StatusPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
