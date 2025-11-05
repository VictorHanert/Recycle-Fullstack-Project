import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { productsAPI } from "../api";
import { currencyUtils } from "../utils/currencyUtils";
import Alert from "../components/shared/Alert";
import { useAlert } from "../hooks/useAlert";
import { notify } from "../utils/notifications";
import { CardLoader } from "../components/shared/LoadingSpinners";
import ViewHistory from "../components/shared/RecentlyViewedProducts";
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function Dashboard() {
  const { user, logout } = useAuth();
  const { data: userProducts, loading, error, refetch } = useFetch(
    user ? `/api/profile/${user.id}/products` : null
  );
  const { alertState, showConfirm, showError, closeAlert } = useAlert();

  const handleDeleteProduct = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      async () => {
        try {
          await productsAPI.delete(productId);
          notify.success("Product deleted successfully");
          // Refresh the products list after deletion
          refetch();
        } catch (err) {
          console.error('Error deleting product:', err);
          notify.error("Failed to delete product. Please try again.");
          showError('Error', 'Failed to delete product. Please try again.');
        }
      }
    );
  };  return (
    <>
      <div className="px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-lg text-gray-600">
            Welcome back, <span className="font-semibold">{user?.full_name || user?.username}</span>!
          </p>
        </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-3 lg:gap-6">
        {user.is_admin ? (
          <div className="bg-white p-6 rounded-lg shadow border-2 border-red-200 md:col-span-3">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Admin Panel</h3>
            <p className="text-gray-600 mb-4">Access administrative features and controls.</p>
            <button 
              onClick={() => window.location.href = '/admin'}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
            >
              <AdminPanelSettingsIcon fontSize="small" />
              Go to Admin <ArrowForwardIcon fontSize="small" />
            </button>
          </div>
        ) : (
        <>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <PersonIcon />
              Profile
            </h3>
            <p className="text-gray-600 mb-4">Manage your account settings and personal information.</p>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Go to Profile <ArrowForwardIcon fontSize="small" />
            </button>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <MessageIcon />
              Messages
            </h3>
            <p className="text-gray-600 mb-4">View and manage your conversations with other users.</p>
            <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View Messages <ArrowForwardIcon fontSize="small" />
            </button>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <FavoriteIcon />
              Favorites
            </h3>
            <p className="text-gray-600 mb-4">Browse and manage your saved favorite products.</p>
            <button 
              onClick={() => window.location.href = '/favorites'}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View Favorites <ArrowForwardIcon fontSize="small" />
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <DirectionsBikeIcon />
              Marketplace
            </h3>
            <p className="text-gray-600 mb-4">Explore bikes and accessories from our community.</p>
            <button 
              onClick={() => window.location.href = '/products'}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Browse Products <ArrowForwardIcon fontSize="small" />
            </button>
          </div>

          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2 text-blue-600 flex items-center gap-2">
              <AddCircleOutlineIcon />
              Sell Products
            </h3>
            <p className="text-gray-600 mb-4">List your bike or accessories for sale on the marketplace.</p>
            <button 
              onClick={() => window.location.href = '/create-product'}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Create Listing <ArrowForwardIcon fontSize="small" />
            </button>
          </div>

          <button 
            onClick={logout}
            className="bg-white p-3 rounded-lg shadow hover:shadow-md transition-shadow text-left w-full"
          >
            <h3 className="text-xl font-semibold mb-2 text-red-600 flex items-center gap-2">
              <LogoutIcon />
              Log Out
            </h3>
            <p className="text-gray-600 mb-4">Sign out of your account securely.</p>
          </button>
        </>
        )}
      </div>

      {/* User Products */}
        <div className="bg-white rounded-lg shadow p-6 my-10">
          <h2 className="text-xl font-semibold mb-4">
            My Products ({userProducts?.length || 0})
          </h2>
          
          {loading ? (
            <CardLoader message="Loading your products..." />
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">Error loading products: {error}</div>
              <button 
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : userProducts && userProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <a href={`/products/${product.id}`} className="font-semibold hover:underline">{product.title}</a>
                  <p className="text-gray-600">{product.price_amount} {currencyUtils.getCurrencySymbol(product.price_currency)}</p>
                  <p className="text-sm text-gray-500">Status: {product.status}</p>
                  <hr className="my-1" />
                    <div className="flex items-center gap-3">
                        <a href={`/products/${product.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-blue-500">
                        <EditIcon fontSize="x-small" />
                      </a>
                      <button onClick={(e) => handleDeleteProduct(e, product.id)} className="text-red-500">
                        <DeleteIcon fontSize="x-small" />
                      </button>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No products found</p>
          )}
        </div>

      {/* View History Section */}
      <div className="my-10">
        <ViewHistory />
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

export default Dashboard;
