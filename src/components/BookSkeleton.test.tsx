import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookSkeleton } from './BookSkeleton';

describe('BookSkeleton Component', () => {
  it('should render the pulse skeleton placeholder with correct structure', () => {
    const { container } = render(<BookSkeleton />);

    // Verifies key skeleton CSS properties are present
    const pulseWrapper = container.querySelector('.animate-pulse');
    expect(pulseWrapper).toBeInTheDocument();
    expect(pulseWrapper).toHaveClass('rounded-2xl', 'bg-slate-800/20');

    // Verify subparts (cover thumbnail placeholder and text content lines)
    const coverPlaceholder = container.querySelector('.w-24.h-36');
    expect(coverPlaceholder).toBeInTheDocument();
    expect(coverPlaceholder).toHaveClass('bg-slate-800', 'rounded-xl');

    // Inspect general structures representing title, author, and description lines
    const lines = container.querySelectorAll('.bg-slate-800, .bg-slate-800\\/50');
    expect(lines.length).toBeGreaterThan(3);
  });
});
