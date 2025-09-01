import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function AdminLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Navigation */}
      <nav className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin" className="text-xl font-bold">
                Admin Panel
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-300 hover:text-white">
                Back to Site
              </Link>
              <span className="text-gray-300">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="text-gray-300 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin sidebar and content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 min-h-screen">
          <nav className="mt-5 px-2">
            <Link
              to="/admin"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Users
            </Link>
            <Link
              to="/admin/products"
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Products
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
