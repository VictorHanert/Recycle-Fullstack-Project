import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ProductCard from '../../../components/products/ProductCard';

// Mock all dependencies
vi.mock('../../../utils/formatUtils', () => ({
  formatRelativeTime: vi.fn((date) => `formatted ${date}`),
  formatCondition: vi.fn((condition) => `formatted ${condition}`)
}));

vi.mock('../../../utils/currencyUtils', () => ({
  currencyUtils: {
    getCurrencySymbol: vi.fn((currency) => `${currency} symbol`)
  }
}));

vi.mock('../../../utils/notifications', () => ({
  notify: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('../../../stores/favoritesStore', () => ({
  useFavoritesStore: vi.fn(() => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(() => Promise.resolve(true)),
    checkFavoriteStatus: vi.fn()
  }))
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, username: 'testuser' },
    token: 'mock-token',
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    updateUser: vi.fn(),
    isAuthenticated: true,
    isAdmin: false
  }))
}));

vi.mock('../../../components/products/PriceHistoryDisplay', () => ({
  default: () => <div data-testid="price-history-display">Price History</div>
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    description: 'Test description',
    price_amount: 100,
    price_currency: 'DKK',
    condition: 'good',
    likes_count: 5,
    images: [{ url: 'test-image.jpg' }],
    seller: { id: 1, username: 'testseller' },
    location: { city: 'Copenhagen' },
    created_at: '2023-01-01T00:00:00Z',
    price_changes: []
  };

  const mockOnClick = vi.fn();
  const mockOnFavoriteChange = vi.fn();

  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('100 DKK symbol')).toBeInTheDocument();
    expect(screen.getByText('Condition: formatted good')).toBeInTheDocument();
    expect(screen.getByText('testseller')).toBeInTheDocument();
    expect(screen.getByText('Copenhagen')).toBeInTheDocument();
  });

  test('renders placeholder image when no images provided', () => {
    const productWithoutImages = { ...mockProduct, images: [] };
    render(<ProductCard product={productWithoutImages} onClick={mockOnClick} />);

    const img = screen.getByAltText('Test Product');
    expect(img).toHaveAttribute('src', 'https://placehold.co/600x400.png');
  });

  test('displays correct price formatting for whole numbers', () => {
    const wholePriceProduct = { ...mockProduct, price_amount: 150 };
    render(<ProductCard product={wholePriceProduct} onClick={mockOnClick} />);

    expect(screen.getByText('150 DKK symbol')).toBeInTheDocument();
  });

  test('displays correct price formatting for decimals', () => {
    const decimalPriceProduct = { ...mockProduct, price_amount: 99.99 };
    render(<ProductCard product={decimalPriceProduct} onClick={mockOnClick} />);

    expect(screen.getByText('99.99 DKK symbol (broken)')).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const card = screen.getByRole('img', { name: 'Test Product' }).closest('.cursor-pointer');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockProduct);
  });

  test('renders favorite button', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const favoriteButton = screen.getByRole('button', { name: /add to favorites/i });
    expect(favoriteButton).toBeInTheDocument();
  });

  test('renders PriceHistoryDisplay component', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    expect(screen.getByTestId('price-history-display')).toBeInTheDocument();
  });

  test('renders seller link correctly', () => {
    render(<ProductCard product={mockProduct} onClick={mockOnClick} />);

    const sellerLink = screen.getByRole('link', { name: 'testseller' });
    expect(sellerLink).toHaveAttribute('href', '/user/1');
  });

  test('handles missing seller gracefully', () => {
    const productWithoutSeller = { ...mockProduct, seller: null };
    render(<ProductCard product={productWithoutSeller} onClick={mockOnClick} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  test('handles missing location gracefully', () => {
    const productWithoutLocation = { ...mockProduct, location: null };
    render(<ProductCard product={productWithoutLocation} onClick={mockOnClick} />);

    expect(screen.getByText(', formatted 2023-01-01T00:00:00Z')).toBeInTheDocument();
  });

  test('handles missing created_at gracefully', () => {
    const productWithoutDate = { ...mockProduct, created_at: null };
    render(<ProductCard product={productWithoutDate} onClick={mockOnClick} />);

    expect(screen.getByText('Copenhagen')).toBeInTheDocument();
  });
});