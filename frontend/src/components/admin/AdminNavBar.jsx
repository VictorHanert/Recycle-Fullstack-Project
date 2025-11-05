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
    <nav className="bg-white shadow-sm border-b relative">
      <div className="max-w-7xl mx-auto md:px-4 relative">
        {/* Divider lines between rows on small/medium screens */}
        <div className="absolute inset-x-0 hidden border-t border-gray-200 md:block md:top-1/2 lg:hidden"></div>
        <div className="absolute inset-x-0 border-t border-gray-200 top-1/3 block md:hidden"></div>
        <div className="absolute inset-x-0 border-t border-gray-200 top-2/3 block md:hidden"></div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 text-center relative">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`py-3 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
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
