import { act, screen } from '@testing-library/react';

import { AutoRefreshIndicator } from '../components/auto-refresh-indicator';

import { renderDiagnostics } from './test-utils';

describe('AutoRefreshIndicator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render countdown text', () => {
    renderDiagnostics(<AutoRefreshIndicator onRefresh={vi.fn()} />);
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });

  it('should render refresh button', () => {
    renderDiagnostics(<AutoRefreshIndicator onRefresh={vi.fn()} />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should call onRefresh when button is clicked', async () => {
    const onRefresh = vi.fn();
    const { user } = renderDiagnostics(<AutoRefreshIndicator onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('should disable button when refreshing', () => {
    renderDiagnostics(<AutoRefreshIndicator onRefresh={vi.fn()} isRefreshing={true} />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
  });

  it('should decrement countdown over time', async () => {
    vi.useFakeTimers();
    renderDiagnostics(<AutoRefreshIndicator onRefresh={vi.fn()} />);
    expect(screen.getByText(/30s/)).toBeInTheDocument();
    await act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/27s/)).toBeInTheDocument();
  });

  it('should reset countdown after reaching zero', async () => {
    vi.useFakeTimers();
    renderDiagnostics(<AutoRefreshIndicator onRefresh={vi.fn()} />);
    await act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByText(/30s/)).toBeInTheDocument();
  });
});
