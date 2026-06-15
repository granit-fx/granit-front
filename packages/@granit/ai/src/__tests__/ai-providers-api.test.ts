import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { listAIProviderModels, listAIProviders } from '../api/ai-providers-api';

describe('ai-providers-api', () => {
  describe('listAIProviders', () => {
    it('should GET {basePath}/providers', async () => {
      const client = createMockClient();
      const data = [
        { name: 'OpenAI', supportsChat: true, supportsEmbeddings: true },
        { name: 'Anthropic', supportsChat: true, supportsEmbeddings: false },
      ];
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await listAIProviders(client, '');

      expect(client.get).toHaveBeenCalledWith('/providers');
      expect(result).toEqual(data);
    });

    it('should prepend basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await listAIProviders(client, '/api/v1/ai');

      expect(client.get).toHaveBeenCalledWith('/api/v1/ai/providers');
    });
  });

  describe('listAIProviderModels', () => {
    it('should GET {basePath}/providers/{providerName}/models', async () => {
      const client = createMockClient();
      const data = [
        { id: 'gpt-4o', displayName: 'GPT-4o', capabilities: {}, maxContextTokens: 128000 },
      ];
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await listAIProviderModels(client, '', 'OpenAI');

      expect(client.get).toHaveBeenCalledWith('/providers/OpenAI/models');
      expect(result).toEqual(data);
    });

    it('should encode the provider name in the URL', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await listAIProviderModels(client, '/api/v1/ai', 'Azure OpenAI');

      expect(client.get).toHaveBeenCalledWith('/api/v1/ai/providers/Azure%20OpenAI/models');
    });
  });
});
