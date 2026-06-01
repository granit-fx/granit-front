import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  usePutWorkspaceCustomization,
  useWorkspaceCustomization,
} from '../hooks/use-workspace-customization';
import { CustomizationProvider } from '../providers/customization-provider';

import type { WorkspaceCustomizationResponse } from '@granit/entities-customization';
import type { ReactNode } from 'react';

const sampleResponse: WorkspaceCustomizationResponse = {
  workspaceName: 'sales',
  deltas: [],
  updatedAt: null,
  updatedByUserId: null,
};

function createHarness() {
  const client = createMockClient();
  const queryClient = createTestQueryClient();
  const onWorkspaceCustomizationChanged = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <CustomizationProvider config={{ client, onWorkspaceCustomizationChanged }}>
        {children}
      </CustomizationProvider>
    );
  return { client, queryClient, onWorkspaceCustomizationChanged, wrapper };
}

describe('useWorkspaceCustomization', () => {
  it('GETs the workspace customization endpoint', async () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const { result } = renderHook(() => useWorkspaceCustomization({ workspaceName: 'sales' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/workspaces/sales/customization');
  });
});

describe('usePutWorkspaceCustomization', () => {
  it('PUTs deltas and fires the manifest hook on success', async () => {
    const { client, queryClient, onWorkspaceCustomizationChanged, wrapper } = createHarness();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePutWorkspaceCustomization(), { wrapper });
    await result.current.mutateAsync({
      workspaceName: 'sales',
      request: { deltas: [{ kind: 'Hide', fieldName: 'tile-pipeline' }] },
    });

    expect(client.put).toHaveBeenCalledWith('/api/v1/workspaces/sales/customization', {
      deltas: [{ kind: 'Hide', fieldName: 'tile-pipeline' }],
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toContainEqual(['entities-customization', 'workspaces', 'sales']);
    expect(onWorkspaceCustomizationChanged).toHaveBeenCalledWith('sales');
  });
});
