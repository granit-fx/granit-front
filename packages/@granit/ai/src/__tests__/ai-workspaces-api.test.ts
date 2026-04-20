import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createAIWorkspace,
  deleteAIWorkspace,
  getAIWorkspace,
  listAIWorkspaces,
  updateAIWorkspace,
} from '../api/ai-workspaces-api.js';

describe('ai-workspaces-api', () => {
  describe('listAIWorkspaces', () => {
    it('should GET {basePath}/workspaces', async () => {
      const client = createMockClient();
      const data = { workspaces: [], totalCount: 0 };
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await listAIWorkspaces(client, '');

      expect(client.get).toHaveBeenCalledWith('/workspaces');
      expect(result).toEqual(data);
    });

    it('should prepend basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: { workspaces: [], totalCount: 0 } });

      await listAIWorkspaces(client, '/api/v1/ai');

      expect(client.get).toHaveBeenCalledWith('/api/v1/ai/workspaces');
    });
  });

  describe('getAIWorkspace', () => {
    it('should GET {basePath}/workspaces/{name}', async () => {
      const client = createMockClient();
      const workspace = { name: 'default', provider: 'OpenAI', model: 'gpt-4o' };
      vi.mocked(client.get).mockResolvedValue({ data: workspace });

      const result = await getAIWorkspace(client, '', 'default');

      expect(client.get).toHaveBeenCalledWith('/workspaces/default');
      expect(result).toEqual(workspace);
    });

    it('should encode workspace name in URL', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: {} });

      await getAIWorkspace(client, '/api/v1/ai', 'my workspace');

      expect(client.get).toHaveBeenCalledWith('/api/v1/ai/workspaces/my%20workspace');
    });
  });

  describe('createAIWorkspace', () => {
    it('should POST {basePath}/workspaces', async () => {
      const client = createMockClient();
      const request = { name: 'test', provider: 'OpenAI', model: 'gpt-4o' };
      const response = { ...request, kind: 'Dynamic', activated: true };
      vi.mocked(client.post).mockResolvedValue({ data: response });

      const result = await createAIWorkspace(client, '', request);

      expect(client.post).toHaveBeenCalledWith('/workspaces', request);
      expect(result).toEqual(response);
    });
  });

  describe('updateAIWorkspace', () => {
    it('should PUT {basePath}/workspaces/{name}', async () => {
      const client = createMockClient();
      const request = { provider: 'OpenAI', model: 'gpt-4o-mini', activated: true };
      vi.mocked(client.put).mockResolvedValue({ data: { name: 'test', ...request } });

      await updateAIWorkspace(client, '', 'test', request);

      expect(client.put).toHaveBeenCalledWith('/workspaces/test', request);
    });
  });

  describe('deleteAIWorkspace', () => {
    it('should DELETE {basePath}/workspaces/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await deleteAIWorkspace(client, '', 'test');

      expect(client.delete).toHaveBeenCalledWith('/workspaces/test');
    });

    it('should encode workspace name in URL', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({ data: undefined });

      await deleteAIWorkspace(client, '/api/v1/ai', 'my workspace');

      expect(client.delete).toHaveBeenCalledWith('/api/v1/ai/workspaces/my%20workspace');
    });
  });
});
