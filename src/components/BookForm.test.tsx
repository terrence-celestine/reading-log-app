import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookForm } from './BookForm';
import { db } from '../lib/db';
import { enrichBook } from '../lib/enrichBook';
import { toast } from 'sonner';

// Mock dependecies
vi.mock('../lib/enrichBook', () => ({
  enrichBook: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock dexie database methods
const mockAddBook = vi.fn();
const mockUpdateBook = vi.fn();
let mockFirstResult: any = null;

vi.mock('../lib/db', () => ({
  db: {
    books: {
      filter: vi.fn().mockImplementation(() => ({
        first: vi.fn().mockImplementation(() => Promise.resolve(mockFirstResult)),
      })),
      add: vi.fn().mockImplementation((book) => mockAddBook(book)),
      update: vi.fn().mockImplementation((id, updates) => mockUpdateBook(id, updates)),
    },
  },
}));

describe('BookForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFirstResult = null;
    mockAddBook.mockResolvedValue(true);
    mockUpdateBook.mockResolvedValue(true);
    // Setup default mock implementation for enrichBook
    vi.mocked(enrichBook).mockResolvedValue({
      summary: 'A great book description.',
      coverUrl: 'https://example.com/cover.jpg',
      isbn: '1234567890',
      pageCount: 250,
    });
  });

  it('should render the core form fields and headings with correct accessibility roles', () => {
    render(<BookForm />);

    expect(screen.getByRole('heading', { name: /add a new book/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /author/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to library/i })).toBeInTheDocument();
  });

  it('should let the user type into Title and Author fields', async () => {
    const user = userEvent.setup();
    render(<BookForm />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const authorInput = screen.getByRole('textbox', { name: /author/i });

    await user.type(titleInput, 'The Hobbit');
    await user.type(authorInput, 'Tolkien');

    expect(titleInput).toHaveValue('The Hobbit');
    expect(authorInput).toHaveValue('Tolkien');
  });

  it('should display error toast and block submission when a book with the same title already exists', async () => {
    const user = userEvent.setup();
    mockFirstResult = { id: 'existing-id', title: 'The Hobbit', author: 'Tolkien' };

    render(<BookForm />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const authorInput = screen.getByRole('textbox', { name: /author/i });
    const submitButton = screen.getByRole('button', { name: /add to library/i });

    await user.type(titleInput, 'The Hobbit');
    await user.type(authorInput, 'Tolkien');
    await user.click(submitButton);

    // Verify duplication checks were called correctly
    expect(db.books.filter).toHaveBeenCalled();
    expect(mockAddBook).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('The Hobbit is already in your library!');
  });

  it('should successfully add a new book to the database, trigger AI enrichment, and reset form fields', async () => {
    const user = userEvent.setup();
    mockFirstResult = null; // No existing book

    render(<BookForm />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const authorInput = screen.getByRole('textbox', { name: /author/i });
    const submitButton = screen.getByRole('button', { name: /add to library/i });

    await user.type(titleInput, 'Clean Code');
    await user.type(authorInput, 'Robert C. Martin');
    await user.click(submitButton);

    // Verify local DB addition gets triggered with 'pending' metadata status
    expect(mockAddBook).toHaveBeenCalledTimes(1);
    const addedBook = mockAddBook.mock.calls[0][0];
    expect(addedBook.title).toBe('Clean Code');
    expect(addedBook.author).toBe('Robert C. Martin');
    expect(addedBook.status).toBe('to-read');
    expect(addedBook.metadataStatus).toBe('pending');

    // Verify success toast triggers
    expect(toast.success).toHaveBeenCalledWith('Added "Clean Code" to your library!', expect.any(Object));

    // Verify AI enrichment endpoint is requested with title and author
    expect(enrichBook).toHaveBeenCalledWith('Clean Code', 'Robert C. Martin');

    // Wait for async background AI enrichment promise to resolve and update the database
    await waitFor(() => {
      expect(mockUpdateBook).toHaveBeenCalledWith(addedBook.id, {
        coverUrl: 'https://example.com/cover.jpg',
        totalPages: 250,
        metadataStatus: 'success',
        isbn: '1234567890',
        summary: 'A great book description.',
      });
    });

    // Inputs should be reset to empty strings
    expect(titleInput).toHaveValue('');
    expect(authorInput).toHaveValue('');
  });

  it('should set metadataStatus to failed if background enrichment promise throws an error', async () => {
    const user = userEvent.setup();
    mockFirstResult = null;
    vi.mocked(enrichBook).mockRejectedValue(new Error('AI enrichment service offline'));

    render(<BookForm />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const authorInput = screen.getByRole('textbox', { name: /author/i });
    const submitButton = screen.getByRole('button', { name: /add to library/i });

    await user.type(titleInput, 'Refactoring');
    await user.type(authorInput, 'Martin Fowler');
    await user.click(submitButton);

    expect(mockAddBook).toHaveBeenCalledTimes(1);
    const addedBook = mockAddBook.mock.calls[0][0];

    // Verify success toast triggers for initial add
    expect(toast.success).toHaveBeenCalledWith('Added "Refactoring" to your library!', expect.any(Object));

    // Wait for the background catch handler to execute and update the metadata status to 'failed'
    await waitFor(() => {
      expect(mockUpdateBook).toHaveBeenCalledWith(addedBook.id, {
        metadataStatus: 'failed',
      });
    });
  });

  it('should handle general database errors gracefully', async () => {
    const user = userEvent.setup();
    mockFirstResult = null;
    mockAddBook.mockRejectedValue(new Error('IndexedDB full'));

    render(<BookForm />);

    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const authorInput = screen.getByRole('textbox', { name: /author/i });
    const submitButton = screen.getByRole('button', { name: /add to library/i });

    await user.type(titleInput, 'Code Complete');
    await user.type(authorInput, 'Steve McConnell');
    await user.click(submitButton);

    // Verify error toast was shown
    expect(toast.error).toHaveBeenCalledWith('Failed to add book. It might already be in your library.');
  });
});
