import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { profileAPI } from "../api";
import { productsAPI } from "../api";
import { currencyUtils } from "../utils/currencyUtils";
import Alert from "../components/shared/Alert";
import { useAlert } from "../hooks/useAlert";
import { PageLoader } from "../components/shared/LoadingSpinners";
import { notify } from "../utils/notifications";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddLocationIcon from '@mui/icons-material/AddLocation';

function Profile() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [locationData, setLocationData] = useState({
    city: '',
    postcode: ''
  });

  const { alertState, showConfirm, showError, closeAlert } = useAlert();

  // Use auth context user for own profile
  const currentUser = user;

  useEffect(() => {
    if (user && token) {
      fetchProfile();
      fetchUserProducts();
    }
  }, [user, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await profileAPI.getMyProfile(token);
      setProfileData(profile);
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      });
      if (profile.location) {
        setLocationData({
          city: profile.location.city || '',
          postcode: profile.location.postcode || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const products = await profileAPI.getMyProducts({}, token);
      setUserProducts(products);
    } catch (err) {
      console.error('Products fetch error:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending profile update data:', formData); // Debug log
      const updatedProfile = await profileAPI.updateMyProfile(formData, token);
      setProfileData(updatedProfile);
      setIsEditing(false);
      setError(null);
      notify.success('Profile updated successfully!');
    } catch (err) {
      const errorMessage = `Failed to update profile: ${err.message}`;
      setError(errorMessage);
      notify.error(errorMessage);
      console.error('Profile update error:', err);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = await profileAPI.addMyLocation(locationData, token);
      setProfileData(updatedProfile);
      setIsEditingLocation(false);
      setError(null);
      notify.success('Location updated successfully!');
    } catch (err) {
      const errorMessage = 'Failed to update location';
      setError(errorMessage);
      notify.error(errorMessage);
      console.error('Location update error:', err);
    }
  };

  const handleRemoveLocation = async () => {
    try {
      const updatedProfile = await profileAPI.removeMyLocation(token);
      setProfileData(updatedProfile);
      setLocationData({ city: '', postcode: '' });
      setError(null);
      notify.success('Location removed successfully!');
    } catch (err) {
      const errorMessage = 'Failed to remove location';
      setError(errorMessage);
      notify.error(errorMessage);
      console.error('Location remove error:', err);
    }
  };

  const handleDeleteAccount = async () => {
    showConfirm(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      async () => {
        try {
          await profileAPI.deleteMyAccount(token);
          // Redirect to home or logout
          window.location.href = '/';
          notify.success('Account deleted successfully');
        } catch (err) {
          const errorMessage = 'Failed to delete account';
          setError(errorMessage);
          notify.error(errorMessage);
          console.error('Account delete error:', err);
          showError('Error', 'Failed to delete account. Please try again.');
        }
      }
    );
  };

  const handleDeleteProduct = async (productId) => {
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      async () => {
        try {
          await productsAPI.delete(productId);
          notify.success('Product deleted successfully');
          // Refresh the products list
          fetchUserProducts();
        } catch (err) {
          console.error('Error deleting product:', err);
          notify.error('Failed to delete product. Please try again.');
          showError('Error', 'Failed to delete product. Please try again.');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="px-4 mb-48">
        <PageLoader message="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 mb-48">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 mb-48">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
            <p className="text-lg text-gray-600">
              Manage your account settings and personal information.
            </p>
          </div>        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                <EditIcon fontSize="small" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                >
                  <SaveIcon fontSize="small" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                >
                  <CancelIcon fontSize="small" />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p><strong>Username:</strong> {profileData?.username}</p>
              <p><strong>Full Name:</strong> {profileData?.full_name || 'Not provided'}</p>
              <p><strong>Email:</strong> {profileData?.email}</p>
              <p><strong>Phone:</strong> {profileData?.phone || 'Not provided'}</p>
            </div>
          )}
        </div>

        {/* Location Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Location</h2>
            {!isEditingLocation && (
              <button
                onClick={() => setIsEditingLocation(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              >
                {profileData?.location ? (
                  <>
                    <EditIcon fontSize="small" />
                    Edit
                  </>
                ) : (
                  <>
                    <AddLocationIcon fontSize="small" />
                    Add Location
                  </>
                )}
              </button>
            )}
          </div>

            {isEditingLocation ? (
              <form onSubmit={handleUpdateLocation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={locationData.city}
                    onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postcode</label>
                  <input
                    type="text"
                    value={locationData.postcode}
                    onChange={(e) => setLocationData({...locationData, postcode: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                  >
                    <SaveIcon fontSize="small" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center gap-2"
                  >
                    <CancelIcon fontSize="small" />
                    Cancel
                  </button>
                  {profileData?.location && (
                    <button
                      type="button"
                      onClick={handleRemoveLocation}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                    >
                      <DeleteIcon fontSize="small" />
                      Remove Location
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div>
                {profileData?.location ? (
                  <p>{profileData.location.city}, {profileData.location.postcode}</p>
                ) : (
                  <p className="text-gray-500">No location set</p>
                )}
              </div>
            )}
          </div>
        

        {/* User Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            My Products ({userProducts.length})
          </h2>
          {userProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold">{product.title}</h3>
                  <p className="text-gray-600">{product.price_amount} {currencyUtils.getCurrencySymbol(product.price_currency)}</p>
                  <p className="text-sm text-gray-500">Status: {product.status}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <a href={`/products/${product.id}/edit`} className="text-blue-500 hover:underline text-sm flex items-center gap-1">
                      <EditIcon fontSize="small" />
                      Edit
                    </a>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:underline text-sm flex items-center gap-1">
                      <DeleteIcon fontSize="small" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No products found</p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Danger Zone</h2>
          <p className="text-red-700 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
          >
            <DeleteIcon fontSize="small" />
            Delete Account
          </button>
        </div>
      </div>
    </div>

    <Alert
      isOpen={alertState.isOpen}
      onClose={closeAlert}
      onConfirm={alertState.onConfirm}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      confirmText={alertState.type === 'error' ? 'OK' : 'Delete'}
      showCancel={alertState.type !== 'error'}
    />
    </>
  );
}

export default Profile;