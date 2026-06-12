import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewModal } from './ReviewModal';

// Mock store state
let mockIsOpen = false;
let mockSelectedBookId: string | null = null;
const mockClose = vi.fn();

// Mock useReviewStore hook
vi.mock('../hooks/useReviewStore', () => ({
  useReviewStore: () => ({
    isOpen: mockIsOpen,
    selectedBookId: mockSelectedBookId,
    close: mockClose,
  }),
}));

// Mock ReviewPanel to isolate ReviewModal behavior
vi.mock('./ReviewPanel', () => ({
  ReviewPanel: ({ bookId }: { bookId: string }) => (
    <div data-testid="mock-review-panel">Review Panel for {bookId}</div>
  ),
}));

describe('ReviewModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = false;
    mockSelectedBookId = null;
  });

  it('should render hidden classes when the modal is closed', () => {
    mockIsOpen = false;
    mockSelectedBookId = null;

    const { container } = render(<ReviewModal />);

    // Overlay backdrop should have opacity-0 and pointer-events-none classes
    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('opacity-0', 'pointer-events-none');
    expect(overlay).not.toHaveClass('opacity-100', 'pointer-events-auto');

    // Container should have opacity-0, scale-95, and pointer-events-none classes
    const modalContainer = container.querySelector('.bg-slate-900');
    expect(modalContainer).toBeInTheDocument();
    expect(modalContainer).toHaveClass('opacity-0', 'scale-95', 'pointer-events-none');
    expect(modalContainer).not.toHaveClass('opacity-100', 'scale-100', 'pointer-events-auto');

    // Inner panel should not be rendered
    expect(screen.queryByTestId('mock-review-panel')).not.toBeInTheDocument();
  });

  it('should render visible classes and active subpanels when modal is open', () => {
    mockIsOpen = true;
    mockSelectedBookId = 'book-999';

    const { container } = render(<ReviewModal />);

    // Overlay backdrop should have opacity-100 and pointer-events-auto classes
    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('opacity-100', 'pointer-events-auto');
    expect(overlay).not.toHaveClass('opacity-0', 'pointer-events-none');

    // Container should have opacity-100, scale-100, and pointer-events-auto classes
    const modalContainer = container.querySelector('.bg-slate-900');
    expect(modalContainer).toBeInTheDocument();
    expect(modalContainer).toHaveClass('opacity-100', 'scale-100', 'pointer-events-auto');
    expect(modalContainer).not.toHaveClass('opacity-0', 'scale-95', 'pointer-events-none');

    // Inner panel should render with correct book id passed
    const reviewPanel = screen.getByTestId('mock-review-panel');
    expect(reviewPanel).toBeInTheDocument();
    expect(reviewPanel).toHaveTextContent('Review Panel for book-999');
  });

  it('should call close when clicking the close button', async () => {
    const user = userEvent.setup();
    mockIsOpen = true;
    mockSelectedBookId = 'book-999';

    render(<ReviewModal />);

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    await user.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should call close when clicking the backdrop overlay', async () => {
    const user = userEvent.setup();
    mockIsOpen = true;
    mockSelectedBookId = 'book-999';

    const { container } = render(<ReviewModal />);

    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toBeInTheDocument();
    
    // Simulate user clicking on the backdrop
    await user.click(overlay!);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
