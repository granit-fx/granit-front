import { ScheduledActionStatus } from '@granit/scheduling';
import { screen } from '@testing-library/react';

import { SchedulingStatusBadge } from '../components/scheduling-status-badge';

import { renderWithProviders } from './test-utils';

describe('SchedulingStatusBadge', () => {
  it('should render Pending status', () => {
    renderWithProviders(<SchedulingStatusBadge status={ScheduledActionStatus.Pending} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render Executed status', () => {
    renderWithProviders(<SchedulingStatusBadge status={ScheduledActionStatus.Executed} />);
    expect(screen.getByText('Executed')).toBeInTheDocument();
  });

  it('should render Cancelled status', () => {
    renderWithProviders(<SchedulingStatusBadge status={ScheduledActionStatus.Cancelled} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should render Failed status', () => {
    renderWithProviders(<SchedulingStatusBadge status={ScheduledActionStatus.Failed} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should render Processing status', () => {
    renderWithProviders(<SchedulingStatusBadge status={ScheduledActionStatus.Processing} />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });
});
