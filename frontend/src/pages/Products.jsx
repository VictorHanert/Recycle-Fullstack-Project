import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Components
import ProductCard from "../components/products/ProductCard";
import ProductFilters from "../components/products/ProductFilters";
import Pagination from "../components/shared/Pagination";
import { PageLoader, InlineLoader } from "../components/shared/LoadingSpinners";

// API
import { productsAPI } from "../api";
import { notify } from "../utils/notifications";

function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Basic state
  const [productsData, setProductsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
    locationId: "",
    condition: "",
    sortBy: "newest"
  });

  // Temporary state for inputs that should not auto-apply
  const [tempSearch, setTempSearch] = useState("");
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

  // Initialize filters from URL parameters
  useEffect(() => {
    const newFilters = {
      search: searchParams.get('search') || "",
      category: searchParams.get('category') || "",
      minPrice: searchParams.get('min_price') || "",
      maxPrice: searchParams.get('max_price') || "",
      locationId: searchParams.get('location_id') || "",
      condition: searchParams.get('condition') || "",
      sortBy: searchParams.get('sort') || "newest"
    };
    setFilters(newFilters);
    // Initialize temporary state with URL values
    setTempSearch(newFilters.search);
    setTempMinPrice(newFilters.minPrice);
    setTempMaxPrice(newFilters.maxPrice);
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "newest") {
        const paramKey = key === 'locationId' ? 'location_id' : key === 'minPrice' ? 'min_price' : key === 'maxPrice' ? 'max_price' : key === 'sortBy' ? 'sort' : key;
        params.set(paramKey, value);
      }
    });

    setSearchParams(params);
  }, [filters, setSearchParams]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 700) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories and locations
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await productsAPI.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        notify.error("Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchLocations = async () => {
      try {
        setLocationsLoading(true);
        const data = await productsAPI.getLocations();
        setLocations(data);
      } catch (err) {
        console.error("Error fetching locations:", err);
        notify.error("Failed to load locations");
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchCategories();
    fetchLocations();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await productsAPI.getAll({
          page,
          size: 15,
          search: filters.search || undefined,
          category: filters.category || undefined,
          min_price: filters.minPrice || undefined,
          max_price: filters.maxPrice || undefined,
          location_id: filters.locationId || undefined,
          condition: filters.condition || undefined,
          sort: filters.sortBy || undefined
        });

        setProductsData(data);
      } catch (err) {
        const errorMessage = err.message || "Error fetching products";
        setError(errorMessage);
        notify.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, filters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Event handlers
  const handleProductClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleFilterApply = () => {
    // Apply all temporary values to actual filters
    setFilters(prev => ({
      ...prev,
      search: tempSearch,
      minPrice: tempMinPrice,
      maxPrice: tempMaxPrice
    }));
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleFilterApply();
  };

  const handleCategoryChange = (e) => updateFilter('category', e.target.value);
  const handleLocationChange = (e) => updateFilter('locationId', e.target.value);
  const handleConditionChange = (e) => updateFilter('condition', e.target.value);
  const handleSortChange = (e) => updateFilter('sortBy', e.target.value);

  const handlePriceInputChange = (type, value) => {
    if (type === 'min') {
      setTempMinPrice(value);
    } else {
      setTempMaxPrice(value);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      locationId: "",
      condition: "",
      sortBy: "newest"
    });
    setTempSearch("");
    setTempMinPrice("");
    setTempMaxPrice("");
    setPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(value =>
    value && value !== "newest"
  ).length;

  return (
    <div className="relative px-4">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
      </div>

      {/* Filters */}
      <ProductFilters
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        searchTerm={tempSearch}
        setSearchTerm={setTempSearch}
        handleSearchSubmit={handleSearchSubmit}
        selectedCategory={filters.category}
        handleCategoryChange={handleCategoryChange}
        categories={categories}
        categoriesLoading={categoriesLoading}
        selectedLocationId={filters.locationId}
        handleLocationChange={handleLocationChange}
        locations={locations}
        locationsLoading={locationsLoading}
        selectedCondition={filters.condition}
        handleConditionChange={handleConditionChange}
        sortBy={filters.sortBy}
        handleSortChange={handleSortChange}
        tempMinPrice={tempMinPrice}
        tempMaxPrice={tempMaxPrice}
        handlePriceInputChange={handlePriceInputChange}
        handleFilterApply={handleFilterApply}
        clearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Products Grid */}
      {loading ? (
        <div className="px-4">
          <PageLoader message="Loading products..." />
        </div>
      ) : error ? (
        <div className="px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsData && productsData.products.length > 0 ? (
              productsData.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={handleProductClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">No products found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        productsData={productsData}
        currentPage={page}
        onPageChange={setPage}
      />

      {/* Back to top button */}
      {showBackToTop && (
        <button
          id="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-4 right-2 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 border-2 border-gray-50"
          title="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Products;
