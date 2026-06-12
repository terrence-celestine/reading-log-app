import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadingStreak } from './ReadingStreak';
import type { ReadingSession } from '../types';

// Mock variables for live query state
let mockSessions: ReadingSession[] | undefined = [];

// Mock dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    return mockSessions;
  },
}));

// Mock db
vi.mock('../lib/db', () => ({
  db: {
    sessions: {
      toArray: vi.fn(),
    },
  },
}));

describe('ReadingStreak Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessions = [];
  });

  it('should render null when sessions are undefined (loading state)', () => {
    mockSessions = undefined;
    const { container } = render(<ReadingStreak />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });

  it('should render a 0 Day Streak in gray and without pulse animation when sessions are empty', () => {
    mockSessions = [];
    const { container } = render(<ReadingStreak />);

    expect(screen.getByText('0 Day Streak')).toBeInTheDocument();

    const textWrapper = container.querySelector('.text-gray-400');
    expect(textWrapper).toBeInTheDocument();
    expect(textWrapper).not.toHaveClass('text-orange-500');

    const icon = container.querySelector('svg');
    expect(icon).not.toHaveClass('fill-orange-500', 'animate-pulse');
  });

  it('should render a positive active streak in orange with pulse animation', () => {
    mockSessions = [
      {
        id: 'session-1',
        bookId: 'book-1',
        pagesRead: 10,
        date: new Date().toISOString(),
        syncedToCloud: 0,
      },
    ];

    const { container } = render(<ReadingStreak />);

    expect(screen.getByText('1 Day Streak')).toBeInTheDocument();

    const textWrapper = container.querySelector('.text-orange-500');
    expect(textWrapper).toBeInTheDocument();
    expect(textWrapper).not.toHaveClass('text-gray-400');

    const icon = container.querySelector('svg');
    expect(icon).toHaveClass('fill-orange-500', 'animate-pulse');
  });

  it('should calculate accurate streaks for multiple consecutive daily sessions', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(today.getDate() - 2);

    mockSessions = [
      {
        bookId: 'book-1',
        pagesRead: 5,
        date: today.toISOString(),
        syncedToCloud: 0,
      },
      {
        bookId: 'book-1',
        pagesRead: 10,
        date: yesterday.toISOString(),
        syncedToCloud: 0,
      },
      {
        bookId: 'book-1',
        pagesRead: 8,
        date: dayBeforeYesterday.toISOString(),
        syncedToCloud: 0,
      },
    ];

    render(<ReadingStreak />);

    expect(screen.getByText('3 Day Streak')).toBeInTheDocument();
  });

  it('should break the streak calculation if a consecutive day is missed', () => {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    mockSessions = [
      {
        bookId: 'book-1',
        pagesRead: 5,
        date: today.toISOString(),
        syncedToCloud: 0,
      },
      {
        bookId: 'book-1',
        pagesRead: 10,
        date: threeDaysAgo.toISOString(),
        syncedToCloud: 0,
      },
    ];

    render(<ReadingStreak />);

    // Expected streak is only 1 because of the 3-day gap which broke the sequence
    expect(screen.getByText('1 Day Streak')).toBeInTheDocument();
  });
});
