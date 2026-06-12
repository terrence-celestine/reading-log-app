import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookRecommendations } from './BookRecommendations';
import { db } from '../lib/db';
import { getBookRecommendations } from '../lib/getBookRecommendations';
import { toast } from 'sonner';
import type { Book, Recommendation } from '../types';

// Mock dependecies
vi.mock('../lib/getBookRecommendations', () => ({
  getBookRecommendations: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock controllable query variables
let mockFinishedBooks: Book[] | undefined = [];
let mockRecommendations: Recommendation[] | undefined = [];

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    const fnStr = fn.toString();
    if (fnStr.includes('status === \'finished\'') || fnStr.includes('status===\'finished\'')) {
      return mockFinishedBooks;
    }
    return mockRecommendations;
  },
}));

// Mock database interactions
const mockAddBook = vi.fn();
const mockClearRecommendations = vi.fn();
const mockBulkAddRecommendations = vi.fn();
const mockDeleteRecommendation = vi.fn();

vi.mock('../lib/db', () => ({
  db: {
    books: {
      add: vi.fn().mockImplementation((book) => mockAddBook(book)),
      filter: vi.fn().mockImplementation(() => ({
        first: vi.fn(), // Controls duplicate resolution below inside tests
      })),
    },
    recommendations: {
      clear: vi.fn().mockImplementation(() => mockClearRecommendations()),
      bulkAdd: vi.fn().mockImplementation((recs) => mockBulkAddRecommendations(recs)),
      where: vi.fn().mockImplementation(() => ({
        equals: vi.fn().mockImplementation(() => ({
          delete: vi.fn().mockImplementation(() => mockDeleteRecommendation()),
        })),
      })),
    },
  },
}));

describe('BookRecommendations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFinishedBooks = [];
    mockRecommendations = [];
    mockAddBook.mockResolvedValue(true);
    mockClearRecommendations.mockResolvedValue(true);
    mockBulkAddRecommendations.mockResolvedValue(true);
    mockDeleteRecommendation.mockResolvedValue(true);

    // Mock resolve for duplicate check inside addBook as 'null' (no duplicates)
    vi.mocked(db.books.filter).mockImplementation(() => ({
      first: vi.fn().mockResolvedValue(null),
    } as any));

    // Reset default mock value for getting book recommendations API
    vi.mocked(getBookRecommendations).mockResolvedValue({
      recommendations: [
        {
          bookId: 'rec-1',
          title: 'The Silmarillion',
          author: 'J.R.R. Tolkien',
          isbn: '0987654321',
          totalPages: 400,
          summary: 'Ancient legends of Middle-earth.',
          coverUrl: 'https://example.com/silmarillion.jpg',
          date: '',
          syncedToCloud: 0,
          pagesRead: 0,
        },
      ],
    });
  });

  it('should render loading skeletons when recommendations or finishedBooks are undefined', () => {
    mockFinishedBooks = undefined;
    mockRecommendations = undefined;
    
    const { container } = render(<BookRecommendations />);

    expect(screen.queryByText(/book recommendations/i)).not.toBeInTheDocument();
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state if finishedBooks array is empty', () => {
    mockFinishedBooks = [];
    mockRecommendations = [];

    render(<BookRecommendations />);

    expect(screen.getByText(/you have no finished books to get recommendations from!/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /refresh recommendations/i })).not.toBeInTheDocument();
  });

  it('should render prompt message and refresh recommendations button when finishedBooks exist but recommendations is empty', () => {
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    mockRecommendations = [];

    render(<BookRecommendations />);

    expect(screen.getByText(/ready for some recommendations\?/i)).toBeInTheDocument();
    expect(screen.getByText(/click the button below to get recommendations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh recommendations/i })).toBeInTheDocument();
  });

  it('should render recommendations list when books are present', () => {
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    mockRecommendations = [
      {
        bookId: 'rec-1',
        title: 'The Silmarillion',
        author: 'J.R.R. Tolkien',
        isbn: '0987654321',
        totalPages: 400,
        summary: 'Ancient legends of Middle-earth.',
        coverUrl: 'https://example.com/silmarillion.jpg',
        date: '',
        syncedToCloud: 0,
        pagesRead: 0,
      },
    ];

    render(<BookRecommendations />);

    expect(screen.getByRole('heading', { name: /book recommendations/i })).toBeInTheDocument();
    expect(screen.getByText('The Silmarillion')).toBeInTheDocument();
    expect(screen.getByText('J.R.R. Tolkien')).toBeInTheDocument();
    expect(screen.getByText('400 pages')).toBeInTheDocument();
    expect(screen.getByText('Ancient legends of Middle-earth.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh recommendations/i })).toBeInTheDocument();
  });

  it('should fetch recommendations from API and save them to the database on refresh click', async () => {
    const user = userEvent.setup();
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    mockRecommendations = []; // Empty, rendering prompt

    render(<BookRecommendations />);

    const refreshButton = screen.getByRole('button', { name: /refresh recommendations/i });
    await user.click(refreshButton);

    expect(toast.loading).toHaveBeenCalledWith('Getting recommendations...');
    expect(getBookRecommendations).toHaveBeenCalledWith(mockFinishedBooks);
    
    // Verify database updates
    expect(mockClearRecommendations).toHaveBeenCalledTimes(1);
    expect(mockBulkAddRecommendations).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          bookId: 'rec-1',
          title: 'The Silmarillion',
          author: 'J.R.R. Tolkien',
          totalPages: 400,
        }),
      ])
    );
    expect(toast.success).toHaveBeenCalledWith('Recommendations refreshed!');
  });

  it('should display error toast if recommendations fetch API fails', async () => {
    const user = userEvent.setup();
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    mockRecommendations = [];

    vi.mocked(getBookRecommendations).mockRejectedValue(new Error('AI limit reached'));

    render(<BookRecommendations />);

    const refreshButton = screen.getByRole('button', { name: /refresh recommendations/i });
    await user.click(refreshButton);

    expect(toast.error).toHaveBeenCalledWith('Failed to get recommendations!');
  });

  it('should successfully add a recommended book to the library, delete it from recommendations list and trigger toast feedback', async () => {
    const user = userEvent.setup();
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    
    const targetRec = {
      bookId: 'rec-1',
      title: 'The Silmarillion',
      author: 'J.R.R. Tolkien',
      isbn: '0987654321',
      totalPages: 400,
      summary: 'Ancient legends of Middle-earth.',
      coverUrl: 'https://example.com/silmarillion.jpg',
      date: '',
      syncedToCloud: 0,
      pagesRead: 0,
    };
    mockRecommendations = [targetRec];

    render(<BookRecommendations />);

    const card = screen.getByText('The Silmarillion').closest('li');
    const addButton = within(card!).getByRole('button', { name: /add book to library/i });
    await user.click(addButton);

    // Verify duplicate search check was executed
    expect(db.books.filter).toHaveBeenCalled();

    // Verify addition triggers correctly with default values
    expect(mockAddBook).toHaveBeenCalledTimes(1);
    expect(mockAddBook).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'The Silmarillion',
        author: 'J.R.R. Tolkien',
        isbn: '0987654321',
        pagesRead: 0,
        totalPages: 400,
        status: 'to-read',
        metadataStatus: 'success',
      })
    );

    // Verify item is cleaned up from recommendations table
    expect(mockDeleteRecommendation).toHaveBeenCalledTimes(1);
    
    // Verify toast feedback
    expect(toast.success).toHaveBeenCalledWith('Added "The Silmarillion" to your library!');
  });

  it('should block adding recommended book if the book is already in the library', async () => {
    const user = userEvent.setup();
    mockFinishedBooks = [{ id: '1', title: 'The Hobbit', author: 'Tolkien', status: 'finished', totalPages: 100, pagesRead: 100, progressPercentage: 100, createdAt: '' }];
    
    const targetRec = {
      bookId: 'rec-1',
      title: 'The Silmarillion',
      author: 'J.R.R. Tolkien',
      isbn: '0987654321',
      totalPages: 400,
      summary: 'Ancient legends of Middle-earth.',
      coverUrl: 'https://example.com/silmarillion.jpg',
      date: '',
      syncedToCloud: 0,
      pagesRead: 0,
    };
    mockRecommendations = [targetRec];

    // Mock duplicate check to return a matched existing book
    vi.mocked(db.books.filter).mockImplementation(() => ({
      first: vi.fn().mockResolvedValue({ id: 'existing-id', title: 'The Silmarillion' }),
    } as any));

    render(<BookRecommendations />);

    const card = screen.getByText('The Silmarillion').closest('li');
    const addButton = within(card!).getByRole('button', { name: /add book to library/i });
    await user.click(addButton);

    // Verify database additions and deletions were blocked
    expect(mockAddBook).not.toHaveBeenCalled();
    expect(mockDeleteRecommendation).not.toHaveBeenCalled();

    // Verify warning toast feedback
    expect(toast.error).toHaveBeenCalledWith('"The Silmarillion" is already in your library!');
  });
});
