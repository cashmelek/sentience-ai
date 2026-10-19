import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../components/MetricCard';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="icon">Icon</span>,
}));

describe('MetricCard', () => {
  it('renders the metric card with correct values', () => {
    render(
      <MetricCard
        icon={() => <span data-testid="icon">Icon</span>}
        label="Test Label"
        value="100"
        colorClass="text-emerald-500"
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders with subValue when provided', () => {
    render(
      <MetricCard
        icon={() => <span>Icon</span>}
        label="Score"
        value="85"
        subValue="%85"
        colorClass="text-blue-500"
      />
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('%85')).toBeInTheDocument();
  });
});
