const ProductFilters = ({
  showFilters,
  setShowFilters,
  searchTerm,
  setSearchTerm,
  handleSearchSubmit,
  selectedCategory,
  handleCategoryChange,
  categories,
  categoriesLoading,
  selectedLocationId,
  handleLocationChange,
  locations,
  locationsLoading,
  selectedCondition,
  handleConditionChange,
  sortBy,
  handleSortChange,
  tempMinPrice,
  tempMaxPrice,
  handlePriceInputChange,
  handleFilterApply,
  clearFilters,
  activeFiltersCount
}) => {
  return (
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {searchTerm && <option value="relevance">Best Match</option>}
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min price"
                value={tempMinPrice}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFilterApply();
                  }
                }}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFilterApply();
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                step="0.01"
              />
              <button
                onClick={handleFilterApply}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Enter
              </button>
            </div>
          </div>

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
  );
};

export default ProductFilters;
