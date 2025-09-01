import Products from '../components/AllProducts';

const HomePage = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to MyMarketplace</h1>
        <p className="text-lg text-gray-600">
          Discover and browse our collection of products
        </p>
      </div>
      <Products />
    </div>
  );
};

export default HomePage;
