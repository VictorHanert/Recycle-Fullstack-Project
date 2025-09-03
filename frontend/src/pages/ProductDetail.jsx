import { useParams } from "react-router-dom";
import { useFetch } from "../hooks/useFetch";

function ProductDetail() {
  const { id } = useParams();
  const { data: product, loading, error } = useFetch(`/api/products/${id}`);

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

  return (
    <div className="px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img
              src={product.images?.[0]?.url || "https://placehold.co/600x400.png"}
              alt={product.title}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
            
            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-blue-600">${product.price_amount}</span>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm ${
                product.is_sold
                  ? 'bg-red-100 text-red-800'
                  : ''
              }`}>
                {product.is_sold ? 'Sold' : ''}
              </span>
            </div>
            
            <div className="mb-6 space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Owner:</span> {product.seller?.username || 'Unknown'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Location:</span> {product.location ? `${product.location.city}, ${product.location.postcode}` : 'Unknown'}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Condition:</span> {product.condition}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Likes:</span> {product.likes_count}
              </p>
            </div>
            
            <p className="text-gray-700 mb-6">{product.description}</p>
            
            <div className="space-y-3">
              <button 
                disabled={product.is_sold}
                className={`w-full py-3 px-6 rounded-lg font-semibold ${
                  product.is_sold
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {product.is_sold ? 'Sold' : 'Add to Cart'}
              </button>
              
              <button className="w-full py-3 px-6 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
                Like ({product.likes_count})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
