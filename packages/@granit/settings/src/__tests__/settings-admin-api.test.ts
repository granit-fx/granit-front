import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getAdminAppSettings, saveAdminAppSettings } from '../api/settings-api.js';

describe('settings-admin-api', () => {
  describe('getAdminAppSettings', () => {
    it('should GET {basePath}/admin/config/settings', async () => {
      const client = createMockClient();
      const data = [
        {
          key: 'app.name',
          label: 'App Name',
          description: '',
          value: 'Guava',
          type: 'string' as const,
        },
      ];
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await getAdminAppSettings(client, '/api/v1');

      expect(client.get).toHaveBeenCalledWith('/api/v1/admin/config/settings');
      expect(result).toEqual(data);
    });

    it('should work with empty basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await getAdminAppSettings(client, '');

      expect(client.get).toHaveBeenCalledWith('/admin/config/settings');
    });
  });

  describe('saveAdminAppSettings', () => {
    it('should PUT {basePath}/admin/config/settings', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({});

      const settings = [
        { key: 'app.name', value: 'Guava Pro' },
        { key: 'app.theme', value: 'dark' },
      ];
      await saveAdminAppSettings(client, '/api/v1', settings);

      expect(client.put).toHaveBeenCalledWith('/api/v1/admin/config/settings', settings);
    });

    it('should work with empty basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({});

      await saveAdminAppSettings(client, '', [{ key: 'k', value: 'v' }]);

      expect(client.put).toHaveBeenCalledWith('/admin/config/settings', [{ key: 'k', value: 'v' }]);
    });
  });
});
