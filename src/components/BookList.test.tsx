import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookList } from './BookList';
import type { Book } from '../types';

// Declare controllable mock state for useLiveQuery
let mockBooks: Book[] | undefined = [];

// 1. Setup mock functions for our hooks
const mockDeleteBook = vi.fn();
const mockUpdateBookStatus = vi.fn();
const mockUpdatePages = vi.fn();
const mockOpenNotesPanel = vi.fn();
const mockOpenReviewPanel = vi.fn();

// Mock the hook modules
vi.mock('../hooks/useDeleteBook', () => ({
  useDeleteBook: () => ({
    deleteBook: mockDeleteBook,
  }),
}));

vi.mock('../hooks/useUpdateBookStatus', () => ({
  default: () => ({
    updateBookStatus: mockUpdateBookStatus,
  }),
}));

vi.mock('../hooks/useUpdateProgress', () => ({
  useUpdateProgress: () => ({
    updatePages: mockUpdatePages,
  }),
}));

vi.mock('../hooks/useNotesStore', () => ({
  useNotesStore: () => ({
    open: mockOpenNotesPanel,
  }),
}));

vi.mock('../hooks/useReviewStore', () => ({
  useReviewStore: () => ({
    open: mockOpenReviewPanel,
  }),
}));

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    return mockBooks;
  },
}));

// Mock tooltip components to simplify DOM rendering and avoid Radix UI Portal queries
vi.mock('./ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('BookList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBooks = [];
  });

  it('should render loading skeletons when books is undefined', () => {
    mockBooks = undefined;
    const { container } = render(<BookList />);
    
    // Should not render the main header
    expect(screen.queryByRole('heading', { name: /my library/i })).not.toBeInTheDocument();
    
    // Should render animated skeletons
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render empty state message when the books array is empty', () => {
    mockBooks = [];
    render(<BookList />);

    expect(screen.getByText(/your library is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first book above!/i)).toBeInTheDocument();
  });

  it('should render the library list and search input when books are present', () => {
    const book1: Book = {
      id: '1',
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      totalPages: 310,
      pagesRead: 100,
      status: 'reading',
      progressPercentage: 32,
      createdAt: new Date().toISOString(),
    };
    mockBooks = [book1];

    render(<BookList />);

    expect(screen.getByRole('heading', { name: /my library/i })).toBeInTheDocument();
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
    expect(screen.getByText('J.R.R. Tolkien')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search by title or author/i)).toBeInTheDocument();
  });

  it('should calculate and display the correct counters on status tabs', () => {
    mockBooks = [
      { id: '1', title: 'Book 1', author: 'Author 1', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Book 2', author: 'Author 2', totalPages: 100, pagesRead: 0, status: 'to-read', createdAt: '', progressPercentage: 0 },
      { id: '3', title: 'Book 3', author: 'Author 3', totalPages: 100, pagesRead: 100, status: 'finished', createdAt: '', progressPercentage: 100 },
      { id: '4', title: 'Book 4', author: 'Author 4', totalPages: 100, pagesRead: 10, status: 'reading', createdAt: '', progressPercentage: 10, deleted: true }, // Deleted book should be excluded
    ];

    render(<BookList />);

    // Total active books should be 3
    const allTab = screen.getByRole('button', { name: /^all3$/i });
    expect(allTab).toBeInTheDocument();

    const toReadTab = screen.getByRole('button', { name: /^to read1$/i });
    expect(toReadTab).toBeInTheDocument();

    const readingTab = screen.getByRole('button', { name: /^reading1$/i });
    expect(readingTab).toBeInTheDocument();

    const finishedTab = screen.getByRole('button', { name: /^finished1$/i });
    expect(finishedTab).toBeInTheDocument();
  });

  it('should filter books in real-time when clicking on different status tabs', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'React Guide', author: 'Dan', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Vue Guide', author: 'Evan', totalPages: 100, pagesRead: 0, status: 'to-read', createdAt: '', progressPercentage: 0 },
    ];

    render(<BookList />);

    // Initially both books should be rendered
    expect(screen.getByText('React Guide')).toBeInTheDocument();
    expect(screen.getByText('Vue Guide')).toBeInTheDocument();

    // Click "To Read" tab
    const toReadTab = screen.getByRole('button', { name: /^to read/i });
    await user.click(toReadTab);

    // Only "Vue Guide" should be shown
    expect(screen.queryByText('React Guide')).not.toBeInTheDocument();
    expect(screen.getByText('Vue Guide')).toBeInTheDocument();

    // Click "Reading" tab
    const readingTab = screen.getByRole('button', { name: /^reading/i });
    await user.click(readingTab);

    // Only "React Guide" should be shown
    expect(screen.getByText('React Guide')).toBeInTheDocument();
    expect(screen.queryByText('Vue Guide')).not.toBeInTheDocument();
  });

  it('should filter books when typing in the search input', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Clean Code', author: 'Robert Martin', totalPages: 100, pagesRead: 0, status: 'to-read', createdAt: '', progressPercentage: 0 },
    ];

    render(<BookList />);

    const searchInput = screen.getByPlaceholderText(/search by title or author/i);
    await user.type(searchInput, 'clean');

    // Only Clean Code should be visible
    expect(screen.queryByText('The Hobbit')).not.toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();

    // The "Clear" button should appear and let us clear the search
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    // Both should be visible again and input should be empty
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(searchInput).toHaveValue('');
  });

  it('should display empty search results and allow resetting all filters', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const searchInput = screen.getByPlaceholderText(/search by title or author/i);
    await user.type(searchInput, 'Nonexistent Book');

    expect(screen.getByText(/no books found matching your criteria/i)).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /reset filters/i });
    await user.click(resetButton);

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('The Hobbit')).toBeInTheDocument();
  });

  it('should trigger archive book status callback on clicking archive icon', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const archiveButton = screen.getByRole('button', { name: /archive book/i });
    await user.click(archiveButton);

    expect(mockUpdateBookStatus).toHaveBeenCalledWith('1', 'to-read');
  });

  it('should trigger complete book callback on clicking finish reading icon', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const finishButton = screen.getByRole('button', { name: /finish reading book/i });
    await user.click(finishButton);

    expect(mockUpdatePages).toHaveBeenCalledWith('1', 100);
  });

  it('should trigger delete book callback on clicking trash icon', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const deleteButton = screen.getByRole('button', { name: /delete book/i });
    await user.click(deleteButton);

    expect(mockDeleteBook).toHaveBeenCalledWith('1');
  });

  it('should trigger open notes panel callback on clicking pencil icon', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const notesButton = screen.getByRole('button', { name: /add notes/i });
    await user.click(notesButton);

    expect(mockOpenNotesPanel).toHaveBeenCalledWith('1');
  });

  it('should trigger open review modal callback on clicking write review (finished status only)', async () => {
    const user = userEvent.setup();
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Clean Code', author: 'Uncle Bob', totalPages: 100, pagesRead: 100, status: 'finished', createdAt: '', progressPercentage: 100 },
    ];

    render(<BookList />);

    // Write review button should not be present on the reading book (The Hobbit)
    const card1 = screen.getByText('The Hobbit').closest('.rounded-2xl');
    expect(within(card1 as HTMLElement).queryByRole('button', { name: /write review/i })).not.toBeInTheDocument();

    // Write review button should be present on the finished book (Clean Code)
    const card2 = screen.getByText('Clean Code').closest('.rounded-2xl');
    const writeReviewButton = within(card2 as HTMLElement).getByRole('button', { name: /write review/i });
    expect(writeReviewButton).toBeInTheDocument();

    await user.click(writeReviewButton);
    expect(mockOpenReviewPanel).toHaveBeenCalledWith('2');
  });

  it('should trigger updatePages when the page input is modified with valid values', async () => {
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const pageInput = screen.getByRole('spinbutton');
    expect(pageInput).toHaveValue(50);

    // Fire a change event directly to bypass multi-character typing issues on static controlled component
    fireEvent.change(pageInput, { target: { value: '65' } });

    // Expected pages change: newPages(65) - pagesRead(50) = +15 delta
    expect(mockUpdatePages).toHaveBeenCalledWith('1', 15);
  });

  it('should not trigger updatePages when the page input is empty or invalid', async () => {
    mockBooks = [
      { id: '1', title: 'The Hobbit', author: 'Tolkien', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
    ];

    render(<BookList />);

    const pageInput = screen.getByRole('spinbutton');
    
    // Fire empty change event
    fireEvent.change(pageInput, { target: { value: '' } });

    expect(mockUpdatePages).not.toHaveBeenCalled();
  });
});
