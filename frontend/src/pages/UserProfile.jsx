import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { currencyUtils } from "../utils/currencyUtils";
import { formatCondition } from "../utils/formatUtils";
import Alert from "../components/shared/Alert";
import { useAlert } from "../hooks/useAlert";
import { PageLoader } from "../components/shared/LoadingSpinners";

function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  
  const { data: profileData, loading: profileLoading, error: profileError } = useFetch(
    userId ? `/api/profile/${userId}` : null
  );
  
  const { data: userProducts, loading: productsLoading, error: productsError } = useFetch(
    userId ? `/api/profile/${userId}/products` : null
  );

  const { alertState, showInfo, closeAlert } = useAlert();

  const loading = profileLoading || productsLoading;
  const error = profileError || productsError;
  const isOwnProfile = user && user.id === parseInt(userId || 0);

  if (loading || error) {
    return (
      <div className="px-4 mb-48">
        {loading ? (
          <PageLoader message="Loading profile..." />
        ) : (
          <div className="text-center py-8">
            <div className="text-red-600 text-lg">{error}</div>
          </div>
        )}
      </div>
    );
  }

  const handleSendMessage = () => {
    showInfo('Send Message', 'Message functionality would be implemented here. You would be able to send a message to the seller.');
  };

  return (
    <>
      <div className="px-4 mb-48">
        <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {profileData?.username || 'User'}'s Profile
            {isOwnProfile && <span className="text-blue-600 ml-2">(You)</span>}
          </h1>
          {profileData && (
            <p className="text-lg text-gray-600">
              Member since {new Date(profileData.created_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Public Profile Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-2">
            <p><strong>Username:</strong> {profileData?.username || 'Loading...'}</p>
            {profileData?.full_name && (
              <p><strong>Name:</strong> {profileData.full_name}</p>
            )}
            {profileData?.location && (
              <p><strong>Location:</strong> {profileData.location.city}, {profileData.location.postcode}</p>
            )}
          </div>
        </div>

        {/* User Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Active Products ({userProducts?.length || 0})
          </h2>
          {userProducts?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">
                    {Number(product.price_amount) % 1 === 0
                      ? Number(product.price_amount)
                      : Number(product.price_amount).toFixed(2)
                    } {currencyUtils.getCurrencySymbol(product.price_currency)}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    Condition: {formatCondition(product.condition)}
                  </p>
                  {product.location && (
                    <p className="text-sm text-gray-500">
                      Location: {product.location.city}, {product.location.postcode}
                    </p>
                  )}
                  <div className="mt-2">
                    <a
                      href={`/products/${product.id}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active products found</p>
          )}
        </div>

        {/* Contact Information (if viewing someone else's profile) */}
        {!isOwnProfile && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Contact Seller {profileData.full_name || profileData.username}</h2>
            <p className="text-blue-700 mb-4">
              Interested in {profileData.full_name || profileData.username}'s products?
            </p>
            <button 
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Send Message
            </button>
          </div>
        )}

        {/* Link to own profile management */}
        {isOwnProfile && (
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h2 className="text-xl font-semibold text-green-800 mb-4">Manage Your Profile</h2>
            <p className="text-green-700 mb-4">
              This is how your profile appears to other users.
            </p>
            <a
              href="/profile"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
            >
              Edit Profile
            </a>
          </div>
        )}
      </div>
    </div>

    <Alert
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      confirmText={alertState.type === 'error' ? 'OK' : 'Confirm'}
      showCancel={alertState.type !== 'error' && alertState.type !== 'info'}
    />
    </>
  );
}

export default UserProfile;