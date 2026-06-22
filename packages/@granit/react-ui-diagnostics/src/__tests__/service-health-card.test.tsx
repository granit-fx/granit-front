import { screen, within } from '@testing-library/react';

import { ServiceHealthCard } from '../components/service-health-card';

import { renderDiagnostics } from './test-utils';

import type { ServiceHealthResponse } from '@granit/diagnostics';

const checkedAt = '2026-03-12T10:00:00Z';

function makeService(overrides: Partial<ServiceHealthResponse> = {}): ServiceHealthResponse {
  return {
    id: 'postgresql',
    name: 'PostgreSQL',
    status: 'healthy',
    responseTimeMs: 42,
    description: 'Primary database cluster',
    tags: ['readiness', 'startup'],
    ...overrides,
  };
}

describe('ServiceHealthCard', () => {
  it('should render the service name', () => {
    renderDiagnostics(<ServiceHealthCard service={makeService()} checkedAt={checkedAt} />);
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
  });

  it.each([
    ['healthy', 'Healthy'],
    ['degraded', 'Degraded'],
    ['down', 'Down'],
  ] as const)('should render the translated label for status "%s"', (status, label) => {
    const { container } = renderDiagnostics(
      <ServiceHealthCard service={makeService({ status })} checkedAt={checkedAt} />
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(/Diagnostics\.Status\./)).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="service-health-card"]')).toHaveAttribute(
      'data-status',
      status
    );
  });

  it('should render the response time when present', () => {
    renderDiagnostics(
      <ServiceHealthCard service={makeService({ responseTimeMs: 42 })} checkedAt={checkedAt} />
    );
    expect(screen.getByText('42ms')).toBeInTheDocument();
  });

  it('should render an em dash when responseTimeMs is null', () => {
    renderDiagnostics(
      <ServiceHealthCard service={makeService({ responseTimeMs: null })} checkedAt={checkedAt} />
    );
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/ms$/)).not.toBeInTheDocument();
  });

  it('should render the description when present', () => {
    renderDiagnostics(
      <ServiceHealthCard
        service={makeService({ description: 'Primary database cluster' })}
        checkedAt={checkedAt}
      />
    );
    expect(screen.getByText('Primary database cluster')).toBeInTheDocument();
  });

  it('should omit the description when null', () => {
    renderDiagnostics(
      <ServiceHealthCard service={makeService({ description: null })} checkedAt={checkedAt} />
    );
    expect(screen.queryByText('Primary database cluster')).not.toBeInTheDocument();
  });

  it('should render each tag', () => {
    renderDiagnostics(
      <ServiceHealthCard
        service={makeService({ tags: ['readiness', 'startup'] })}
        checkedAt={checkedAt}
      />
    );
    expect(screen.getByText('readiness')).toBeInTheDocument();
    expect(screen.getByText('startup')).toBeInTheDocument();
  });

  it('should show an unreachable alert only when the service is down', () => {
    const { rerender } = renderDiagnostics(
      <ServiceHealthCard service={makeService({ status: 'healthy' })} checkedAt={checkedAt} />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<ServiceHealthCard service={makeService({ status: 'down' })} checkedAt={checkedAt} />);

    const alert = screen.getByRole('alert');
    expect(within(alert).getByText('Service unreachable')).toBeInTheDocument();
  });
});
