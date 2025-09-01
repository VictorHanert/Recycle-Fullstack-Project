import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isLoggedIn, isAdmin, username, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
              MyMarketplace
            </Link>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex space-x-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActiveRoute('/')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/products"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActiveRoute('/products')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Products
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActiveRoute('/admin')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>

              {/* Login/Logout */}
              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Welcome, {username}
                      {isAdmin && <span className="text-red-600 font-medium"> (Admin)</span>}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
