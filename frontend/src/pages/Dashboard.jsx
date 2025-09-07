import { useAuth } from "../hooks/useAuth";

function Dashboard({ user: propUser }) {
  const { user } = useAuth();
  
  // Use auth context user or prop user for flexibility
  const currentUser = user || propUser;

  return (
    <div className="px-4 mb-48">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-lg text-gray-600">
          Welcome back, <span className="font-semibold">{currentUser?.full_name || currentUser?.username}</span>!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-3 lg:gap-6">
        {user.is_admin ? (
          <div className="bg-white p-6 rounded-lg shadow border-2 border-red-200 md:col-span-3">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Admin Panel</h3>
            <p className="text-gray-600 mb-4">Access administrative features and controls.</p>
            <button 
              onClick={() => window.location.href = '/admin'}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go to Admin →
            </button>
          </div>
        ) : (
        <>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">Profile</h3>
            <p className="text-gray-600 mb-4">Manage your account settings and preferences.</p>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="text-blue-600 hover:text-blue-800"
            >
              Go to Profile →
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">Last viewed</h3>
            <p className="text-gray-600 mb-4">This is the last products you viewed.</p>
            <button className="text-blue-600 hover:text-blue-800">View History →</button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">Wishlist</h3>
            <p className="text-gray-600 mb-4">Keep track of products you want to buy.</p>
            <button className="text-blue-600 hover:text-blue-800">View Wishlist →</button>
          </div>
        </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
