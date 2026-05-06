import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActivitiesSidePanel } from '../components/activities-side-panel.js';
import { activitiesSidePanel } from '../contributions/entity-side-panel.js';
import { ActivitiesProvider } from '../providers/activities-provider.js';

import type { ActivityListResponse } from '@granit/activities';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

const sampleResponse: ActivityListResponse = {
  items: [],
  totalCount: 0,
  page: 1,
  pageSize: 10,
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <ActivitiesProvider config={{ client }}>{children}</ActivitiesProvider>
    );
  };
}

describe('<ActivitiesSidePanel>', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters the list to entity + OpenOrOverdue by default', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivitiesSidePanel entityName="Granit.Sales.Quote" entityId="q-1" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities', {
      params: {
        entityType: 'Granit.Sales.Quote',
        entityId: 'q-1',
        status: 'OpenOrOverdue',
        page: 1,
        pageSize: 10,
      },
    });
  });

  it('exposes entityName + entityId as data-attrs and a labelled section', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    const { container } = render(
      <ActivitiesSidePanel entityName="Granit.Sales.Quote" entityId="q-1" />,
      { wrapper: createWrapper(client) }
    );

    const section = container.querySelector('[data-granit-activities-side-panel]');
    expect(section?.getAttribute('data-entity-name')).toBe('Granit.Sales.Quote');
    expect(section?.getAttribute('data-entity-id')).toBe('q-1');
    expect(section?.getAttribute('aria-label')).toBe('Activities');
  });

  it('hides the create CTA when no onCreate callback is provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    render(<ActivitiesSidePanel entityName="Granit.Sales.Quote" entityId="q-1" />, {
      wrapper: createWrapper(client),
    });

    expect(screen.queryByRole('button', { name: '+ Activity' })).toBeNull();
  });

  it('fires onCreate with the entity context when the CTA is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });
    const onCreate = vi.fn();

    render(
      <ActivitiesSidePanel entityName="Granit.Sales.Quote" entityId="q-1" onCreate={onCreate} />,
      { wrapper: createWrapper(client) }
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Activity' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate).toHaveBeenCalledWith({
      entityName: 'Granit.Sales.Quote',
      entityId: 'q-1',
    });
  });
});

describe('activitiesSidePanel (EntityDetail contribution)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an EntitySidePanel renderer matching the (entityName, entityId) contract', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    const onCreate = vi.fn();
    const Renderer = activitiesSidePanel({ onCreate });

    render(<Renderer entityName="Granit.Sales.Quote" entityId="q-1" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    expect(client.get).toHaveBeenCalledWith('/api/v1/activities', {
      params: {
        entityType: 'Granit.Sales.Quote',
        entityId: 'q-1',
        status: 'OpenOrOverdue',
        page: 1,
        pageSize: 10,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: '+ Activity' }));
    expect(onCreate).toHaveBeenCalledWith({
      entityName: 'Granit.Sales.Quote',
      entityId: 'q-1',
    });
  });

  it('hides the CTA when no onCreate option is supplied to the factory', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    const Renderer = activitiesSidePanel();
    render(<Renderer entityName="Granit.Sales.Quote" entityId="q-1" />, {
      wrapper: createWrapper(client),
    });

    expect(screen.queryByRole('button', { name: '+ Activity' })).toBeNull();
  });
});
