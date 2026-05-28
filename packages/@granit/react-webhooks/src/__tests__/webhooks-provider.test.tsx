import { GranitClientProvider } from '@granit/react-api-client';
import { createMockClient } from '@granit/testing';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useWebhooksConfig, WebhooksProvider } from '../providers/webhooks-provider.js';

import type { AxiosInstance } from '@granit/api-client';

describe('WebhooksProvider', () => {
  it('uses config.client when provided', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebhooksProvider config={{ client }}>{children}</WebhooksProvider>
    );

    const { result } = renderHook(() => useWebhooksConfig(), { wrapper });

    expect(result.current.client).toBe(client);
    expect(result.current.basePath).toBe('/api/v1/webhooks');
  });

  it('falls back to the GranitClientProvider context client when config.client is omitted', () => {
    const contextClient = createMockClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <GranitClientProvider client={contextClient as unknown as AxiosInstance}>
        <WebhooksProvider config={{}}>{children}</WebhooksProvider>
      </GranitClientProvider>
    );

    const { result } = renderHook(() => useWebhooksConfig(), { wrapper });

    expect(result.current.client).toBe(contextClient);
  });

  it('honours a custom basePath', () => {
    const client = createMockClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WebhooksProvider config={{ client, basePath: '/api/v2/webhooks' }}>
        {children}
      </WebhooksProvider>
    );

    const { result } = renderHook(() => useWebhooksConfig(), { wrapper });

    expect(result.current.basePath).toBe('/api/v2/webhooks');
  });

  it('throws when no client is available (neither config nor context)', () => {
    // React surfaces render-time throws via the error boundary path; suppress
    // the noisy console.error so test output stays readable.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebhooksProvider config={{}}>{children}</WebhooksProvider>
      );
      expect(() => renderHook(() => useWebhooksConfig(), { wrapper })).toThrow(
        /WebhooksProvider requires an Axios client/
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});

describe('useWebhooksConfig', () => {
  it('throws when used outside a WebhooksProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => renderHook(() => useWebhooksConfig())).toThrow(
        /must be used within a <WebhooksProvider>/
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
