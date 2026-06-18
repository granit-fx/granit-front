import { createTestQueryClient } from '@granit/react-testing';
import { axiosResponse, createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAIChat } from '../hooks/use-ai-chat';
import { useAIEmbeddings } from '../hooks/use-ai-embeddings';
import { useAIProviders } from '../hooks/use-ai-providers';
import { useAIWorkspace } from '../hooks/use-ai-workspace';
import { useAIWorkspaces } from '../hooks/use-ai-workspaces';
import { useCreateAIWorkspace } from '../hooks/use-create-ai-workspace';
import { useDeleteAIWorkspace } from '../hooks/use-delete-ai-workspace';
import { useUpdateAIWorkspace } from '../hooks/use-update-ai-workspace';
import { AIProvider } from '../providers/ai-provider';

import type { AIConfig } from '../providers/ai-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AIConfig = { client, basePath };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AIProvider config={config}>{children}</AIProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// -- Workspace queries -------------------------------------------------------

describe('useAIWorkspaces', () => {
  it('should fetch all workspaces', async () => {
    const client = createMockClient();
    const data = {
      workspaces: [{ name: 'default', provider: 'OpenAI', model: 'gpt-4o' }],
      totalCount: 1,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(data));

    const { result } = renderHook(() => useAIWorkspaces(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/ai/workspaces');
    expect(result.current.data).toEqual(data);
  });

  it('should not fetch when disabled', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useAIWorkspaces({ enabled: false }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isFetching).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useAIWorkspace', () => {
  it('should fetch a single workspace', async () => {
    const client = createMockClient();
    const workspace = { name: 'default', provider: 'OpenAI', model: 'gpt-4o' };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(workspace));

    const { result } = renderHook(() => useAIWorkspace('default'), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/ai/workspaces/default');
    expect(result.current.data).toEqual(workspace);
  });
});

// -- Workspace mutations -----------------------------------------------------

describe('useCreateAIWorkspace', () => {
  it('should POST to create a workspace', async () => {
    const client = createMockClient();
    const response = { name: 'test', provider: 'OpenAI', model: 'gpt-4o', kind: 'Dynamic' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useCreateAIWorkspace(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await act(async () => {
      result.current.create({ name: 'test', provider: 'OpenAI', model: 'gpt-4o' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.post).toHaveBeenCalledWith('/api/v1/ai/workspaces', {
      name: 'test',
      provider: 'OpenAI',
      model: 'gpt-4o',
    });
  });

  it('should expose error on failure', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useCreateAIWorkspace(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      result.current.create({ name: 'dup', provider: 'OpenAI', model: 'gpt-4o' });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe('Conflict');
  });
});

describe('useUpdateAIWorkspace', () => {
  it('should PUT to update a workspace', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse({ name: 'ws' }));

    const { result } = renderHook(() => useUpdateAIWorkspace(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    const request = { provider: 'OpenAI', model: 'gpt-4o-mini', activated: true };
    await act(async () => {
      result.current.update('ws', request);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.put).toHaveBeenCalledWith('/api/v1/ai/workspaces/ws', request);
  });
});

describe('useDeleteAIWorkspace', () => {
  it('should DELETE a workspace using the default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeleteAIWorkspace(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      result.current.remove('test');
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/ai/workspaces/test');
  });
});

// -- Chat --------------------------------------------------------------------

describe('useAIChat', () => {
  it('should send a chat completion request', async () => {
    const client = createMockClient();
    const response = {
      workspaceName: 'default',
      model: 'gpt-4o',
      content: 'Hi!',
      usage: null,
      duration: '00:00:01',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useAIChat(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await act(async () => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hello' }] });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.post).toHaveBeenCalledWith('/api/v1/ai/chat/default', {
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(result.current.data).toEqual(response);
  });
});

// -- Embeddings --------------------------------------------------------------

describe('useAIEmbeddings', () => {
  it('should generate embeddings', async () => {
    const client = createMockClient();
    const response = {
      workspaceName: 'default',
      model: 'text-embedding-3-small',
      embeddings: [{ index: 0, vector: [0.1, 0.2] }],
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useAIEmbeddings(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await act(async () => {
      result.current.generate('default', { inputs: ['Hello'] });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(client.post).toHaveBeenCalledWith('/api/v1/ai/embeddings/default', {
      inputs: ['Hello'],
    });
    expect(result.current.data).toEqual(response);
  });
});

// -- AI Providers ------------------------------------------------------------

describe('useAIProviders', () => {
  it('GETs the list of AI providers', async () => {
    const client = createMockClient();
    const response = [{ name: 'openai', displayName: 'OpenAI' }];
    vi.mocked(client.get).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useAIProviders(), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(expect.stringContaining('/providers'));
    expect(result.current.data).toEqual(response);
  });

  it('does not fetch when enabled is false', () => {
    const client = createMockClient();

    const { result } = renderHook(() => useAIProviders({ enabled: false }), {
      wrapper: createWrapper(client, '/api/v1/ai'),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('uses empty basePath when provider has no basePath configured', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

    const { result } = renderHook(() => useAIProviders(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// -- useAIChat no basePath ---------------------------------------------------

describe('useAIChat — no basePath', () => {
  it('falls back to empty string basePath when none is configured', async () => {
    const client = createMockClient();
    const response = {
      workspaceName: 'default',
      model: 'gpt-4o',
      content: 'Hi!',
      usage: null,
      duration: '00:00:01',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(response));

    const { result } = renderHook(() => useAIChat(), {
      wrapper: createWrapper(client),
    });

    await act(async () => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hello' }] });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toEqual(response);
  });
});
