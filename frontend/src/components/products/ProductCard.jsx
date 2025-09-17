import { formatRelativeTime, formatCondition } from '../../utils/formatUtils';
import { currencyUtils } from '../../utils/currencyUtils';
import PriceHistoryDisplay from './PriceHistoryDisplay';

function ProductCard({ product, onClick }) {
    return (
        <div 
            className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onClick && onClick(product)}
        >
            {/* Like button */}
            <button className="absolute top-1 right-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="#6c6b6bff" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
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
                <h3 className="text-md font-semibold text-gray-900 mb-1">
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
