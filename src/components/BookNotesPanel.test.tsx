import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookNotesPanel } from './BookNotesPanel';
import { db } from '../lib/db';
import type { Book, BookNote } from '../types';

// Mock variables for live queries
let mockBook: Book | undefined = undefined;
let mockNotes: BookNote[] = [];

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any, deps?: any) => {
    // Determine which query is executing based on function logic structure
    const fnStr = fn.toString();
    if (fnStr.includes('books.get')) {
      return mockBook;
    }
    return mockNotes;
  },
}));

// Mock dexie database methods
const mockAddNote = vi.fn();
const mockDeleteNote = vi.fn();

vi.mock('../lib/db', () => ({
  db: {
    books: {
      get: vi.fn().mockImplementation(() => Promise.resolve(mockBook)),
    },
    bookNotes: {
      add: vi.fn().mockImplementation((note) => mockAddNote(note)),
      delete: vi.fn().mockImplementation((id) => mockDeleteNote(id)),
      // Handle the builder chain where: db.bookNotes.where("bookId").equals(bookId).toArray()
      where: vi.fn().mockImplementation(() => ({
        equals: vi.fn().mockImplementation(() => ({
          toArray: vi.fn().mockImplementation(() => Promise.resolve(mockNotes)),
        })),
      })),
    },
  },
}));

describe('BookNotesPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBook = {
      id: 'book-123',
      title: 'The Lord of the Rings',
      author: 'J.R.R. Tolkien',
      totalPages: 1000,
      pagesRead: 150,
      status: 'reading',
      progressPercentage: 15,
      createdAt: '',
    };
    mockNotes = [];
  });

  it('should render loading state when book is undefined', () => {
    mockBook = undefined;
    render(<BookNotesPanel bookId="book-123" />);

    expect(screen.getByText(/loading book details.../i)).toBeInTheDocument();
  });

  it('should render correct header elements and empty list states when book is loaded', () => {
    render(<BookNotesPanel bookId="book-123" />);

    // Header Details
    expect(screen.getByText('The Lord of the Rings')).toBeInTheDocument();
    expect(screen.getByText('J.R.R. Tolkien')).toBeInTheDocument();
    expect(screen.getByText('Book Notes')).toBeInTheDocument();

    // Form Elements
    expect(screen.getByPlaceholderText(/write a note.../i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('note');
    expect(screen.getByPlaceholderText(/page \(optional\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add note/i })).toBeInTheDocument();

    // Default Empty Feed State
    expect(screen.getByText(/no notes or quotes yet/i)).toBeInTheDocument();
  });

  it('should toggle textarea placeholder based on select dropdown type', async () => {
    const user = userEvent.setup();
    render(<BookNotesPanel bookId="book-123" />);

    const textarea = screen.getByPlaceholderText(/write a note.../i);
    const select = screen.getByRole('combobox');

    // Default is note
    expect(textarea).toHaveAttribute('placeholder', 'Write a note...');

    // Change to quote
    await user.selectOptions(select, 'quote');
    expect(textarea).toHaveAttribute('placeholder', 'Type or paste the quote...');

    // Change back to note
    await user.selectOptions(select, 'note');
    expect(textarea).toHaveAttribute('placeholder', 'Write a note...');
  });

  it('should add a custom thought note successfully with page number and reset fields', async () => {
    const user = userEvent.setup();
    render(<BookNotesPanel bookId="book-123" />);

    const textarea = screen.getByPlaceholderText(/write a note.../i);
    const pageInput = screen.getByPlaceholderText(/page \(optional\)/i);
    const submitButton = screen.getByRole('button', { name: /add note/i });

    await user.type(textarea, 'Gandalf is arriving at Shire.');
    await user.type(pageInput, '22');
    await user.click(submitButton);

    expect(mockAddNote).toHaveBeenCalledTimes(1);
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({
        bookId: 'book-123',
        note: 'Gandalf is arriving at Shire.',
        pageNumber: 22,
        type: 'note',
        syncedToCloud: 0,
        date: expect.any(String),
      })
    );

    // Form inputs should reset to empty
    expect(textarea).toHaveValue('');
    expect(pageInput).toHaveValue(null);
  });

  it('should add a quote successfully without a page number', async () => {
    const user = userEvent.setup();
    render(<BookNotesPanel bookId="book-123" />);

    const textarea = screen.getByPlaceholderText(/write a note.../i);
    const select = screen.getByRole('combobox');
    const submitButton = screen.getByRole('button', { name: /add note/i });

    await user.selectOptions(select, 'quote');
    await user.type(textarea, 'One Ring to rule them all.');
    await user.click(submitButton);

    expect(mockAddNote).toHaveBeenCalledTimes(1);
    expect(mockAddNote).toHaveBeenCalledWith(
      expect.objectContaining({
        bookId: 'book-123',
        note: 'One Ring to rule them all.',
        pageNumber: undefined,
        type: 'quote',
        syncedToCloud: 0,
        date: expect.any(String),
      })
    );
  });

  it('should list added notes/quotes reverse-chronologically with accurate icons', () => {
    mockNotes = [
      {
        id: 1,
        bookId: 'book-123',
        note: 'Early note',
        type: 'note',
        pageNumber: 10,
        date: '2026-06-12T10:00:00.000Z',
        syncedToCloud: 0,
      },
      {
        id: 2,
        bookId: 'book-123',
        note: 'Later quote',
        type: 'quote',
        pageNumber: 50,
        date: '2026-06-12T11:00:00.000Z',
        syncedToCloud: 0,
      },
    ];

    render(<BookNotesPanel bookId="book-123" />);

    // Should render both contents
    expect(screen.getByText('Early note')).toBeInTheDocument();
    expect(screen.getByText('"Later quote"')).toBeInTheDocument();

    // Verify page tags
    expect(screen.getByText('Page 10')).toBeInTheDocument();
    expect(screen.getByText('Page 50')).toBeInTheDocument();

    // Grab both notes rendered and verify reverse-chronological sorting (Later quote should be first)
    const items = screen.getAllByRole('button', { name: /delete note/i });
    expect(items.length).toBe(2);
  });

  it('should filter feed dynamically when selecting tabs', async () => {
    const user = userEvent.setup();
    mockNotes = [
      {
        id: 1,
        bookId: 'book-123',
        note: 'Simple Note',
        type: 'note',
        date: '2026-06-12T10:00:00.000Z',
        syncedToCloud: 0,
      },
      {
        id: 2,
        bookId: 'book-123',
        note: 'Cool Quote',
        type: 'quote',
        date: '2026-06-12T11:00:00.000Z',
        syncedToCloud: 0,
      },
    ];

    render(<BookNotesPanel bookId="book-123" />);

    // Active Tab All: Both visible
    expect(screen.getByText('Simple Note')).toBeInTheDocument();
    expect(screen.getByText('"Cool Quote"')).toBeInTheDocument();

    // Select Notes Tab
    const notesTab = screen.getByRole('button', { name: /notes/i });
    await user.click(notesTab);

    expect(screen.getByText('Simple Note')).toBeInTheDocument();
    expect(screen.queryByText('"Cool Quote"')).not.toBeInTheDocument();

    // Select Quotes Tab
    const quotesTab = screen.getByRole('button', { name: /quotes/i });
    await user.click(quotesTab);

    expect(screen.queryByText('Simple Note')).not.toBeInTheDocument();
    expect(screen.getByText('"Cool Quote"')).toBeInTheDocument();
  });

  it('should trigger deletion when clicking delete icon', async () => {
    const user = userEvent.setup();
    mockNotes = [
      {
        id: 42,
        bookId: 'book-123',
        note: 'Note to be deleted',
        type: 'note',
        date: '2026-06-12T10:00:00.000Z',
        syncedToCloud: 0,
      },
    ];

    render(<BookNotesPanel bookId="book-123" />);

    const deleteButton = screen.getByRole('button', { name: /delete note/i });
    await user.click(deleteButton);

    expect(mockDeleteNote).toHaveBeenCalledTimes(1);
    expect(mockDeleteNote).toHaveBeenCalledWith(42);
  });
});
