import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { Link } from "react-router-dom";
import { InlineLoader } from "../shared/LoadingSpinners";

function AdminOverview() {
  const { user, token } = useAuth();

  const { data: stats, loading: statsLoading, error: statsError } = useFetch('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return (
    <div className="px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Panel</h1>
        <p className="text-lg text-gray-600">
          Welcome to the admin dashboard, <span className="font-semibold">{user?.full_name || user?.username}</span>!
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8 max-w-5xl mx-auto">
        {/* Stats Cards */}
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Total Users</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.total_users || 0}</p>
        </div>
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Total Products</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.total_products || 0}</p>
        </div>
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Active Products</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.active_products || 0}</p>
        </div>
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Sold Products</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.sold_products || 0}</p>
        </div>
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Conversion Rate</h3>
          <p className="text-2xl font-bold text-blue-600">{stats?.conversion_rate || 0}%</p>
        </div>
        <div className="bg-white px-1 py-2 rounded shadow flex flex-col items-center">
          <h3 className="text-xs font-medium text-gray-700 mb-1 text-center">Revenue from Sold</h3>
          <p className="text-lg font-bold text-blue-600 truncate ">{stats?.revenue_from_sold_products || 0} DKK</p>
        </div>

        {statsLoading && (
          <div className="col-span-2 sm:col-span-3 md:col-span-3 lg:col-span-6 text-center text-gray-500 py-4">
            <InlineLoader message="Loading stats..." />
          </div>
        )}
        {statsError && (
          <div className="col-span-2 sm:col-span-3 md:col-span-3 lg:col-span-6 text-center text-red-500">Error loading stats: {statsError}</div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/users" className="block w-full text-left p-3 border rounded hover:bg-gray-50">
              👥 Manage Users
            </Link>
            <Link to="/admin/products" className="block w-full text-left p-3 border rounded hover:bg-gray-50">
              📦 Manage Products
            </Link>
            <Link to="/admin/locations" className="block w-full text-left p-3 border rounded hover:bg-gray-50">
              📍 Manage Locations
            </Link>
            <Link to="/admin/stats" className="block w-full text-left p-3 border rounded hover:bg-gray-50">
              📊 View Reports
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm">New user registered: john@example.com</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm">Product updated: Wireless Headphones</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <p className="text-sm">New order placed: #ORD-12345</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;