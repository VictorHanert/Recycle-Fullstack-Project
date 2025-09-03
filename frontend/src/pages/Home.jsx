import { Link } from "react-router-dom";
import Button from "@mui/material/Button";

function Home() {
  return (
    <div className="px-4">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to MyMarketplace</h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover and browse our collection of used items at the best prices.
        </p>
        <div className="space-x-4">
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to="/products"
            sx={{ px: 4, py: 1.5 }}
          >
            Shop Now
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            component={Link}
            to="/register"
            sx={{ px: 4, py: 1.5 }}
          >
            Sign Up
          </Button>
        </div>
      </div>
      
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2">Electronics</h3>
          <p className="text-gray-600">Find quality used phones, laptops, gaming consoles and other electronics at great prices.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">👕</div>
          <h3 className="text-xl font-semibold mb-2">Clothes</h3>
          <p className="text-gray-600">Discover pre-loved fashion items, designer pieces and everyday wear for all styles.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-4">🪑</div>
          <h3 className="text-xl font-semibold mb-2">Furniture</h3>
          <p className="text-gray-600">Browse used furniture pieces to furnish your home with unique and affordable finds.</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Shopping?</h2>
        <p className="text-gray-600 mb-6">
          Join us today and explore our wide range of used items tailored to your needs.
        </p>
        <Button
          variant="contained"
          color="primary"
          size="large"
          component={Link}
          to="/products"
          sx={{ px: 4, py: 1.5 }}
        >
          Browse Products →
        </Button>
      </div>
    </div>
  );
}

export default Home;
