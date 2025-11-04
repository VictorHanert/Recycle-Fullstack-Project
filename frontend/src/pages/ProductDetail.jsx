import { useParams, useNavigate} from "react-router-dom";
import { useState, useEffect } from "react";
import { useFetch } from "../hooks/useFetch";
import { useAuth } from "../hooks/useAuth";
import { productsAPI, favoritesAPI } from "../api";
import { formatRelativeTime, formatCondition } from "../utils/formatUtils";
import { currencyUtils } from "../utils/currencyUtils";
import ImageSlider from "../components/products/ImageSlider";
import PriceHistoryDisplay from "../components/products/PriceHistoryDisplay";
import Alert from "../components/shared/Alert";
import { useAlert } from "../hooks/useAlert";
import { PageLoader } from "../components/shared/LoadingSpinners";
import { notify } from "../utils/notifications";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import MessageIcon from '@mui/icons-material/Message';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';


function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: product, loading, error, refetch } = useFetch(`/api/products/${id}`);
  const { alertState, showConfirm, showError, showInfo, closeAlert } = useAlert();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);

  const isOwner = user && product && user.id === product.seller?.id;

  // Check favorite status when product loads
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && product) {
        try {
          const response = await favoritesAPI.checkStatus(id);
          setIsFavorite(response.is_favorite);
        } catch (err) {
          // User not logged in or error checking status
          setIsFavorite(false);
        }
      }
    };
    checkFavoriteStatus();
  }, [user, product, id]);

  // Action handlers
  const handleEdit = () => navigate(`/products/${id}/edit`);

  const handleDelete = async () => {
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      async () => {
        try {
          await productsAPI.delete(id);
          notify.success('Product deleted successfully');
          navigate('/products');
        } catch (err) {
          console.error('Error deleting product:', err);
          notify.error('Failed to delete product. Please try again.');
          showError('Error', 'Failed to delete product. Please try again.');
        }
      }
    );
  };

  const handleProductStatus = async (newStatus) => {
    const statusMessages = {
      sold: 'mark product as sold',
      active: 'mark product as available'
    };

    try {
      await productsAPI.update(id, { status: newStatus });
      notify.success(`Product ${statusMessages[newStatus]} successfully`);
      refetch();
    } catch (err) {
      console.error(`Error ${statusMessages[newStatus]}:`, err);
      notify.error(`Failed to ${statusMessages[newStatus]}. Please try again.`);
      showError('Error', `Failed to ${statusMessages[newStatus]}. Please try again.`);
    }
  };

  const handleContactSeller = () => {
    if (product?.seller?.id) {
      navigate(`/messages/${product.seller.id}?productId=${product.id}`);
    } else {
      showError('Error', 'Seller information not available.');
    }
  };

  const handleLike = async () => {
    setIsLoadingFavorite(true);
    try {
      await favoritesAPI.toggle(id, isFavorite);
      setIsFavorite(!isFavorite);
      // Refetch product to update the favorites count
      refetch();
      
      notify.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      notify.error('Failed to update favorites. Please try again.');
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Compact loading/error states
  const renderLoadingState = (message) => (
    <div className="px-4">
      <PageLoader message={message} />
    </div>
  );

  const renderErrorState = (message) => (
    <div className="px-4">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {message}
      </div>
    </div>
  );

  if (loading) return renderLoadingState("Loading product...");
  if (error) return renderErrorState(`Error loading product: ${error}`);
  if (!product) return renderLoadingState("Product not found.");

  // Check if any details exist that should be displayed
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
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-blue-600">
                    {Number(product.price_amount) % 1 === 0
                      ? Number(product.price_amount)
                      : Number(product.price_amount).toFixed(2)
                    } {currencyUtils.getCurrencySymbol(product.price_currency)}
                </span>
                
                <PriceHistoryDisplay product={product} />
              </div>
              
              {product.status === 'sold' && (
                <span className="ml-4 px-3 py-1 rounded-full text-lg font-bold bg-red-100 text-red-800">
                  Sold
                </span>
              )}
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
              <span className="text-gray-600"><b>Added to Favorites:</b> {product.likes_count ?? null}</span>
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
                        product.width_cm && `(Width) ${product.width_cm}cm`,
                        product.height_cm && `(Height) ${product.height_cm}cm`,
                        product.depth_cm && `(Depth) ${product.depth_cm}cm`
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
                    className="p-1 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1"
                  >
                    <EditIcon fontSize="small" />
                    Edit Product
                  </button>

                  <button
                    onClick={() => handleProductStatus(product.status === 'sold' ? 'active' : 'sold')}
                    className="p-1 rounded-lg font-semibold bg-white-600 text-blue-600 hover:bg-green-70 border border-blue-600 flex items-center justify-center gap-1"
                  >
                    {product.status === 'sold' ? (
                      <>
                        <CheckCircleIcon fontSize="small" />
                        Mark as Available
                      </>
                    ) : (
                      <>
                        <PauseCircleIcon fontSize="small" />
                        Mark as Sold
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="p-1 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-1"
                  >
                    <DeleteIcon fontSize="small" />
                    Delete
                  </button>
                </div>
              ) : (
                // Visitor actions
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleContactSeller}
                    disabled={product.status === 'sold'}
                    className={`py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                      product.status === 'sold'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <MessageIcon fontSize="small" />
                    {product.status === 'sold' ? 'Sold' : 'Contact Seller'}
                  </button>

                  <button
                    onClick={handleLike}
                    disabled={isLoadingFavorite}
                    className={`py-3 px-6 rounded-lg font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      isFavorite
                        ? 'bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-100'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isLoadingFavorite ? (
                      'Loading...'
                    ) : (
                      <>
                        {isFavorite ? (
                          <FavoriteIcon fontSize="small" />
                        ) : (
                          <FavoriteBorderIcon fontSize="small" />
                        )}
                        {isFavorite ? 'Liked' : 'Like'} ({product.likes_count || 0})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Status indicator for sold products */}
              {product.status === 'sold' && (
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
