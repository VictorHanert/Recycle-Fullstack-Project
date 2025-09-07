function Navbar({ user, onLogout }) {
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
          
          <div className="flex items-center space-x-4">
            <a href="/" className="text-gray-700 hover:text-gray-900">
              Home
            </a>
            <a href="/products" className="text-gray-700 hover:text-gray-900">
              Products
            </a>
            
            {user ? (
              <>
                <a href="/dashboard" className="text-gray-700 hover:text-gray-900">
                  Dashboard
                </a>
                {user.is_admin && (
                  <a href="/admin" className="text-red-700 hover:text-red-900">
                    Admin
                  </a>
                )}
                  <button
                    onClick={onLogout}
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Logout
                  </button>
                  <a href="/profile">
                    <img
                      src="/user-avatar.png"
                      alt="User Avatar"
                      className="h-6 w-6 rounded-full cursor-pointer hover:opacity-80"
                    />
                  </a>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-700 hover:text-gray-900">
                  Login
                </a>
                <a href="/register" className="text-gray-700 hover:text-gray-900">
                  Register
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
