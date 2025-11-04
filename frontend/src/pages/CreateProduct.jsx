import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { productsAPI } from "../api";
import { currencyUtils } from "../utils/currencyUtils";
import { PageLoader, ButtonLoader } from "../components/shared/LoadingSpinners";
import { notify } from "../utils/notifications";

import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';

function CreateProduct() {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price_amount: "",
    price_currency: "DKK",
    category_id: "",
    // Optional fields
    condition: "",
    quantity: "",
    location_id: "",
    width_cm: "",
    height_cm: "",
    depth_cm: "",
    weight_kg: "",
    color_ids: [],
    material_ids: [],
    tag_ids: []
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [colors, setColors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file count
    if (images.length + files.length > 10) {
      alert("Maximum 10 images allowed");
      return;
    }

    setUploadingImages(true);
    const newImages = [];

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not a valid image file`);
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          // headers: {
          //   'Authorization': `Bearer ${token}`
          // },  // Temporarily disabled for testing
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          newImages.push({
            url: result.url,
            filename: result.filename,
            file: file
          });
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          console.error('Upload failed:', errorData);
          alert(`Failed to upload ${file.name}: ${errorData.detail || response.statusText}`);
        }
      }

      setImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const [categoriesData, locationsData, currenciesData, productDetailsData] = await Promise.all([
          productsAPI.getCategories(),
          productsAPI.getLocations(),
          productsAPI.getCurrencies(),
          productsAPI.getProductDetails()
        ]);

        setCategories(categoriesData);
        setLocations(locationsData);
        setCurrencies(currenciesData);
        setColors(productDetailsData.colors || []);
        setMaterials(productDetailsData.materials || []);
        setTags(productDetailsData.tags || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load form data. Please refresh the page.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked ? [...(prev[name] || []), parseInt(value)] : (prev[name] || []).filter(id => id !== parseInt(value))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    } else if (formData.title.length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }

    if (!formData.price_amount) {
      errors.price_amount = "Price is required";
    } else {
      const price = parseFloat(formData.price_amount);
      if (isNaN(price) || price <= 0) {
        errors.price_amount = "Price must be a positive number";
      }
    }

    if (!formData.category_id) {
      errors.category_id = "Category is required";
    }

    // Optional field validations
    if (formData.quantity && (parseInt(formData.quantity) < 1 || parseInt(formData.quantity) > 999)) {
      errors.quantity = "Quantity must be between 1 and 999";
    }

    if (formData.width_cm && (parseFloat(formData.width_cm) <= 0 || parseFloat(formData.width_cm) > 1000)) {
      errors.width_cm = "Width must be between 0.1 and 1000 cm";
    }

    if (formData.height_cm && (parseFloat(formData.height_cm) <= 0 || parseFloat(formData.height_cm) > 1000)) {
      errors.height_cm = "Height must be between 0.1 and 1000 cm";
    }

    if (formData.depth_cm && (parseFloat(formData.depth_cm) <= 0 || parseFloat(formData.depth_cm) > 1000)) {
      errors.depth_cm = "Depth must be between 0.1 and 1000 cm";
    }

    if (formData.weight_kg && (parseFloat(formData.weight_kg) <= 0 || parseFloat(formData.weight_kg) > 1000)) {
      errors.weight_kg = "Weight must be between 0.1 and 1000 kg";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price_amount: parseFloat(formData.price_amount),
        price_currency: formData.price_currency,
        category_id: parseInt(formData.category_id),
        // Optional fields - only include if they have values
        ...(formData.condition && { condition: formData.condition }),
        ...(formData.quantity && { quantity: parseInt(formData.quantity) }),
        ...(formData.location_id && { location_id: parseInt(formData.location_id) }),
        ...(formData.width_cm && { width_cm: parseFloat(formData.width_cm) }),
        ...(formData.height_cm && { height_cm: parseFloat(formData.height_cm) }),
        ...(formData.depth_cm && { depth_cm: parseFloat(formData.depth_cm) }),
        ...(formData.weight_kg && { weight_kg: parseFloat(formData.weight_kg) }),
        ...(formData.color_ids.length > 0 && { color_ids: formData.color_ids }),
        ...(formData.material_ids.length > 0 && { material_ids: formData.material_ids }),
        ...(formData.tag_ids.length > 0 && { tag_ids: formData.tag_ids }),
        ...(images.length > 0 && { image_urls: images.map(img => img.url) })
      };

      const newProduct = await productsAPI.create(productData);

      notify.success("Product created successfully!");
      // Redirect to the newly created product
      navigate(`/products/${newProduct.id}`);

    } catch (err) {
      console.error("Error creating product:", err);
      const errorMessage = err.message || "Failed to create product. Please try again.";
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <PageLoader message="Loading form data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Sell Your Bicycle</h1>
          <p className="text-lg text-gray-600">
            List your bicycle for sale and reach potential buyers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Main Form Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Bicycle Name *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter bicycle name"
                  maxLength={200}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">{formData.title.length}/200 characters</p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe your bicycle in detail"
                  maxLength={1000}
                />
                {validationErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">{formData.description.length}/1000 characters</p>
              </div>

              <div>
                <label htmlFor="price_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Price ({currencyUtils.getCurrencySymbol(formData.price_currency)}) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="price_amount"
                    name="price_amount"
                    value={formData.price_amount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.price_amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  <select
                    name="price_currency"
                    value={formData.price_currency}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currencyUtils.getCurrencyDisplayName(currency.code)}
                      </option>
                    ))}
                  </select>
                </div>
                {validationErrors.price_amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.price_amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {validationErrors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.category_id}</p>
                )}
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  id="location_id"
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.city}, {location.postcode}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Column - Images */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Images</h2>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Max 10)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImages}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadingImages && (
                  <p className="mt-2 text-sm text-blue-600">Uploading images...</p>
                )}
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Uploaded Images ({images.length}/10)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Image Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload high-quality photos from multiple angles</li>
                  <li>• First image will be the main product photo</li>
                  <li>• Supported formats: JPG, PNG, GIF</li>
                  <li>• Maximum file size: 5MB per image</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg
                className={`w-5 h-5 mr-2 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Advanced Options Section */}
          {showAdvanced && (
            <div className="mb-8 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Quantity */}
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      max="999"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.quantity ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1"
                    />
                    {validationErrors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.quantity}</p>
                    )}
                  </div>

                  {/* Dimensions */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Dimensions (cm)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="width_cm" className="block text-xs text-gray-600 mb-1">Width</label>
                        <input
                          type="number"
                          id="width_cm"
                          name="width_cm"
                          value={formData.width_cm}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="1000"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            validationErrors.width_cm ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label htmlFor="height_cm" className="block text-xs text-gray-600 mb-1">Height</label>
                        <input
                          type="number"
                          id="height_cm"
                          name="height_cm"
                          value={formData.height_cm}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="1000"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            validationErrors.height_cm ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.0"
                        />
                      </div>
                      <div>
                        <label htmlFor="depth_cm" className="block text-xs text-gray-600 mb-1">Depth</label>
                        <input
                          type="number"
                          id="depth_cm"
                          name="depth_cm"
                          value={formData.depth_cm}
                          onChange={handleInputChange}
                          step="0.1"
                          min="0"
                          max="1000"
                          className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            validationErrors.depth_cm ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.0"
                        />
                      </div>
                    </div>
                    {(validationErrors.width_cm || validationErrors.height_cm || validationErrors.depth_cm) && (
                      <p className="mt-1 text-xs text-red-600">
                        {validationErrors.width_cm || validationErrors.height_cm || validationErrors.depth_cm}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="weight_kg" className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight_kg"
                      name="weight_kg"
                      value={formData.weight_kg}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="1000"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.weight_kg ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.0"
                    />
                    {validationErrors.weight_kg && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.weight_kg}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Colors
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {colors.map((color) => (
                        <label key={color.id} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            name="color_ids"
                            value={color.id}
                            checked={formData.color_ids.includes(color.id)}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm">{color.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {materials.map((material) => (
                        <label key={material.id} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            name="material_ids"
                            value={material.id}
                            checked={formData.material_ids.includes(material.id)}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm">{material.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {tags.map((tag) => (
                        <label key={tag.id} className="flex items-center mb-1">
                          <input
                            type="checkbox"
                            name="tag_ids"
                            value={tag.id}
                            checked={formData.tag_ids.includes(tag.id)}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="text-sm">{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AddCircleOutlineIcon fontSize="small" className="inline-block mr-2" />
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <ButtonLoader size={16} />
                  <span>Creating Product...</span>
                </div>
              ) : (
                "Create Product"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <CancelIcon fontSize="small" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProduct;
