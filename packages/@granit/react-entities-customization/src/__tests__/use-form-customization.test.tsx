import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useFormCustomization, usePutFormCustomization } from '../hooks/use-form-customization';
import { CustomizationProvider } from '../providers/customization-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { FormCustomizationResponse } from '@granit/entities-customization';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleResponse: FormCustomizationResponse = {
  entityName: 'Quote',
  variant: 'Edit',
  deltas: [],
  updatedAt: null,
  updatedByUserId: null,
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
      <CustomizationProvider config={{ client, onFormCustomizationChanged }}>
        {children}
      </CustomizationProvider>
    );
  return { client, queryClient, onFormCustomizationChanged, wrapper };
}

describe('useFormCustomization', () => {
  it('GETs the form customization endpoint with the resolved key', async () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const { result } = renderHook(
      () => useFormCustomization({ entityName: 'Quote', variant: 'Edit' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/forms/Edit');
    expect(result.current.data).toEqual(sampleResponse);
  });

  it('is disabled when entityName is empty', () => {
    const { client, wrapper } = createHarness();

    renderHook(() => useFormCustomization({ entityName: '', variant: 'Edit' }), { wrapper });

    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('usePutFormCustomization', () => {
  it('PUTs the deltas, invalidates the read query, and fires the manifest hook', async () => {
    const { client, queryClient, onFormCustomizationChanged, wrapper } = createHarness();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePutFormCustomization(), { wrapper });
    await result.current.mutateAsync({
      entityName: 'Quote',
      variant: 'Edit',
      request: { deltas: [{ kind: 'Hide', fieldName: 'internalNotes' }] },
    });

    expect(client.put).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/forms/Edit', {
      deltas: [{ kind: 'Hide', fieldName: 'internalNotes' }],
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(['entities-customization', 'forms', 'Quote', 'Edit']);
    expect(onFormCustomizationChanged).toHaveBeenCalledWith('Quote');
  });
});
