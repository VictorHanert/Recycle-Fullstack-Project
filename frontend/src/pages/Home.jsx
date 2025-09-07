import { Link } from "react-router-dom";
import Button from "@mui/material/Button";
import { useAuth } from "../hooks/useAuth";

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="px-4">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Welcome to ReCycle</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The marketplace for pre-owned bicycles. Find your perfect ride or give your bike a new life with our cycling community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            component={Link}
            to="/products"
            sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
          >
            Browse Bikes
          </Button>
          {!isAuthenticated ? (
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              component={Link}
              to="/register"
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              Join ReCycle
            </Button>
          ) : (
            <Button 
              variant="outlined" 
              color="primary" 
              size="large"
              component={Link}
              to="/dashboard"
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              My Dashboard
            </Button>
          )}
        </div>
      </div>
      
      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Link to="/products" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-blue-600 text-center">Road Bikes</h3>
            <p className="text-gray-600 text-center flex-grow">Premium road bikes for speed enthusiasts. From budget-friendly to professional racing bikes.</p>
            <div className="mt-6 text-blue-600 text-sm font-medium text-center group-hover:text-blue-700">Browse Road Bikes →</div>
          </div>
        </Link>
        
        <Link to="/products" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-blue-600 text-center">Mountain Bikes</h3>
            <p className="text-gray-600 text-center flex-grow">Trail-ready mountain bikes for adventure seekers. Full suspension, hardtail, and entry-level options.</p>
            <div className="mt-6 text-blue-600 text-sm font-medium text-center group-hover:text-blue-700">Browse Mountain Bikes →</div>
          </div>
        </Link>
        
        <Link to="/products" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 group-hover:text-blue-600 text-center">City & E-Bikes</h3>
            <p className="text-gray-600 text-center flex-grow">Perfect for daily commuting and city rides. Including electric bikes for effortless cycling.</p>
            <div className="mt-6 text-blue-600 text-sm font-medium text-center group-hover:text-blue-700">Browse City Bikes →</div>
          </div>
        </Link>
      </div>

      {/* Blue Container Section */}
      <div className="bg-blue-600 rounded-xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Join the ReCycle Community?</h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          {isAuthenticated 
            ? "Discover amazing bikes or list your own to help it find a new cycling enthusiast."
            : "Join cycling enthusiasts buying and selling quality pre-owned bicycles."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="contained"
            size="large"
            component={Link}
            to="/products"
            sx={{ 
              px: 6, 
              py: 2, 
              fontSize: '1.1rem',
              bgcolor: 'white', 
              color: 'primary.main',
              '&:hover': { bgcolor: 'grey.100' } 
            }}
          >
            Browse Bikes →
          </Button>
          {isAuthenticated && (
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/dashboard"
              sx={{ 
                px: 6, 
                py: 2, 
                fontSize: '1.1rem',
                color: 'white', 
                borderColor: 'white', 
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } 
              }}
            >
              List Your Bike
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
