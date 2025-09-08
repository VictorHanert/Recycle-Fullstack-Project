import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productsAPI } from "../api";

function Products() {
  const navigate = useNavigate();

  const [productsData, setProductsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [size] = useState(15); // pagination size

  const [searchTerm, setSearchTerm] = useState("");   // live typing
  const [searchQuery, setSearchQuery] = useState(""); // actual applied search
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // New filter states
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  
  // Categories and locations state
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);

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

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await productsAPI.getAll({
        page,
        size,
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

  useEffect(() => {
    setTempMinPrice(minPrice);
  }, [minPrice]);

  useEffect(() => {
    setTempMaxPrice(maxPrice);
  }, [maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [page, searchQuery, selectedCategory, minPrice, maxPrice, selectedLocationId, selectedCondition, sortBy]);

  const handleProductClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
    setPage(1); // reset when searching
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

  const [tempMinPrice, setTempMinPrice] = useState("");
  const [tempMaxPrice, setTempMaxPrice] = useState("");

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

  if (loading) {
    return (
      <div className="px-4 flex justify-center items-center min-h-64">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button 
          onClick={fetchProducts}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h1>
        <p className="text-lg text-gray-600">
          Discover our carefully curated selection of tech products and accessories.
        </p>
      </div>

      {/* Filter/Search Bar */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                {activeFiltersCount}
              </span>
            )}
            <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? "Loading..." : "All Categories"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={selectedLocationId}
                  onChange={handleLocationChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={locationsLoading}
                >
                  <option value="">
                    {locationsLoading ? "Loading..." : "All Locations"}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}, {location.postcode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={selectedCondition}
                  onChange={handleConditionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Conditions</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={tempMinPrice}
                  onChange={(e) => handlePriceInputChange('min', e.target.value)}
                  onBlur={() => handlePriceBlur('min')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <span className="self-center text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max price"
                  value={tempMaxPrice}
                  onChange={(e) => handlePriceInputChange('max', e.target.value)}
                  onBlur={() => handlePriceBlur('max')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
                <button className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Apply</button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
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

      {/* Pagination */}
      {productsData && productsData.total_pages > 1 && (
        <div className="flex justify-center mt-8 gap-2 flex-wrap">
          {/* Prev */}
          {page > 1 && (
            <button
              onClick={() => handlePageChange(page - 1)}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Previous
            </button>
          )}

          {/* Page numbers */}
          {Array.from({ length: productsData.total_pages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              className={`px-4 py-2 rounded ${
                pageNumber === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          {/* Next */}
          {page < productsData.total_pages && (
            <button
              onClick={() => handlePageChange(page + 1)}
              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Products;
