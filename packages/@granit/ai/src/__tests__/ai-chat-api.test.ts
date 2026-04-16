import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { chatComplete } from '../api/ai-chat-api.js';

describe('ai-chat-api', () => {
  describe('chatComplete', () => {
    it('should POST /ai/chat/{workspaceName}', async () => {
      const client = createMockClient();
      const request = { messages: [{ role: 'user' as const, content: 'Hello' }] };
      const response = {
        workspaceName: 'default',
        model: 'gpt-4o',
        content: 'Hi!',
        usage: null,
        duration: '00:00:01',
      };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await chatComplete(client, '', 'default', request);

      expect(client.post).toHaveBeenCalledWith('/ai/chat/default', request);
      expect(result).toEqual(response);
    });

    it('should prepend basePath', async () => {
      const client = createMockClient();
      const request = { messages: [{ role: 'user' as const, content: 'Hello' }] };
      vi.mocked(client.post).mockResolvedValue({ data: {} });

      await chatComplete(client, '/api/v1', 'default', request);

      expect(client.post).toHaveBeenCalledWith('/api/v1/ai/chat/default', request);
    });

    it('should encode workspace name in URL', async () => {
      const client = createMockClient();
      vi.mocked(client.post).mockResolvedValue({ data: {} });

      await chatComplete(client, '', 'my workspace', {
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(client.post).toHaveBeenCalledWith('/ai/chat/my%20workspace', expect.anything());
    });
  });
});
