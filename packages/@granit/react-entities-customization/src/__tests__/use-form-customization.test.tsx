import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useEntityCustomization, usePutEntityCustomization } from '../hooks/use-form-customization';
import { EntitiesCustomizationProvider } from '../providers/customization-provider';
import { mockEntityCustomization } from '../testing/data';

import type { AxiosInstance } from '@granit/api-client';
import type { EntityCustomizationResponse } from '@granit/entities-customization';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Shipped fixture (id `cust-1`, entity `Quote`, `FormDefault`) with the
// deltas cleared for the empty-response cases this suite exercises.
const sampleResponse: EntityCustomizationResponse = {
  ...mockEntityCustomization,
  deltas: [],
};

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly onFormCustomizationChanged: ReturnType<typeof vi.fn>;
  readonly wrapper: (props: { children: ReactNode }) => React.ReactElement;
}

function createHarness(): Harness {
  const client = createMockClient();
  const queryClient = createTestQueryClient();
  const onFormCustomizationChanged = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <EntitiesCustomizationProvider config={{ client, onFormCustomizationChanged }}>
        {children}
      </EntitiesCustomizationProvider>
    );
  return { client, queryClient, onFormCustomizationChanged, wrapper };
}

describe('useEntityCustomization', () => {
  it('GETs the entity customization endpoint with the resolved key', async () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const { result } = renderHook(
      () => useEntityCustomization({ entityName: 'Quote', layoutKind: 'FormDefault' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/FormDefault');
    expect(result.current.data).toEqual(sampleResponse);
  });

  it('is disabled when entityName is empty', () => {
    const { client, wrapper } = createHarness();

    renderHook(() => useEntityCustomization({ entityName: '', layoutKind: 'FormDefault' }), {
      wrapper,
    });

    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('usePutEntityCustomization', () => {
  it('PUTs the deltas, invalidates the read query, and fires the manifest hook', async () => {
    const { client, queryClient, onFormCustomizationChanged, wrapper } = createHarness();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePutEntityCustomization(), { wrapper });
    await result.current.mutateAsync({
      entityName: 'Quote',
      layoutKind: 'FormDefault',
      request: { deltas: [{ $type: 'hide', fieldName: 'internalNotes' }] },
    });

    expect(client.put).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/FormDefault', {
      deltas: [{ $type: 'hide', fieldName: 'internalNotes' }],
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(['entities-customization', 'layout', 'Quote', 'FormDefault']);
    expect(onFormCustomizationChanged).toHaveBeenCalledWith('Quote');
  });
});
