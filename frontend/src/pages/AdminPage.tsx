import Admin from '../components/Admin';

const AdminPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Administrative controls and management</p>
      </div>
      <Admin />
    </div>
  );
};

export default AdminPage;
