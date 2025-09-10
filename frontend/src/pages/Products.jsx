import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import ProductCard from "../components/ProductCard";
import ProductFilters from "../components/ProductFilters";
import Pagination from "../components/Pagination";

// API
import { productsAPI } from "../api";

function Products() {
  const navigate = useNavigate();

  // Basic state
  const [productsData, setProductsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Data states
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

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

  // Sync temp prices
  useEffect(() => {
    setTempMinPrice(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setTempMaxPrice(maxPrice);
  }, [maxPrice]);

  // Fetch categories and locations
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await productsAPI.getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
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
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          location_id: selectedLocationId || undefined,
          condition: selectedCondition || undefined,
          sort: sortBy || undefined
        });

        setProductsData(data);
      } catch (err) {
        setError(err.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, searchQuery, selectedCategory, minPrice, maxPrice, selectedLocationId, selectedCondition, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, selectedLocationId, selectedCondition, sortBy]);

  // Event handlers
  const handleProductClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleLocationChange = (e) => {
    setSelectedLocationId(e.target.value);
    setPage(1);
  };

  const handleConditionChange = (e) => {
    setSelectedCondition(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handlePriceInputChange = (type, value) => {
    if (type === 'min') {
      setTempMinPrice(value);
    } else {
      setTempMaxPrice(value);
    }
  };

  const handlePriceBlur = (type) => {
    const value = type === 'min' ? tempMinPrice : tempMaxPrice;
    if (type === 'min') {
      setMinPrice(value);
    } else {
      setMaxPrice(value);
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchQuery("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setTempMinPrice("");
    setTempMaxPrice("");
    setSelectedLocationId("");
    setSelectedCondition("");
    setSortBy("newest");
    setPage(1);
  };

  const activeFiltersCount = [
    searchQuery,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedLocationId,
    selectedCondition,
    sortBy !== "newest"
  ].filter(Boolean).length;

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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        handleCategoryChange={handleCategoryChange}
        categories={categories}
        categoriesLoading={categoriesLoading}
        selectedLocationId={selectedLocationId}
        handleLocationChange={handleLocationChange}
        locations={locations}
        locationsLoading={locationsLoading}
        selectedCondition={selectedCondition}
        handleConditionChange={handleConditionChange}
        sortBy={sortBy}
        handleSortChange={handleSortChange}
        tempMinPrice={tempMinPrice}
        tempMaxPrice={tempMaxPrice}
        handlePriceInputChange={handlePriceInputChange}
        handlePriceBlur={handlePriceBlur}
        clearFilters={clearFilters}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Products Grid */}
      {loading ? (
        <div className="px-4 flex justify-center items-center min-h-64">
          <div className="text-lg text-gray-600">Loading products...</div>
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
