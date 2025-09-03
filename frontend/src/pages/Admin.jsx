import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";

function Admin() {
  const { user, token } = useAuth();
  
  const { data: users, loading: usersLoading, error: usersError } = useFetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { data: products, loading: productsLoading, error: productsError } = useFetch('/api/products/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return (
    <div className="px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Panel</h1>
        <p className="text-lg text-gray-600">
          Welcome to the admin dashboard, {user?.full_name || user?.username}!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
          {usersLoading ? (
            <p className="text-3xl font-bold text-gray-400">Loading...</p>
          ) : usersError ? (
            <p className="text-sm text-red-600">Error loading</p>
          ) : (
            <p className="text-3xl font-bold text-blue-600">{users?.length || 0}</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Products</h3>
          {productsLoading ? (
            <p className="text-3xl font-bold text-gray-400">Loading...</p>
          ) : productsError ? (
            <p className="text-sm text-red-600">Error loading</p>
          ) : (
            <p className="text-3xl font-bold text-green-600">{products?.total || 0}</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">890</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
          <p className="text-3xl font-bold text-green-600">$12,345</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              + Add New Product
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              👥 Manage Users
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              📊 View Reports
            </button>
            <button className="w-full text-left p-3 border rounded hover:bg-gray-50">
              ⚙️ System Settings
            </button>
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
            <div className="p-3 border-l-4 border-green-400 bg-green-50">
              <p className="text-sm">Product updated: Wireless Headphones</p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
            <div className="p-3 border-l-4 border-purple-400 bg-purple-50">
              <p className="text-sm">New order placed: #ORD-12345</p>
              <p className="text-xs text-gray-500">10 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;
