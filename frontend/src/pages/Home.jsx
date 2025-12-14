import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PopularProducts from "../components/shared/PopularProducts";

function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-12">
      {/* Hero Section */}
      <div className="mb-12 sm:mb-16 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
          Welcome to ReCycle
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
          The marketplace for pre-owned bicycles. Find your perfect ride or give
          your bike a new life with our cycling community.
        </p>
        <div className="flex flex-row gap-4 justify-center">
          <Link to="/products">
            <button className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-medium rounded hover:bg-blue-700 transition">
              Browse Bikes
            </button>
          </Link>
          {!isAuthenticated ? (
            <Link to="/register">
              <button className="border border-blue-600 text-blue-600 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-medium rounded hover:bg-blue-600 hover:text-white transition">
                Join ReCycle
              </button>
            </Link>
          ) : (
            <Link to="/dashboard">
              <button className="border border-blue-600 text-blue-600 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-medium rounded hover:bg-blue-600 hover:text-white transition">
                My Dashboard
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-12">
        <Link to="/products?category=Road+Bikes" className="group">
          <div className="bg-[url('/images/racing-bike.jpg')] bg-cover bg-center bg-no-repeat rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-48 md:h-72 relative">
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex flex-col justify-start md:justify-end">
              <h3 className="text-lg font-semibold m-3 text-white text-center hidden md:block">
                Road Bikes
              </h3>
              <p className="text-xs lg:text-base m-3 text-gray-200 text-center flex-grow hidden md:block">
                Premium road bikes for speed enthusiasts. From budget-friendly
                to professional racing bikes.
              </p>
              <div className="my-3 text-white text-xs md:text-base font-medium text-center group-hover:text-blue-100 sm:whitespace-nowrap">
                Road Bikes →
              </div>
            </div>
          </div>
        </Link>

        <Link to="/products?category=Mountain+Bikes" className="group">
          <div className="bg-[url('/images/mountain-bike.jpg')] bg-cover bg-center bg-no-repeat rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-48 md:h-72 relative">
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex flex-col justify-start md:justify-end">
              <h3 className="text-lg font-semibold m-3 text-white text-center hidden md:block">
                Mountain Bikes
              </h3>
              <p className="text-xs lg:text-base m-3 text-gray-200 text-center flex-grow hidden md:block">
                Trail-ready mountain bikes for adventure seekers. Full
                suspension, hardtail, and entry-level options.
              </p>
              <div className="my-3 text-white text-xs md:text-base font-medium text-center group-hover:text-blue-100 sm:whitespace-nowrap">
                Mountain Bikes →
              </div>
            </div>
          </div>
        </Link>

        <Link to="/products?category=Electric+Bikes" className="group">
          <div className="bg-[url('/images/city-bike.jpg')] bg-cover bg-center bg-no-repeat rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 border border-gray-100 h-48 md:h-72 relative">
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex flex-col justify-start md:justify-end">
              <h3 className="text-lg font-semibold m-3 text-white text-center hidden md:block">
                City & E-Bikes
              </h3>
              <p className="text-xs lg:text-base m-3 text-gray-200 text-center flex-grow hidden md:block">
                Perfect for daily commuting and city rides. Including electric
                bikes for effortless cycling.
              </p>
              <div className="my-3 text-white text-xs md:text-base font-medium text-center group-hover:text-blue-100 sm:whitespace-nowrap">
                City Bikes →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Popular Products Section */}
      <div className="my-12">
        <PopularProducts limit={5} />
      </div>

      {/* Blue Container Section */}
      <div className="bg-blue-600 rounded-xl p-6 sm:p-8 md:p-10 lg:p-12 text-center text-white">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
          Ready to Join the ReCycle Community?
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
          {isAuthenticated
            ? "Discover amazing bikes or list your own to help it find a new cycling enthusiast."
            : "Join cycling enthusiasts buying and selling quality pre-owned bicycles."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/products">
            <button className="bg-white text-blue-600 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-medium rounded hover:bg-gray-100 transition">
              Browse Bikes →
            </button>
          </Link>
          {isAuthenticated && (
            <Link to="/dashboard">
              <button className="border border-white text-white px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base md:text-lg font-medium rounded hover:bg-white hover:bg-opacity-10 transition">
                List Your Bike
              </button>
            </Link>
          )}
        </div>
        <button

      onClick={() => {
        throw new Error('This is your first error!');
      }}
    >
      Break the world
    </button>
      </div>
    </div>
  );
}

export default Home;
