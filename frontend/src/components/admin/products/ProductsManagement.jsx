import { useState, useEffect } from 'react';
import { adminAPI, productsAPI } from '../../../api';
import { useAlert } from '../../../hooks/useAlert';
import Alert from '../../shared/Alert';
import ProductFormModal from './ProductFormModal';
import ProductsTable from './ProductsTable';
import { notify } from '../../../utils/notifications';

function ProductsManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [colors, setColors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const [formLoading, setFormLoading] = useState(false);

  const { alertState, showConfirm, closeAlert } = useAlert();

  // Fetch products
  const fetchProducts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, size: 15 };
      if (search) params.search = search;
      params.sort_field = sortField;
      params.sort_direction = sortDirection;

      const response = await adminAPI.getAllProducts(params);
      setProducts(response.products);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories, locations, and product details
  const fetchCategoriesAndLocations = async () => {
    try {
      const [categoriesRes, locationsRes, detailsRes] = await Promise.all([
        productsAPI.getCategories(),
        productsAPI.getLocations(),
        productsAPI.getProductDetails()
      ]);
      setCategories(categoriesRes);
      setLocations(locationsRes);
      setColors(detailsRes.colors || []);
      setMaterials(detailsRes.materials || []);
      setTags(detailsRes.tags || []);
    } catch (err) {
      console.error('Failed to fetch categories/locations/details:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndLocations();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1, searchTerm);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle create product
  const handleCreateProduct = async (productData) => {
    try {
      setFormLoading(true);
      await adminAPI.createProduct(productData);
      notify.success('Product created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchProducts(currentPage);
    } catch (err) {
      console.error('Failed to create product:', err);
      const errorMessage = err.message || 'Failed to create product';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = async (productData) => {
    try {
      setFormLoading(true);
      await adminAPI.updateProduct(selectedProduct.id, productData);
      notify.success('Product updated successfully!');
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts(currentPage);
    } catch (err) {
      console.error('Failed to update product:', err);
      const errorMessage = err.message || 'Failed to update product';
      setError(errorMessage);
      notify.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    const performDelete = async () => {
      try {
        await adminAPI.deleteProduct(productId);
        notify.success('Product deleted successfully!');
        fetchProducts(currentPage);
      } catch (err) {
        console.error('Failed to delete product:', err);
        const errorMessage = err.message || 'Failed to delete product';
        setError(errorMessage);
        notify.error(errorMessage);
      }
    };
    showConfirm('Confirm Delete', 'Are you sure you want to delete this product?', performDelete);
  };

  // Open edit modal
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      title: product.title,
      description: product.description || '',
      price_amount: product.price_amount.toString(),
      price_currency: product.price_currency || 'DKK',
      category_id: product.category_id.toString(),
      condition: product.condition,
      quantity: product.quantity,
      location_id: product.location_id?.toString() || '',
      width_cm: product.width_cm?.toString() || '',
      height_cm: product.height_cm?.toString() || '',
      depth_cm: product.depth_cm?.toString() || '',
      weight_kg: product.weight_kg?.toString() || '',
      status: product.status,
      color_ids: product.colors?.map(c => c.id) || [],
      material_ids: product.materials?.map(m => m.id) || [],
      tag_ids: product.tags?.map(t => t.id) || []
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price_amount: '',
      price_currency: 'DKK',
      category_id: '',
      condition: 'good',
      quantity: 1,
      location_id: '',
      width_cm: '',
      height_cm: '',
      depth_cm: '',
      weight_kg: '',
      status: 'active',
      color_ids: [],
      material_ids: [],
      tag_ids: []
    });
    setSelectedProduct(null);
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Product
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchProducts(1, '');
              }}
              className="bg-white text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-red-700"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Products Table */}
      <ProductsTable
        products={products}
        onEdit={openEditModal}
        onDelete={handleDeleteProduct}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchProducts(page, searchTerm)}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction);
          fetchProducts(1, searchTerm);
        }}
      />

      {/* Create Product Modal */}
      <ProductFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateProduct}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        categories={categories}
        locations={locations}
        colors={colors}
        materials={materials}
        tags={tags}
        isEdit={false}
      />

      {/* Edit Product Modal */}
      <ProductFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onSubmit={handleEditProduct}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        categories={categories}
        locations={locations}
        colors={colors}
        materials={materials}
        tags={tags}
        isEdit={true}
      />

      {/* Alert Component */}
      <Alert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}

export default ProductsManagement;