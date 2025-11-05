import { useEffect, useState } from 'react';
import { activityAPI } from '../../api';
import { formatUtils } from '../../utils/formatUtils';
import { CardLoader } from '../shared/LoadingSpinners';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function RecentActivity() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const response = await activityAPI.getRecentActivityFeed(5);
        setActivityData(response);
      } catch (err) {
        console.error('Error fetching recent activity:', err);
        setError(err.message || 'Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return <CardLoader message="Loading recent activity..." />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <TrendingUpIcon className="text-blue-600" fontSize="large" />
        <h2 className="text-2xl font-bold text-gray-900">Recent Platform Activity</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* Recent User Signups */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <PersonAddIcon className="text-green-600" />
            <h3 className="text-lg font-semibold">Recent Signups</h3>
          </div>
          {activityData?.recent_signups?.length > 0 ? (
            <div className="space-y-3">
              {activityData.recent_signups.map((signup) => (
                <div key={signup.user_id} className="border-b pb-3 last:border-b-0">
                  <a href={`/user/${signup.user_id}`} className="font-medium text-gray-900">{signup.username}</a>
                  <div className="text-sm text-gray-600 truncate">{signup.email}</div>
                  {signup.full_name && (
                    <div className="text-sm text-gray-500">{signup.full_name}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {formatUtils.timeAgo(signup.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent signups</p>
          )}
        </div>

        {/* Recent Product Creations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <AddShoppingCartIcon className="text-blue-600" />
            <h3 className="text-lg font-semibold">Recent Products</h3>
          </div>
          {activityData?.recent_products?.length > 0 ? (
            <div className="space-y-3">
              {activityData.recent_products.map((product) => (
                <div key={product.product_id} className="border-b pb-3 last:border-b-0">
                  <a
                    href={`/products/${product.product_id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {product.title}
                  </a>
                  <div className="text-sm text-gray-600 truncate">
                    by {product.seller_username}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatUtils.timeAgo(product.created_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent products</p>
          )}
        </div>

        {/* Recent Favorites */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FavoriteIcon className="text-red-600" />
            <h3 className="text-lg font-semibold">Recent Favorites</h3>
          </div>
          {activityData?.recent_favorites?.length > 0 ? (
            <div className="space-y-3">
              {activityData.recent_favorites.map((favorite, index) => (
                <div key={`${favorite.product_id}-${index}`} className="border-b pb-3 last:border-b-0">
                  <div className="font-medium text-gray-900">{favorite.username}</div>
                  <div className="text-sm text-gray-600">liked</div>
                  <a
                    href={`/products/${favorite.product_id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {favorite.title}
                  </a>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatUtils.timeAgo(favorite.favorited_at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent favorites</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentActivity;