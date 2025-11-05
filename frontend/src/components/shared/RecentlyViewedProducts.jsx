import { useEffect, useState } from 'react';
import { activityAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { currencyUtils } from '../../utils/currencyUtils';
import { formatUtils } from '../../utils/formatUtils';
import VisibilityIcon from '@mui/icons-material/Visibility';

function ViewHistory({ limit = 5, currentProductId = null }) {
  const { user } = useAuth();
  const [viewHistory, setViewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchViewHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await activityAPI.getViewHistory(20);
        let items = response.items || [];
        
        // Filter out current product if provided
        if (currentProductId) {
          items = items.filter(item => item.product_id !== parseInt(currentProductId));
        }
        
        // Limit to specified number
        items = items.slice(0, limit);
        
        setViewHistory(items);
      } catch (err) {
        console.error('Error fetching view history:', err);
        setError(err.message || 'Failed to load view history');
      } finally {
        setLoading(false);
      }
    };

    fetchViewHistory();
  }, [user, limit, currentProductId]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Recently Viewed Products</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {viewHistory.map((item, index) => (
          <a
            key={`${item.product_id}-${index}`}
            href={`/products/${item.product_id}`}
            className="block group"
          >
            <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <VisibilityIcon fontSize="large" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-blue-600 mb-1">
                  {item.title}
                </h3>
                <p className="text-blue-600 font-bold text-sm mb-1">
                  {Number(item.price_amount) % 1 === 0
                    ? Number(item.price_amount)
                    : Number(item.price_amount).toFixed(2)
                  } {currencyUtils.getCurrencySymbol(item.price_currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUtils.timeAgo(item.viewed_at)}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default ViewHistory;
