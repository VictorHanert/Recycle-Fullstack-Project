import { Link, useLocation } from 'react-router-dom';

function AdminNavbar() {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/users', label: 'Manage Users' },
    { path: '/admin/products', label: 'Manage Products' },
    { path: '/admin/locations', label: 'Manage Locations' },
    { path: '/admin/stats', label: 'Stats' },
    { path: '/admin/activity', label: 'Recent Activity' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                location.pathname === item.path
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default AdminNavbar;