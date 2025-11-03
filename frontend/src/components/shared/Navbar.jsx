import React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function Navbar({ user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-medium text-gray-700">
              <img src="/logo.png" alt="ReCycle" className="h-10 w-10 inline-block" />
              Re
              <span className="font-bold text-gray-900">Cycle</span>
            </a>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 font-medium">
            <a href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <HomeIcon fontSize="small" />
              Home
            </a>
            <a href="/products" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <DirectionsBikeIcon fontSize="small" />
              Products
            </a>
            {user && (
              <a href="/create-product" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <AddCircleOutlineIcon fontSize="small" />
                Sell
              </a>
            )}
            
            {user ? (
              <>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <DashboardIcon fontSize="small" />
                  Dashboard
                </a>
                {user.is_admin && (
                  <a href="/admin" className="text-red-700 hover:text-red-900 flex items-center gap-1">
                    <AdminPanelSettingsIcon fontSize="small" />
                    Admin
                  </a>
                )}
                <div className="relative group flex items-center">
                  <div className="flex items-center cursor-pointer">
                    <img
                      src="/user-avatar.png"
                      alt="User Avatar"
                      className="h-6 w-6 rounded-full hover:opacity-80"
                    />
                    <svg className="w-4 h-4 ml-1 text-gray-500 group-hover:text-gray-700 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                    <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                      <PersonIcon fontSize="small" />
                      Profile
                    </a>
                    <a href="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                      <MessageIcon fontSize="small" />
                      Messages
                    </a>
                    <a href="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                      <FavoriteIcon fontSize="small" />
                      Favorites
                    </a>
                    <div className="border-t border-gray-200 mt-1">
                      <button
                        onClick={onLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-1"
                      >
                        <LogoutIcon fontSize="small" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-700 hover:text-gray-900 flex items-center gap-1">
                  <LoginIcon fontSize="small" />
                  Login
                </a>
                <a href="/register" className="text-gray-700 hover:text-gray-900 flex items-center gap-1">
                  <PersonAddIcon fontSize="small" />
                  Register
                </a>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <div className="relative group flex items-center mr-4">
                <div className="flex items-center cursor-pointer">
                  <img
                    src="/user-avatar.png"
                    alt="User Avatar"
                    className="h-6 w-6 rounded-full hover:opacity-80"
                  />
                  <svg className="w-4 h-4 ml-1 text-gray-500 group-hover:text-gray-700 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="absolute right-0 top-6 w-32 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200">
                  <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                    <PersonIcon fontSize="small" />
                    Profile
                  </a>
                  <a href="/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                    <MessageIcon fontSize="small" />
                    Messages
                  </a>
                  <a href="/favorites" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1">
                    <FavoriteIcon fontSize="small" />
                    Favorites
                  </a>
                  <div className="border-t border-gray-200 mt-1">
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium flex items-center gap-1"
                    >
                      <LogoutIcon fontSize="small" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <a href="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                <HomeIcon fontSize="small" />
                Home
              </a>
              <a href="/products" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                <DirectionsBikeIcon fontSize="small" />
                Products
              </a>
              {user && (
                <a href="/create-product" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                  <AddCircleOutlineIcon fontSize="small" />
                  Sell
                </a>
              )}
              {user && (
                <a href="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                  <DashboardIcon fontSize="small" />
                  Dashboard
                </a>
              )}
              {user && user.is_admin && (
                <a href="/admin" className="block px-3 py-2 text-base font-medium text-red-700 hover:text-red-900 hover:bg-red-50 rounded-md flex items-center gap-1">
                  <AdminPanelSettingsIcon fontSize="small" />
                  Admin
                </a>
              )}
              {!user && (
                <>
                  <a href="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                    <LoginIcon fontSize="small" />
                    Login
                  </a>
                  <a href="/register" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-1">
                    <PersonAddIcon fontSize="small" />
                    Register
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
