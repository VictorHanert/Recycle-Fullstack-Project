interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  isLoggedIn: boolean;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  username?: string;
}

const Layout = ({ 
  children, 
  currentView, 
  onViewChange, 
  isLoggedIn, 
  isAdmin, 
  onLogin, 
  onLogout, 
  username 
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              MyMarketplace
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <div className="flex space-x-1">
                <button
                  onClick={() => onViewChange('status')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'status'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Status
                </button>
                <button
                  onClick={() => onViewChange('items')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'items'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Items
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onViewChange('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </div>

              {/* Login/Logout */}
              <div className="flex items-center space-x-3">
                {isLoggedIn ? (
                  <>
                    <span className="text-sm text-gray-600">
                      Welcome, {username}
                      {isAdmin && <span className="text-red-600 font-medium"> (Admin)</span>}
                    </span>
                    <button
                      onClick={onLogout}
                      className="px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onLogin}
                    className="px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
