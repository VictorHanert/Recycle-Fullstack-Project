import Modal from '../../shared/Modal';
import { ButtonLoader } from '../../shared/LoadingSpinners';

function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  formLoading,
  categories,
  locations,
  colors,
  materials,
  tags,
  isEdit = false
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price_amount: parseFloat(formData.price_amount),
      quantity: parseInt(formData.quantity),
      category_id: parseInt(formData.category_id),
      location_id: parseInt(formData.location_id),
      width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
      height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
      depth_cm: formData.depth_cm ? parseFloat(formData.depth_cm) : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      color_ids: formData.color_ids.length > 0 ? formData.color_ids : null,
      material_ids: formData.material_ids.length > 0 ? formData.material_ids : null,
      tag_ids: formData.tag_ids.length > 0 ? formData.tag_ids : null,
    };
    onSubmit(productData);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Product" : "Create New Product"}
    >
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price_amount}
              onChange={(e) => setFormData({...formData, price_amount: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={formData.price_currency}
              onChange={(e) => setFormData({...formData, price_currency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DKK">DKK</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="needs_repair">Needs Repair</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
            <select
              required
              value={formData.location_id}
              onChange={(e) => setFormData({...formData, location_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.city} {location.postcode}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
            <input
              type="number"
              step="0.01"
              value={formData.width_cm}
              onChange={(e) => setFormData({...formData, width_cm: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              step="0.01"
              value={formData.height_cm}
              onChange={(e) => setFormData({...formData, height_cm: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depth (cm)</label>
            <input
              type="number"
              step="0.01"
              value={formData.depth_cm}
              onChange={(e) => setFormData({...formData, depth_cm: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="0.01"
              value={formData.weight_kg}
              onChange={(e) => setFormData({...formData, weight_kg: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
          <select
            multiple
            value={formData.color_ids}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              setFormData({...formData, color_ids: selectedOptions});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {colors.map(color => (
              <option key={color.id} value={color.id}>{color.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple colors</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Materials</label>
          <select
            multiple
            value={formData.material_ids}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              setFormData({...formData, material_ids: selectedOptions});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {materials.map(material => (
              <option key={material.id} value={material.id}>{material.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple materials</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <select
            multiple
            value={formData.tag_ids}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
              setFormData({...formData, tag_ids: selectedOptions});
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tags</p>
        </div>
        {isEdit && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {formLoading ? (
              <div className="flex items-center space-x-2">
                <ButtonLoader size={14} />
                <span>{isEdit ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              isEdit ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductFormModal;