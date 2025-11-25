import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Navbar from '../../../components/shared/Navbar';

// Mock Material-UI icons to avoid import issues in tests
vi.mock('@mui/icons-material/Home', () => ({ default: () => null }));
vi.mock('@mui/icons-material/DirectionsBike', () => ({ default: () => null }));
vi.mock('@mui/icons-material/AddCircleOutline', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Dashboard', () => ({ default: () => null }));
vi.mock('@mui/icons-material/AdminPanelSettings', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Person', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Message', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Favorite', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Logout', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Login', () => ({ default: () => null }));
vi.mock('@mui/icons-material/PersonAdd', () => ({ default: () => null }));

describe('Navbar Component', () => {
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    mockOnLogout.mockReset();
  });

  test('renders login and register links when user is not authenticated', () => {
    render(<Navbar user={null} onLogout={mockOnLogout} />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Sell')).not.toBeInTheDocument();
  });

  test('renders dashboard and sell links when user is authenticated', () => {
    const user = { id: 1, username: 'testuser' };
    render(<Navbar user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  test('renders admin link when user is admin', () => {
    const user = { id: 1, username: 'admin', is_admin: true };
    render(<Navbar user={user} onLogout={mockOnLogout} />);

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('does not render admin link when user is not admin', () => {
    const user = { id: 1, username: 'user', is_admin: false };
    render(<Navbar user={user} onLogout={mockOnLogout} />);

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('calls onLogout when logout button is clicked', () => {
    const user = { id: 1, username: 'testuser' };
    render(<Navbar user={user} onLogout={mockOnLogout} />);

    const logoutButtons = screen.getAllByText('Logout');
    fireEvent.click(logoutButtons[0]);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  test('renders home and products links always', () => {
    render(<Navbar user={null} onLogout={mockOnLogout} />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
  });
});