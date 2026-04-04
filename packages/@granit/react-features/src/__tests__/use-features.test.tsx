import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDeleteFeatureOverride,
  useFeatureDefinitions,
  useFeatureValue,
  useFeatureValues,
  useSetFeatureOverride,
} from '../hooks/use-features.js';
import { FeaturesProvider } from '../providers/features-provider.js';

import type { FeaturesConfig } from '../providers/features-provider.js';
import type { FeatureGroupResponse, FeatureValueResponse } from '@granit/features';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const sampleGroup: FeatureGroupResponse = {
  name: 'ui',
  displayName: 'User Interface',
  features: [
    {
      name: 'ui.dark-mode',
      defaultValue: 'false',
      valueType: 'Toggle',
      numericConstraint: null,
      selectionValues: null,
      displayName: 'Dark Mode',
      description: null,
    },
  ],
};

const sampleValue: FeatureValueResponse = {
  name: 'ui.dark-mode',
  value: 'true',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: FeaturesConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <FeaturesProvider config={config}>{children}</FeaturesProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('use-features', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useFeatureDefinitions', () => {
    it('fetches definitions with default basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

      const { result } = renderHook(() => useFeatureDefinitions(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/granit/features/definitions');
      expect(result.current.data).toEqual([sampleGroup]);
    });

    it('fetches definitions with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

      const { result } = renderHook(() => useFeatureDefinitions(), {
        wrapper: createWrapper(client, '/custom/features'),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/custom/features/definitions');
    });
  });

  describe('useFeatureValues', () => {
    it('fetches all feature values', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [sampleValue] });

      const { result } = renderHook(() => useFeatureValues(), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/granit/features/values');
      expect(result.current.data).toEqual([sampleValue]);
    });
  });

  describe('useFeatureValue', () => {
    it('fetches a single feature value', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: sampleValue });

      const { result } = renderHook(() => useFeatureValue('ui.dark-mode'), {
        wrapper: createWrapper(client),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.get).toHaveBeenCalledWith('/api/granit/features/values/ui.dark-mode');
      expect(result.current.data).toEqual(sampleValue);
    });

    it('is disabled when name is empty', () => {
      const client = createMockClient();

      const { result } = renderHook(() => useFeatureValue(''), {
        wrapper: createWrapper(client),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(client.get).not.toHaveBeenCalled();
    });
  });

  describe('useSetFeatureOverride', () => {
    it('sets an override via PUT', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useSetFeatureOverride(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ name: 'ui.dark-mode', request: { value: 'true' } });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.put).toHaveBeenCalledWith('/api/granit/features/overrides/ui.dark-mode', {
        value: 'true',
      });
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockRejectedValue(new Error('Forbidden'));

      const { result } = renderHook(() => useSetFeatureOverride(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate({ name: 'ui.dark-mode', request: { value: 'true' } });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Forbidden');
    });
  });

  describe('useDeleteFeatureOverride', () => {
    it('deletes an override via DELETE', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDeleteFeatureOverride(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('ui.dark-mode');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(client.delete).toHaveBeenCalledWith('/api/granit/features/overrides/ui.dark-mode');
    });

    it('exposes error state on failure', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockRejectedValue(new Error('Not Found'));

      const { result } = renderHook(() => useDeleteFeatureOverride(), {
        wrapper: createWrapper(client),
      });

      result.current.mutate('ui.dark-mode');

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe('Not Found');
    });
  });
});
