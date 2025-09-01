import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="px-4">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MyMarketplace</h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover and browse our collection of products to the best prices.
        </p>
        <div className="space-x-4">
          <Link
            to="/products"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Shop Now
          </Link>
          <Link
            to="/register"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-block"
          >
            Sign Up
          </Link>
        </div>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">🎧</div>
          <h3 className="text-xl font-semibold mb-2">Premium Audio</h3>
          <p className="text-gray-600">High-quality headphones and speakers for the ultimate audio experience.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">⌚</div>
          <h3 className="text-xl font-semibold mb-2">Smart Devices</h3>
          <p className="text-gray-600">Stay connected with our range of smart watches and fitness trackers.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">💻</div>
          <h3 className="text-xl font-semibold mb-2">Tech Accessories</h3>
          <p className="text-gray-600">Essential accessories to enhance your tech setup and productivity.</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Shopping?</h2>
        <p className="text-gray-600 mb-6">
          Join us today and explore our wide range of products tailored to your needs.
        </p>
        <Link
          to="/products"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Browse Products →
        </Link>
      </div>
    </div>
  );
}

export default Home;
