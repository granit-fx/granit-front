import { createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import { deleteSetting, getSetting, getSettings, updateSetting } from '../api/settings-api';

describe('settings-api', () => {
  describe('getSettings', () => {
    it('should GET /settings/{scope}', async () => {
      const client = createMockClient();
      const data = { 'Granit.Localization.PreferredCulture': 'fr' };
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await getSettings(client, '', 'user');

      expect(client.get).toHaveBeenCalledWith('/settings/user');
      expect(result).toEqual(data);
    });

    it('should prepend basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue({ data: {} });

      await getSettings(client, '/api/v1', 'global');

      expect(client.get).toHaveBeenCalledWith('/api/v1/settings/global');
    });
  });

  describe('getSetting', () => {
    it('should GET /settings/{scope}/{name}', async () => {
      const client = createMockClient();
      const data = { name: 'Granit.Localization.PreferredCulture', value: 'fr' };
      vi.mocked(client.get).mockResolvedValue({ data });

      const result = await getSetting(client, '', 'user', 'Granit.Localization.PreferredCulture');

      expect(client.get).toHaveBeenCalledWith(
        '/settings/user/Granit.Localization.PreferredCulture'
      );
      expect(result).toEqual(data);
    });
  });

  describe('updateSetting', () => {
    it('should PUT /settings/{scope}/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue({});

      await updateSetting(client, '', 'user', 'Granit.Localization.PreferredCulture', {
        value: 'en',
      });

      expect(client.put).toHaveBeenCalledWith(
        '/settings/user/Granit.Localization.PreferredCulture',
        { value: 'en' }
      );
    });
  });

  describe('deleteSetting', () => {
    it('should DELETE /settings/{scope}/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue({});

      await deleteSetting(client, '', 'user', 'Granit.Localization.PreferredCulture');

      expect(client.delete).toHaveBeenCalledWith(
        '/settings/user/Granit.Localization.PreferredCulture'
      );
    });
  });
});
