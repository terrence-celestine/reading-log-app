import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar Component', () => {
  it('should render a zero percent progress bar in blue when progress has not started', () => {
    const { container } = render(<ProgressBar current={0} total={100} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-blue-600');
    expect(bar).not.toHaveClass('bg-emerald-500');
    expect(bar).toHaveStyle({ width: '0%' });
  });

  it('should render a partial percent progress bar in blue when progress is in-progress', () => {
    const { container } = render(<ProgressBar current={45} total={100} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-blue-600');
    expect(bar).not.toHaveClass('bg-emerald-500');
    expect(bar).toHaveStyle({ width: '45%' });
  });

  it('should render a 100 percent progress bar in emerald green when progress is fully complete', () => {
    const { container } = render(<ProgressBar current={100} total={100} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-emerald-500');
    expect(bar).not.toHaveClass('bg-blue-600');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('should cap the progress bar at 100 percent in emerald green if current exceeds total pages', () => {
    const { container } = render(<ProgressBar current={150} total={100} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-emerald-500');
    expect(bar).toHaveStyle({ width: '100%' });
  });

  it('should render a zero percent progress bar and avoid division by zero when total is zero', () => {
    const { container } = render(<ProgressBar current={0} total={0} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-blue-600');
    expect(bar).toHaveStyle({ width: '0%' });
  });

  it('should render a zero percent progress bar and avoid division by zero when total is zero and current is positive', () => {
    const { container } = render(<ProgressBar current={50} total={0} />);

    const bar = container.querySelector('.rounded-full div');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass('bg-blue-600');
    expect(bar).toHaveStyle({ width: '0%' });
  });
});
