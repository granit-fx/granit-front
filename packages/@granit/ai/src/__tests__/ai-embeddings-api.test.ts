import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { generateEmbeddings } from '../api/ai-embeddings-api';

describe('ai-embeddings-api', () => {
  describe('generateEmbeddings', () => {
    it('should POST {basePath}/embeddings/{workspaceName}', async () => {
      const client = createMockClient();
      const request = { inputs: ['Hello world'] };
      const response = {
        workspaceName: 'default',
        model: 'text-embedding-3-small',
        embeddings: [{ index: 0, vector: [0.1, 0.2, 0.3] }],
        usage: { inputTokens: 3 },
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await generateEmbeddings(client, '', 'default', request);

      expect(client.post).toHaveBeenCalledWith('/embeddings/default', request);
      expect(result).toEqual(response);
      expect(result.usage).toEqual({ inputTokens: 3 });
    });

    it('should handle null usage', async () => {
      const client = createMockClient();
      const response = {
        workspaceName: 'default',
        model: 'text-embedding-3-small',
        embeddings: [{ index: 0, vector: [0.1, 0.2] }],
        usage: null,
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await generateEmbeddings(client, '', 'default', { inputs: ['test'] });

      expect(result.usage).toBeNull();
    });

    it('should prepend basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: {} });

      await generateEmbeddings(client, '/api/v1/ai', 'default', { inputs: ['test'] });

      expect(client.post).toHaveBeenCalledWith('/api/v1/ai/embeddings/default', {
        inputs: ['test'],
      });
    });

    it('should encode workspace name in URL', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: {} });

      await generateEmbeddings(client, '', 'my workspace', { inputs: ['test'] });

      expect(client.post).toHaveBeenCalledWith('/embeddings/my%20workspace', expect.anything());
    });
  });
});
