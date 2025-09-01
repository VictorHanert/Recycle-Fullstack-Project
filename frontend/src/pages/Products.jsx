import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";

function Products() {
  const navigate = useNavigate();

  // Mock products data - in real app, this would come from API
  const [products] = useState([
    {
      id: 1,
      name: "Wireless Bluetooth Headphones",
      owner: "John Doe",
      location: "København V",
      price: 45,
      description:
        "High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals who need crystal-clear audio quality.",
      image: "https://placehold.co/600x400.png",
      sold: false,
      likes: 2,
    },
    {
      id: 2,
      name: "Smart Watch Series 8",
      owner: "Jane Smith",
      location: "Aarhus",
      price: 299,
      description:
        "The latest Smart Watch with health tracking, GPS, and customizable watch faces.",
      image: "https://placehold.co/600x400.png",
      sold: false,
      likes: 5,
    }
  ]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-lg text-gray-600">
          Discover our carefully curated selection of tech products and accessories.
        </p>
      </div>

      {/* Filter/Search Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select className="px-1 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="accessories">Clothing</option>
          <option value="audio">Furnitures</option>
        </select>
        <select className="px-1 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="">Sort by</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={handleProductClick}
          />
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-12">
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Load More Products
        </button>
      </div>
    </div>
  );
}

export default Products;
