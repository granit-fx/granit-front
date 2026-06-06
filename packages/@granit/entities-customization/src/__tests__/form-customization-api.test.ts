import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  deleteEntityCustomization,
  getEntityCustomization,
  putEntityCustomization,
} from '../api/form-customization-api';

import type {
  EntityCustomizationRequest,
  EntityCustomizationResponse,
} from '../types/customization';

const apiBase = '/api/v1';

const sampleResponse: EntityCustomizationResponse = {
  id: 'cust-1',
  entityName: 'Quote',
  layoutKind: 'FormDefault',
  deltas: [
    { $type: 'hide', fieldName: 'internalNotes' },
    { $type: 'reorder', fieldName: 'amount', beforeFieldName: null, afterFieldName: 'currency' },
  ],
};

describe('getEntityCustomization', () => {
  it('GETs /entities/{name}/customization/{layoutKind}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    const result = await getEntityCustomization(client, apiBase, 'Quote', 'FormDefault');

    expect(client.get).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/FormDefault');
    expect(result).toEqual(sampleResponse);
  });

  it('URI-encodes the entity name and layoutKind', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleResponse));

    await getEntityCustomization(client, apiBase, 'Custom/Entity', 'FormDefault');

    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/entities/Custom%2FEntity/customization/FormDefault'
    );
  });

  it('propagates 403 when the caller lacks Forms.Read', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('Request failed with status code 403'));

    await expect(getEntityCustomization(client, apiBase, 'Quote', 'FormDefault')).rejects.toThrow(
      /403/
    );
  });
});

describe('putEntityCustomization', () => {
  it('PUTs the deltas body to /entities/{name}/customization/{layoutKind}', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(sampleResponse));
    const request: EntityCustomizationRequest = {
      deltas: [
        { $type: 'regroup', fieldName: 'amount', groupKey: 'pricing' },
        { $type: 'hide', fieldName: 'internalNotes' },
      ],
    };

    const result = await putEntityCustomization(client, apiBase, 'Quote', 'FormDefault', request);

    expect(client.put).toHaveBeenCalledWith(
      '/api/v1/entities/Quote/customization/FormDefault',
      request
    );
    expect(result).toEqual(sampleResponse);
  });

  it('propagates 422 on unknown delta kinds rejected by the backend', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Request failed with status code 422'));

    await expect(
      putEntityCustomization(client, apiBase, 'Quote', 'FormDefault', { deltas: [] })
    ).rejects.toThrow(/422/);
  });
});

describe('deleteEntityCustomization', () => {
  it('DELETEs /entities/{name}/customization/{layoutKind}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ status: 204 });

    await deleteEntityCustomization(client, apiBase, 'Quote', 'FormDefault');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/entities/Quote/customization/FormDefault');
  });
});
