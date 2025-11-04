import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/admin/AdminNavBar';

function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;