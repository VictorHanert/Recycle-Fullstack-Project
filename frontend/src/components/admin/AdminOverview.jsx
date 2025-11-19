import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAdminStore } from "../../stores";
import { Link } from "react-router-dom";
import { InlineLoader } from "../shared/LoadingSpinners";
import RecentActivity from "./RecentActivity";
import PopularProducts from "../shared/PopularProducts";

function AdminOverview() {
  const { user } = useAuth();
  const { stats, statsLoading, statsError, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
      
      {/* Recent Activity - Live Data */}
      <div className="mb-8">
        <RecentActivity />
      </div>

      {/* Popular Products - Static Data */}
      <div className="mb-8">
        <PopularProducts />
      </div>
    </div>
  );
}

export default AdminOverview;