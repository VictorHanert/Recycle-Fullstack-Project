import Products from '../components/AllProducts';

const ProductsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600">Browse and manage products</p>
      </div>
      <Products />
    </div>
  );
};

export default ProductsPage;
