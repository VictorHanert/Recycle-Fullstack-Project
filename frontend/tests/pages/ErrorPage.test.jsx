import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '../../src/pages/ErrorPage';

// Mock window.history.back
const mockBack = vi.fn();
Object.defineProperty(window, 'history', {
  value: { back: mockBack },
  writable: true,
});

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error page correctly', () => {
    render(<ErrorPage />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    expect(screen.getByText("The page you're looking for doesn't exist or has been moved.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('calls window.history.back when back button is clicked', () => {
    render(<ErrorPage />);

    const backButton = screen.getByRole('button', { name: /go back/i });
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});