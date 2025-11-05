import { useEffect, useState } from 'react';
import { activityAPI } from '../../api';
import { currencyUtils } from '../../utils/currencyUtils';
import { formatCondition } from '../../utils/formatUtils';
import RecommendIcon from '@mui/icons-material/Recommend';
import FavoriteIcon from '@mui/icons-material/Favorite';
import VisibilityIcon from '@mui/icons-material/Visibility';

function ProductRecommendations({ productId, limit = 5 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!productId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await activityAPI.getProductRecommendations(productId, limit);
        setRecommendations(response.recommendations || []);
      } catch (err) {
        console.error('Error fetching product recommendations:', err);
        setError(err.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [productId, limit]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">You Might Also Like</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {recommendations.map((product) => (
          <a
            key={product.id}
            href={`/products/${product.id}`}
            className="block group"
          >
            <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <RecommendIcon fontSize="large" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-600 mb-1">
                  {product.title}
                </h3>
                <p className="text-blue-600 font-bold text-sm mb-1">
                  {Number(product.price_amount) % 1 === 0
                    ? Number(product.price_amount)
                    : Number(product.price_amount).toFixed(2)
                  } {currencyUtils.getCurrencySymbol(product.price_currency)}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {formatCondition(product.condition)}
                </p>
                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <FavoriteIcon fontSize="inherit" />
                    {product.likes_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <VisibilityIcon fontSize="inherit" />
                    {product.views_count}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default ProductRecommendations;
