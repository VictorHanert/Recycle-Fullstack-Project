import { useParams, useNavigate } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { productsAPI } from "../api";
import { formatRelativeTime, formatCondition } from "../utils/formatUtils";
import { currencyUtils } from "../utils/currencyUtils";
import ImageSlider from "../components/ImageSlider";
import Alert from "../components/Alert";
import { useAlert } from "../hooks/useAlert";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, loading, error, refetch } = useFetch(`/api/products/${id}`);
  const { alertState, showConfirm, showError, showInfo, closeAlert } = useAlert();

  const isOwner = user && product && user.id === product.seller?.id;

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleDelete = async () => {
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      async () => {
        try {
          await productsAPI.delete(id);
          navigate('/products');
        } catch (err) {
          console.error('Error deleting product:', err);
          showError('Error', 'Failed to delete product. Please try again.');
        }
      }
    );
  };

  const handleMarkAsSold = async () => {
    try {
      await productsAPI.update(id, { is_sold: true });
      refetch(); // Refresh the product data
    } catch (err) {
      console.error('Error marking product as sold:', err);
      showError('Error', 'Failed to mark product as sold. Please try again.');
    }
  };

  const handleContactSeller = () => {
    showInfo('Contact Seller', 'Contact seller functionality would be implemented here');
  };

  const handleLike = () => {
    showInfo('Like Product', 'Like functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="px-4 flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error loading product: {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Product not found.</p>
        </div>
      </div>
    );
  }

  // Check if any details exist
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasMaterials = Array.isArray(product.materials) && product.materials.length > 0;
  const hasTags = Array.isArray(product.tags) && product.tags.length > 0;
  const hasDimensions = product.width_cm || product.height_cm || product.depth_cm;
  const hasWeight = product.weight_kg;
  const showDetails = hasColors || hasMaterials || hasTags || hasDimensions || hasWeight;

  return (
    <>
      <div className="px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <ImageSlider
              images={product.images}
              alt={product.title}
            />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>

            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-blue-600">
                  {Number(product.price_amount) % 1 === 0
                    ? Number(product.price_amount)
                    : Number(product.price_amount).toFixed(2)
                  } {currencyUtils.getCurrencySymbol(product.price_currency)}
              </span>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm ${
                product.is_sold
                  ? 'bg-red-100 text-red-800'
                  : ''
              }`}>
                {product.is_sold ? 'Sold' : ''}
              </span>
            </div>

            {/* Created/Updated time display */}
            <div className="mb-4 text-sm text-gray-500">
              {product.created_at && product.updated_at && product.created_at !== product.updated_at ? (
                `${formatRelativeTime(product.created_at)} (edited ${formatRelativeTime(product.updated_at)})`
              ) : (
                product.created_at ? formatRelativeTime(product.created_at) : ''
              )}
            </div>

            {/* Views and Favorites */}
            <div className="flex items-center gap-6 mb-4">
              <span className="text-gray-600"><b>Views:</b> {product.views_count ?? null}</span>
              <span className="text-gray-600"><b>Added to Favorites:</b> {product.favorites_count ?? null}</span>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Owner:</span> {product.seller?.username ? (
                  <a 
                    href={`/user/${product.seller.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                  >
                    {product.seller.username}
                  </a>
                ) : 'Unknown'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Location:</span> {product.location ? `${product.location.city}, ${product.location.postcode}` : 'Unknown'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Condition:</span> {formatCondition(product.condition)}
              </p>
            </div>

            {/* Details Section (only if at least one is present) */}
            {showDetails && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Details</h2>
                <div className="flex flex-wrap gap-4">
                  {hasColors && (
                    <div>
                      <span className="font-medium">Colors:</span> {product.colors.map((color) => color.name).join(', ')}
                    </div>
                  )}
                  {hasMaterials && (
                    <div>
                      <span className="font-medium">Materials:</span> {product.materials.map((mat) => mat.name).join(', ')}
                    </div>
                  )}
                  {hasTags && (
                    <div>
                      <span className="font-medium">Tags:</span> {product.tags.map((tag) => tag.name).join(', ')}
                    </div>
                  )}
                  {hasDimensions && (
                    <div>
                      <span className="font-medium">Dimensions:</span> {[
                        product.width_cm && `${product.width_cm}cm W`,
                        product.height_cm && `${product.height_cm}cm H`,
                        product.depth_cm && `${product.depth_cm}cm D`
                      ].filter(Boolean).join(' × ')}
                    </div>
                  )}
                  {hasWeight && (
                    <div>
                      <span className="font-medium">Weight:</span> {product.weight_kg}kg
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-gray-700 mb-6">{product.description}</p>

            {/* Action Buttons - Different for owners vs visitors */}
            <div className="space-y-3">
              {isOwner ? (
                // Owner actions
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleEdit}
                    className="py-1 px-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Edit Product
                  </button>

                  {!product.is_sold && (
                    <button
                      onClick={handleMarkAsSold}
                      className="py-1 px-2 rounded-lg font-semibold bg-white-600 text-blue-600 hover:bg-green-70 border border-blue-600"
                    >
                      Mark as Sold
                    </button>
                  )}

                  <button
                    onClick={handleDelete}
                    className="py-1 px-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Product
                  </button>
                </div>
              ) : (
                // Visitor actions
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleContactSeller}
                    disabled={product.is_sold}
                    className={`py-3 px-6 rounded-lg font-semibold ${
                      product.is_sold
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {product.is_sold ? 'Sold' : 'Contact Seller'}
                  </button>

                  <button
                    onClick={handleLike}
                    className="py-3 px-6 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Like ({product.likes_count || 0})
                  </button>
                </div>
              )}

              {/* Status indicator for sold products */}
              {product.is_sold && (
                <div className="text-center">
                  <span className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    This product has been sold
                  </span>
                </div>
              )}
            </div>
          </div>
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
      confirmText={alertState.type === 'error' ? 'OK' : 'Confirm'}
      showCancel={alertState.type !== 'error' && alertState.type !== 'info'}
    />
    </>
  );
}

export default ProductDetail;
