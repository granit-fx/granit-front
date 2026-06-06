import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  getWorkspaceCustomization,
  putWorkspaceCustomization,
} from '../api/workspace-customization-api';

import type {
  WorkspaceCustomizationRequest,
  WorkspaceCustomizationResponse,
} from '../types/customization';

const apiBase = '/api/v1';

const sampleResponse: WorkspaceCustomizationResponse = {
  workspaceName: 'sales',
  deltas: [{ $type: 'hide', fieldName: 'pipelineForecast' }],
  updatedAt: '2026-05-06T10:00:00Z',
  updatedByUserId: 'user-1',
};

describe('getWorkspaceCustomization', () => {
  it('GETs /workspaces/{name}/customization', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const result = await getWorkspaceCustomization(client, apiBase, 'sales');

    expect(client.get).toHaveBeenCalledWith('/api/v1/workspaces/sales/customization');
    expect(result).toEqual(sampleResponse);
  });

  it('URI-encodes the workspace name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    await getWorkspaceCustomization(client, apiBase, 'sales/eu');

    expect(client.get).toHaveBeenCalledWith('/api/v1/workspaces/sales%2Feu/customization');
  });
});

describe('putWorkspaceCustomization', () => {
  it('PUTs the deltas body', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const request: WorkspaceCustomizationRequest = {
      deltas: [
        {
          $type: 'reorder',
          fieldName: 'tile-pipeline',
          beforeFieldName: 'tile-quotes',
          afterFieldName: null,
        },
      ],
    };

    const result = await putWorkspaceCustomization(client, apiBase, 'sales', request);

    expect(client.put).toHaveBeenCalledWith('/api/v1/workspaces/sales/customization', request);
    expect(result).toEqual(sampleResponse);
  });

  it('propagates 403 when the caller lacks Workspaces.Manage', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(
      putWorkspaceCustomization(client, apiBase, 'sales', { deltas: [] })
    ).rejects.toThrow(/403/);
  });
});
