import { axiosResponse, createMockClient } from '@granit/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useCreatePrompt } from '../hooks/use-create-prompt';
import { useCustomisePrompt } from '../hooks/use-customise-prompt';
import { usePromptPicker } from '../hooks/use-prompt-picker';
import { usePrompts } from '../hooks/use-prompts';
import { mockPromptPicker, mockPromptSummaries, mockSystemPrompt } from '../testing/data';

import { createWrapper, TEST_BASE_PATH } from './test-utils';

import type { PromptId } from '@granit/ai-prompts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('prompt catalogue hooks', () => {
  it('usePrompts returns the catalogue, system first', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockPromptSummaries));

    const { result } = renderHook(() => usePrompts(), { wrapper: createWrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]?.isSystem).toBe(true);
    expect(client.get).toHaveBeenCalledWith(TEST_BASE_PATH);
  });

  it('usePromptPicker returns the grouped picker with a null-category General group', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockPromptPicker));

    const { result } = renderHook(() => usePromptPicker(), { wrapper: createWrapper(client) });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith(`${TEST_BASE_PATH}/picker`);
    expect(result.current.data?.categories.some((c) => c.categoryId === null)).toBe(true);
  });

  it('useCreatePrompt POSTs the body and resolves the new prompt', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mockSystemPrompt));

    const { result } = renderHook(() => useCreatePrompt(), { wrapper: createWrapper(client) });
    await act(async () => {
      await result.current.createAsync({ name: 'X', content: 'Y' });
    });

    expect(client.post).toHaveBeenCalledWith(TEST_BASE_PATH, { name: 'X', content: 'Y' });
  });

  it('useCustomisePrompt POSTs to {id}/customise', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mockSystemPrompt));

    const { result } = renderHook(() => useCustomisePrompt(), { wrapper: createWrapper(client) });
    const id = mockSystemPrompt.id as PromptId;
    await act(async () => {
      await result.current.customiseAsync(id);
    });

    expect(client.post).toHaveBeenCalledWith(`${TEST_BASE_PATH}/${id}/customise`);
  });
});
