import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { getAdminAppSettings, saveAdminAppSettings } from '../api/settings-api.js';

import type { AdminAppSetting, BulkUpdateSettingsResponse } from '../types/index.js';

describe('settings-admin-api', () => {
  describe('getAdminAppSettings', () => {
    it('should GET {basePath}/settings/global/definitions', async () => {
      const client = createMockClient();
      const data: AdminAppSetting[] = [
        {
          key: 'app.name',
          label: 'App Name',
          description: null,
          defaultValue: 'Guava',
          value: 'Guava',
          valueKind: 'String',
          allowedValues: null,
          isEncrypted: false,
        },
      ];
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await getAdminAppSettings(client, '/api/v1', 'global');

      expect(client.get).toHaveBeenCalledWith('/api/v1/settings/global/definitions');
      expect(result).toEqual(data);
    });

    it('should GET the tenant definitions when scope is tenant', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await getAdminAppSettings(client, '/api/v1', 'tenant');

      expect(client.get).toHaveBeenCalledWith('/api/v1/settings/tenant/definitions');
    });

    it('should work with empty basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: [] });

      await getAdminAppSettings(client, '', 'global');

      expect(client.get).toHaveBeenCalledWith('/settings/global/definitions');
    });
  });

  describe('saveAdminAppSettings', () => {
    it('should PUT {basePath}/settings/global/bulk with the entries wrapped in { settings }', async () => {
      const client = createMockClient();
      const envelope: BulkUpdateSettingsResponse = {
        results: [
          { key: 'app.name', outcome: 'Updated', errorCode: null },
          { key: 'app.theme', outcome: 'Updated', errorCode: null },
        ],
      };
      vi.mocked(client.put).mockResolvedValue({ data: envelope });

      const settings = [
        { key: 'app.name', value: 'Guava Pro' },
        { key: 'app.theme', value: 'dark' },
      ];
      const result = await saveAdminAppSettings(client, '/api/v1', 'global', settings);

      expect(client.put).toHaveBeenCalledWith('/api/v1/settings/global/bulk', { settings });
      expect(result).toEqual(envelope);
    });

    it('should PUT the tenant bulk route when scope is tenant', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({ data: { results: [] } });

      await saveAdminAppSettings(client, '/api/v1', 'tenant', [{ key: 'k', value: 'v' }]);

      expect(client.put).toHaveBeenCalledWith('/api/v1/settings/tenant/bulk', {
        settings: [{ key: 'k', value: 'v' }],
      });
    });

    it('should forward per-entry outcomes from the envelope', async () => {
      const client = createMockClient();
      const envelope: BulkUpdateSettingsResponse = {
        results: [
          { key: 'ok', outcome: 'Updated', errorCode: null },
          {
            key: 'bad',
            outcome: 'ProviderNotAllowed',
            errorCode: 'Granit:Settings:ProviderNotAllowed',
          },
          { key: 'unknown', outcome: 'NotFound', errorCode: 'Granit:Settings:NotFound' },
        ],
      };
      vi.mocked(client.put).mockResolvedValue({ data: envelope });

      const result = await saveAdminAppSettings(client, '', 'global', []);

      expect(result.results.filter((r) => r.outcome !== 'Updated')).toHaveLength(2);
    });
  });
});
