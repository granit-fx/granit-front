import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteFeatureOverride,
  getAllFeatureValues,
  getFeatureDefinitions,
  getFeatureValue,
  setFeatureOverride,
} from '../api/features-api';

import type { FeatureGroupResponse, FeatureValueResponse } from '../types/index';

const basePath = '/features';

const sampleGroup: FeatureGroupResponse = {
  name: 'ui',
  displayName: 'User Interface',
  features: [
    {
      name: 'ui.dark-mode',
      defaultValue: 'false',
      valueType: 'Toggle',
      numericConstraint: null,
      selectionValues: null,
      displayName: 'Dark Mode',
      description: 'Enable dark mode for the application.',
    },
    {
      name: 'ui.max-items',
      defaultValue: '50',
      valueType: 'Numeric',
      numericConstraint: { min: 10, max: 200 },
      selectionValues: null,
      displayName: 'Max Items',
      description: null,
    },
    {
      name: 'ui.theme',
      defaultValue: 'light',
      valueType: 'Selection',
      numericConstraint: null,
      selectionValues: ['light', 'dark', 'system'],
      displayName: null,
      description: null,
    },
  ],
};

const sampleValue: FeatureValueResponse = {
  name: 'ui.dark-mode',
  value: 'true',
};

describe('features-api', () => {
  describe('getFeatureDefinitions', () => {
    it('should GET {basePath}/definitions', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleGroup]));

      const result = await getFeatureDefinitions(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/definitions`);
      expect(result).toEqual([sampleGroup]);
    });

    it('should work with custom basePath', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([]));

      await getFeatureDefinitions(client, '/custom/features');

      expect(client.get).toHaveBeenCalledWith('/custom/features/definitions');
    });
  });

  describe('getAllFeatureValues', () => {
    it('should GET {basePath}/values', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse([sampleValue]));

      const result = await getAllFeatureValues(client, basePath);

      expect(client.get).toHaveBeenCalledWith(`${basePath}/values`);
      expect(result).toEqual([sampleValue]);
    });
  });

  describe('getFeatureValue', () => {
    it('should GET {basePath}/values/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleValue));

      const result = await getFeatureValue(client, basePath, 'ui.dark-mode');

      expect(client.get).toHaveBeenCalledWith(`${basePath}/values/ui.dark-mode`);
      expect(result).toEqual(sampleValue);
    });

    it('should encode name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleValue));

      await getFeatureValue(client, basePath, 'feature/special@name');

      expect(client.get).toHaveBeenCalledWith(
        `${basePath}/values/${encodeURIComponent('feature/special@name')}`
      );
    });
  });

  describe('setFeatureOverride', () => {
    it('should PUT {basePath}/overrides/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await setFeatureOverride(client, basePath, 'ui.dark-mode', { value: 'true' });

      expect(client.put).toHaveBeenCalledWith(`${basePath}/overrides/ui.dark-mode`, {
        value: 'true',
      });
    });

    it('should encode name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

      await setFeatureOverride(client, basePath, 'feature/special@name', { value: '42' });

      expect(client.put).toHaveBeenCalledWith(
        `${basePath}/overrides/${encodeURIComponent('feature/special@name')}`,
        { value: '42' }
      );
    });
  });

  describe('deleteFeatureOverride', () => {
    it('should DELETE {basePath}/overrides/{name}', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteFeatureOverride(client, basePath, 'ui.dark-mode');

      expect(client.delete).toHaveBeenCalledWith(`${basePath}/overrides/ui.dark-mode`);
    });

    it('should encode name with special characters', async () => {
      const client = createMockClient();
      vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

      await deleteFeatureOverride(client, basePath, 'feature/special@name');

      expect(client.delete).toHaveBeenCalledWith(
        `${basePath}/overrides/${encodeURIComponent('feature/special@name')}`
      );
    });
  });
});
