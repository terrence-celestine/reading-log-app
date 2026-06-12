import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewPanel } from './ReviewPanel';
import { db } from '../lib/db';
import { toast } from 'sonner';

// Mock store close callback
const mockCloseReviewPanel = vi.fn();
vi.mock('../hooks/useReviewStore', () => ({
  useReviewStore: () => ({
    close: mockCloseReviewPanel,
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock live query variables and execution control
let mockBook: any = null;
let hasRunSideEffect = false;

// Clean mock of useLiveQuery to support both state resolution and loading side-effects
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    const fnStr = fn.toString();
    // Distinguish between the data query and the async load side-effect query
    if (fnStr.includes('async') || fnStr.includes('setRating')) {
      if (!hasRunSideEffect) {
        hasRunSideEffect = true;
        // Execute the async load side-effect. The await inside fn() will naturally schedule 
        // the state updates to run in a microtask, safely after rendering but before user actions.
        fn();
      }
      return undefined;
    }
    return mockBook;
  },
}));

// Mock db updates
const mockUpdateBook = vi.fn();
vi.mock('../lib/db', () => ({
  db: {
    books: {
      get: vi.fn().mockImplementation(() => Promise.resolve(mockBook)),
      update: vi.fn().mockImplementation((id, updates) => mockUpdateBook(id, updates)),
    },
  },
}));

describe('ReviewPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasRunSideEffect = false;
    mockBook = {
      id: 'book-789',
      title: 'A Game of Thrones',
      author: 'George R.R. Martin',
      rating: 0,
      review: '',
    };
    mockUpdateBook.mockResolvedValue(true);
  });

  it('should render loading state when book details are unresolved', () => {
    mockBook = null;
    render(<ReviewPanel bookId="book-789" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render correct header and empty form states for a new review', () => {
    render(<ReviewPanel bookId="book-789" />);

    expect(screen.getByText('Book Review')).toBeInTheDocument();
    expect(screen.getByText('A Game of Thrones')).toBeInTheDocument();
    expect(screen.getByText('George R.R. Martin')).toBeInTheDocument();

    // Check textarea placeholder
    expect(screen.getByPlaceholderText(/write your thoughts here/i)).toBeInTheDocument();

    // Check stars are initially empty (no amber-400 / yellow color highlights)
    const stars = screen.getAllByRole('button');
    // 5 stars buttons + 1 save review button = 6 buttons total
    expect(stars.length).toBe(6);

    const starIcons = screen.getAllByRole('button').slice(0, 5);
    starIcons.forEach((starButton) => {
      const svg = starButton.querySelector('svg');
      expect(svg).toHaveClass('text-slate-700');
      expect(svg).not.toHaveClass('text-amber-400');
    });
  });

  it('should pre-populate form states if the book already has a rating and review saved', async () => {
    mockBook = {
      id: 'book-789',
      title: 'A Game of Thrones',
      author: 'George R.R. Martin',
      rating: 3,
      review: 'An absolute masterpiece of dark fantasy.',
    };

    render(<ReviewPanel bookId="book-789" />);

    // Textarea should contain existing review (awaiting microtasks for async load useLiveQuery effect)
    const textarea = screen.getByRole('textbox', { name: /thoughts & review/i });
    await waitFor(() => {
      expect(textarea).toHaveValue('An absolute masterpiece of dark fantasy.');
    });

    // First 3 star icons should have active classes, and last 2 should be empty
    const starIcons = screen.getAllByRole('button').slice(0, 5);
    
    // Star 1 (index 0) - Active
    expect(starIcons[0].querySelector('svg')).toHaveClass('text-amber-400');
    // Star 2 (index 1) - Active
    expect(starIcons[1].querySelector('svg')).toHaveClass('text-amber-400');
    // Star 3 (index 2) - Active
    expect(starIcons[2].querySelector('svg')).toHaveClass('text-amber-400');
    // Star 4 (index 3) - Inactive
    expect(starIcons[3].querySelector('svg')).not.toHaveClass('text-amber-400');
    // Star 5 (index 4) - Inactive
    expect(starIcons[4].querySelector('svg')).not.toHaveClass('text-amber-400');
  });

  it('should highlight stars on hover and revert on mouse leave', async () => {
    const user = userEvent.setup();
    render(<ReviewPanel bookId="book-789" />);

    const starIcons = screen.getAllByRole('button').slice(0, 5);

    // Hover over 4th star (index 3)
    await user.hover(starIcons[3]);

    // First 4 stars should light up
    expect(starIcons[0].querySelector('svg')).toHaveClass('text-amber-400');
    expect(starIcons[1].querySelector('svg')).toHaveClass('text-amber-400');
    expect(starIcons[2].querySelector('svg')).toHaveClass('text-amber-400');
    expect(starIcons[3].querySelector('svg')).toHaveClass('text-amber-400');
    expect(starIcons[4].querySelector('svg')).not.toHaveClass('text-amber-400');

    // Unhover
    await user.unhover(starIcons[3]);

    // All should go back to empty (revert to rating 0)
    starIcons.forEach((starButton) => {
      expect(starButton.querySelector('svg')).not.toHaveClass('text-amber-400');
    });
  });

  it('should block saving and trigger error toast if no star rating is selected', async () => {
    const user = userEvent.setup();
    render(<ReviewPanel bookId="book-789" />);

    const saveButton = screen.getByRole('button', { name: /save review/i });
    await user.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('Please select a star rating!');
    expect(mockUpdateBook).not.toHaveBeenCalled();
    expect(mockCloseReviewPanel).not.toHaveBeenCalled();
  });

  it('should successfully save review to database and dismiss panel on click', async () => {
    const user = userEvent.setup();
    render(<ReviewPanel bookId="book-789" />);

    const starIcons = screen.getAllByRole('button').slice(0, 5);
    const textarea = screen.getByRole('textbox', { name: /thoughts & review/i });
    const saveButton = screen.getByRole('button', { name: /save review/i });

    // Select 5 stars (index 4)
    await user.click(starIcons[4]);
    
    // Type review thoughts
    await user.type(textarea, 'Unbelievable twists and turns!');

    // Submit
    await user.click(saveButton);

    // Verify DB update triggers correctly
    expect(mockUpdateBook).toHaveBeenCalledTimes(1);
    expect(mockUpdateBook).toHaveBeenCalledWith('book-789', {
      rating: 5,
      review: 'Unbelievable twists and turns!',
    });

    // Verify feedback and closure actions
    expect(toast.success).toHaveBeenCalledWith('Review saved successfully!');
    expect(mockCloseReviewPanel).toHaveBeenCalledTimes(1);
  });

  it('should display error toast and keep modal open if database update fails', async () => {
    const user = userEvent.setup();
    mockUpdateBook.mockRejectedValue(new Error('IndexedDB full error'));

    render(<ReviewPanel bookId="book-789" />);

    const starIcons = screen.getAllByRole('button').slice(0, 5);
    const saveButton = screen.getByRole('button', { name: /save review/i });

    // Click 4 stars
    await user.click(starIcons[3]);
    await user.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('Failed to save review.');
    expect(mockCloseReviewPanel).not.toHaveBeenCalled();
  });
});
