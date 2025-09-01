import { useParams } from "react-router-dom";

function ProductDetail() {
  const { id } = useParams();

  // Mock product data - in real app, fetch based on id
  const product = {
    id: id || "1",
    name: "Wireless Bluetooth Headphones",
    owner: "John Doe",
    location: "København V",
    price: 45,
    description: "High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals who need crystal-clear audio quality.",
    image: "https://placehold.co/600x400.png",
    sold: false,
    likes: 2
  };

  return (
    <div className="px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-blue-600">${product.price}</span>
              <span className={`ml-4 px-3 py-1 rounded-full text-sm ${
                product.sold
                  ? 'bg-red-100 text-red-800'
                  : ''
              }`}>
                {product.sold ? 'Sold' : ''}
              </span>
            </div>
            
            
            <p className="text-gray-700 mb-6">{product.description}</p>
            
            <div className="space-y-3">
              <button 
                disabled={product.sold}
                className={`w-full py-3 px-6 rounded-lg font-semibold ${
                  product.sold
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {product.sold ? 'Sold' : 'Add to Cart'}
              </button>
              
              <button className="w-full py-3 px-6 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
                Like
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
