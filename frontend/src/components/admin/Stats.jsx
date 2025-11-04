function Stats() {
  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Statistics</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Detailed statistics and reports will be implemented here.</p>
        <div className="mt-4 space-y-2">
          <button className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-700">
            Export Data to Excel 📊
          </button>
        </div>
      </div>
    </div>
  );
}

export default Stats;