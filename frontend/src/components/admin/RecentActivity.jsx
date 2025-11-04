function RecentActivity() {
  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Recent Activity</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Recent activity log will be implemented here.</p>
        <div className="mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Refresh Activity
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;