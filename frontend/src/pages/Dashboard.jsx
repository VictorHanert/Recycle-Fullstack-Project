import { useAuth } from "../hooks/useAuth";
import { useFetch } from "../hooks/useFetch";
import { productsAPI } from "../api";
import { currencyUtils } from "../utils/currencyUtils";

function Dashboard() {
  const { user } = useAuth();
  const { data: userProducts, loading, error, refetch } = useFetch(
    user ? `/api/profile/${user.id}/products` : null
  );

  const handleDeleteProduct = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productsAPI.delete(productId);
        // Refresh the products list after deletion
        refetch();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  return (
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

      {/* User Products */}
        <div className="bg-white rounded-lg shadow p-6 my-10">
          <h2 className="text-xl font-semibold mb-4">
            My Products ({userProducts?.length || 0})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading your products...</div>
            </div>
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
                    <div className="mt-2">
                        <a href={`/products/${product.id}/edit`} onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:underline text-sm mr-2">
                        Edit
                      </a>
                      <button onClick={(e) => handleDeleteProduct(e, product.id)} className="text-red-500 hover:underline text-sm">
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
    </div>
  );
}

export default Dashboard;
