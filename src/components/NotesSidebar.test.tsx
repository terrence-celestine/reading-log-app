import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesSidebar } from './NotesSidebar';

// Mock variables for notes store state
let mockIsOpen = false;
let mockSelectedBookId: string | null = null;
const mockClose = vi.fn();

// Mock useNotesStore hook
vi.mock('../hooks/useNotesStore', () => ({
  useNotesStore: () => ({
    isOpen: mockIsOpen,
    selectedBookId: mockSelectedBookId,
    close: mockClose,
  }),
}));

// Mock BookNotesPanel to isolate NotesSidebar behavior
vi.mock('./BookNotesPanel', () => ({
  BookNotesPanel: ({ bookId }: { bookId: string }) => (
    <div data-testid="mock-notes-panel">Book Notes Panel for {bookId}</div>
  ),
}));

describe('NotesSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = false;
    mockSelectedBookId = null;
  });

  it('should render hidden overlay and container when sidebar is closed', () => {
    mockIsOpen = false;
    mockSelectedBookId = null;

    const { container } = render(<NotesSidebar />);

    // Container should be off-screen (have translate-x-full class)
    const sidebarContainer = container.querySelector('.bg-slate-900');
    expect(sidebarContainer).toHaveClass('translate-x-full');

    // Overlay should be invisible (have opacity-0 and pointer-events-none classes)
    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toHaveClass('opacity-0', 'pointer-events-none');
    expect(overlay).not.toHaveClass('opacity-100', 'pointer-events-auto');

    // Notes panel should not be rendered
    expect(screen.queryByTestId('mock-notes-panel')).not.toBeInTheDocument();
  });

  it('should render open overlay, active container, and inner panel when open', () => {
    mockIsOpen = true;
    mockSelectedBookId = 'book-567';

    const { container } = render(<NotesSidebar />);

    // Container should be active (have translate-x-0 class)
    const sidebarContainer = container.querySelector('.bg-slate-900');
    expect(sidebarContainer).toHaveClass('translate-x-0');
    expect(sidebarContainer).not.toHaveClass('translate-x-full');

    // Overlay should be visible (have opacity-100 and pointer-events-auto classes)
    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toHaveClass('opacity-100', 'pointer-events-auto');
    expect(overlay).not.toHaveClass('opacity-0', 'pointer-events-none');

    // Inner notes panel should render with correct book id passed
    const notesPanel = screen.getByTestId('mock-notes-panel');
    expect(notesPanel).toBeInTheDocument();
    expect(notesPanel).toHaveTextContent('Book Notes Panel for book-567');
  });

  it('should call close when clicking the close button', async () => {
    const user = userEvent.setup();
    mockIsOpen = true;
    mockSelectedBookId = 'book-567';

    render(<NotesSidebar />);

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    await user.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('should call close when clicking the backdrop overlay', async () => {
    const user = userEvent.setup();
    mockIsOpen = true;
    mockSelectedBookId = 'book-567';

    const { container } = render(<NotesSidebar />);

    const overlay = container.querySelector('.bg-slate-950\\/60');
    expect(overlay).toBeInTheDocument();
    
    // Simulate user clicking on the background overlay
    await user.click(overlay!);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
