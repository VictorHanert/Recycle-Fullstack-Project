import { useAuth } from "../hooks/useAuth";

function Profile({ user: propUser }) {
  const { user } = useAuth();
  
  // Use auth context user or prop user for flexibility
  const currentUser = user || propUser;

  return (
    <div className="px-4 mb-48">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
        <p className="text-lg text-gray-600">
          Profile for: {currentUser?.name || currentUser?.email}!
        </p>
      </div>
    </div>
  );
}

export default Profile;