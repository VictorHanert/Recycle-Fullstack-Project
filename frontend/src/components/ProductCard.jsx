function ProductCard({ product, onClick }) {
    return (
        <div 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onClick && onClick(product)}
        >
            <img
                src={product.images?.[0]?.url || "https://placehold.co/600x400.png"}
                alt={product.title}
                className="w-full h-48 object-cover"
            />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-blue-600">
                        ${product.price_amount}
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs ${
                        product.is_sold 
                            ? 'bg-red-100 text-red-800' 
                            : ''
                    }`}>
                        {product.is_sold ? 'Sold' : ''}
                    </span>
                </div>
                
                <div className="text-gray-600 text-sm mb-3 flex-grow">
                    <p>Owner: {product.seller?.username || 'Unknown'}</p>
                    <p>Location: {product.location ? `${product.location.city}, ${product.location.postcode}` : 'Unknown'}</p>
                    {product.likes_count !== undefined && <p>Likes: {product.likes_count}</p>}
                </div>

                <div className="mt-auto">
                    <button 
                        className={`w-full py-2 px-4 rounded font-medium ${
                            product.is_sold
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={product.is_sold}
                    >
                        {product.is_sold ? 'Sold' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
