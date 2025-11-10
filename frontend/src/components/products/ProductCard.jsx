import { useState, useEffect } from 'react';
import { formatRelativeTime, formatCondition } from '../../utils/formatUtils';
import { currencyUtils } from '../../utils/currencyUtils';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useAuth } from '../../hooks/useAuth';
import { notify } from '../../utils/notifications';
import PriceHistoryDisplay from './PriceHistoryDisplay';

function ProductCard({ product, onClick, onFavoriteChange }) {
    const { user } = useAuth();
    const { isFavorite, toggleFavorite, checkFavoriteStatus } = useFavoritesStore();
    const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
    const [likesCount, setLikesCount] = useState(product.likes_count || 0);
    
    const isFav = isFavorite(product.id);

    // Check favorite status when component mounts
    useEffect(() => {
        if (user && product.id) {
            checkFavoriteStatus(product.id);
        }
    }, [user, product.id, checkFavoriteStatus]);

    // Update likes count when product prop changes
    useEffect(() => {
        setLikesCount(product.likes_count || 0);
    }, [product.likes_count]);

    const handleLike = async (e) => {
        e.stopPropagation(); // Prevent card click
        
        if (!user) {
            notify.info('Please log in to add favorites');
            return;
        }

        setIsLoadingFavorite(true);
        try {
            const newIsFavorite = await toggleFavorite(product.id);
            
            // Update local likes count optimistically
            setLikesCount(prev => newIsFavorite ? prev + 1 : Math.max(0, prev - 1));
            
            // Notify parent component if callback provided
            if (onFavoriteChange) {
                onFavoriteChange(product.id, newIsFavorite);
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        } finally {
            setIsLoadingFavorite(false);
        }
    };

    return (
        <div 
            className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onClick && onClick(product)}
        >
            {/* Like button */}
            <button 
                onClick={handleLike}
                disabled={isLoadingFavorite}
                className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                    isFav 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-white/80 hover:bg-white'
                } ${isLoadingFavorite ? 'opacity-50 cursor-not-allowed' : ''} shadow-md`}
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
                {isLoadingFavorite ? (
                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 ${isFav ? 'text-white' : 'text-gray-600'}`} 
                        fill={isFav ? 'currentColor' : 'none'} 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                )}
            </button>
            
            <img
                src={product.images?.[0]?.url || "https://placehold.co/600x400.png"}
                alt={product.title}
                className="w-full h-48 object-cover"
            />
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xl font-bold text-blue-600">
                        {Number(product.price_amount) % 1 === 0
                            ? Number(product.price_amount)
                            : Number(product.price_amount).toFixed(2)
                        } {currencyUtils.getCurrencySymbol(product.price_currency)}
                    </span>
                </div>
                <PriceHistoryDisplay 
                    product={product} 
                    oldPriceClassName="text-sm line-through text-gray-500"
                    discountClassName="text-green-600 text-xs font-medium"
                />
                <h3 className="text-md font-semibold text-gray-900 mb-1 truncate">
                    {product.title}
                    </h3>
                    <span className="text-sm text-gray-500 mb-1">
                        Condition: {formatCondition(product.condition)}
                    </span>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                
                <div className="text-gray-600 text-sm mt-auto border-t pt-2">
                    <p>{product.seller?.username ? (
                        <a 
                            href={`/user/${product.seller.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {product.seller.username}
                        </a>
                    ) : 'Unknown'}</p>
                    <div>
                        <span>{product.location ? `${product.location.city}` : ''}</span>
                        <span>{product.created_at ? `, ${formatRelativeTime(product.created_at)}` : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
