import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadingStats } from './ReadingStat';
import type { Book } from '../types';

// Mock live query variables
let mockBooks: Book[] | undefined = [];

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    return mockBooks;
  },
}));

// Mock db
vi.mock('../lib/db', () => ({
  db: {
    books: {
      toArray: vi.fn(),
    },
  },
}));

describe('ReadingStats Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBooks = [];
  });

  it('should render zero metrics when books are undefined (loading state)', () => {
    mockBooks = undefined;
    render(<ReadingStats />);

    expect(screen.getByText('Total Books')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();

    // Sinks metrics back to 0 as fallback
    const values = screen.getAllByText('0');
    expect(values.length).toBe(2);
  });

  it('should render zero metrics when the library database is empty', () => {
    mockBooks = [];
    render(<ReadingStats />);

    expect(screen.getByText('Total Books')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();

    const values = screen.getAllByText('0');
    expect(values.length).toBe(2);
  });

  it('should calculate and display metrics correctly for active and finished books', () => {
    mockBooks = [
      { id: '1', title: 'Book 1', author: 'Author 1', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Book 2', author: 'Author 2', totalPages: 100, pagesRead: 100, status: 'finished', createdAt: '', progressPercentage: 100 },
      { id: '3', title: 'Book 3', author: 'Author 3', totalPages: 120, pagesRead: 0, status: 'to-read', createdAt: '', progressPercentage: 0 },
      { id: '4', title: 'Book 4', author: 'Author 4', totalPages: 100, pagesRead: 100, status: 'finished', createdAt: '', progressPercentage: 100 },
    ];

    render(<ReadingStats />);

    // Total books = 4
    expect(screen.getByText('4')).toBeInTheDocument();

    // Finished books = 2 (Book 2 and Book 4)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should exclude deleted books from the total books count calculations', () => {
    mockBooks = [
      { id: '1', title: 'Book 1', author: 'Author 1', totalPages: 100, pagesRead: 50, status: 'reading', createdAt: '', progressPercentage: 50 },
      { id: '2', title: 'Book 2', author: 'Author 2', totalPages: 100, pagesRead: 100, status: 'finished', createdAt: '', progressPercentage: 100, deleted: true }, // Deleted
      { id: '3', title: 'Book 3', author: 'Author 3', totalPages: 120, pagesRead: 0, status: 'to-read', createdAt: '', progressPercentage: 0 },
    ];

    render(<ReadingStats />);

    // Total active books should be 2 (excludes Book 2)
    expect(screen.getByText('2')).toBeInTheDocument();

    // Finished active books should be 0 because Book 2 is marked deleted
    const finishedValues = screen.getAllByText('0');
    expect(finishedValues.length).toBe(1); // One zero for finished books count, other values are 2
  });
});
